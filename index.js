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
    v.addEventListener("loadeddata", () => v.setAttribute("data-ready", "true"));
    // Example (uncomment + supply your own file to activate):
    // v.src = "assets/primo-reel-desktop.mp4"; // or -mobile.mp4 for the second element
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
})();
