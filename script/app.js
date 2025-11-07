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
  Swal.fire({
    title: "Rate Our App 💬",
    html: `
      <div class="rating-container" style="display:flex;justify-content:space-around;gap:10px;margin-top:10px;">
        <div class="rating-option" data-value="Poor" style="cursor:pointer;font-size:30px;">😞</div>
        <div class="rating-option" data-value="Fine" style="cursor:pointer;font-size:30px;">😐</div>
        <div class="rating-option" data-value="Good" style="cursor:pointer;font-size:30px;">🙂</div>
        <div class="rating-option" data-value="Too Good" style="cursor:pointer;font-size:30px;">😊</div>
        <div class="rating-option" data-value="Welldone" style="cursor:pointer;font-size:30px;">🤩</div>
      </div>
      <p id="selected-rating" style="margin-top:15px;font-weight:500;"></p>
    `,
    showCancelButton: true,
    confirmButtonText: "Save & Logout",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    theme: "auto",
    allowOutsideClick: false,
    didOpen: () => {
      const options =
        Swal.getHtmlContainer().querySelectorAll(".rating-option");
      const selected =
        Swal.getHtmlContainer().querySelector("#selected-rating");
      options.forEach((opt) => {
        opt.addEventListener("click", () => {
          options.forEach((o) => (o.style.transform = "scale(1)"));
          opt.style.transform = "scale(1.3)";
          selected.textContent = `You selected: ${opt.dataset.value}`;
          selected.dataset.value = opt.dataset.value;
        });
      });
    },
    preConfirm: () => {
      const selected =
        Swal.getHtmlContainer().querySelector("#selected-rating").dataset.value;
      if (!selected) {
        Swal.showValidationMessage("Please select a rating ⭐");
        return false;
      }
      return selected;
    },
  }).then((result) => {
    if (result.isConfirmed) {
      const rating = result.value;
      signOut(auth)
        .then(() => {
          Swal.fire({
            position: "top-end",
            icon: "success",
            title: `Logout Successful — Thanks for rating`,
            theme: "auto",
            showConfirmButton: false,
            timer: 1000,
          });
          setTimeout(() => {
            window.location.href = "index.html";
          }, 1000);
        })
        .catch((error) => {
          Swal.fire({
            icon: "error",
            title: "Logout Failed",
            theme: "auto",
            text: error.message,
            timer: 1500,
            showConfirmButton: false,
          });
        });
    }
  });
});

// Username Get
const currentUsername = localStorage.getItem("username");
let messageElements = {};

// Voice Recording
let mediaRecorder;
let audioChunks = [];
let audioStream;
let isRecording = false;
let audioBlobUrl = null;

const micButton = document.getElementById("mic-btn");
const messageInput = document.getElementById("message");
const sendButton = document.querySelector('button[onclick="sendMessageBtn()"]');

// Blob to Base64
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
      theme: "auto",
    });
    resetVoiceUI();
  }
}

// Function to stop recording and prepare data
function processAudioData() {
  if (!audioChunks.length) return;

  const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
  audioBlobUrl = URL.createObjectURL(audioBlob);

  // UI Update after stopping
  messageInput.value = "Voice Message Ready";
  micButton.innerHTML = `<i class="fa-solid fa-redo"></i>`;
  micButton.classList.remove("recording");

  // Show audio player dynamically (only when recording is done)
  showAudioPreview(audioBlobUrl);
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

  const existingAudio = document.getElementById("voicePreview");
  if (existingAudio) existingAudio.remove();
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

// Show dynamic audio preview
function showAudioPreview(url) {
  // Remove old preview if any
  const old = document.getElementById("voicePreview");
  if (old) old.remove();

  const audio = document.createElement("audio");
  audio.id = "voicePreview";
  audio.src = url;
  audio.controls = true;
  audio.classList.add("w-full", "mt-3", "rounded-lg");

  // Insert in your desired container (below input box, or inside chat)
  document.getElementById("chatMessages").appendChild(audio);
}

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
  } else {
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
      theme: "auto",
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
        theme: "auto",
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

// Enter key to send text message
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
  const existingData = messageElements[messageId];
  if (existingData && existingData.querySelector(".message-audio")) return;

  Swal.fire({
    title: "Edit Message",
    input: "text",
    theme: "auto",
    inputValue: currentText,
    showCancelButton: true,
    confirmButtonText: "Save",
    confirmButtonColor: "#d9534f",
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
          theme: "auto",
          showConfirmButton: false,
          timer: 1200,
        });
      }
    })
    .catch((error) => {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        theme: "auto",
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
    theme: "auto",
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
            theme: "auto",
            showConfirmButton: false,
            timer: 1200,
          });
        })
        .catch((error) => {
          Swal.fire({
            icon: "error",
            title: "Delete Failed",
            theme: "auto",
            text: error.message,
            showConfirmButton: false,
            timer: 1500,
          });
        });
    }
  });
};


