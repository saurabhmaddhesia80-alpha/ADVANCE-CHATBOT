const deleteChatBtn = document.getElementById("delete-chat-btn");
const container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");
const suggestionsBox = document.querySelector(".suggestions");
const addFileBtn = document.getElementById("add-file-btn");
const cancelFileBtn = document.getElementById("cancel-file-btn");
const fileInputField = document.getElementById("file-input");
const filePreview = document.querySelector(".file-preview");
const appHeader = document.querySelector(".app-header");

const themeToggle = document.getElementById("theme-toggle-btn");
const sendBtn = document.getElementById("send-prompt-btn");

// ✅ Stop button
const stopBtn = document.createElement("button");
stopBtn.id = "stop-response-btn";
stopBtn.className = "material-symbols-rounded";
stopBtn.textContent = "stop";
stopBtn.style.display = "none";
promptForm.querySelector(".prompt-actions").appendChild(stopBtn);

// API Setup
const API_KEY = `AIzaSyCjjkpGMv-2rOPTn12kzsnRou9wwlB8u4o`; // replace with valid Gemini API key
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

let typingInterval, controller;
let chatHistory = [];
let userMessage = "";

// Create message elements
const createMsgElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Smart scroll
const scrollToBottom = (force = false) => {
  const threshold = 100;
  const atBottom =
    chatsContainer.scrollHeight - chatsContainer.scrollTop - chatsContainer.clientHeight <
    threshold;
  if (atBottom || force) {
    chatsContainer.scrollTo({
      top: chatsContainer.scrollHeight,
      behavior: "smooth"
    });
  }
};

// Typing effect
const typingEffect = (text, textElement, botMsgDiv) => {
  textElement.textContent = "";
  const words = text.split(" ");
  let wordIndex = 0;

  typingInterval = setInterval(() => {
    if (wordIndex < words.length) {
      textElement.textContent += (wordIndex === 0 ? "" : " ") + words[wordIndex++];
      botMsgDiv.classList.remove("loading");
      scrollToBottom();
    } else {
      clearInterval(typingInterval);
      scrollToBottom(true);
    }
  }, 40);
};

// Fetch response
const generateResponse = async (botMsgDiv) => {
  const textElement = botMsgDiv.querySelector(".message-text");

  // Show stop button while generating
  stopBtn.style.display = "inline-flex";
  sendBtn.disabled = true;

  controller = new AbortController();
  const signal = controller.signal;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }]
          }
        ]
      }),
      signal
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Unknown error");

    const responseText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Empty response.";

    typingEffect(responseText.trim(), textElement, botMsgDiv);
  } catch (error) {
    if (error.name === "AbortError") {
      textElement.textContent = "⛔ Response stopped.";
    } else {
      console.error(error);
      textElement.textContent = "⚠️ Error fetching response: " + error.message;
    }
  } finally {
    stopBtn.style.display = "none";
    sendBtn.disabled = false;
    controller = null;
  }
};

// Form submit
const handleFormSubmit = (e) => {
  e.preventDefault();
  userMessage = promptInput.value.trim();
  if (!userMessage) return;

  // ✅ Hide header + suggestions once user starts searching
  appHeader.style.display = "none";
  suggestionsBox.style.display = "none";

  promptInput.value = "";

  // generate user message html
// ...existing code...

const file = fileInputField.files[0];
let imageHTML = "";
if (file && file.type.startsWith("image/")) {
    const imageURL = URL.createObjectURL(file);
    imageHTML = `<img src="${imageURL}" class="chat-image-preview" style="max-width:180px;max-height:180px;border-radius:12px;margin-top:8px;">`;
}

const userMsgHTML = `<img src="user-avatar.png" class="avatar">
    <p class="message-text"></p>`;
const userMsgDiv = createMsgElement(userMsgHTML, "user-message");
userMsgDiv.querySelector(".message-text").textContent = userMessage;
chatsContainer.appendChild(userMsgDiv);

  scrollToBottom();

  // generate bot message
  setTimeout(() => {
    const botMsgHTML = `<img src="gemini-logo.png" class="avatar"><p class="message-text">Just a sec..</p>`;
    const botMsgDiv = createMsgElement(botMsgHTML, "bot-message", "loading");
    chatsContainer.appendChild(botMsgDiv);
    scrollToBottom();
    generateResponse(botMsgDiv);
  }, 600);
};

promptForm.addEventListener("submit", handleFormSubmit);

// ✅ File upload logic
addFileBtn.addEventListener("click", () => fileInputField.click());

fileInputField.addEventListener("change", () => {
  const file = fileInputField.files[0];
  if (!file) return;

  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (e)=> {
      filePreview.src = e.target.result;
      filePreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  } else {
    filePreview.src = "file-icon.png"; // generic icon
    filePreview.style.display = "block";
  }

  cancelFileBtn.style.display = "flex";
  addFileBtn.style.display = "none";
});

cancelFileBtn.addEventListener("click", () => {
  fileInputField.value = "";
  filePreview.style.display = "none";
  cancelFileBtn.style.display = "none";
  addFileBtn.style.display = "flex";
});

// ✅ Stop response
stopBtn.addEventListener("click", () => {
  if (controller) {
    controller.abort();
    clearInterval(typingInterval);
  }
});

// Theme toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
  themeToggle.textContent = document.body.classList.contains("light-theme")
    ? "dark_mode"
    : "light_mode";
});

// Suggestions click handling
document.querySelectorAll(".suggestions-item").forEach(item => {
  item.addEventListener("click", () => {
    const suggestionText = item.querySelector(".text").textContent;
    promptInput.value = suggestionText;
    suggestionsBox.style.display = "none";
    promptForm.dispatchEvent(new Event("submit", { cancelable: true }));
  });
});

// If you have a showBtn and hideSuggestions function, add them here
// Example:
// const showBtn = document.getElementById("show-btn");
// function showSuggestions() { suggestionsBox.style.display = "block"; }
// function hideSuggestions() { suggestionsBox.style.display = "none"; }
// showBtn.addEventListener("click", showSuggestions);

deleteChatBtn.addEventListener("click", () => {
  chatsContainer.innerHTML = "";
  appHeader.style.display = "block";
  suggestionsBox.style.display = "flex";
});