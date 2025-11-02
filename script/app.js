// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
import {
  getAuth,
  GoogleAuthProvider,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  update,
  remove,
  onChildRemoved,
  onChildChanged,
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
const auth = getAuth(app);
const db = getDatabase(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Theme Toggle

const themeToggle = document.getElementById("theme-toggle");
const currentTheme = localStorage.getItem("theme") || "light";

if (currentTheme === "dark") {
  document.documentElement.classList.add("dark");
}

themeToggle?.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  const theme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
  localStorage.setItem("theme", theme);
});

// Username Continue Button
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

// Sign Out
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

// Username Get
const currentUsername = localStorage.getItem("username");
let messageElements = {};

// Message Function
function createMessageElement(data, messageId) {
  const container = document.createElement("div");
  container.classList.add("msg-container");
  container.classList.add(
    data.currentUsername === currentUsername ? "sent" : "received"
  );
  container.id = messageId;

  // Letter Circle
  const letterCircle = document.createElement("div");
  letterCircle.classList.add("letterCircle");
  letterCircle.textContent = data.currentUsername
    ? data.currentUsername.charAt(0).toUpperCase()
    : "?";

  // Message Text
  const messageText = document.createElement("div");
  messageText.classList.add("message-text");
  messageText.innerHTML = `
    ${data.text}
    <span class="time-inside">${data.day} . ${data.time}</span>
    ${
      data.currentUsername === currentUsername
        ? `
      <div class="msg-actions">
        <button class="edit-btn" onclick="editMessage('${messageId}' , '${data.text.replace(
          /'/g,
          "\\'"
        )}')"> <i class="fa-solid fa-pen"></i> </button>
        <button class="delete-btn" onclick="deleteMessage('${messageId}')"> <i class="fa-solid fa-trash"></i> </button>
      </div>
    `
        : ""
    }
  `;

  container.appendChild(letterCircle);
  container.appendChild(messageText);

  messageElements[messageId] = container;
  return container;
}

// Send Message
window.sendMessageBtn = function () {
  const message = document.getElementById("message").value.trim();
  if (message === "") return;

  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const day = now.toLocaleDateString([], { weekday: "short" });

  push(ref(db, "messages"), {
    text: message,
    currentUsername: currentUsername,
    time: time,
    day: day,
  });

  document.getElementById("message").value = "";
};

// Enter key to send message
document.getElementById("message")?.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    window.sendMessageBtn();
  }
});

// New Message Listener
onChildAdded(ref(db, "messages"), (snapshot) => {
  const data = snapshot.val();
  const chatBox = document.getElementById("chatBox");
  if (chatBox) {
    const msgElement = createMessageElement(data, snapshot.key);
    chatBox.appendChild(msgElement);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

// Update Message Listener
onChildChanged(ref(db, "messages"), (snapshot) => {
  const data = snapshot.val();
  const existingElement = messageElements[snapshot.key];
  if (existingElement) {
    existingElement.querySelector(".message-text").innerHTML = `
      ${data.text}
      <span class="time-inside">${data.day} . ${data.time}</span>
      ${
        data.currentUsername === currentUsername
          ? `
        <div class="msg-actions">
          <button class="edit-btn" onclick="editMessage('${snapshot.key}' , '${data.text.replace(
            /'/g,
            "\\'"
          )}')"> <i class="fa-solid fa-pen"></i> </button>
          <button class="delete-btn" onclick="deleteMessage('${snapshot.key}')"> <i class="fa-solid fa-trash"></i> </button>
        </div>
      `
          : ""
      }
    `;
  }
});

// Delete Message Listener
onChildRemoved(ref(db, "messages"), (snapshot) => {
  const messageId = snapshot.key;
  const existingElement = messageElements[messageId];
  if (existingElement) {
    existingElement.remove();
    delete messageElements[messageId];
  }
});

// Edit Message
window.editMessage = function (messageId, currentText) {
  Swal.fire({
    title: "Edit Message",
    input: "text",
    inputValue: currentText,
    showCancelButton: true,
    confirmButtonText: "Save",
    cancelButtonText: "Cancel",
    background: "#fff",
    color: "#333",
  })
    .then((result) => {
      if (result.isConfirmed) {
        const messageRef = ref(db, `messages/${messageId}`);
        update(messageRef, {
          text: result.value ? result.value.trim() : "",
          edited: true,
          editedAt: new Date().toISOString(),
        });
        Swal.fire({
          icon: "success",
          title: "Message Updated!",
          showConfirmButton: false,
          timer: 1200,
        });
      }
    })
    .catch((error) => {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: error.message,
        showConfirmButton: false,
        timer: 1500,
      });
    });
};

// Delete Message
window.deleteMessage = function (messageId) {
  Swal.fire({
    title: "Are you sure?",
    text: "This message will be deleted permanently.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d14141",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Yes, delete it!",
  }).then((result) => {
    if (result.isConfirmed) {
      const messageRef = ref(db, `messages/${messageId}`);
      remove(messageRef)
        .then(() => {
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            showConfirmButton: false,
            timer: 1200,
          });
        })
        .catch((error) => {
          Swal.fire({
            icon: "error",
            title: "Delete Failed",
            text: error.message,
            showConfirmButton: false,
            timer: 1500,
          });
        });
    }
  });
};
