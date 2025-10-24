// Import the functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
import {
  getAuth,
  createWithEmailAndPassword,
  SignInWithEmailAndPassword,
  GoogleAuthProvider,
  OnAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5FV2pZQpUa5DgkEISG6N15wvd1UEQqOw",
  authDomain: "realtime-database-d0558.firebaseapp.com",
  databaseURL: "https://realtime-database-d0558-default-rtdb.firebaseio.com",
  projectId: "realtime-database-d0558",
  storageBucket: "realtime-database-d0558.firebasestorage.app",
  messagingSenderId: "109851855109",
  appId: "1:109851855109:web:0d5b31a6b846828df34f6c",
  measurementId: "G-5EYBQ3RBJ8",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Theme toggle functionality
const themeToggle = document.getElementById("theme-toggle");

// Check for saved theme preference
const currentTheme = localStorage.getItem("theme") || "light";
if (currentTheme === "dark") {
  document.documentElement.classList.add("dark");
}

themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");

  // Save theme preference
  const theme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
  localStorage.setItem("theme", theme);
});
