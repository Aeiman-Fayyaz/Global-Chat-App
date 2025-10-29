// Import the functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
import {
  getAuth,
  // createWithEmailAndPassword,
  // SignInWithEmailAndPassword,
  GoogleAuthProvider,
  signOut,

  // OnAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

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
const db = getDatabase(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Theme toggle functionality
const themeToggle = document.getElementById("theme-toggle");

// Check for saved theme preference
const currentTheme = localStorage.getItem("theme") || "light";
if (currentTheme === "dark") {
  document.documentElement.classList.add("dark");
}

themeToggle?.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");

  // Save theme preference
  const theme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
  localStorage.setItem("theme", theme);
});

// Username Continue Button Redirect to Chat App
document.getElementById("user-btn")?.addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  if (!username) {
    Swal.fire({
      position: "top-end",
      icon: "error",
      title: "Username must be enter",
      showConfirmButton: false,
      timer: 500,
    });
    return;
  }
  localStorage.setItem("username" , username)
  window.location.href = "chat.html";
});

// Signout
document.getElementById("logout-btn")?.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Logiout Sucessful",
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
const currentUsername = localStorage.getItem("username")

// Chat Functions
function createMessageElement(data, messageId, currentUsername) {
  const container = document.createElement("div");
  container.classList.add("msg-container");
  container.classList.add(
    data.currentUsername === currentUsername ? "sent" : "received"
  );

  // Number of Messages
  const wrapper = document.createElement("div");
  wrapper.classList.add("message-wrapper");

  // DP container - Initial
  const letterCircle = document.createElement("div");
  letterCircle.classList.add("letterCircle");
  letterCircle.textContent = data.currentUsername.charAt(0).toUpperCase();

   // Append elements
  container.appendChild(letterCircle);
  // container.appendChild(messageText);

  return container
}

// Make Message Globally
window.sendMessageBtn = function () {
  const message = document.getElementById("message").value;
  // const username = document.getElementById("username").value

  // Push Message to Firebase
  push(ref(db, "messages"), {
    // name : username ,
    text: message,
  });
  document.getElementById("message").value = ""; // Clear Input
};

// Function for new Messages and Print
onChildAdded(ref(db, "messages"), function (snapshot) {
  let data = snapshot.val();
  let chatBox = document.getElementById("chatBox");
  let msgElement = document.createElement("p");
  msgElement.textContent = data.text;
  chatBox.appendChild(msgElement);
  chatBox.scrollTop = chatBox.scrollHeight;
});
