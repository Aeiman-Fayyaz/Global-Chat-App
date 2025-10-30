// ---------------------------
// Import Firebase functions
// ---------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

// ---------------------------
// Firebase configuration
// ---------------------------
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

// ---------------------------
// Initialize Firebase
// ---------------------------
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// ---------------------------
// Theme Toggle Functionality
// ---------------------------
const themeToggle = document.getElementById("theme-toggle");
const currentTheme = localStorage.getItem("theme") || "light";

if (currentTheme === "dark") {
  document.documentElement.classList.add("dark");
}

themeToggle?.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem("theme", theme);
});

// ---------------------------
// Username Continue Button
// ---------------------------
document.getElementById("user-btn")?.addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  if (!username) {
    Swal.fire({
      position: "top-end",
      icon: "error",
      title: "Username must be entered",
      showConfirmButton: false,
      timer: 500,
    });
    return;
  }
  localStorage.setItem("username", username);
  window.location.href = "chat.html";
});

// ---------------------------
// Sign Out Functionality
// ---------------------------
document.getElementById("logout-btn")?.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Logout Successful",
        showConfirmButton: false,
        timer: 500,
      });
      window.location.href = "index.html";
    })
    .catch((error) => {
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: "Logout Failed",
        footer: error.message,
        showConfirmButton: false,
        timer: 500,
      });
    });
});

// ---------------------------
// Chat Messaging Functions
// ---------------------------
const currentUsername = localStorage.getItem("username");

function createMessageElement(data) {
  const container = document.createElement("div");
  container.classList.add("msg-container");
  container.classList.add(data.currentUsername === currentUsername ? "sent" : "received");

  const letterCircle = document.createElement("div");
  letterCircle.classList.add("letterCircle");
  letterCircle.textContent = data.currentUsername.charAt(0).toUpperCase();

  const messageText = document.createElement("div");
  messageText.classList.add("message-text");
  messageText.textContent = data.text;

  container.appendChild(letterCircle);
  container.appendChild(messageText);

  return container;
}

window.sendMessageBtn = function () {
  const message = document.getElementById("message").value.trim();
  if (message === "") return;
  
  push(ref(db, "messages"), {
    text: message,
    currentUsername: currentUsername,
  });
  document.getElementById("message").value = "";
};

// ---------------------------
// Listen for New Messages
// ---------------------------
onChildAdded(ref(db, "messages"), (snapshot) => {
  const data = snapshot.val();
  const chatBox = document.getElementById("chatBox");
  if (chatBox) {
    const msgElement = createMessageElement(data);
    chatBox.appendChild(msgElement);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});
