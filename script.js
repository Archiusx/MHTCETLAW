// =====================================================
//  MHT CET Law Portal — script.js
//  Developed by Piyush Deshkar
//  Firebase Auth + Firestore — ALL users can register
// =====================================================

// ── Firebase Config ──────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyD_4_adS0YQs8bGMbEvNSpLpW3BpCdvIAU",
  authDomain:        "mark1-7ce7e.firebaseapp.com",
  projectId:         "mark1-7ce7e",
  storageBucket:     "mark1-7ce7e.appspot.com",
  messagingSenderId: "147908886392",
  appId:             "1:147908886392:web:7d209960ba65868172128d",
  measurementId:     "G-6J34J730EW"
};

// ── App constants ─────────────────────────────────────
const REDIRECT_URL = "https://mhtcetlaw.netlify.app/dashboard";

// ── Firebase SDK (CDN global) ─────────────────────────
const app  = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

// ── Helpers ───────────────────────────────────────────
function showAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  const cls = { error:'ae', success:'as', warning:'aw' }[type] || 'ae';
  const ico = { error:'fa-exclamation-circle', success:'fa-check-circle', warning:'fa-clock' }[type];
  el.innerHTML = `<div class="alert ${cls}"><i class="fas ${ico}"></i><span>${msg}</span></div>`;
  if (type !== 'warning') setTimeout(() => { el.innerHTML = ''; }, 5500);
}

function setBtn(id, loading) {
  const btn  = document.getElementById(id);
  const span = btn && btn.querySelector('span');
  const icon = btn && btn.querySelector('i.btn-ico');
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    if (icon) icon.className = 'fas fa-spinner fa-spin btn-ico';
    if (span) span.textContent = 'Please wait…';
  } else {
    const map = {
      loginBtn:    ['fa-sign-in-alt',  'Sign In'],
      registerBtn: ['fa-user-plus',    'Create Account']
    };
    const [ic, txt] = map[id] || ['fa-check','Done'];
    if (icon) icon.className = `fas ${ic} btn-ico`;
    if (span) span.textContent = txt;
  }
}

function errMsg(code) {
  const m = {
    'auth/user-not-found':      'No account found. Please sign up first.',
    'auth/wrong-password':      'Incorrect password. Try again.',
    'auth/invalid-credential':  'Invalid email or password.',
    'auth/invalid-email':       'Please enter a valid email address.',
    'auth/email-already-in-use':'Email already registered. Please sign in.',
    'auth/weak-password':       'Password too weak. Use at least 6 characters.',
    'auth/too-many-requests':   'Too many attempts. Try again later.',
    'auth/network-request-failed':'Network error. Check your connection.'
  };
  return m[code] || 'Something went wrong. Please try again.';
}

function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

// ── Tabs ──────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
      document.querySelectorAll('.pane').forEach(p => p.classList.remove('on'));
      btn.classList.add('on');
      const pane = document.getElementById(btn.dataset.tab);
      if (pane) pane.classList.add('on');
      document.getElementById('loginAlert').innerHTML   = '';
      document.getElementById('registerAlert').innerHTML = '';
    });
  });
}

// ── Password toggle ───────────────────────────────────
function initEyes() {
  document.querySelectorAll('.eye').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = document.getElementById(btn.dataset.for);
      if (!inp) return;
      const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      btn.querySelector('i').className = show ? 'fas fa-eye-slash' : 'fas fa-eye';
    });
  });
}

// ── LOGIN ─────────────────────────────────────────────
async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPassword').value;

  if (!email || !validEmail(email)) return showAlert('loginAlert', 'Enter a valid email address.');
  if (!pass)                        return showAlert('loginAlert', 'Enter your password.');

  setBtn('loginBtn', true);
  try {
    const cred = await auth.signInWithEmailAndPassword(email, pass);
    // Update last login in Firestore
    await db.collection('users').doc(cred.user.uid).set(
      { lastLogin: firebase.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
    showAlert('loginAlert', '✅ Login successful! Redirecting…', 'success');
    setTimeout(() => { window.location.href = REDIRECT_URL; }, 1500);
  } catch (err) {
    showAlert('loginAlert', errMsg(err.code));
    setBtn('loginBtn', false);
  }
}

// ── REGISTER ──────────────────────────────────────────
async function handleRegister() {
  const name  = document.getElementById('regName').value.trim();
  const age   = document.getElementById('regAge').value.trim();
  const exam  = document.getElementById('regExam').value;
  const phone = document.getElementById('regPhone').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass  = document.getElementById('regPass').value;

  if (!name)              return showAlert('registerAlert', 'Enter your full name.');
  if (!age || isNaN(age) || +age < 14 || +age > 40)
                          return showAlert('registerAlert', 'Enter a valid age (14–40).');
  if (!exam)              return showAlert('registerAlert', 'Select your target exam.');
  if (!email || !validEmail(email))
                          return showAlert('registerAlert', 'Enter a valid email address.');
  if (!pass || pass.length < 6)
                          return showAlert('registerAlert', 'Password must be at least 6 characters.');

  setBtn('registerBtn', true);
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    await cred.user.updateProfile({ displayName: name });

    // Save full profile to Firestore
    await db.collection('users').doc(cred.user.uid).set({
      uid:       cred.user.uid,
      fullName:  name,
      age:       +age,
      exam:      exam,
      phone:     phone || '',
      email:     email,
      role:      'student',
      verified:  false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    });

    showAlert('registerAlert', `🎉 Welcome ${name}! Account created. Redirecting…`, 'success');
    setTimeout(() => { window.location.href = REDIRECT_URL; }, 1800);
  } catch (err) {
    showAlert('registerAlert', errMsg(err.code));
    setBtn('registerBtn', false);
  }
}

// ── FORGOT PASSWORD ───────────────────────────────────
async function handleForgot(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  if (!email || !validEmail(email))
    return showAlert('loginAlert', 'Enter your email above first.');
  try {
    await auth.sendPasswordResetEmail(email);
    showAlert('loginAlert', '📧 Reset link sent! Check your inbox.', 'success');
  } catch (err) {
    showAlert('loginAlert', errMsg(err.code));
  }
}

// ── ENTER key support ─────────────────────────────────
function initEnter() {
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const active = document.querySelector('.pane.on');
    if (!active) return;
    if (active.id === 'pane-login')    handleLogin();
    if (active.id === 'pane-register') handleRegister();
  });
}

// ── BOOT ─────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initEyes();
  initEnter();

  document.getElementById('loginBtn').addEventListener('click', handleLogin);
  document.getElementById('registerBtn').addEventListener('click', handleRegister);
  document.getElementById('forgotLink').addEventListener('click', handleForgot);
});
