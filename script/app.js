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

// Theme Toggle Functionality
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

// Sign Out Functionality
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

// Chat Messaging Functions
const currentUsername = localStorage.getItem("username");

function createMessageElement(data) {
  const container = document.createElement("div");
  container.classList.add("msg-container");
  container.classList.add(
    data.currentUsername === currentUsername ? "sent" : "received"
  );

  // Letter Circle Username Initliat
  const letterCircle = document.createElement("div");
  letterCircle.classList.add("letterCircle");
  letterCircle.textContent = data.currentUsername ?data.currentUsername.charAt(0).toUpperCase(): "?";

  // Message Text
  const messageText = document.createElement("div");
  messageText.classList.add("message-text");
  messageText.textContent = data.text;

  // Time and Day
  const timeText = document.createElement("span");
  timeText.classList.add("time-inside");
  timeText.textContent = `${data.day} . ${data.time}`;

  // Edit Delete Buttons Container
  if (data.currentUsername === currentUsername) {
    const btnContainer = document.createElement("div");
    btnContainer.classList.add("msg-actions");
    btnContainer.innerHTML = `<button class="edit-btn" onclick="editMessage(this , '${data.text}')">
        <i class="fa-solid fa-pen"></i>
      </button>
      <button class="delete-btn" onclick="deleteMessage(this)">
        <i class="fa-solid fa-trash"></i>
      </button>`;
    messageText.appendChild(btnContainer);
  }

  // Append Childs
  container.appendChild(letterCircle);
  container.appendChild(messageText);
  messageText.appendChild(timeText);

  return container;
}

window.sendMessageBtn = function () {
  const message = document.getElementById("message").value.trim();
  if (message === "") return;

  // Time and Date
  const now = new Date();
  // For Time
  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  // For Day
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
document.getElementById('message')?.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    window.sendMessageBtn();
  }
});

// Listen for New Messages
onChildAdded(ref(db, "messages"), (snapshot) => {
  const data = snapshot.val();
  const chatBox = document.getElementById("chatBox");
  if (chatBox) {
    const msgElement = createMessageElement(data);
    chatBox.appendChild(msgElement);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

// Listen for Edit Messages
onChildChanged(ref(db, "messages"), (snapshot) => {
  const data = snapshot.val();
  const messageId = snapshot.key;
  const existingElement = messageElements[messageId];

  // Update the Message text
  if (existingElement) {
    existingElement.classList.add("message-text");
    existingElement.firstChild.textContent = data.text;
  }
});

// Listen for Message Deletions
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
    // inputValidator: (value ) => {
    //   if (!value) return "Please enter something!";
    // },
  })
    .then((result) => {
      if (result.isConfirmed) {
        // Update in Firebase
        const messageRef = ref(db, `messages/${messageId}`);
        update(messageRef, {
          text: result.value.trim(),
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
  const message = messageId.closest(".message-text");

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
      // Delete in Firebase
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
