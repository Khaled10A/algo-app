(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  /* ── Mobile menu ─────────────────────────────────────────────── */
  const burger = document.querySelector(".burger");
  const overlay = document.querySelector("[data-overlay]");
  const menu = document.getElementById("mobile-menu");

  function setMenu(open) {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    overlay.hidden = !open;
    menu.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    if (!open) burger.focus();
  }

  const isMenuOpen = () => burger.getAttribute("aria-expanded") === "true";

  burger.addEventListener("click", () => setMenu(!isMenuOpen()));
  overlay.addEventListener("click", () => setMenu(false));

  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isMenuOpen()) setMenu(false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720 && isMenuOpen()) setMenu(false);
  });

  /* ── Stat count-up ───────────────────────────────────────────── */
  const values = Array.from(document.querySelectorAll(".stat-value"));

  const format = (el, value) =>
    value.toFixed(Number(el.dataset.decimals || 0)) + (el.dataset.suffix || "");

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  function countUp(el, index) {
    const target = parseFloat(el.dataset.target);
    const duration = 1500 + index * 80;
    const startDelay = 480 + index * 90;
    const start = performance.now() + startDelay;

    function frame(now) {
      const elapsed = now - start;
      if (elapsed < 0) {
        requestAnimationFrame(frame);
        return;
      }
      const progress = Math.min(elapsed / duration, 1);
      el.textContent = format(el, target * easeOutCubic(progress));
      if (progress < 1) requestAnimationFrame(frame);
      else el.textContent = format(el, target);
    }

    requestAnimationFrame(frame);
  }

  function runCounters() {
    values.forEach((el, i) => {
      el.textContent = format(el, 0);
      countUp(el, i);
    });
  }

  if (!prefersReducedMotion.matches && "IntersectionObserver" in window) {
    const statsEl = document.querySelector(".stats");
    let started = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            started = true;
            observer.disconnect();
            runCounters();
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(statsEl);
  }
  /* With reduced motion or no IO support, the markup already shows
     the final values — nothing to animate. */
})();
