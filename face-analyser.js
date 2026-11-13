/* =========================================================
   PRIMO FACE ANALYSER — page logic
   Flow: selfie/upload → preview (retake/replace) → goals →
         consent → Analyse → recommendations → WhatsApp.
   The photo lives only in memory on this page.
   ========================================================= */
(() => {
  "use strict";

  const ENDPOINT = (window.PRIMO_ANALYZER_ENDPOINT || "").trim();
  const WA_NUMBER = window.PRIMO_WHATSAPP_NUMBER || "919966016169";
  const MAX_SIDE = 1024;          // downscale before sending
  const JPEG_QUALITY = 0.85;
  const REQUEST_TIMEOUT_MS = 45000;

  // Photo quality thresholds (measured on a 256px-wide grey copy of the centre of the photo)
  // - too dark: only catches near-black photos (brightest 10% of the centre still very dim).
  //   Kept deliberately lenient so darker skin tones and low-key portraits are never rejected here;
  //   subtler lighting problems are judged by the AI, which returns "too_dark" if it can't see features.
  const Q = { minHighlight: 60, maxBrightness: 220, maxClippedShare: 0.35, minSharpness: 120 };

  const $ = id => document.getElementById(id);
  const el = {
    stageEmpty: $("stageEmpty"), camera: $("camera"), faceGuide: $("faceGuide"),
    cameraControls: $("cameraControls"), preview: $("preview"),
    uploadInput: $("uploadInput"), cameraFallbackInput: $("cameraFallbackInput"),
    photoActionsEmpty: $("photoActionsEmpty"), photoActionsFilled: $("photoActionsFilled"),
    photoMessage: $("photoMessage"), goalChips: $("goalChips"), goalNote: $("goalNote"),
    consent: $("consent"), btnAnalyze: $("btnAnalyze"), analyzeHint: $("analyzeHint"),
    loading: $("loading"), errorBox: $("errorBox"), errorText: $("errorText"),
    results: $("results"), staleBanner: $("staleBanner"), observations: $("observations"),
    recommendations: $("recommendations"), btnBook: $("btnBook")
  };

  const state = {
    photo: null,          // { blob, url, quality }
    stream: null,
    facingMode: "user",
    busy: false,
    lastResultKey: null,  // photo+goals the shown results belong to
    photoSeq: 0
  };

  /* ---------------- helpers ---------------- */
  const show = (node, on = true) => { node.hidden = !on; };
  const selectedGoals = () =>
    [...el.goalChips.querySelectorAll('.goal-chip[aria-pressed="true"]')].map(b => b.dataset.goal);
  const currentKey = () => `${state.photoSeq}|${selectedGoals().join(",")}|${el.goalNote.value.trim()}`;

  function photoMessage(text) {
    el.photoMessage.textContent = text || "";
    show(el.photoMessage, !!text);
  }

  function refreshAnalyzeButton() {
    const ready = !!state.photo && state.photo.quality.ok && el.consent.checked && !state.busy;
    el.btnAnalyze.disabled = !ready;
    let hint = "";
    if (!state.photo) hint = "Add a photo and tick the box to continue.";
    else if (!state.photo.quality.ok) hint = "Please retake or replace the photo first.";
    else if (!el.consent.checked) hint = "Tick the box above to continue.";
    el.analyzeHint.textContent = hint;
    show(el.analyzeHint, !!hint);

    // results no longer match the inputs → flag them
    if (!el.results.hidden) show(el.staleBanner, state.lastResultKey !== currentKey());
  }

  /* ---------------- stage ---------------- */
  function renderStage(mode) {           // "empty" | "camera" | "preview"
    show(el.stageEmpty, mode === "empty");
    show(el.camera, mode === "camera");
    show(el.faceGuide, mode === "camera");
    show(el.cameraControls, mode === "camera");
    show(el.preview, mode === "preview");
    show(el.photoActionsEmpty, mode !== "camera" && !state.photo);
    show(el.photoActionsFilled, mode !== "camera" && !!state.photo);
    show($("cameraHint"), mode === "camera");
  }

  /* ---------------- photo quality ---------------- */
  function assessQuality(canvas) {
    const cw = canvas.width, ch = canvas.height;
    // centre region, where the face should be
    const sx = cw * 0.2, sy = ch * 0.12, sw = cw * 0.6, sh = ch * 0.7;
    const w = 256, h = Math.max(1, Math.round(256 * sh / sw));
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;

    const g = new Float32Array(w * h);
    const hist = new Uint32Array(256);
    let sum = 0, clipped = 0;
    for (let i = 0, p = 0; p < g.length; i += 4, p++) {
      const y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      g[p] = y; sum += y; hist[y | 0]++;
      if (y > 250) clipped++;
    }
    const brightness = sum / g.length;
    let acc = 0, highlight = 255;               // 90th-percentile luminance
    for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= g.length * 0.9) { highlight = v; break; } }

    // variance of the Laplacian = sharpness
    let lsum = 0, lsq = 0, n = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const p = y * w + x;
        const lap = g[p - w] + g[p + w] + g[p - 1] + g[p + 1] - 4 * g[p];
        lsum += lap; lsq += lap * lap; n++;
      }
    }
    const mean = lsum / n;
    const sharpness = lsq / n - mean * mean;
    const clippedShare = clipped / g.length;

    let issue = null;
    if (highlight < Q.minHighlight) issue = "too_dark";
    else if (brightness > Q.maxBrightness || clippedShare > Q.maxClippedShare) issue = "overexposed";
    else if (sharpness < Q.minSharpness) issue = "blurry";
    return { ok: !issue, issue, brightness: Math.round(brightness), highlight, sharpness: Math.round(sharpness) };
  }

  const RETAKE_MESSAGES = {
    too_dark: "This photo is too dark to see your features. Please move to a brighter spot or face a window, then retake.",
    overexposed: "This photo is too bright or washed out. Step away from direct light and retake.",
    blurry: "This photo looks blurry. Hold your phone steady (or tap the screen to focus) and retake.",
    no_face: "We couldn't find a clear face in this photo. Please take a selfie facing the camera.",
    multiple_faces: "We can see more than one face. Please use a photo with just you in it.",
    face_obscured: "Your face is partly hidden or turned away. Please face the camera without sunglasses, mask or cap.",
    not_a_photo: "This doesn't look like a real photo. Please take or upload a selfie.",
    unreadable: "We couldn't open that image. Please use a JPG or PNG photo."
  };

  /* ---------------- set photo from any source ---------------- */
  async function setPhotoFromCanvas(source, sw, sh, mirror) {
    const scale = Math.min(1, MAX_SIDE / Math.max(sw, sh));
    const c = document.createElement("canvas");
    c.width = Math.round(sw * scale);
    c.height = Math.round(sh * scale);
    const ctx = c.getContext("2d");
    if (mirror) { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(source, 0, 0, c.width, c.height);

    const quality = assessQuality(c);
    const blob = await new Promise(res => c.toBlob(res, "image/jpeg", JPEG_QUALITY));
    if (!blob) throw new Error("encode_failed");

    clearPhoto(false);
    state.photo = { blob, url: URL.createObjectURL(blob), quality };
    state.photoSeq++;
    el.preview.src = state.photo.url;
    renderStage("preview");
    photoMessage(quality.ok ? "" : RETAKE_MESSAGES[quality.issue]);
    el.photoMessage.dataset.issue = quality.issue || "";
    hideError();
    refreshAnalyzeButton();
  }

  async function setPhotoFromFile(file) {
    if (!file) return;
    if (file.type && !file.type.startsWith("image/")) { photoMessage(RETAKE_MESSAGES.unreadable); return; }
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      await img.decode();
      await setPhotoFromCanvas(img, img.naturalWidth, img.naturalHeight, false);
    } catch {
      photoMessage(RETAKE_MESSAGES.unreadable);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function clearPhoto(render = true) {
    if (state.photo) URL.revokeObjectURL(state.photo.url);
    state.photo = null;
    el.preview.removeAttribute("src");
    if (render) {
      state.photoSeq++;
      photoMessage("");
      renderStage("empty");
      refreshAnalyzeButton();
    }
  }

  /* ---------------- camera ---------------- */
  const canUseLiveCamera = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.isSecureContext);

  function stopCamera() {
    if (state.stream) state.stream.getTracks().forEach(t => t.stop());
    state.stream = null;
    el.camera.srcObject = null;
  }

  async function openCamera() {
    if (!canUseLiveCamera()) { el.cameraFallbackInput.click(); return; }
    stopCamera();
    photoMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: state.facingMode, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false
      });
      state.stream = stream;
      el.camera.srcObject = stream;
      el.camera.classList.toggle("mirror", state.facingMode === "user");
      renderStage("camera");
      $("stage").scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      const blocked = err && (err.name === "NotAllowedError" || err.name === "SecurityError");
      photoMessage(blocked
        ? "Camera access is blocked. Allow camera access in your browser settings, or tap Upload photo instead."
        : "We couldn't start your camera. You can upload a photo instead.");
      renderStage(state.photo ? "preview" : "empty");
    }
  }

  async function capture() {
    const v = el.camera;
    if (!v.videoWidth) return;               // stream not ready yet
    const mirror = state.facingMode === "user";
    const w = v.videoWidth, h = v.videoHeight;
    // grab the current frame BEFORE stopping the stream
    const frame = document.createElement("canvas");
    frame.width = w; frame.height = h;
    frame.getContext("2d").drawImage(v, 0, 0, w, h);
    stopCamera();
    await setPhotoFromCanvas(frame, w, h, mirror);
  }

  function cancelCamera() {
    stopCamera();
    renderStage(state.photo ? "preview" : "empty");
  }

  /* ---------------- analysis ---------------- */
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(",")[1]);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  }

  function setBusy(on) {
    state.busy = on;
    show(el.loading, on);
    document.querySelectorAll("#photoActionsFilled button, #goalChips button").forEach(b => { b.disabled = on; });
    el.goalNote.disabled = on;
    refreshAnalyzeButton();
  }

  function hideError() { show(el.errorBox, false); }
  function showError(text) {
    el.errorText.textContent = text;
    show(el.errorBox, true);
  }

  const ERROR_MESSAGES = {
    not_configured: "The analyser isn't set up yet. Please try again later or book directly on WhatsApp.",
    timeout: "The analysis took too long. Please check your connection and try again.",
    network: "We couldn't reach the analyser. Please check your internet connection and try again.",
    default: "We couldn't analyse your photo this time. Please try again."
  };

  async function analyze() {
    if (!state.photo || state.busy) return;
    if (!ENDPOINT) { showError(ERROR_MESSAGES.not_configured); return; }

    hideError();
    setBusy(true);
    const key = currentKey();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

    try {
      const image = await blobToBase64(state.photo.blob);
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, mediaType: "image/jpeg", goals: selectedGoals(), note: el.goalNote.value.trim() }),
        signal: ctrl.signal,
        credentials: "omit",
        cache: "no-store"
      });
      let data = null;
      try { data = await res.json(); } catch { /* non-JSON */ }

      if (data && data.status === "retake") {
        show(el.results, false);
        state.photo.quality = { ok: false, issue: data.issue || "no_face" };   // block resubmitting the same photo
        photoMessage(RETAKE_MESSAGES[data.issue] || RETAKE_MESSAGES.no_face);
        el.photoMessage.dataset.issue = data.issue || "no_face";
        el.photoMessage.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      if (!res.ok || !data || data.status !== "ok") {
        const why = (data && (data.detail || data.code)) || `HTTP ${res.status}`;
        showError((ERROR_MESSAGES[data && data.code] || ERROR_MESSAGES.default) + "  [" + why + "]");
        return;
      }
      state.lastResultKey = key;
      renderResults(data);
    } catch (err) {
      showError(ctrl.signal.aborted ? ERROR_MESSAGES.timeout : ERROR_MESSAGES.network);
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  }

  /* ---------------- results ---------------- */
  const BASIS_LABEL = { photo: "From your photo", goal: "From your goal", both: "Photo + your goal" };

  function renderResults(data) {
    el.observations.replaceChildren(...(data.observations.length ? data.observations : ["Your photo looks great for analysis."]).map(t => {
      const d = document.createElement("div");
      d.className = "bg-[#59ff4f]/10 border border-[#59ff4f]/40 px-4 py-2 rounded-full";
      d.textContent = t;
      return d;
    }));

    el.recommendations.replaceChildren(...data.recommendations.map(r => {
      const card = document.createElement("label");
      card.className = "glass rounded-2xl p-5 flex gap-4 items-start cursor-pointer border border-[#59ff4f]/20 hover:border-[#59ff4f]/60 transition";
      card.dataset.serviceId = r.id;

      const cb = document.createElement("input");
      cb.type = "checkbox"; cb.checked = true; cb.className = "mt-1 w-5 h-5 accent-[#59ff4f] shrink-0";
      cb.dataset.name = r.name; cb.dataset.price = r.price;
      cb.addEventListener("change", updateBookLink);

      const body = document.createElement("div");
      body.className = "flex-1";
      const top = document.createElement("div");
      top.className = "flex justify-between gap-3 items-baseline";
      const name = document.createElement("h3"); name.className = "text-xl font-bold"; name.textContent = r.name;
      const price = document.createElement("span"); price.className = "text-[#59ff4f] font-bold whitespace-nowrap"; price.textContent = r.price;
      top.append(name, price);
      const reason = document.createElement("p"); reason.className = "text-gray-300 mt-1"; reason.textContent = r.reason;
      const tag = document.createElement("span"); tag.className = "inline-block mt-3 text-xs uppercase tracking-wider text-gray-400 border border-white/20 rounded-full px-3 py-1";
      tag.textContent = BASIS_LABEL[r.basis] || BASIS_LABEL.photo;
      body.append(top, reason, tag);
      card.append(cb, body);
      return card;
    }));

    updateBookLink();
    show(el.staleBanner, false);
    show(el.results, true);
    el.results.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateBookLink() {
    const picked = [...el.recommendations.querySelectorAll('input[type="checkbox"]:checked')];
    const lines = picked.map(cb => `• ${cb.dataset.name} (${cb.dataset.price})`);
    const text = `Hi Primo! I'd like to book these services suggested by the Face Analyser:\n${lines.join("\n")}\n\nPreferred date/time: `;
    el.btnBook.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
    el.btnBook.classList.toggle("pointer-events-none", !picked.length);
    el.btnBook.classList.toggle("opacity-40", !picked.length);
  }

  function startOver() {
    stopCamera();
    clearPhoto();
    show(el.results, false);
    hideError();
    state.lastResultKey = null;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------------- wiring ---------------- */
  $("btnTakeSelfie").addEventListener("click", openCamera);
  $("btnRetake").addEventListener("click", openCamera);
  $("btnUpload").addEventListener("click", () => el.uploadInput.click());
  $("btnReplace").addEventListener("click", () => el.uploadInput.click());
  $("btnRemove").addEventListener("click", () => { clearPhoto(); show(el.results, false); hideError(); });
  $("btnCapture").addEventListener("click", capture);
  $("btnCancelCamera").addEventListener("click", cancelCamera);
  $("btnSwitchCamera").addEventListener("click", () => {
    state.facingMode = state.facingMode === "user" ? "environment" : "user";
    openCamera();
  });
  $("btnRetry").addEventListener("click", analyze);
  $("btnErrorNewPhoto").addEventListener("click", () => { hideError(); el.uploadInput.click(); });
  $("btnStartOver").addEventListener("click", startOver);
  el.btnAnalyze.addEventListener("click", analyze);
  el.consent.addEventListener("change", refreshAnalyzeButton);
  el.goalNote.addEventListener("input", refreshAnalyzeButton);

  el.goalChips.addEventListener("click", e => {
    const chip = e.target.closest(".goal-chip");
    if (!chip || state.busy) return;
    chip.setAttribute("aria-pressed", chip.getAttribute("aria-pressed") === "true" ? "false" : "true");
    refreshAnalyzeButton();
  });

  [el.uploadInput, el.cameraFallbackInput].forEach(input => {
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      input.value = "";               // allow picking the same file again
      await setPhotoFromFile(file);
    });
  });

  // release the camera and drop the photo when the customer leaves
  window.addEventListener("pagehide", () => { stopCamera(); clearPhoto(false); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && state.stream) cancelCamera(); });

  renderStage("empty");
  refreshAnalyzeButton();

  // exposed for automated tests only
  window.__primoAnalyser = { state, assessQuality, thresholds: Q };
})();
