// Constants and State Management
const STORAGE_KEYS = {
    USER_DATA: 'messagehub_user',
    MESSAGES: 'messagehub_messages',
    THEME: 'messagehub_theme'
};

let currentUser = null;
let messages = [];

// Initialize messages array if empty
if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify([]));
}

// DOM Elements
const elements = {
    loginForm: document.getElementById('login-form'),
    messageForm: document.getElementById('message-form'),
    messagesContainer: document.getElementById('messages-container'),
    loginSection: document.getElementById('login-section'),
    boardSection: document.getElementById('board-section'),
    adminWelcome: document.getElementById('admin-welcome'),
    userAvatar: document.getElementById('user-avatar'),
    userName: document.getElementById('user-name'),
    currentTime: document.getElementById('current-time'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message')
};

// Toast Notification System
const showToast = (message, type = 'success') => {
    elements.toastMessage.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.remove('hidden');
    
    setTimeout(() => {
        elements.toast.classList.add('hidden');
    }, 3000);
};

// Message Management
const MessageSystem = {
    async saveMessage(text) {
        try {
            const newMessage = {
                id: Date.now().toString(),
                text: text,
                username: currentUser.username,
                profilePic: currentUser.profilePic || 'default-avatar.png',
                timestamp: new Date().toISOString(),
                isAdminMessage: currentUser.isAdmin
            };

            // Get existing messages
            const existingMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
            existingMessages.unshift(newMessage);

            // Save to localStorage
            localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(existingMessages));
            
            this.displayMessages();
            showToast('Message sent successfully!');
            return true;
        } catch (error) {
            console.error('Error saving message:', error);
            showToast('Failed to send message', 'error');
            return false;
        }
    },

    async deleteMessage(messageId) {
        try {
            let existingMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
            existingMessages = existingMessages.filter(m => m.id !== messageId);
            
            localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(existingMessages));
            this.displayMessages();
            showToast('Message deleted successfully!');
        } catch (error) {
            console.error('Error deleting message:', error);
            showToast('Failed to delete message', 'error');
        }
    },

    displayMessages() {
        const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
        elements.messagesContainer.innerHTML = '';

        messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = `message ${message.isAdminMessage ? 'admin-message' : ''}`;
            
            messageElement.innerHTML = `
                <div class="message-header">
                    <div class="message-user">
                        <img src="${message.profilePic}" alt="${message.username}" onerror="this.src='default-avatar.png'">
                        <span>${message.username}</span>
                    </div>
                    <span class="message-timestamp">${new Date(message.timestamp).toLocaleString()}</span>
                </div>
                <div class="message-content">${this.escapeHtml(message.text)}</div>
                <div class="message-actions">
                    <button class="action-btn copy-btn" onclick="MessageSystem.copyMessage('${message.id}')">
                        <i class='bx bx-copy'></i> Copy
                    </button>
                    ${currentUser?.isAdmin ? `
                        <button class="action-btn delete-btn" onclick="MessageSystem.deleteMessage('${message.id}')">
                            <i class='bx bx-trash'></i> Delete
                        </button>
                    ` : ''}
                </div>
            `;
            
            elements.messagesContainer.appendChild(messageElement);
        });
    },

    async copyMessage(messageId) {
        const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
        const message = messages.find(m => m.id === messageId);
        
        if (!message) return;

        try {
            await navigator.clipboard.writeText(message.text);
            showToast('Message copied to clipboard!');
        } catch (error) {
            console.error('Copy failed:', error);
            showToast('Failed to copy message', 'error');
        }
    },

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};

// User Management
const UserSystem = {
    login(username, password, profilePic = 'default-avatar.png') {
        try {
            const isAdmin = username === 'admin' && password === 'admin123';
            
            currentUser = {
                username,
                profilePic,
                isAdmin
            };

            localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(currentUser));
            
            this.updateUI();
            showToast(`Welcome, ${username}!`);
            return true;
        } catch (error) {
            console.error('Login error:', error);
            showToast('Login failed. Please try again.', 'error');
            return false;
        }
    },

    logout() {
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        currentUser = null;
        elements.loginSection.classList.remove('hidden');
        elements.boardSection.classList.add('hidden');
        elements.adminWelcome.classList.add('hidden');
    },

    updateUI() {
        if (currentUser) {
            elements.loginSection.classList.add('hidden');
            elements.boardSection.classList.remove('hidden');
            elements.userAvatar.src = currentUser.profilePic;
            elements.userName.textContent = currentUser.username;

            if (currentUser.isAdmin) {
                elements.adminWelcome.classList.remove('hidden');
            }
        }
    }
};

// Clock Update
const updateClock = () => {
    elements.currentTime.textContent = new Date().toLocaleTimeString();
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize clock
    updateClock();
    setInterval(updateClock, 1000);

    // Check for existing session
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        UserSystem.updateUI();
        MessageSystem.displayMessages();
    }

    // Login form handler
    elements.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = e.target.username.value;
        const password = e.target.password.value;
        const profilePicInput = e.target['profile-pic'];
        
        let profilePic = 'default-avatar.png';
        if (profilePicInput.files.length > 0) {
            try {
                profilePic = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(profilePicInput.files[0]);
                });
            } catch (error) {
                console.error('Error reading profile picture:', error);
            }
        }

        if (UserSystem.login(username, password, profilePic)) {
            MessageSystem.displayMessages();
        }
    });

    // Message form handler
    elements.messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const messageInput = e.target['message-input'];
        const messageText = messageInput.value.trim();
        
        if (!messageText) return;

        if (await MessageSystem.saveMessage(messageText)) {
            messageInput.value = '';
        }
    });

    // Logout handler
    document.getElementById('logout-btn').addEventListener('click', () => {
        UserSystem.logout();
    });
});

// Auto refresh messages
setInterval(() => {
    if (currentUser) {
        MessageSystem.displayMessages();
    }
}, 30000);
