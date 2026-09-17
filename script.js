const body = document.body;
body.classList.add("reveal-ready");

const progressBar = document.querySelector(".scroll-progress span");
const revealItems = document.querySelectorAll("[data-reveal]");
const counters = document.querySelectorAll("[data-count]");
const tiltItems = document.querySelectorAll("[data-tilt]");
const hoverItems = document.querySelectorAll(
  ".work-card, .stack-card, .timeline-item, .metric, .button, .nav-links a, .nav-cta, .education-strip span, .deck-shell, .deck-card, .career-row, .stack-tile, .credential-pill, .deck-tabs button, .deck-arrow"
);
const deck = document.querySelector("[data-deck]");
const deckViewport = document.querySelector("[data-deck-viewport]");
const deckSlides = Array.from(document.querySelectorAll("[data-deck-slide]"));
const deckTabs = Array.from(document.querySelectorAll("[data-deck-tab]"));
const deckStatus = document.querySelector("[data-deck-status]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? (window.scrollY / max) * 100 : 0;
  progressBar.style.width = `${progress}%`;
}

function animateCounter(item) {
  const target = Number(item.dataset.count || 0);
  const suffix = item.dataset.suffix || "";
  const duration = 1150;
  const start = performance.now();

  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    item.textContent = `${Math.round(target * eased)}${suffix}`;
    if (t < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

const seenCounters = new WeakSet();

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");

        entry.target.querySelectorAll("[data-count]").forEach((counter) => {
          if (!seenCounters.has(counter) && !prefersReducedMotion) {
            seenCounters.add(counter);
            animateCounter(counter);
          }
        });
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -60px" }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

tiltItems.forEach((item) => {
  item.addEventListener("pointermove", (event) => {
    if (prefersReducedMotion || window.innerWidth < 760) return;
    const rect = item.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    item.style.transform = `perspective(900px) rotateX(${y * -5}deg) rotateY(${x * 7}deg) translateY(-2px)`;
  });

  item.addEventListener("pointerleave", () => {
    item.style.transform = "";
  });
});

hoverItems.forEach((item) => {
  item.addEventListener("pointermove", (event) => {
    const rect = item.getBoundingClientRect();
    item.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    item.style.setProperty("--my", `${event.clientY - rect.top}px`);
  });

  item.addEventListener("pointerleave", () => {
    item.style.removeProperty("--mx");
    item.style.removeProperty("--my");
  });
});

let activeDeckIndex = 0;
const deckDurations = [3000, 1500, 1500];
let deckTimer = null;
let deckIsPaused = false;
let deckStartedAt = 0;
let deckRemaining = deckDurations[0];

function updateDeckHeight() {
  if (!deckViewport || !deckSlides.length) return;
  const activeSlide = deckSlides[activeDeckIndex];
  deckViewport.style.height = `${activeSlide.offsetHeight}px`;
}

function clearDeckTimer() {
  if (!deckTimer) return;
  window.clearTimeout(deckTimer);
  deckTimer = null;
}

function scheduleDeckAutoplay(duration = deckDurations[activeDeckIndex] || 1500) {
  clearDeckTimer();
  if (!deck || prefersReducedMotion || deckIsPaused || !deckSlides.length) return;
  deckRemaining = duration;
  deckStartedAt = performance.now();
  deckTimer = window.setTimeout(() => {
    setDeckSlide(activeDeckIndex + 1);
  }, duration);
}

function pauseDeckAutoplay() {
  deckIsPaused = true;
  deck?.classList.add("is-paused");
  if (deckTimer) {
    const elapsed = performance.now() - deckStartedAt;
    deckRemaining = Math.max(700, deckRemaining - elapsed);
  }
  clearDeckTimer();
}

function resumeDeckAutoplay() {
  deckIsPaused = false;
  deck?.classList.remove("is-paused");
  scheduleDeckAutoplay(deckRemaining);
}

function setDeckSlide(index, focusTab = false) {
  if (!deckSlides.length) return;
  activeDeckIndex = (index + deckSlides.length) % deckSlides.length;

  if (deck) {
    deckRemaining = deckDurations[activeDeckIndex] || 1500;
    deck.style.setProperty("--deck-duration", `${deckRemaining}ms`);
  }

  deckSlides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === activeDeckIndex;
    slide.classList.toggle("is-active", isActive);
    slide.setAttribute("aria-hidden", String(!isActive));
  });

  deckTabs.forEach((tab, tabIndex) => {
    const isActive = tabIndex === activeDeckIndex;
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
    if (focusTab && isActive) tab.focus();
  });

  if (deckStatus) {
    deckStatus.textContent = `Page ${activeDeckIndex + 1} of ${deckSlides.length}`;
  }

  requestAnimationFrame(updateDeckHeight);
  scheduleDeckAutoplay(deckRemaining);
}

if (deck && deckSlides.length) {
  deckTabs.forEach((tab) => {
    tab.addEventListener("click", () => setDeckSlide(Number(tab.dataset.deckTab || 0)));
  });

  document.querySelector("[data-deck-prev]")?.addEventListener("click", () => {
    setDeckSlide(activeDeckIndex - 1, true);
  });

  document.querySelector("[data-deck-next]")?.addEventListener("click", () => {
    setDeckSlide(activeDeckIndex + 1, true);
  });

  document.querySelectorAll("[data-nav-slide]").forEach((link) => {
    link.addEventListener("click", () => {
      setDeckSlide(Number(link.dataset.navSlide || 0));
    });
  });

  deck.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setDeckSlide(activeDeckIndex - 1, true);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      setDeckSlide(activeDeckIndex + 1, true);
    }
  });

  let swipeStartX = 0;
  deckViewport.addEventListener("pointerdown", (event) => {
    swipeStartX = event.clientX;
  });

  deckViewport.addEventListener("pointerup", (event) => {
    const distance = event.clientX - swipeStartX;
    if (Math.abs(distance) > 55) {
      setDeckSlide(activeDeckIndex + (distance < 0 ? 1 : -1));
    }
  });

  deck.addEventListener("pointerenter", pauseDeckAutoplay);
  deck.addEventListener("pointerleave", resumeDeckAutoplay);
  deck.addEventListener("focusin", pauseDeckAutoplay);
  deck.addEventListener("focusout", () => {
    if (!deck.contains(document.activeElement)) resumeDeckAutoplay();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseDeckAutoplay();
    else resumeDeckAutoplay();
  });

  window.addEventListener("resize", updateDeckHeight);
  setDeckSlide(0);
}

const year = document.getElementById("year");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);
updateProgress();

const canvas = document.getElementById("signalCanvas");
const ctx = canvas.getContext("2d");
let width = 0;
let height = 0;
let points = [];
let pointer = { x: -9999, y: -9999 };

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.min(92, Math.max(38, Math.floor((width * height) / 22000)));
  points = Array.from({ length: count }, (_, index) => ({
    x: (index * 191) % width,
    y: (index * 379) % height,
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.18,
    phase: Math.random() * Math.PI * 2,
  }));
}

function drawSignalField() {
  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 1;

  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    point.x += point.vx + Math.sin(point.phase) * 0.02;
    point.y += point.vy + Math.cos(point.phase) * 0.02;
    point.phase += 0.004;

    if (point.x < -20) point.x = width + 20;
    if (point.x > width + 20) point.x = -20;
    if (point.y < -20) point.y = height + 20;
    if (point.y > height + 20) point.y = -20;

    for (let j = i + 1; j < points.length; j += 1) {
      const other = points[j];
      const dx = point.x - other.x;
      const dy = point.y - other.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 145) {
        const alpha = (1 - distance / 145) * 0.16;
        ctx.strokeStyle = `rgba(216, 183, 107, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
      }
    }

    const px = point.x - pointer.x;
    const py = point.y - pointer.y;
    const pointerDistance = Math.hypot(px, py);
    if (pointerDistance < 180) {
      ctx.strokeStyle = `rgba(130, 231, 201, ${(1 - pointerDistance / 180) * 0.28})`;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(pointer.x, pointer.y);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(244, 239, 229, 0.42)";
    ctx.fillRect(point.x, point.y, 1.35, 1.35);
  }

  if (!prefersReducedMotion) requestAnimationFrame(drawSignalField);
}

if (!prefersReducedMotion) {
  resizeCanvas();
  drawSignalField();
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("pointermove", (event) => {
    pointer = { x: event.clientX, y: event.clientY };
  });
  window.addEventListener("pointerleave", () => {
    pointer = { x: -9999, y: -9999 };
  });
}
