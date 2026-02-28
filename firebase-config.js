import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBtWu9rJli1ngM-xMJeDa10fNRCHFE_EO8",
  authDomain: "loginpage-d13a7.firebaseapp.com",
  databaseURL: "https://loginpage-d13a7-default-rtdb.firebaseio.com",
  projectId: "loginpage-d13a7",
  storageBucket: "loginpage-d13a7.firebasestorage.app",
  messagingSenderId: "865928476680",
  appId: "1:865928476680:web:d03e9e5c79a68ddc03b9bd",
  measurementId: "G-NN79RZX78R"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Admin emails — full dashboard + admin panel access
export const ADMIN_EMAILS = [
  "co.2024.prdeshkar@bitwardha.ac.in",
  "class11art@gmail.com"
];

// Premium exception emails — hardcoded premium access (no Firestore check needed)
// Add any student email here to give them permanent premium access
export const PREMIUM_EMAILS = [
  "udayaglave@gmail.com",
  "oojhas07@gmail.com"
];

export default app;
