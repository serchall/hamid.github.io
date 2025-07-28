// Chat Widget JavaScript
class ChatWidget {
    constructor(options = {}) {
        this.isOpen = false;
        this.socket = null;
        this.messages = [];
        this.isTyping = false;
        this.notificationCount = 0;
        this.currentUser = null;
        this.options = {
            autoOpen: false,
            showWelcome: true,
            maxMessages: 50,
            ...options
        };
        this.init();
    }

    init() {
        this.createWidget();
        this.checkAuthentication();
        this.setupSocket();
        this.setupEventListeners();
        this.loadMessagesFromDatabase();
        
        // Auto-open if configured
        if (this.options.autoOpen) {
            setTimeout(() => this.openChat(), 2000);
        }

        // Listen for auth state changes
        window.addEventListener('authStateChanged', (e) => {
            this.handleAuthChange(e.detail);
        });
    }

    handleAuthChange(authData) {
        this.currentUser = authData.user;
        this.updateChatTitle();
        
        if (authData.isAuthenticated) {
            // Reload messages for authenticated user
            this.loadMessagesFromDatabase();
        } else {
            // Clear messages for logged out user
            this.clearMessages();
        }
    }

    clearMessages() {
        this.messages = [];
        this.elements.messages.innerHTML = `
            <div class="welcome-message">
                <h4>👋 سلام!</h4>
                <p>به پشتیبانی آنلاین خوش آمدید. چطور می‌تونم کمکتون کنم؟</p>
            </div>
        `;
    }
    }

    createWidget() {
        // Create chat widget HTML
        const widgetHTML = `
            <div class="chat-widget">
                <button class="chat-toggle" id="chatToggle">
                    <i class="fas fa-comments"></i>
                    <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
                </button>
                
                <div class="chat-window" id="chatWindow">
                    <div class="chat-header">
                        <div>
                            <h3 id="chatTitle">پشتیبانی آنلاین</h3>
                            <div class="status" id="connectionStatus">در حال اتصال...</div>
                        </div>
                        <button class="chat-close" id="chatClose">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="chat-messages" id="chatMessages">
                        <div class="welcome-message" id="welcomeMessage">
                            <h4>👋 سلام!</h4>
                            <p>به پشتیبانی آنلاین خوش آمدید. چطور می‌تونم کمکتون کنم؟</p>
                        </div>
                    </div>
                    
                    <div class="typing-indicator" id="typingIndicator">
                        <div class="typing-dots">
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                        </div>
                        <span style="margin-right: 10px; font-size: 12px; color: #6c757d;">در حال تایپ...</span>
                    </div>
                    
                    <div class="chat-input-area">
                        <input type="text" class="chat-input" id="chatInput" placeholder="پیام خود را بنویسید..." maxlength="500">
                        <button class="chat-send" id="chatSend">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add widget to page
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        
        // Get references to elements
        this.elements = {
            toggle: document.getElementById('chatToggle'),
            window: document.getElementById('chatWindow'),
            close: document.getElementById('chatClose'),
            messages: document.getElementById('chatMessages'),
            input: document.getElementById('chatInput'),
            send: document.getElementById('chatSend'),
            status: document.getElementById('connectionStatus'),
            badge: document.getElementById('notificationBadge'),
            typingIndicator: document.getElementById('typingIndicator'),
            title: document.getElementById('chatTitle'),
            welcomeMessage: document.getElementById('welcomeMessage')
        };
    }

    checkAuthentication() {
        // Use AuthManager if available
        if (window.authManager) {
            this.currentUser = window.authManager.getUser();
            if (this.currentUser) {
                this.updateChatTitle();
            }
        } else {
            // Fallback to direct localStorage check
            const token = localStorage.getItem('authToken');
            if (token) {
                this.currentUser = {
                    token: token,
                    name: localStorage.getItem('userName') || 'کاربر',
                    email: localStorage.getItem('userEmail') || ''
                };
                this.updateChatTitle();
            }
        }
    }

    updateChatTitle() {
        if (this.currentUser) {
            this.elements.title.textContent = `چت ${this.currentUser.name}`;
        }
    }

    setupSocket() {
        // Connect to Socket.IO server with authentication
        const token = localStorage.getItem('authToken');
        this.socket = io({
            auth: {
                token: token
            }
        });
        
        this.socket.on('connect', () => {
            this.updateConnectionStatus('آنلاین', 'online');
            console.log('Connected to chat server');
            
            // Send user info to server
            if (this.currentUser) {
                this.socket.emit('user info', {
                    name: this.currentUser.name,
                    email: this.currentUser.email
                });
            }
        });

        this.socket.on('disconnect', () => {
            this.updateConnectionStatus('آفلاین', 'offline');
            console.log('Disconnected from chat server');
        });

        this.socket.on('chat message', (data) => {
            this.addMessage(data.message, data.sender === 'user' ? 'user' : 'bot', data.timestamp);
            this.hideTypingIndicator();
        });

        this.socket.on('typing', () => {
            this.showTypingIndicator();
        });

        this.socket.on('stop typing', () => {
            this.hideTypingIndicator();
        });

        this.socket.on('user joined', (data) => {
            this.addSystemMessage(`${data.username} به چت پیوست`);
        });

        this.socket.on('user left', (data) => {
            this.addSystemMessage(`${data.username} چت را ترک کرد`);
        });

        this.socket.on('authentication required', () => {
            this.showLoginPrompt();
        });

        this.socket.on('messages loaded', (messages) => {
            this.displayMessages(messages);
        });
    }

    setupEventListeners() {
        // Toggle chat window
        this.elements.toggle.addEventListener('click', () => {
            this.toggleChat();
        });

        // Close chat window
        this.elements.close.addEventListener('click', () => {
            this.closeChat();
        });

        // Send message on Enter key
        this.elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Send message on button click
        this.elements.send.addEventListener('click', () => {
            this.sendMessage();
        });

        // Typing indicator
        let typingTimer;
        this.elements.input.addEventListener('input', () => {
            if (!this.isTyping) {
                this.isTyping = true;
                this.socket.emit('typing');
            }
            
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
                this.isTyping = false;
                this.socket.emit('stop typing');
            }, 1000);
        });

        // Close chat when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.chat-widget') && this.isOpen) {
                this.closeChat();
            }
        });

        // Prevent closing when clicking inside chat
        this.elements.window.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        this.isOpen = true;
        this.elements.window.classList.add('active');
        this.elements.input.focus();
        this.clearNotifications();
        this.scrollToBottom();
    }

    closeChat() {
        this.isOpen = false;
        this.elements.window.classList.remove('active');
        this.hideTypingIndicator();
    }

    sendMessage() {
        const message = this.elements.input.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Send to server with user info
        this.socket.emit('chat message', {
            message: message,
            timestamp: new Date().toISOString(),
            userId: this.currentUser ? this.currentUser.token : null,
            username: this.currentUser ? this.currentUser.name : 'کاربر ناشناس'
        });

        // Clear input
        this.elements.input.value = '';
        
        // Stop typing indicator
        this.socket.emit('stop typing');
        this.isTyping = false;
    }

    addMessage(text, sender, timestamp = null, saveToLocal = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        
        const time = timestamp ? new Date(timestamp) : new Date();
        const timeString = time.toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageDiv.innerHTML = `
            <div class="message-bubble new">
                ${this.escapeHtml(text)}
            </div>
            <div class="message-time">${timeString}</div>
        `;

        // Remove welcome message if it exists
        const welcomeMessage = this.elements.messages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        this.elements.messages.appendChild(messageDiv);
        this.scrollToBottom();

        // Store message locally if needed
        if (saveToLocal) {
            this.messages.push({
                text,
                sender,
                timestamp: time.toISOString()
            });
            this.saveMessages();
        }

        // Remove animation class after animation completes
        setTimeout(() => {
            const bubble = messageDiv.querySelector('.message-bubble');
            if (bubble) {
                bubble.classList.remove('new');
            }
        }, 300);

        // Show notification if chat is closed
        if (!this.isOpen && sender === 'bot') {
            this.showNotification();
        }
    }

    addSystemMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message system';
        messageDiv.innerHTML = `
            <div class="message-bubble" style="background: #f8f9fa; color: #6c757d; text-align: center; font-style: italic; max-width: 100%;">
                ${this.escapeHtml(text)}
            </div>
        `;
        this.elements.messages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        this.elements.typingIndicator.classList.add('active');
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.elements.typingIndicator.classList.remove('active');
    }

    updateConnectionStatus(text, status) {
        this.elements.status.textContent = text;
        this.elements.status.className = `status ${status}`;
    }

    showNotification() {
        this.notificationCount++;
        this.elements.badge.textContent = this.notificationCount;
        this.elements.badge.style.display = 'flex';
    }

    clearNotifications() {
        this.notificationCount = 0;
        this.elements.badge.style.display = 'none';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        }, 100);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveMessages() {
        try {
            localStorage.setItem('chat_messages', JSON.stringify(this.messages.slice(-50))); // Keep last 50 messages
        } catch (e) {
            console.warn('Could not save messages to localStorage:', e);
        }
    }

    loadMessagesFromDatabase() {
        // Request messages from server
        if (this.socket && this.socket.connected) {
            this.socket.emit('load messages', {
                userId: this.currentUser ? this.currentUser.token : null
            });
        }
    }

    displayMessages(messages) {
        // Clear welcome message
        if (this.elements.welcomeMessage) {
            this.elements.welcomeMessage.remove();
        }

        // Display messages from database
        messages.forEach(msg => {
            const sender = msg.sender === 'user' ? 'user' : 'bot';
            this.addMessage(msg.text, sender, msg.createdAt, false);
        });

        this.scrollToBottom();
    }

    showLoginPrompt() {
        const loginHTML = `
            <div class="login-prompt" style="text-align: center; padding: 20px;">
                <h4>🔐 ورود به چت</h4>
                <p>برای استفاده از چت، لطفاً وارد حساب کاربری خود شوید.</p>
                <button onclick="window.location.href='/auth.html'" class="btn btn-primary">
                    <i class="fas fa-sign-in-alt me-1"></i>ورود
                </button>
            </div>
        `;
        this.elements.messages.innerHTML = loginHTML;
    }

    // Public methods for external use
    open() {
        this.openChat();
    }

    close() {
        this.closeChat();
    }

    send(text) {
        this.elements.input.value = text;
        this.sendMessage();
    }

    // Auto-response system for common questions
    setupAutoResponses() {
        const responses = {
            'سلام': 'سلام! چطور می‌تونم کمکتون کنم؟',
            'خداحافظ': 'خداحافظ! امیدوارم بتونم کمکتون کرده باشم.',
            'قیمت': 'برای اطلاع از قیمت‌ها، لطفاً با شماره ۰۲۱-۱۲۳۴۵۶۷۸ تماس بگیرید.',
            'ساعت کاری': 'ساعت کاری ما: شنبه تا چهارشنبه ۹ صبح تا ۶ عصر',
            'ارسال': 'ارسال رایگان برای خریدهای بالای ۵۰۰ هزار تومان',
            'بازگشت': 'مهلت بازگشت کالا: ۷ روز پس از تحویل'
        };

        // Override sendMessage to include auto-responses
        const originalSendMessage = this.sendMessage.bind(this);
        this.sendMessage = () => {
            const message = this.elements.input.value.trim();
            if (!message) return;

            originalSendMessage();

            // Check for auto-response
            setTimeout(() => {
                const lowerMessage = message.toLowerCase();
                for (const [keyword, response] of Object.entries(responses)) {
                    if (lowerMessage.includes(keyword.toLowerCase())) {
                        setTimeout(() => {
                            this.addMessage(response, 'bot');
                        }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
                        break;
                    }
                }
            }, 500);
        };
    }
}

// Initialize chat widget when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatWidget = new ChatWidget();
    
    // Setup auto-responses after a short delay
    setTimeout(() => {
        window.chatWidget.setupAutoResponses();
    }, 1000);
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatWidget;
} 