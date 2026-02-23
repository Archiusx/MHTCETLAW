/* =============================================
   legal-aptitude.js — MHT CET LAW Portal
   Module 1: Legal Aptitude Interactive Logic
   ============================================= */

(function () {
  'use strict';

  /* ── STATE ─────────────────────────────── */
  var cardsViewed   = new Set();
  var selectedAnswers = {};
  var quizSubmitted = false;
  var totalCards    = 12;

  /* ── DARK MODE SYNC ────────────────────── */
  try {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch (e) {}

  var themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
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

  /* ── TAB SWITCHING ─────────────────────── */
  var tabs   = document.querySelectorAll('.la-tab');
  var panels = document.querySelectorAll('.la-panel');

  function switchTab(tabName) {
    tabs.forEach(function (t) {
      var isActive = t.dataset.tab === tabName;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    panels.forEach(function (p) {
      p.classList.toggle('active', p.id === 'tab-' + tabName);
    });
    // trigger fade-in for newly shown panel
    var panel = document.getElementById('tab-' + tabName);
    if (panel) {
      panel.querySelectorAll('.fade-in:not(.visible)').forEach(function (el, i) {
        el.style.transitionDelay = (i * 60) + 'ms';
        el.classList.add('visible');
      });
    }
    try { history.replaceState(null, '', '#' + tabName); } catch (e) {}
  }

  window.switchTab = switchTab; // expose for footer links

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      switchTab(tab.dataset.tab);
    });
  });

  // Restore from hash
  var hash = window.location.hash.replace('#', '');
  var validTabs = ['constitution','contracts','torts','criminal','maxims','flashcards','quiz'];
  if (hash && validTabs.indexOf(hash) !== -1) {
    switchTab(hash);
  }

  /* ── FLASHCARDS ────────────────────────── */
  var fcCards = document.querySelectorAll('.la-fc');
  totalCards = fcCards.length;
  document.getElementById('total-cards-count').textContent = totalCards;

  fcCards.forEach(function (card) {
    card.addEventListener('click', function () {
      card.classList.toggle('flipped');
      var idx = parseInt(card.dataset.index, 10);
      if (card.classList.contains('flipped')) {
        cardsViewed.add(idx);
        card.classList.add('viewed');
      }
      updateProgress();
    });
  });

  /* ── PROGRESS ──────────────────────────── */
  function updateProgress() {
    var viewed  = cardsViewed.size;
    var percent = Math.round((viewed / totalCards) * 100);

    document.getElementById('cards-viewed').textContent       = viewed + '/' + totalCards;
    document.getElementById('completion-percent').textContent = percent + '%';
    document.getElementById('main-progress').style.width      = percent + '%';
  }

  updateProgress();

  /* ── QUIZ OPTION SELECTION ─────────────── */
  document.querySelectorAll('.la-quiz-q').forEach(function (qEl, qIdx) {
    qEl.querySelectorAll('.la-opt').forEach(function (opt) {
      opt.addEventListener('click', function () {
        if (quizSubmitted) return;
        // deselect siblings
        qEl.querySelectorAll('.la-opt').forEach(function (o) {
          o.classList.remove('selected');
        });
        opt.classList.add('selected');
        selectedAnswers[qIdx] = parseInt(opt.dataset.val, 10);
      });
    });
  });

  /* ── SUBMIT QUIZ ───────────────────────── */
  document.getElementById('submitQuizBtn').addEventListener('click', function () {
    var questions   = document.querySelectorAll('.la-quiz-q');
    var correctCount = 0;

    questions.forEach(function (qEl, qIdx) {
      var correct    = parseInt(qEl.dataset.correct, 10);
      var userAnswer = selectedAnswers[qIdx];

      qEl.querySelectorAll('.la-opt').forEach(function (opt) {
        var val = parseInt(opt.dataset.val, 10);
        opt.classList.remove('correct', 'incorrect');
        opt.disabled = true;

        if (val === correct) {
          opt.classList.add('correct');
        } else if (userAnswer !== undefined && val === userAnswer && userAnswer !== correct) {
          opt.classList.add('incorrect');
        }
      });

      if (userAnswer === correct) correctCount++;
    });

    quizSubmitted = true;

    // Update header score
    document.getElementById('quiz-score-display').textContent = correctCount + '/15';

    // Show result
    var resultEl  = document.getElementById('quizResult');
    var scoreEl   = document.getElementById('finalScore');
    var msgEl     = document.getElementById('resultMsg');
    var iconEl    = document.getElementById('resultIcon');

    scoreEl.textContent = correctCount + ' / 15';

    if (correctCount === 15) {
      iconEl.textContent = '🏆';
      msgEl.textContent  = 'Perfect score! Outstanding performance!';
      resultEl.style.borderColor = '#16a34a';
    } else if (correctCount >= 12) {
      iconEl.textContent = '🎉';
      msgEl.textContent  = 'Excellent! You are well-prepared for the exam.';
      resultEl.style.borderColor = '#16a34a';
    } else if (correctCount >= 8) {
      iconEl.textContent = '👍';
      msgEl.textContent  = 'Good job! Review the topics you got wrong and try again.';
      resultEl.style.borderColor = '#d97706';
    } else {
      iconEl.textContent = '📚';
      msgEl.textContent  = 'Keep studying! Go through the theory sections and flashcards, then retry.';
      resultEl.style.borderColor = '#dc2626';
    }

    resultEl.classList.add('show');
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  /* ── RESET QUIZ ────────────────────────── */
  function resetQuiz() {
    selectedAnswers = {};
    quizSubmitted   = false;

    document.querySelectorAll('.la-opt').forEach(function (opt) {
      opt.classList.remove('selected', 'correct', 'incorrect');
      opt.disabled = false;
    });

    document.getElementById('quizResult').classList.remove('show');
    document.getElementById('quiz-score-display').textContent = '–/15';
    document.getElementById('finalScore').textContent = '0 / 15';
  }

  document.getElementById('resetQuizBtn').addEventListener('click', resetQuiz);
  document.getElementById('retryBtn').addEventListener('click', function () {
    resetQuiz();
    document.getElementById('submitQuizBtn').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  /* ── FADE-IN ON SCROLL ─────────────────── */
  var faders = document.querySelectorAll('.fade-in');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        entry.target.style.transitionDelay = (i % 6 * 55) + 'ms';
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.1 });

    faders.forEach(function (el) { io.observe(el); });
  } else {
    faders.forEach(function (el) { el.classList.add('visible'); });
  }

})();
