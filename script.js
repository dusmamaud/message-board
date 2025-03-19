// Constants
const STORAGE_KEYS = {
  THEME: "messagehub-theme",
  USER: "messagehub-user",
  MESSAGES: "messagehub-messages",
};

const API_ENDPOINTS = {
  MESSAGES: "/api/messages",
  USERS: "/api/users",
};

// State Management
let currentUser = null;
let messages = [];

// DOM Elements
const elements = {
  themeSwitch: document.getElementById("theme-switch"),
  currentTime: document.getElementById("current-time"),
  adminWelcome: document.getElementById("admin-welcome"),
  loginSection: document.getElementById("login-section"),
  boardSection: document.getElementById("board-section"),
  loginForm: document.getElementById("login-form"),
  messageForm: document.getElementById("message-form"),
  messagesContainer: document.getElementById("messages-container"),
  userAvatar: document.getElementById("user-avatar"),
  userName: document.getElementById("user-name"),
  logoutBtn: document.getElementById("logout-btn"),
  toast: document.getElementById("toast"),
  toastMessage: document.getElementById("toast-message"),
  loadingSpinner: document.getElementById("loading-spinner"),
};

// Theme Management
class ThemeManager {
  static init() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || "light";
    ThemeManager.setTheme(savedTheme);
    elements.themeSwitch.checked = savedTheme === "dark";

    elements.themeSwitch.addEventListener("change", (e) => {
      const newTheme = e.target.checked ? "dark" : "light";
      ThemeManager.setTheme(newTheme);
    });
  }

  static setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }
}

// Time Display
class TimeDisplay {
  static init() {
    TimeDisplay.updateTime();
    setInterval(TimeDisplay.updateTime, 1000);
  }

  static updateTime() {
    const now = new Date();
    elements.currentTime.textContent = now.toLocaleTimeString();
  }
}

// Toast Notifications
class Toast {
  static show(message, type = "success") {
    elements.toastMessage.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.remove("hidden");

    setTimeout(() => {
      elements.toast.classList.add("hidden");
    }, 3000);
  }
}

// User Management
class UserManager {
  static async login(username, password, profilePic) {
    try {
      elements.loadingSpinner.classList.remove("hidden");

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const isAdmin = username === "admin" && password === "admin123";

      currentUser = {
        username,
        isAdmin,
        profilePic: profilePic || "default-avatar.png",
      };

      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));

      UserManager.updateUI();
      Toast.show(`Welcome, ${username}!`);

      return true;
    } catch (error) {
      console.error("Login error:", error);
      Toast.show("Login failed. Please try again.", "error");
      return false;
    } finally {
      elements.loadingSpinner.classList.add("hidden");
    }
  }

  static logout() {
    currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.USER);
    elements.loginSection.classList.remove("hidden");
    elements.boardSection.classList.add("hidden");
    elements.adminWelcome.classList.add("hidden");
  }

  static updateUI() {
    elements.loginSection.classList.add("hidden");
    elements.boardSection.classList.remove("hidden");

    if (currentUser.isAdmin) {
      elements.adminWelcome.classList.remove("hidden");
    }

    elements.userAvatar.src = currentUser.profilePic;
    elements.userName.textContent = currentUser.username;
  }
}

// Message Management
class MessageManager {
  static async loadMessages() {
    try {
      elements.loadingSpinner.classList.remove("hidden");

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await fetch("messages.json");
      messages = await response.json();

      MessageManager.displayMessages();
    } catch (error) {
      console.error("Error loading messages:", error);
      Toast.show("Failed to load messages", "error");
    } finally {
      elements.loadingSpinner.classList.add("hidden");
    }
  }

  static async saveMessage(text) {
    try {
      const newMessage = {
        id: Date.now().toString(),
        text,
        username: currentUser.username,
        profilePic: currentUser.profilePic,
        timestamp: new Date().toISOString(),
        isAdminMessage: currentUser.isAdmin,
      };

      messages.unshift(newMessage);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      MessageManager.displayMessages();
      Toast.show("Message sent successfully!");

      return true;
    } catch (error) {
      console.error("Error saving message:", error);
      Toast.show("Failed to send message", "error");
      return false;
    }
  }

  static async deleteMessage(messageId) {
    try {
      messages = messages.filter((m) => m.id !== messageId);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      MessageManager.displayMessages();
      Toast.show("Message deleted successfully!");
    } catch (error) {
      console.error("Error deleting message:", error);
      Toast.show("Failed to delete message", "error");
    }
  }

  static displayMessages() {
    elements.messagesContainer.innerHTML = "";

    messages.forEach((message) => {
      const messageElement = document.createElement("div");
      messageElement.className = `message ${
        message.isAdminMessage ? "admin-message" : ""
      }`;

      messageElement.innerHTML = `
              <div class="message-header">
                  <div class="message-user">
                      <img src="${message.profilePic}" alt="${
        message.username
      }">
                      <span>${message.username}</span>
                  </div>
                  <span class="message-timestamp">${new Date(
                    message.timestamp
                  ).toLocaleString()}</span>
              </div>
              <div class="message-content">${message.text}</div>
              <div class="message-actions">
                  <button class="action-btn copy-btn" onclick="MessageManager.copyMessage('${
                    message.id
                  }')">
                      <i class='bx bx-copy'></i>
                      Copy
                  </button>
                  ${
                    currentUser.isAdmin
                      ? `
                      <button class="action-btn delete-btn" onclick="MessageManager.deleteMessage('${message.id}')">
                          <i class='bx bx-trash'></i>
                          Delete
                      </button>
                  `
                      : ""
                  }
              </div>
          `;

      elements.messagesContainer.appendChild(messageElement);
    });
  }

  static async copyMessage(messageId) {
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    try {
      await navigator.clipboard.writeText(message.text);
      Toast.show("Message copied to clipboard!");
    } catch (error) {
      console.error("Copy failed:", error);
      Toast.show("Failed to copy message", "error");
    }
  }
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Initialize components
  ThemeManager.init();
  TimeDisplay.init();

  // Check for saved user session
  const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    UserManager.updateUI();
    MessageManager.loadMessages();
  }

  // Login form submission
  elements.loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = e.target.username.value;
    const password = e.target.password.value;
    const profilePicInput = e.target["profile-pic"];

    let profilePic = null;
    if (profilePicInput.files.length > 0) {
      profilePic = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(profilePicInput.files[0]);
      });
    }

    const success = await UserManager.login(username, password, profilePic);
    if (success) {
      MessageManager.loadMessages();
    }
  });

  // Message form submission
  elements.messageForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const messageText = e.target["message-input"].value.trim();
    if (!messageText) return;

    const success = await MessageManager.saveMessage(messageText);
    if (success) {
      e.target.reset();
    }
  });

  // Logout button
  elements.logoutBtn.addEventListener("click", UserManager.logout);
});

// Auto-refresh messages
setInterval(() => {
  if (currentUser) {
    MessageManager.loadMessages();
  }
}, 30000);
