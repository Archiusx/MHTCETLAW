/* =============================================
   modules.js — MHT CET LAW Portal
   PREMIUM ACCESS GATE + Full UI
   ============================================= */

import { auth, db, ADMIN_EMAILS } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, addDoc, collection, query, orderBy, getDocs, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentUser = null;

/* ── PREMIUM ACCESS GATE ─────────────────── */
const gate = document.getElementById('premiumGate');
const content = document.getElementById('modulesPageContent');

// Show gate immediately, hide content
if (gate) gate.style.display = 'flex';
if (content) content.style.visibility = 'hidden';

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (!user) {
    showGate('notLoggedIn');
    return;
  }

  const isAdmin = ADMIN_EMAILS.includes(user.email);
  if (isAdmin) { grantAccess(user); return; }

  // ALWAYS fetch fresh from Firestore — never trust sessionStorage
  // Admin may have just upgraded this user, stale cache would break access
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    const data = snap.exists() ? snap.data() : {};
    const plan = data.plan || 'free';

    if (plan === 'premium' || plan === 'admin') {
      grantAccess(user);
    } else {
      showGate('notPremium', user);
    }
  } catch(e) {
    // Firestore error — deny access, show gate
    showGate('notPremium', user);
  }
});

function grantAccess(user) {
  if (gate) {
    gate.style.opacity = '0';
    gate.style.transition = 'opacity 0.3s';
    setTimeout(() => { gate.style.display = 'none'; }, 300);
  }
  if (content) {
    content.style.visibility = 'visible';
    content.style.opacity = '0';
    content.style.transition = 'opacity 0.4s';
    requestAnimationFrame(() => { content.style.opacity = '1'; });
  }
  // Show user info in header
  if (user) {
    const nameEl = document.getElementById('gateUserName');
    const avatarEl = document.getElementById('headerUserAvatar');
    if (nameEl) nameEl.textContent = user.displayName || user.email.split('@')[0];
    if (avatarEl) {
      if (user.photoURL) {
        avatarEl.style.backgroundImage = `url(${user.photoURL})`;
        avatarEl.style.backgroundSize = 'cover';
        avatarEl.innerHTML = '';
      } else {
        avatarEl.textContent = (user.displayName || user.email).charAt(0).toUpperCase();
      }
    }
  }
  initUI();
}

function showGate(reason, user) {
  if (gate) gate.style.display = 'flex';
  if (content) content.style.visibility = 'hidden';

  const loadingEl = document.getElementById('gateLoading');
  const notLoggedEl = document.getElementById('gateNotLoggedIn');
  const notPremiumEl = document.getElementById('gateNotPremium');
  const gateEmailEl = document.getElementById('gateUserEmail');

  if (loadingEl) loadingEl.style.display = 'none';
  if (reason === 'notLoggedIn') {
    if (notLoggedEl) notLoggedEl.style.display = 'block';
    if (notPremiumEl) notPremiumEl.style.display = 'none';
  } else {
    if (notLoggedEl) notLoggedEl.style.display = 'none';
    if (notPremiumEl) notPremiumEl.style.display = 'block';
    if (gateEmailEl && user) gateEmailEl.textContent = user.email;
  }
}

/* ── TABS ──────────────────────────────────── */
function initUI() {
  const tabs = document.querySelectorAll('.ptab');
  const panels = document.querySelectorAll('.modules-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
      tab.classList.add('active'); tab.setAttribute('aria-selected','true');
      panels.forEach(p => p.classList.remove('active'));
      const tp = document.getElementById('panel-' + target);
      if (tp) {
        tp.classList.add('active');
        tp.querySelectorAll('.fade-in:not(.visible)').forEach(el => {
          el.style.transitionDelay = '0ms'; el.classList.add('visible');
        });
      }
      try { history.replaceState(null, '', '#' + target); } catch(e) {}
    });
  });

  const hash = window.location.hash.replace('#','');
  if (hash === '3yr' || hash === '5yr') {
    const t = document.getElementById('tab-' + hash);
    if (t) t.click();
  }

  // Dark mode
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    try { if (localStorage.getItem('theme') === 'dark') document.documentElement.setAttribute('data-theme','dark'); } catch(e) {}
    themeToggle.addEventListener('click', () => {
      const html = document.documentElement;
      if (html.getAttribute('data-theme') === 'dark') {
        html.removeAttribute('data-theme');
        try { localStorage.setItem('theme','light'); } catch(e) {}
      } else {
        html.setAttribute('data-theme','dark');
        try { localStorage.setItem('theme','dark'); } catch(e) {}
      }
    });
  }

  // Fade-in
  const faders = document.querySelectorAll('.fade-in');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        entry.target.style.transitionDelay = (i % 4 * 60) + 'ms';
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    faders.forEach(el => io.observe(el));
  } else {
    faders.forEach(el => el.classList.add('visible'));
  }

  // Student message box
  initStudentMsgBox();
}

/* ── SLIDE VIEWER ────────────────────────── */
let slideIdx = 0, slidesTotal = 0;

window.openSlides = function(title, slidesData) {
  const modal = document.getElementById('slideViewer');
  if (!modal) return;
  document.getElementById('slideViewerTitle').textContent = title;
  renderSlideContent(slidesData);
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeSlides = function() {
  const modal = document.getElementById('slideViewer');
  if (modal) { modal.classList.remove('open'); document.body.style.overflow = ''; }
};

function renderSlideContent(slides) {
  const wrap = document.getElementById('slideWrap');
  const counter = document.getElementById('slideCounter');
  wrap.innerHTML = '';
  slidesTotal = slides.length;
  slideIdx = 0;

  if (!slides.length) {
    wrap.innerHTML = '<div style="padding:40px;text-align:center;color:#64748b;font-size:.9rem">No slides yet. Check back soon!</div>';
    if (counter) counter.textContent = '';
    return;
  }

  slides.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'slide-item' + (i === 0 ? ' active' : '');
    el.innerHTML = `
      <div class="slide-meta">Slide ${i+1} / ${slides.length}</div>
      <h3 class="slide-heading">${s.title || ''}</h3>
      <div class="slide-content">${s.body || ''}</div>
      ${s.tip ? `<div class="slide-tip">💡 <strong>Exam Tip:</strong> ${s.tip}</div>` : ''}
      ${s.remember ? `<div class="slide-remember">📌 <strong>Remember:</strong> ${s.remember}</div>` : ''}
    `;
    wrap.appendChild(el);
  });

  updateSlideCounter();
}

function updateSlideCounter() {
  const counter = document.getElementById('slideCounter');
  if (counter) counter.textContent = `${slideIdx + 1} / ${slidesTotal}`;
  const prevBtn = document.getElementById('slidePrev');
  const nextBtn = document.getElementById('slideNext');
  if (prevBtn) prevBtn.disabled = slideIdx === 0;
  if (nextBtn) nextBtn.disabled = slideIdx >= slidesTotal - 1;
}

window.prevSlide = function() { if (slideIdx > 0) goSlide(slideIdx - 1); };
window.nextSlide = function() { if (slideIdx < slidesTotal - 1) goSlide(slideIdx + 1); };

function goSlide(n) {
  const items = document.querySelectorAll('#slideWrap .slide-item');
  items.forEach((item, i) => item.classList.toggle('active', i === n));
  slideIdx = n;
  updateSlideCounter();
}

document.addEventListener('keydown', e => {
  const modal = document.getElementById('slideViewer');
  if (!modal || !modal.classList.contains('open')) return;
  if (e.key === 'Escape') window.closeSlides();
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') window.nextSlide();
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') window.prevSlide();
});

/* ── STUDENT MESSAGE BOX ─────────────────── */
function initStudentMsgBox() {
  const btn = document.getElementById('studentMsgToggle');
  const panel = document.getElementById('studentMsgPanel');
  if (!btn || !panel) return;

  btn.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) loadStudentMsgs();
  });

  document.getElementById('closeMsgPanel')?.addEventListener('click', () => {
    panel.classList.remove('open');
  });

  document.getElementById('sendStudentMsg')?.addEventListener('click', sendStudentMessage);
}

async function loadStudentMsgs() {
  if (!currentUser) return;
  const container = document.getElementById('studentMsgList');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:12px;color:#64748b;font-size:.78rem">Loading...</div>';
  try {
    const q = query(collection(db, 'adminMessages'), orderBy('createdAt','desc'));
    const snap = await getDocs(q);
    container.innerHTML = '';
    let count = 0;
    snap.forEach(d => {
      const m = d.data();
      if (m.to !== currentUser.email) return;
      count++;
      const el = document.createElement('div');
      el.style.cssText = 'padding:10px;background:#0f172a;border-radius:8px;margin-bottom:8px;border-left:3px solid ' + (m.read ? '#334155' : '#6366f1');
      el.innerHTML = `
        <div style="font-size:.68rem;font-weight:700;color:#6366f1;margin-bottom:4px">From Admin · ${m.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || ''}</div>
        <div style="font-size:.82rem;color:#cbd5e1;line-height:1.5">${m.message}</div>
      `;
      container.appendChild(el);
    });
    if (count === 0) {
      container.innerHTML = '<div style="text-align:center;padding:12px;color:#475569;font-size:.78rem">No messages from admin yet</div>';
    }
  } catch(e) {
    container.innerHTML = '<div style="color:#fca5a5;font-size:.78rem;padding:8px">Could not load messages</div>';
  }
}

async function sendStudentMessage() {
  if (!currentUser) return;
  const textarea = document.getElementById('studentMsgText');
  const btn = document.getElementById('sendStudentMsg');
  const status = document.getElementById('studentMsgStatus');
  const text = textarea?.value?.trim();
  if (!text) return;

  btn.disabled = true; btn.textContent = 'Sending...';
  try {
    await addDoc(collection(db, 'messages'), {
      name: currentUser.displayName || currentUser.email.split('@')[0],
      email: currentUser.email,
      message: text,
      source: 'modules-msgbox',
      read: false,
      createdAt: serverTimestamp()
    });
    textarea.value = '';
    if (status) { status.textContent = '✓ Message sent to admin!'; status.style.color = '#86efac'; }
    setTimeout(() => { if (status) status.textContent = ''; }, 3000);
  } catch(e) {
    if (status) { status.textContent = 'Error sending. Try again.'; status.style.color = '#fca5a5'; }
  }
  btn.disabled = false; btn.textContent = 'Send';
}
