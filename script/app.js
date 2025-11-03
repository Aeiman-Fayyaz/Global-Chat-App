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

// --- Voice Recording Variables & Logic (Using Realtime DB/Base64) ---
let mediaRecorder;
let audioChunks = [];
let audioStream;
let isRecording = false;
let audioBlobUrl = null;

const micButton = document.getElementById("mic-btn");
const messageInput = document.getElementById("message");
const sendButton = document.querySelector('button[onclick="sendMessageBtn()"]');

// Record Audio: Blob to Base64 Conversion
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Function to start recording
async function startRecording() {
  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Use 'audio/webm' for compatibility
    mediaRecorder = new MediaRecorder(audioStream, { mimeType: "audio/webm" });
    audioChunks = [];
    audioBlobUrl = null;

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = processAudioData;

    messageInput.setAttribute("disabled", "true");
    messageInput.value = "Recording...";
    micButton.innerHTML = `<i class="fa-solid fa-stop"></i>`;
    micButton.classList.add("recording");

    mediaRecorder.start();
    isRecording = true;
    console.log("Recording started...");
  } catch (err) {
    console.error("Error accessing microphone: ", err);
    Swal.fire({
      icon: "error",
      title: "Microphone Access Denied",
      text: "Please allow microphone access to record voice messages.",
    });
    resetVoiceUI(); // Reset UI on failure
  }
}

// Function to stop recording and prepare data
function processAudioData() {
  if (!audioChunks.length) return;

  const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
  audioBlobUrl = URL.createObjectURL(audioBlob); // Temporary URL for sending

  // UI Update after stopping
  messageInput.value = "Voice Message Ready";
  micButton.innerHTML = `<i class="fa-solid fa-redo"></i>`;
  micButton.classList.remove("recording");
}

// Function to stop recording and close the stream
function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    audioStream.getTracks().forEach((track) => track.stop());
    isRecording = false;
  }
}

// Reset UI state when sending a voice message (or cancelling/retaking)
function resetVoiceUI() {
  messageInput.removeAttribute("disabled");
  messageInput.value = "";
  micButton.innerHTML = `<i class="fa-solid fa-microphone"></i>`;
  micButton.classList.remove("recording");
  audioBlobUrl = null;
  audioChunks = []; // Clear chunks
}

// Mic button event listener (Acts as Start/Stop/Retake)
micButton?.addEventListener("click", () => {
  if (isRecording) {
    // Stop button pressed while recording
    stopRecording();
  } else if (audioBlobUrl) {
    // Retake button pressed (to restart recording)
    resetVoiceUI();
    startRecording();
  } else {
    // Start button pressed
    startRecording();
  }
});

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

  // Message Text/Audio Container
  const messageText = document.createElement("div");

  if (data.type === "audio") {
    const audioSrc = data.audioData;
    messageText.classList.add("message-audio");
    messageText.innerHTML = `
      <audio controls src="${audioSrc}" class="audio-player"></audio>
      <span class ="time-inside-audio">${data.day} . ${data.time}</span>
      ${
        data.currentUsername === currentUsername
          ? `
          <div class="msg-actions-audio">
            <button class="delete-btn" onclick="deleteMessage('${messageId}')"> <i class="fa-solid fa-trash"></i> </button>
          </div>
        `
          : ""
      }
    `;
  } 
  else {
    // Text Message Display
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
  }

  container.appendChild(letterCircle);
  container.appendChild(messageText);

  messageElements[messageId] = container;
  return container;
}

// Send Message
window.sendMessageBtn = async function () {
  const message = document.getElementById("message").value.trim();

  // Voice Message Send
  if (audioBlobUrl) {
    if (audioChunks.length === 0) return;

    Swal.fire({
      title: "Sending Voice Message...",
      text: "Converting audio to Base64...",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      const base64Audio = await blobToBase64(audioBlob); // Convert blob to base64

      const now = new Date();
      const time = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const day = now.toLocaleDateString([], { weekday: "short" });

      push(ref(db, "messages"), {
        // Store Base64 data
        audioData: base64Audio,
        type: "audio",
        currentUsername: currentUsername,
        time: time,
        day: day,
      });
      // Reset UI AFTER successful push
      resetVoiceUI();
      Swal.close();
      return;
    } catch (error) {
      console.error("Voice Message Send Error: ", error);
      Swal.fire({
        icon: "error",
        title: "Error Sending Voice Message",
        text: error.message,
      });
      resetVoiceUI();
      return;
    }
  }

  // Text Message
  if (message === "") return;

  const now = new Date();
  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const day = now.toLocaleDateString([], { weekday: "short" });

  push(ref(db, "messages"), {
    text: message,
    currentUsername: currentUsername,
    time: time,
    day: day,
  });

  document.getElementById("message").value = "";
};

// Enter key to send message (Should only work for text)
document.getElementById("message")?.addEventListener("keypress", function (e) {
  if (e.key === "Enter" && !isRecording && !audioBlobUrl) {
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
  if (data.type === "audio") return;

  const existingElement = messageElements[snapshot.key];
  if (existingElement) {
    existingElement.querySelector(".message-text").innerHTML = `
      ${data.text}
      <span class="time-inside">${data.day} . ${data.time}</span>
      ${
        data.currentUsername === currentUsername
          ? `
          <div class="msg-actions">
            <button class="edit-btn" onclick="editMessage('${
              snapshot.key
            }' , '${data.text.replace(
              /'/g,
              "\\'"
            )}')"> <i class="fa-solid fa-pen"></i> </button>
            <button class="delete-btn" onclick="deleteMessage('${
              snapshot.key
            }')"> <i class="fa-solid fa-trash"></i> </button>
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

// Edit Message (Should not work for audio)
window.editMessage = function (messageId, currentText) {
  // Simple check to prevent editing non-text messages if called directly
  const existingData = messageElements[messageId];
  if (existingData && existingData.querySelector(".message-audio")) return;

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

// Toggle dropdown visibility
document.getElementById("attachmentBtn").addEventListener("click", () => {
  const menu = document.getElementById("attachmentMenu");
  menu.classList.toggle("hidden");
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  const btn = document.getElementById("attachmentBtn");
  const menu = document.getElementById("attachmentMenu");
  if (!btn.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.add("hidden");
  }
});

// Media Upload
function previewMedia(input, type) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const mediaPreview = document.getElementById("mediaPreview");
    mediaPreview.innerHTML = ""; // clear old preview

    let element;
    if (type === "image") {
      element = document.createElement("img");
      element.src = e.target.result;
      element.className = "max-h-40 rounded-lg";
    } else if (type === "video") {
      element = document.createElement("video");
      element.src = e.target.result;
      element.controls = true;
      element.className = "max-h-40 rounded-lg";
    }

    mediaPreview.appendChild(element);
  };
  reader.readAsDataURL(file); // convert to Base64
}
