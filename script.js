// MHT CET LAW Portal - cetlaw.js

document.addEventListener('DOMContentLoaded', () => {

  // ─── Smooth scrolling ───────────────────────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 130;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ─── Active nav link on scroll ──────────────────────────────────────────────
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
  const sections = [];
  navLinks.forEach(l => {
    const id = l.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) sections.push({ el, l });
  });

  const setActive = () => {
    let current = null;
    sections.forEach(({ el }) => {
      if (window.scrollY >= el.offsetTop - 160) current = el.id;
    });
    navLinks.forEach(l => l.classList.remove('active'));
    if (current) {
      const link = document.querySelector(`.nav-link[href="#${current}"]`);
      if (link) link.classList.add('active');
    }
  };

  window.addEventListener('scroll', setActive, { passive: true });
  setActive();

  // ─── Lock Modal ─────────────────────────────────────────────────────────────
  const backdrop = document.getElementById('lockModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');

  function openLockModal(title = 'Premium Content') {
    if (!backdrop) return;
    modalTitle.textContent = title;
    modalDesc.textContent = `"${title}" is part of the premium course. Message @ragexking on Telegram to unlock full access.`;
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLockModal() {
    if (!backdrop) return;
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  window.openLockModal = openLockModal;

  // Close on backdrop click
  backdrop && backdrop.addEventListener('click', e => {
    if (e.target === backdrop) closeLockModal();
  });

  // Close button
  document.getElementById('modalCloseBtn') && document.getElementById('modalCloseBtn').addEventListener('click', closeLockModal);
  document.getElementById('modalCancelBtn') && document.getElementById('modalCancelBtn').addEventListener('click', closeLockModal);

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLockModal();
  });

  // ─── Lock buttons trigger modal ─────────────────────────────────────────────
  document.querySelectorAll('[data-locked]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const name = btn.dataset.locked || 'Premium Content';
      openLockModal(name);
    });
  });

  // ─── Animate counters ───────────────────────────────────────────────────────
  const counters = document.querySelectorAll('.count-up');
  const observed = new Set();

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || observed.has(entry.target)) return;
      observed.add(entry.target);
      const el = entry.target;
      const end = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const duration = 1400;
      const start = performance.now();

      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const val = end % 1 !== 0 ? (end * eased).toFixed(1) : Math.round(end * eased);
        el.textContent = prefix + val + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => io.observe(c));

  // ─── Fade-in on scroll ──────────────────────────────────────────────────────
  const fadeEls = document.querySelectorAll('.fade-in');
  const fadeObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  fadeEls.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.5s ${i * 0.05}s ease, transform 0.5s ${i * 0.05}s ease`;
    fadeObs.observe(el);
  });

  // ─── Nav loading state for external links ───────────────────────────────────
  document.querySelectorAll('a.btn:not([data-locked]):not([href^="#"])').forEach(btn => {
    const href = btn.getAttribute('href');
    if (!href || href === '#' || href === '') return;
    btn.addEventListener('click', function () {
      this.style.opacity = '0.7';
      setTimeout(() => { this.style.opacity = '1'; }, 1500);
    });
  });

});
