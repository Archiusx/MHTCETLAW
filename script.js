// ============================================================
// script.js — MHT CET Law Portal Auth Logic
// Developed by Piyush Deshkar
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { firebaseConfig, APP_CONFIG } from "./config.js";

// ── Firebase Init ─────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ── Helpers ───────────────────────────────────────────────────
function showAlert(containerId, message, type = "error") {
  const el = document.getElementById(containerId);
  if (!el) return;
  const iconMap = { success: "fa-check-circle", warning: "fa-clock", error: "fa-exclamation-circle" };
  el.innerHTML = `
    <div class="alert alert-${type}">
      <i class="fas ${iconMap[type] || iconMap.error}"></i>
      <span>${message}</span>
    </div>`;
  if (type !== "warning") {
    setTimeout(() => { el.innerHTML = ""; }, 5000);
  }
}

function setLoading(btnId, loading) {
  const btn  = document.getElementById(btnId);
  const span = btn?.querySelector("span");
  const icon = btn?.querySelector("i");
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    if (icon) icon.className = "fas fa-spinner fa-spin";
    if (span) span.textContent = "Please wait…";
  } else {
    btn.disabled = false;
    if (btnId === "loginBtn") {
      if (icon) icon.className = "fas fa-sign-in-alt";
      if (span) span.textContent = "Sign In";
    } else if (btnId === "registerBtn") {
      if (icon) icon.className = "fas fa-user-plus";
      if (span) span.textContent = "Create Account";
    }
  }
}

function getFirebaseError(code) {
  const map = {
    "auth/user-not-found":      "No account found with this email.",
    "auth/wrong-password":      "Incorrect password. Please try again.",
    "auth/invalid-email":       "Please enter a valid email address.",
    "auth/email-already-in-use":"This email is already registered. Try logging in.",
    "auth/weak-password":       "Password must be at least 6 characters.",
    "auth/too-many-requests":   "Too many attempts. Please try again later.",
    "auth/network-request-failed":"Network error. Check your connection.",
  };
  return map[code] || "Something went wrong. Please try again.";
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Splash & Reveal ───────────────────────────────────────────
// Removed — card animates via CSS directly, no JS needed

// ── Tabs ──────────────────────────────────────────────────────
function initTabs() {
  const tabs  = document.querySelectorAll(".tab-btn");
  const panes = document.querySelectorAll(".tab-pane");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      panes.forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      const target = document.getElementById(tab.dataset.tab + "-pane");
      if (target) target.classList.add("active");
    });
  });
}

// ── Login ─────────────────────────────────────────────────────
async function handleLogin() {
  const email    = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value;

  if (!email || !validateEmail(email)) {
    showAlert("loginAlert", "Please enter a valid email address.");
    return;
  }
  if (!password) {
    showAlert("loginAlert", "Please enter your password.");
    return;
  }

  setLoading("loginBtn", true);

  // Approved emails bypass Firebase check
  if (APP_CONFIG.approvedEmails.includes(email)) {
    showAlert("loginAlert", "✅ Login successful! Redirecting to portal…", "success");
    setTimeout(() => { window.location.href = APP_CONFIG.redirectAfterLogin; }, 1500);
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);

    if (APP_CONFIG.portalLocked) {
      showAlert(
        "loginAlert",
        "⏳ Your account is pending admin approval. You'll be notified once access is granted.",
        "warning"
      );
      await auth.signOut();
    } else {
      showAlert("loginAlert", "✅ Login successful! Redirecting…", "success");
      setTimeout(() => { window.location.href = APP_CONFIG.redirectAfterLogin; }, 1500);
    }
  } catch (err) {
    showAlert("loginAlert", getFirebaseError(err.code));
  } finally {
    setLoading("loginBtn", false);
  }
}

// ── Register ──────────────────────────────────────────────────
async function handleRegister() {
  const name   = document.getElementById("registerName")?.value.trim();
  const age    = document.getElementById("registerAge")?.value.trim();
  const exam   = document.getElementById("registerExam")?.value;
  const email  = document.getElementById("registerEmail")?.value.trim();
  const pass   = document.getElementById("registerPassword")?.value;

  if (!name) {
    showAlert("registerAlert", "Please enter your full name.");
    return;
  }
  if (!age || isNaN(age) || Number(age) < 15 || Number(age) > 35) {
    showAlert("registerAlert", "Please enter a valid age (15–35).");
    return;
  }
  if (!exam) {
    showAlert("registerAlert", "Please select the exam you're preparing for.");
    return;
  }
  if (!email || !validateEmail(email)) {
    showAlert("registerAlert", "Please enter a valid email address.");
    return;
  }
  if (!pass || pass.length < 6) {
    showAlert("registerAlert", "Password must be at least 6 characters.");
    return;
  }

  setLoading("registerBtn", true);

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    await auth.signOut();

    showAlert(
      "registerAlert",
      `🎉 Account created! Welcome ${name}. Your access is pending admin approval — we'll notify you soon!`,
      "success"
    );

    // Clear form
    ["registerName","registerAge","registerEmail","registerPassword"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    document.getElementById("registerExam").value = "";
  } catch (err) {
    showAlert("registerAlert", getFirebaseError(err.code));
  } finally {
    setLoading("registerBtn", false);
  }
}

// ── Forgot Password ───────────────────────────────────────────
async function handleForgotPassword() {
  const email = document.getElementById("loginEmail")?.value.trim();
  if (!email || !validateEmail(email)) {
    showAlert("loginAlert", "Enter your email above first, then click Forgot Password.");
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    showAlert("loginAlert", "📧 Password reset link sent! Check your inbox.", "success");
  } catch (err) {
    showAlert("loginAlert", getFirebaseError(err.code));
  }
}

// ── Password Toggle ───────────────────────────────────────────
function initPasswordToggles() {
  document.querySelectorAll(".pw-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      const isPass = target.type === "password";
      target.type  = isPass ? "text" : "password";
      btn.querySelector("i").className = isPass ? "fas fa-eye-slash" : "fas fa-eye";
    });
  });
}

// ── Enter Key Support ─────────────────────────────────────────
function initKeyboardSupport() {
  document.getElementById("loginPassword")?.addEventListener("keydown", e => {
    if (e.key === "Enter") handleLogin();
  });
  document.getElementById("registerPassword")?.addEventListener("keydown", e => {
    if (e.key === "Enter") handleRegister();
  });
}

// ── Boot ──────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initPasswordToggles();
  initKeyboardSupport();

  document.getElementById("loginBtn")?.addEventListener("click", handleLogin);
  document.getElementById("registerBtn")?.addEventListener("click", handleRegister);
  document.getElementById("forgotPasswordLink")?.addEventListener("click", e => {
    e.preventDefault();
    handleForgotPassword();
  });
});
