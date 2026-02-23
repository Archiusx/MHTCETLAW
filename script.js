/* =============================================
   MHT CET LAW PORTAL — script.js
   ============================================= */

(function () {
  'use strict';

  /* ── SPLASH SCREEN ─────────────────────── */
  const splash = document.getElementById('splash');

  function hideSplash() {
    if (!splash) return;
    splash.classList.add('hide');
    document.body.classList.add('ready');

    splash.addEventListener(
      'transitionend',
      () => splash.remove(),
      { once: true }
    );
  }

  const minWait = new Promise((r) => setTimeout(r, 900));
  const docReady = new Promise((r) => {
    if (document.readyState === 'complete') r();
    else window.addEventListener('load', r, { once: true });
  });

  Promise.all([minWait, docReady]).then(hideSplash);

  /* ── SMOOTH SCROLL ─────────────────────── */
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const id = link.getAttribute('href');
    if (!id || id === '#') return;

    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();

    const offset = 130;
    const top =
      target.getBoundingClientRect().top +
      window.scrollY -
      offset;

    window.scrollTo({ top, behavior: 'smooth' });
  });

  /* ── ACTIVE NAV LINK ───────────────────── */
  const navLinks = Array.from(
    document.querySelectorAll('.nav-link[href^="#"]')
  );

  const anchors = navLinks
    .map((l) => document.querySelector(l.getAttribute('href')))
    .filter(Boolean);

  function setActive() {
    const scrollY = window.scrollY + 140;
    let current = null;

    anchors.forEach((el) => {
      if (el.offsetTop <= scrollY) current = el.id;
    });

    navLinks.forEach((l) => {
      l.classList.toggle(
        'active',
        l.getAttribute('href') === `#${current}`
      );
    });
  }

  window.addEventListener('scroll', setActive, { passive: true });
  window.addEventListener('load', setActive);

  /* ── LOCK MODAL ────────────────────────── */
  const modalBg = document.getElementById('lockModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');

  function openModal(name) {
    if (!modalBg) return;

    modalTitle.textContent = name || 'Premium Content';
    modalDesc.textContent = `"${name}" is part of the premium course. Message @ragexking on Telegram to unlock access.`;

    modalBg.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modalBg) return;

    modalBg.classList.remove('open');
    document.body.style.overflow = '';
  }

  window.openLockModal = openModal;

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-locked]');
    if (!btn) return;

    e.preventDefault();
    openModal(btn.dataset.locked);
  });

  document
    .getElementById('modalClose')
    ?.addEventListener('click', closeModal);

  document
    .getElementById('modalCancel')
    ?.addEventListener('click', closeModal);

  modalBg?.addEventListener('click', (e) => {
    if (e.target === modalBg) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  /* ── FADE-IN ON SCROLL ─────────────────── */
  const faders = document.querySelectorAll('.fade-in');

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (!entry.isIntersecting) return;

          entry.target.style.transitionDelay =
            `${(i % 6) * 55}ms`;

          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );

    faders.forEach((el) => io.observe(el));
  } else {
    faders.forEach((el) => el.classList.add('visible'));
  }

  /* ── COUNTER ANIMATION ─────────────────── */
  const counters = document.querySelectorAll('.count-up');

  if (counters.length && 'IntersectionObserver' in window) {
    const counterIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target;
          const end = parseFloat(el.dataset.target);
          const suffix = el.dataset.suffix || '';
          const duration = 1200;
          const start = performance.now();

          function tick(now) {
            const progress = Math.min(
              (now - start) / duration,
              1
            );

            const value = Math.round(
              end * (1 - Math.pow(1 - progress, 3))
            );

            el.textContent = value + suffix;

            if (progress < 1) {
              requestAnimationFrame(tick);
            }
          }

          requestAnimationFrame(tick);
          counterIO.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((c) => counterIO.observe(c));
  }

  /* ── BUTTON LOADING STATE ──────────────── */
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('a.btn');
    if (!btn) return;

    const href = btn.getAttribute('href');

    if (
      !href ||
      href.startsWith('#') ||
      btn.dataset.locked !== undefined
    ) {
      return;
    }

    btn.classList.add('loading');
    setTimeout(() => {
      btn.classList.remove('loading');
    }, 3000);
  });

  /* ── DARK MODE TOGGLE ─────────────────── */
  const themeToggle = document.getElementById('themeToggle');

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const html = document.documentElement;

      if (html.getAttribute('data-theme') === 'dark') {
        html.removeAttribute('data-theme');
      } else {
        html.setAttribute('data-theme', 'dark');
      }
    });
  }
})();
