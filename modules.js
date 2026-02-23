/* =============================================
   modules.js — MHT CET LAW Portal
   Study Modules Page Script
   ============================================= */

(function () {
  'use strict';

  /* ── PROGRAMME TAB SWITCHING ───────────── */
  const tabs   = document.querySelectorAll('.ptab');
  const panels = document.querySelectorAll('.modules-panel');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      const target = tab.dataset.tab;

      // Update tab states
      tabs.forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      // Show correct panel
      panels.forEach(function (panel) {
        panel.classList.remove('active');
      });

      var targetPanel = document.getElementById('panel-' + target);
      if (targetPanel) {
        targetPanel.classList.add('active');

        // Re-trigger fade-in animations for newly visible cards
        var faders = targetPanel.querySelectorAll('.fade-in:not(.visible)');
        if ('IntersectionObserver' in window) {
          faders.forEach(function (el) {
            el.style.transitionDelay = '0ms';
            el.classList.add('visible');
          });
        }
      }

      // Update URL hash without scrolling
      try {
        history.replaceState(null, '', '#' + target);
      } catch (e) {}
    });
  });

  /* ── RESTORE TAB FROM URL HASH ─────────── */
  (function () {
    var hash = window.location.hash.replace('#', '');
    if (hash === '3yr' || hash === '5yr') {
      var tabEl = document.getElementById('tab-' + hash);
      if (tabEl) tabEl.click();
    }
  })();

  /* ── LOCK MODAL ────────────────────────── */
  var modalBg    = document.getElementById('lockModal');
  var modalTitle = document.getElementById('modalTitle');
  var modalDesc  = document.getElementById('modalDesc');

  function openModal(name) {
    if (!modalBg) return;
    modalTitle.textContent = name || 'Premium Module';
    modalDesc.textContent  =
      '"' + name + '" is part of the premium course. ' +
      'Message @ragexking on Telegram to unlock full access.';
    modalBg.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modalBg) return;
    modalBg.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Delegate: any [data-locked] button
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-locked]');
    if (!btn) return;
    e.preventDefault();
    openModal(btn.dataset.locked);
  });

  document.getElementById('modalClose')
    ?.addEventListener('click', closeModal);
  document.getElementById('modalCancel')
    ?.addEventListener('click', closeModal);

  modalBg?.addEventListener('click', function (e) {
    if (e.target === modalBg) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  /* ── DARK MODE TOGGLE ───────────────────── */
  var themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    // Sync dark mode state from localStorage if available
    try {
      if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch (e) {}

    themeToggle.addEventListener('click', function () {
      var html = document.documentElement;
      if (html.getAttribute('data-theme') === 'dark') {
        html.removeAttribute('data-theme');
        try { localStorage.setItem('theme', 'light'); } catch (e) {}
      } else {
        html.setAttribute('data-theme', 'dark');
        try { localStorage.setItem('theme', 'dark'); } catch (e) {}
      }
    });
  }

  /* ── FADE-IN ON SCROLL ──────────────────── */
  var faders = document.querySelectorAll('.fade-in');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        entry.target.style.transitionDelay = (i % 4 * 70) + 'ms';
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.1 });

    faders.forEach(function (el) { io.observe(el); });
  } else {
    faders.forEach(function (el) { el.classList.add('visible'); });
  }

})();
