(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     NAV: scroll state, burger menu, active link highlighting,
     smooth-close on link click
  --------------------------------------------------------- */
  const nav = document.getElementById("nav");
  const burger = document.getElementById("burgerBtn");
  const navMobile = document.getElementById("navMobile");
  const navLinks = document.querySelectorAll('[data-link]');

  const fabBook = document.getElementById("fabBook");
  const onScrollNav = () => {
    const scrolled = window.scrollY > 40;
    nav.classList.toggle("is-scrolled", scrolled);
    if (fabBook) fabBook.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.6);
  };
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  burger.addEventListener("click", () => {
    const open = navMobile.classList.toggle("is-open");
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
  });

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      navMobile.classList.remove("is-open");
      burger.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    });
  });

  // Highlight the nav link matching the section currently in view
  const sections = Array.from(document.querySelectorAll("section[id]"));
  const topNavAnchors = document.querySelectorAll('.nav__links a[data-link]');

  const setActiveLink = (id) => {
    topNavAnchors.forEach(a => {
      a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`);
    });
  };

  if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setActiveLink(entry.target.id);
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(s => navObserver.observe(s));
  }

  /* ---------------------------------------------------------
     BOOK APPOINTMENT — visual highlight ping when clicked
     (nav button + floating action button)
  --------------------------------------------------------- */
  const highlightBookButtons = () => {
    document.querySelectorAll(".btn--glow, .fab-book").forEach(btn => {
      btn.classList.add("is-pinged");
      setTimeout(() => btn.classList.remove("is-pinged"), 700);
    });
  };
  document.querySelectorAll('a[href="#book"]').forEach(btn => {
    btn.addEventListener("click", highlightBookButtons);
  });

  /* ---------------------------------------------------------
     REVEAL ON SCROLL
  --------------------------------------------------------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add("is-visible"), (i % 6) * 70);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("is-visible"));
  }

  /* ---------------------------------------------------------
     STAT COUNT-UP
  --------------------------------------------------------- */
  const statEls = document.querySelectorAll(".pitch__num[data-count]");
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimal || "0", 10);
    const duration = 1400;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString("en-IN");
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = decimals ? target.toFixed(decimals) : target.toLocaleString("en-IN");
    };
    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const statObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          statObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    statEls.forEach(el => statObserver.observe(el));
  } else {
    statEls.forEach(el => { el.textContent = el.dataset.count; });
  }

  /* ---------------------------------------------------------
     PITCH CAROUSEL — two slides (About / Franchise), auto-plays
     like Green Trends' sectionTwo slick slider
  --------------------------------------------------------- */
  const pitchTrack = document.getElementById("pitchTrack");
  const pitchDotsWrap = document.getElementById("pitchDots");

  if (pitchTrack) {
    const pitchSlides = pitchTrack.children.length;
    let pitchIndex = 0;
    let pitchTimer;

    for (let i = 0; i < pitchSlides; i++) {
      const dot = document.createElement("button");
      dot.setAttribute("aria-label", `Show slide ${i + 1}`);
      if (i === 0) dot.classList.add("is-active");
      dot.addEventListener("click", () => pitchGoTo(i));
      pitchDotsWrap.appendChild(dot);
    }
    const pitchDots = pitchDotsWrap.children;

    function pitchGoTo(i) {
      pitchIndex = (i + pitchSlides) % pitchSlides;
      pitchTrack.style.transform = `translateX(-${pitchIndex * 100}%)`;
      Array.from(pitchDots).forEach((d, di) => d.classList.toggle("is-active", di === pitchIndex));
    }

    const pitchStart = () => { pitchTimer = setInterval(() => pitchGoTo(pitchIndex + 1), 4500); };
    if (!reduceMotion) pitchStart();
  }

  /* ---------------------------------------------------------
     HERO VIDEO — plays if a real source is ever added;
     otherwise the canvas backdrop below carries the motion.
     To go live: add a <source> to #heroVideoDesktop /
     #heroVideoMobile in the HTML, or set their .src here.
  --------------------------------------------------------- */
  const heroVideos = [document.getElementById("heroVideoDesktop"), document.getElementById("heroVideoMobile")];
  heroVideos.forEach(v => {
    if (!v) return;
    if (v.readyState >= 2) {
      v.setAttribute("data-ready", "true");
    } else {
      v.addEventListener("loadeddata", () => v.setAttribute("data-ready", "true"));
    }
  });

  /* ---------------------------------------------------------
     HERO CANVAS — ambient "smart salon" particle network.
     Lightweight constellation of drifting green/white nodes
     with connecting lines, echoing the brand's tech-forward
     positioning. Respects reduced-motion.
  --------------------------------------------------------- */
  const canvas = document.getElementById("heroCanvas");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let width, height, particles;
    const COUNT = 46;
    const LINK_DIST = 130;

    const rand = (min, max) => Math.random() * (max - min) + min;

    const resize = () => {
      const hero = canvas.closest(".hero");
      width = canvas.width = hero.offsetWidth;
      height = canvas.height = hero.offsetHeight;
    };

    const initParticles = () => {
      particles = Array.from({ length: COUNT }, () => ({
        x: rand(0, width),
        y: rand(0, height),
        vx: rand(-0.15, 0.15),
        vy: rand(-0.12, 0.12),
        r: rand(1, 2.4),
        green: Math.random() > 0.6
      }));
    };

    const step = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            ctx.strokeStyle = `rgba(95,224,66,${0.16 * (1 - dist / LINK_DIST)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = p.green ? "rgba(95,224,66,0.85)" : "rgba(246,247,242,0.55)";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(step);
    };

    resize();
    initParticles();
    requestAnimationFrame(step);

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { resize(); initParticles(); }, 200);
    });
  }

  /* ---------------------------------------------------------
     REVIEWS CAROUSEL
  --------------------------------------------------------- */
  const list = document.getElementById("reviewsList");
  const dotsWrap = document.getElementById("reviewsDots");
  const prevBtn = document.getElementById("revPrev");
  const nextBtn = document.getElementById("revNext");

  if (list) {
    const slides = list.children.length;
    let index = 0;
    let autoTimer;

    for (let i = 0; i < slides; i++) {
      const dot = document.createElement("button");
      dot.setAttribute("aria-label", `Show review ${i + 1}`);
      if (i === 0) dot.classList.add("is-active");
      dot.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(dot);
    }
    const dots = dotsWrap.children;

    function goTo(i) {
      index = (i + slides) % slides;
      list.style.transform = `translateX(-${index * 100}%)`;
      Array.from(dots).forEach((d, di) => d.classList.toggle("is-active", di === index));
    }

    const startAuto = () => {
      autoTimer = setInterval(() => goTo(index + 1), 5500);
    };
    const stopAuto = () => clearInterval(autoTimer);

    prevBtn.addEventListener("click", () => { goTo(index - 1); stopAuto(); startAuto(); });
    nextBtn.addEventListener("click", () => { goTo(index + 1); stopAuto(); startAuto(); });

    if (!reduceMotion) startAuto();
  }

  /* ---------------------------------------------------------
     LOCATIONS — data-driven so new branches drop straight in.
     Rendering the primary branch is handled directly in HTML;
     this array is here so future branches can be pushed in
     without touching markup elsewhere on the page.
  --------------------------------------------------------- */
  window.PRIMO_LOCATIONS = [
    {
      name: "Primo Smart Salon — Madanapalle",
      status: "Open now",
      address: "1st Floor, KNR Complex, NTR Circle, above IBOCO Ice Cream, beside KFC, P&T Colony, Madanapalle, Andhra Pradesh 517325",
      phone: "09966016169",
      rating: "4.9 (773)",
      hours: "Closes 9:30 PM",
      mapsQuery: "Primo Smart Salon Madanapalle"
    }
  ];

  /* ---------------------------------------------------------
     WHATSAPP BOOKING
     - Static "Book Now" links (packages, Party/Groom features)
       carry their message in data-wa-text and get their href
       built here.
     - Pricing-group "Book Now" buttons open a modal where the
       customer picks services + tier, enters name/date/time,
       then sends the same way.
  --------------------------------------------------------- */
  const WHATSAPP_NUMBER = "919966016169"; // salon call number, international format

  const waLink = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

  document.querySelectorAll("[data-wa-text]").forEach(el => {
    el.setAttribute("href", waLink(el.dataset.waText));
  });

  const bookModal = document.getElementById("bookModal");
  const bookModalTitle = document.getElementById("bookModalTitle");
  const bookModalStep1Hint = document.getElementById("bookModalStep1Hint");
  const bookModalServices = document.getElementById("bookModalServices");
  const bookModalSummary = document.getElementById("bookModalSummary");
  const bookModalError = document.getElementById("bookModalError");
  const bookName = document.getElementById("bookName");
  const bookDate = document.getElementById("bookDate");
  const bookTime = document.getElementById("bookTime");
  const bookModalSend = document.getElementById("bookModalSend");
  const bookModalNext = document.getElementById("bookModalNext");
  const bookModalBack = document.getElementById("bookModalBack");
  const bookModalClose = document.getElementById("bookModalClose");
  const bookModalBackdrop = document.getElementById("bookModalBackdrop");
  const bookModalStepPanels = document.querySelectorAll(".book-modal__step");
  const bookModalStepDots = document.querySelectorAll(".book-modal__step-dot");

  const BOOKING_GROUPS = {
    all: {
      title: "Book an Appointment",
      items: [
        { id: "gen_hair", label: "Hair Styling & Cuts" },
        { id: "gen_straight", label: "Permanent Straightening" },
        { id: "gen_facial", label: "Hydra Facial & Skin Care" },
        { id: "gen_waxing", label: "Waxing & Threading" },
        { id: "gen_manipedi", label: "Manicure & Pedicure" },
        { id: "gen_bridal", label: "Bridal & Occasion Styling" }
      ],
      tierGroups: []
    }
  };

  let activeGroupKey = null;
  let currentStep = 1;
  const TOTAL_STEPS = 3;

  const optionPriceText = (opt) => opt.priceLabel || (opt.price != null ? `₹${opt.price}` : "");

  const renderBookingGroup = (key) => {
    const group = BOOKING_GROUPS[key];
    if (!group) return;
    activeGroupKey = key;
    bookModalTitle.textContent = group.title;
    bookModalStep1Hint.textContent = group.locked
      ? "Here's what's included — confirm and add your details next."
      : "Select the services you'd like.";

    const renderItemList = (items) => `<ul class="book-modal__option-list">${items.map(item => {
      const priceLabel = item.priceLabel || (item.price != null ? `₹${item.price}` : "");
      return `
        <li class="book-modal__option">
          <label class="book-modal__option-label">
            <input type="checkbox" name="service" value="${item.label}" data-price-label="${priceLabel}" ${group.locked ? "checked disabled" : ""}/>
            ${item.label}
          </label>
          ${priceLabel ? `<span class="book-modal__option-price">${priceLabel}</span>` : ""}
        </li>
      `;
    }).join("")}</ul>`;

    let html = "";
    if (group.items.length) {
      html += `<div>${renderItemList(group.items)}</div>`;
      if (group.locked && group.note) {
        html += `<p class="book-modal__note">${group.note}</p>`;
      }
    }

    (group.itemGroups || []).forEach(section => {
      html += `<div>
        <span class="book-modal__section-label">${section.label}</span>
        ${renderItemList(section.items)}
      </div>`;
    });

    group.tierGroups.forEach(tier => {
      html += `<div>
        <span class="book-modal__section-label">${tier.label}</span>
        <ul class="book-modal__option-list">
          ${tier.options.map(opt => `
            <li class="book-modal__option">
              <label class="book-modal__option-label">
                <input type="radio" name="tier-${tier.name}" value="${opt.label}" data-tier-label="${tier.label.replace(/\s*\([^)]*\)\s*$/, "")}" data-price-label="${optionPriceText(opt)}"/>
                ${opt.label}
              </label>
              <span class="book-modal__option-price">${optionPriceText(opt)}</span>
            </li>
          `).join("")}
        </ul>
      </div>`;
    });

    bookModalServices.innerHTML = html;
  };

  const getSelections = () => {
    const selections = [];
    bookModalServices.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
      const priceLabel = cb.dataset.priceLabel;
      selections.push(priceLabel ? `${cb.value} (${priceLabel})` : cb.value);
    });
    bookModalServices.querySelectorAll('input[type="radio"]:checked').forEach(rb => {
      const priceLabel = rb.dataset.priceLabel;
      const label = `${rb.dataset.tierLabel}: ${rb.value}`;
      selections.push(priceLabel ? `${label} (${priceLabel})` : label);
    });
    return selections;
  };

  const computeSubtotal = () => {
    let subtotal = 0;
    bookModalServices.querySelectorAll('input[type="checkbox"]:checked, input[type="radio"]:checked').forEach(el => {
      const match = (el.dataset.priceLabel || "").match(/^₹([\d,]+)$/);
      if (match) subtotal += Number(match[1].replace(/,/g, ""));
    });
    return subtotal;
  };

  const formatDate = (date) => new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });
  const formatTime = (time) => new Date(`2000-01-01T${time}`).toLocaleTimeString("en-IN", {
    hour: "numeric", minute: "2-digit", hour12: true
  });

  const renderSummary = () => {
    const selections = getSelections();
    const name = bookName.value.trim();
    const date = bookDate.value;
    const time = bookTime.value;

    const listHtml = selections.map(s => {
      const match = s.match(/^(.*) \(([^)]*)\)$/);
      return match
        ? `<li><span>${match[1]}</span><span>${match[2]}</span></li>`
        : `<li><span>${s}</span></li>`;
    }).join("");

    const note = BOOKING_GROUPS[activeGroupKey].note;
    const noteHtml = note ? `<li class="book-modal__summary-note"><span>${note}</span></li>` : "";

    const subtotal = computeSubtotal();
    const subtotalHtml = (!note && subtotal > 0)
      ? `<li class="book-modal__summary-subtotal"><span>Subtotal</span><span>₹${subtotal.toLocaleString("en-IN")}</span></li>`
      : "";

    const metaLines = [`<span><strong>Name:</strong> ${name}</span>`];
    metaLines.push(`<span><strong>Date:</strong> ${date ? formatDate(date) : "Not specified"}</span>`);
    metaLines.push(`<span><strong>Time:</strong> ${time ? formatTime(time) : "Not specified"}</span>`);

    bookModalSummary.innerHTML = `
      <ul class="book-modal__summary-list">${listHtml}${subtotalHtml}${noteHtml}</ul>
      <div class="book-modal__summary-meta">${metaLines.join("")}</div>
    `;
  };

  const updateStepUI = () => {
    bookModalStepPanels.forEach(panel => {
      panel.classList.toggle("is-active", Number(panel.dataset.step) === currentStep);
    });
    bookModalStepDots.forEach(dot => {
      const n = Number(dot.dataset.stepDot);
      dot.classList.toggle("is-active", n === currentStep);
      dot.classList.toggle("is-done", n < currentStep);
    });
    bookModalBack.style.display = currentStep > 1 ? "inline-flex" : "none";
    bookModalNext.style.display = currentStep < TOTAL_STEPS ? "inline-flex" : "none";
    bookModalSend.style.display = currentStep === TOTAL_STEPS ? "inline-flex" : "none";
    bookModalError.textContent = "";
    if (currentStep === TOTAL_STEPS) renderSummary();
  };

  const goToStep = (n) => {
    currentStep = Math.min(Math.max(n, 1), TOTAL_STEPS);
    updateStepUI();
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!getSelections().length) {
        bookModalError.textContent = "Please select at least one service.";
        return false;
      }
    }
    if (step === 2) {
      if (!bookName.value.trim()) {
        bookModalError.textContent = "Please enter your name.";
        bookName.focus();
        return false;
      }
    }
    return true;
  };

  const openBookModal = (key) => {
    renderBookingGroup(key);
    bookModalError.textContent = "";
    bookName.value = "";
    bookDate.value = "";
    bookTime.value = "";
    bookDate.min = new Date().toISOString().split("T")[0];
    currentStep = 1;
    updateStepUI();
    bookModal.classList.add("is-open");
    bookModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeBookModal = () => {
    bookModal.classList.remove("is-open");
    bookModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  document.querySelectorAll("[data-book-group]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openBookModal(btn.dataset.bookGroup);
    });
  });

  if (bookModalClose) bookModalClose.addEventListener("click", closeBookModal);
  if (bookModalBackdrop) bookModalBackdrop.addEventListener("click", closeBookModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && bookModal.classList.contains("is-open")) closeBookModal();
  });

  if (bookModalNext) {
    bookModalNext.addEventListener("click", () => {
      if (!validateStep(currentStep)) return;
      goToStep(currentStep + 1);
    });
  }
  if (bookModalBack) {
    bookModalBack.addEventListener("click", () => goToStep(currentStep - 1));
  }

  if (bookModalSend) {
    bookModalSend.addEventListener("click", () => {
      if (!validateStep(1) || !validateStep(2)) return;

      const selections = getSelections();
      const name = bookName.value.trim();
      const date = bookDate.value;
      const time = bookTime.value;

      const activeGroup = BOOKING_GROUPS[activeGroupKey];
      const groupTitle = activeGroup.title.replace("Book ", "");
      const bulletLines = selections.map(s => `• ${s.replace(/\s\(([^)]*)\)$/, " – $1")}`).join("\n");

      const subtotal = computeSubtotal();

      let message = `Hi Primo Smart Salon! I'd like to book ${groupTitle}:\n\n${bulletLines}`;
      if (!activeGroup.note && subtotal > 0) message += `\n\nSubtotal: ₹${subtotal.toLocaleString("en-IN")}`;
      if (activeGroup.note) message += `\n\n${activeGroup.note}`;
      message += `\n\nName: ${name}`;
      if (date && time) {
        message += `\nPreferred date: ${formatDate(date)}, time: ${formatTime(time)}`;
      } else if (date) {
        message += `\nPreferred date: ${formatDate(date)}`;
      } else if (time) {
        message += `\nPreferred time: ${formatTime(time)}`;
      }
      message += `\n\nLooking forward to my appointment!`;

      window.open(waLink(message), "_blank");
      closeBookModal();
    });
  }

  /* ---------------------------------------------------------
     GALLERY LIGHTBOX — "View Gallery" opens the full style book
  --------------------------------------------------------- */
  const viewGalleryBtn = document.getElementById("viewGalleryBtn");
  const galleryModal = document.getElementById("galleryModal");
  const galleryModalClose = document.getElementById("galleryModalClose");
  const galleryModalBackdrop = document.getElementById("galleryModalBackdrop");

  const openGalleryModal = () => {
    galleryModal.classList.add("is-open");
    galleryModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };
  const closeGalleryModal = () => {
    galleryModal.classList.remove("is-open");
    galleryModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  if (viewGalleryBtn) viewGalleryBtn.addEventListener("click", openGalleryModal);
  if (galleryModalClose) galleryModalClose.addEventListener("click", closeGalleryModal);
  if (galleryModalBackdrop) galleryModalBackdrop.addEventListener("click", closeGalleryModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && galleryModal.classList.contains("is-open")) closeGalleryModal();
  });

  /* ---------------------------------------------------------
     GALLERY QUOTE MARQUEE — pause the scroll on touch so a
     tap lets the visitor actually read it, not just glimpse it
  --------------------------------------------------------- */
  const galleryQuoteTrack = document.getElementById("galleryQuoteTrack");
  if (galleryQuoteTrack) {
    galleryQuoteTrack.addEventListener("touchstart", () => galleryQuoteTrack.classList.add("is-touched"), { passive: true });
    galleryQuoteTrack.addEventListener("touchend", () => galleryQuoteTrack.classList.remove("is-touched"));
  }

  /* ---------------------------------------------------------
     CAREERS FORM
  --------------------------------------------------------- */
  const careersForm = document.getElementById("careersForm");
  if (careersForm) {
    const posSelect = document.getElementById("careerPosition");
    const posOther = document.getElementById("careerPositionOther");
    posSelect.addEventListener("change", () => {
      if (posSelect.value === "Other") {
        posOther.style.display = "block";
        posOther.required = true;
      } else {
        posOther.style.display = "none";
        posOther.required = false;
        posOther.value = "";
      }
    });

    careersForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("careerName").value.trim();
      const phone = document.getElementById("careerPhone").value.trim();
      let position = posSelect.value;
      if (position === "Other") position = posOther.value.trim();
      const experience = document.getElementById("careerExperience").value;

      const message = `Hello Primo Team,\n\nI am applying for the ${position} position.\n\nName: ${name}\nPhone: ${phone}\nExperience: ${experience}\n\nI am attaching my resume below. Looking forward to hearing from you!`;

      window.open(waLink(message), "_blank");
    });
  }
})();

