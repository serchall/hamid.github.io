// سیستم پشتیبانی آنلاین
class SupportSystem {
    constructor() {
        this.currentUser = null;
        this.socket = io();
        this.init();
    }

    init() {
        this.loadUser();
        this.setupEventListeners();
        this.setupSocketEvents();
        this.loadTickets();
        this.loadLiveChats();
    }

    // بررسی احراز هویت
    checkAuth() {
        const token = localStorage.getItem('authToken');
        return !!token;
    }

    // اتصال به Socket.IO
    connectSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('✅ متصل به سرور پشتیبانی');
            this.isConnected = true;
        });
        
        this.socket.on('disconnect', () => {
            console.log('❌ قطع اتصال از سرور');
            this.isConnected = false;
        });
        
        // دریافت پیام چت زنده
        this.socket.on('live_chat_message', (data) => {
            this.addChatMessage(data);
        });
        
        // پذیرفته شدن چت
        this.socket.on('chat_accepted', (data) => {
            this.onChatAccepted(data);
        });
        
        // بسته شدن چت
        this.socket.on('chat_closed', (data) => {
            this.onChatClosed(data);
        });
        
        // پاسخ تیکت
        this.socket.on('ticket_reply', (data) => {
            this.onTicketReply(data);
        });
        
        // به‌روزرسانی وضعیت تیکت
        this.socket.on('ticket_status_updated', (data) => {
            this.onTicketStatusUpdated(data);
        });
    }

    // بارگذاری تیکت‌ها
    async loadTickets() {
        try {
            const response = await fetch('/api/support/tickets', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displayTickets(data.tickets);
            } else {
                this.showError('خطا در بارگذاری تیکت‌ها: ' + data.message);
            }
        } catch (error) {
            console.error('خطا در بارگذاری تیکت‌ها:', error);
            this.showError('خطا در بارگذاری تیکت‌ها');
        }
    }

    // نمایش تیکت‌ها با وضعیت
    displayTickets(tickets) {
        const ticketsContainer = document.getElementById('ticketsList');
        if (!ticketsContainer) return;

        if (tickets.length === 0) {
            ticketsContainer.innerHTML = '<div class="text-center text-muted">هیچ تیکتی یافت نشد</div>';
            return;
        }

        ticketsContainer.innerHTML = tickets.map(ticket => `
            <div class="card mb-3" data-ticket-id="${ticket.id}">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">${ticket.subject}</h6>
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge ${this.getStatusClass(ticket.status)} ticket-status">
                            ${this.getStatusText(ticket.status)}
                        </span>
                        ${this.currentUser.isAdmin ? `
                            <select class="form-select form-select-sm" style="width: auto;" 
                                    onchange="supportSystem.updateTicketStatus(${ticket.id}, this.value)">
                                <option value="open" ${ticket.status === 'open' ? 'selected' : ''}>باز</option>
                                <option value="in_progress" ${ticket.status === 'in_progress' ? 'selected' : ''}>در حال بررسی</option>
                                <option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>حل شده</option>
                                <option value="closed" ${ticket.status === 'closed' ? 'selected' : ''}>بسته</option>
                            </select>
                        ` : ''}
                    </div>
                </div>
                <div class="card-body">
                    <p class="card-text">${ticket.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>
                            ${new Date(ticket.createdAt).toLocaleDateString('fa-IR')}
                        </small>
                        <button class="btn btn-sm btn-primary" onclick="supportSystem.viewTicket(${ticket.id})">
                            مشاهده جزئیات
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // مشاهده جزئیات تیکت
    async viewTicket(ticketId) {
        try {
            const response = await fetch(`/api/support/tickets/${ticketId}/replies`, {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });

            const data = await response.json();
            if (data.success) {
                this.displayTicketDetails(ticketId, data.replies);
                this.showTicketModal();
            }
        } catch (error) {
            console.error('خطا در بارگذاری جزئیات تیکت:', error);
        }
    }

    // نمایش جزئیات تیکت
    displayTicketDetails(ticketId, replies) {
        const modalBody = document.getElementById('ticketModalBody');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <div class="ticket-replies">
                ${replies.map(reply => `
                    <div class="reply-item ${reply.isAdminReply ? 'admin-reply' : 'user-reply'} mb-3">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="reply-content">
                                <p class="mb-1">${reply.message}</p>
                                <small class="text-muted">
                                    ${reply.isAdminReply ? 'پشتیبان' : 'کاربر'} - 
                                    ${new Date(reply.createdAt).toLocaleString('fa-IR')}
                                </small>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="reply-form mt-3">
                <textarea id="replyMessage" class="form-control" rows="3" 
                          placeholder="پاسخ خود را بنویسید..."></textarea>
                <button class="btn btn-primary mt-2" onclick="supportSystem.sendReply(${ticketId}, document.getElementById('replyMessage').value)">
                    ارسال پاسخ
                </button>
            </div>
        `;
    }

    // نمایش Modal تیکت
    showTicketModal() {
        const modal = new bootstrap.Modal(document.getElementById('ticketModal'));
        modal.show();
    }

    // ارسال پاسخ با اعلان
    async sendReply(ticketId, message) {
        try {
            const response = await fetch(`/api/support/tickets/${ticketId}/replies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            if (data.success) {
                // پاک کردن فیلد پیام
                document.getElementById('replyMessage').value = '';
                
                // بارگذاری مجدد پاسخ‌ها
                this.loadTicketReplies(ticketId);
                
                // نمایش اعلان
                this.showNotification('پاسخ ارسال شد', 'success');
                
                // ارسال اعلان به کاربر
                this.socket.emit('ticket_reply', {
                    ticketId,
                    replyId: data.replyId,
                    message,
                    userId: this.currentUser.id,
                    isAdmin: this.currentUser.isAdmin
                });
            } else {
                this.showNotification('خطا در ارسال پاسخ', 'error');
            }
        } catch (error) {
            console.error('خطا در ارسال پاسخ:', error);
            this.showNotification('خطا در ارسال پاسخ', 'error');
        }
    }

    // ایجاد تیکت جدید
    async createTicket() {
        const subject = document.getElementById('ticketSubject').value.trim();
        const description = document.getElementById('ticketDescription').value.trim();
        const priority = document.getElementById('ticketPriority').value;
        const category = document.getElementById('ticketCategory').value;
        
        if (!subject || !description) {
            this.showError('موضوع و توضیحات الزامی هستند');
            return;
        }
        
        try {
            const response = await fetch('/api/support/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    subject,
                    description,
                    priority,
                    category
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('تیکت با موفقیت ایجاد شد');
                document.getElementById('newTicketForm').reset();
                
                // تغییر به تب تیکت‌ها
                const ticketsTab = new bootstrap.Tab(document.getElementById('tickets-tab'));
                ticketsTab.show();
                
                // بارگذاری مجدد تیکت‌ها
                this.loadTickets();
            } else {
                this.showError('خطا در ایجاد تیکت: ' + data.message);
            }
        } catch (error) {
            console.error('خطا در ایجاد تیکت:', error);
            this.showError('خطا در ایجاد تیکت');
        }
    }

    // شروع چت زنده
    async startLiveChat() {
        try {
            const response = await fetch('/api/support/live-chat/start', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentChatId = data.chatId;
                this.showChatContainer();
                this.updateChatStatus('در انتظار پاسخ پشتیبانی...', 'waiting');
                this.showSuccess(data.message);
            } else {
                this.showError('خطا در شروع چت: ' + data.message);
            }
        } catch (error) {
            console.error('خطا در شروع چت:', error);
            this.showError('خطا در شروع چت');
        }
    }

    // نمایش کانتینر چت
    showChatContainer() {
        document.getElementById('chatContainer').style.display = 'block';
        document.getElementById('chatHistory').style.display = 'none';
        document.getElementById('startChatBtn').style.display = 'none';
        
        // بارگذاری پیام‌های چت
        this.loadChatMessages();
    }

    // بارگذاری پیام‌های چت
    async loadChatMessages() {
        if (!this.currentChatId) return;
        
        try {
            const response = await fetch(`/api/support/live-chat/${this.currentChatId}/messages`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displayChatMessages(data.messages);
            }
        } catch (error) {
            console.error('خطا در بارگذاری پیام‌ها:', error);
        }
    }

    // نمایش پیام‌های چت
    displayChatMessages(messages) {
        const container = document.getElementById('chatMessages');
        
        if (messages.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted mt-4">
                    <i class="fas fa-comments fa-2x mb-2"></i>
                    <p>هنوز پیامی ارسال نشده است</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = messages.map(message => `
            <div class="message ${message.senderId === this.getCurrentUserId() ? 'user' : 'admin'}">
                <div class="${message.senderId === this.getCurrentUserId() ? 'user-avatar' : 'admin-avatar'}">
                    ${message.senderId === this.getCurrentUserId() ? '<i class="fas fa-user"></i>' : '<i class="fas fa-user-shield"></i>'}
                </div>
                <div class="message-content">
                    <div>${message.message}</div>
                    <div class="message-time">
                        ${new Date(message.createdAt).toLocaleTimeString('fa-IR')}
                    </div>
                </div>
            </div>
        `).join('');
        
        // اسکرول به پایین
        container.scrollTop = container.scrollHeight;
    }

    // ارسال پیام چت
    async sendChatMessage() {
        const message = document.getElementById('chatMessageInput').value.trim();
        
        if (!message || !this.currentChatId) return;
        
        try {
            const response = await fetch(`/api/support/live-chat/${this.currentChatId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ message })
            });
            
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('chatMessageInput').value = '';
                // پیام به صورت real-time اضافه می‌شود
            } else {
                this.showError('خطا در ارسال پیام: ' + data.message);
            }
        } catch (error) {
            console.error('خطا در ارسال پیام:', error);
            this.showError('خطا در ارسال پیام');
        }
    }

    // اضافه کردن پیام چت (real-time)
    addChatMessage(data) {
        if (data.chatId !== this.currentChatId) return;
        
        const container = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        
        messageDiv.className = `message ${data.senderId === this.getCurrentUserId() ? 'user' : 'admin'}`;
        messageDiv.innerHTML = `
            <div class="${data.senderId === this.getCurrentUserId() ? 'user-avatar' : 'admin-avatar'}">
                ${data.senderId === this.getCurrentUserId() ? '<i class="fas fa-user"></i>' : '<i class="fas fa-user-shield"></i>'}
            </div>
            <div class="message-content">
                <div>${data.message}</div>
                <div class="message-time">
                    ${new Date(data.createdAt).toLocaleTimeString('fa-IR')}
                </div>
            </div>
        `;
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }

    // بستن چت
    async closeChat() {
        if (!this.currentChatId) return;
        
        try {
            const response = await fetch(`/api/support/live-chat/${this.currentChatId}/close`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.hideChatContainer();
                this.showSuccess('چت بسته شد');
            }
        } catch (error) {
            console.error('خطا در بستن چت:', error);
        }
    }

    // مخفی کردن کانتینر چت
    hideChatContainer() {
        document.getElementById('chatContainer').style.display = 'none';
        document.getElementById('chatHistory').style.display = 'block';
        document.getElementById('startChatBtn').style.display = 'inline-block';
        this.currentChatId = null;
    }

    // بارگذاری تاریخچه چت
    async loadChatHistory() {
        try {
            const response = await fetch('/api/support/live-chat', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displayChatHistory(data.chats);
            }
        } catch (error) {
            console.error('خطا در بارگذاری تاریخچه چت:', error);
        }
    }

    // نمایش تاریخچه چت
    displayChatHistory(chats) {
        const container = document.getElementById('chatHistoryList');
        
        if (chats.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <h6>هیچ چتی یافت نشد</h6>
                    <p>برای شروع چت جدید کلیک کنید</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = chats.map(chat => `
            <div class="ticket-card">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">چت با پشتیبانی</h6>
                        <small class="text-muted">
                            ${new Date(chat.startedAt).toLocaleDateString('fa-IR')}
                        </small>
                    </div>
                    <span class="chat-status status-${chat.status}">${this.getChatStatusText(chat.status)}</span>
                </div>
            </div>
        `).join('');
    }

    // به‌روزرسانی وضعیت چت
    updateChatStatus(status, type) {
        const statusElement = document.getElementById('chatStatus');
        statusElement.textContent = status;
        statusElement.className = `text-muted chat-status status-${type}`;
    }

    // پذیرفته شدن چت
    onChatAccepted(data) {
        if (data.chatId === this.currentChatId) {
            this.updateChatStatus('متصل به پشتیبانی', 'active');
            this.showSuccess('پشتیبانی به چت شما متصل شد');
        }
    }

    // بسته شدن چت
    onChatClosed(data) {
        if (data.chatId === this.currentChatId) {
            this.hideChatContainer();
            this.showSuccess('چت بسته شد');
        }
    }

    // پاسخ تیکت
    onTicketReply(data) {
        if (data.ticketId === this.currentTicketId) {
            this.viewTicket(this.currentTicketId); // بارگذاری مجدد
        }
    }

    // به‌روزرسانی وضعیت تیکت
    onTicketStatusUpdated(data) {
        this.loadTickets(); // بارگذاری مجدد تیکت‌ها
    }

    // به‌روزرسانی وضعیت تیکت
    async updateTicketStatus(ticketId, status) {
        try {
            const response = await fetch(`/api/support/tickets/${ticketId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({ status })
            });

            const data = await response.json();
            if (data.success) {
                // به‌روزرسانی UI
                this.updateTicketStatusUI(ticketId, status);
                
                // نمایش اعلان
                this.showNotification('وضعیت تیکت به‌روزرسانی شد', 'success');
                
                // ارسال اعلان به کاربر
                this.socket.emit('ticket_status_updated', {
                    ticketId,
                    status,
                    userId: this.currentUser.id
                });
            } else {
                this.showNotification('خطا در به‌روزرسانی وضعیت', 'error');
            }
        } catch (error) {
            console.error('خطا در به‌روزرسانی وضعیت تیکت:', error);
            this.showNotification('خطا در به‌روزرسانی وضعیت', 'error');
        }
    }

    // به‌روزرسانی UI وضعیت تیکت
    updateTicketStatusUI(ticketId, status) {
        const statusElement = document.querySelector(`[data-ticket-id="${ticketId}"] .ticket-status`);
        if (statusElement) {
            statusElement.textContent = this.getStatusText(status);
            statusElement.className = `badge ticket-status ${this.getStatusClass(status)}`;
        }
    }

    // دریافت متن وضعیت
    getStatusText(status) {
        const statusMap = {
            'open': 'باز',
            'in_progress': 'در حال بررسی',
            'resolved': 'حل شده',
            'closed': 'بسته'
        };
        return statusMap[status] || status;
    }

    // دریافت کلاس CSS وضعیت
    getStatusClass(status) {
        const classMap = {
            'open': 'bg-warning',
            'in_progress': 'bg-info',
            'resolved': 'bg-success',
            'closed': 'bg-secondary'
        };
        return classMap[status] || 'bg-secondary';
    }

    // ارسال پاسخ با اعلان
    async sendReply(ticketId, message) {
        try {
            const response = await fetch(`/api/support/tickets/${ticketId}/replies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            if (data.success) {
                // پاک کردن فیلد پیام
                document.getElementById('replyMessage').value = '';
                
                // بارگذاری مجدد پاسخ‌ها
                this.loadTicketReplies(ticketId);
                
                // نمایش اعلان
                this.showNotification('پاسخ ارسال شد', 'success');
                
                // ارسال اعلان به کاربر
                this.socket.emit('ticket_reply', {
                    ticketId,
                    replyId: data.replyId,
                    message,
                    userId: this.currentUser.id,
                    isAdmin: this.currentUser.isAdmin
                });
            } else {
                this.showNotification('خطا در ارسال پاسخ', 'error');
            }
        } catch (error) {
            console.error('خطا در ارسال پاسخ:', error);
            this.showNotification('خطا در ارسال پاسخ', 'error');
        }
    }

    // اضافه کردن event listeners
    addEventListeners() {
        // فرم تیکت جدید
        document.getElementById('newTicketForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTicket();
        });
        
        // ارسال پیام چت با Enter
        document.getElementById('chatMessageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });
    }

    // توابع کمکی
    getCurrentUserId() {
        // این تابع باید ID کاربر فعلی را برگرداند
        // در اینجا از localStorage استفاده می‌کنیم
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.id;
    }

    getPriorityText(priority) {
        const texts = {
            'low': 'کم',
            'medium': 'متوسط',
            'high': 'زیاد',
            'urgent': 'فوری'
        };
        return texts[priority] || priority;
    }

    getStatusText(status) {
        const texts = {
            'open': 'باز',
            'in_progress': 'در حال بررسی',
            'resolved': 'حل شده',
            'closed': 'بسته'
        };
        return texts[status] || status;
    }

    getChatStatusText(status) {
        const texts = {
            'waiting': 'در انتظار',
            'active': 'فعال',
            'closed': 'بسته'
        };
        return texts[status] || status;
    }

    showSuccess(message) {
        // نمایش پیام موفقیت
        alert('✅ ' + message);
    }

    showError(message) {
        // نمایش پیام خطا
        alert('❌ ' + message);
    }

    // نمایش اعلان
    showNotification(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toastId = 'toast-' + Date.now();
        const toastHtml = `
            <div class="toast" id="${toastId}" role="alert">
                <div class="toast-header">
                    <strong class="me-auto">اعلان</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        const toast = new bootstrap.Toast(document.getElementById(toastId));
        toast.show();

        // حذف toast بعد از 5 ثانیه
        setTimeout(() => {
            const toastElement = document.getElementById(toastId);
            if (toastElement) {
                toastElement.remove();
            }
        }, 5000);
    }

    // دریافت توکن احراز هویت
    getToken() {
        return localStorage.getItem('authToken');
    }

    // بارگذاری کاربر فعلی
    async loadUser() {
        try {
            const response = await fetch('/api/auth/user', {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });
            const data = await response.json();
            if (data.success) {
                this.currentUser = data.user;
                // به‌روزرسانی نام کاربر در صفحه
                document.getElementById('user-name').textContent = this.currentUser.name;
                document.getElementById('user-email').textContent = this.currentUser.email;
            } else {
                this.showError('خطا در بارگذاری اطلاعات کاربر');
                localStorage.removeItem('authToken');
                window.location.href = '/login.html';
            }
        } catch (error) {
            console.error('خطا در بارگذاری اطلاعات کاربر:', error);
            this.showError('خطا در بارگذاری اطلاعات کاربر');
            localStorage.removeItem('authToken');
            window.location.href = '/login.html';
        }
    }

    // تنظیم event listeners برای Socket.IO
    setupSocketEvents() {
        this.socket.on('connect', () => {
            console.log('✅ متصل به سرور پشتیبانی');
            this.isConnected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('❌ قطع اتصال از سرور');
            this.isConnected = false;
        });

        this.socket.on('live_chat_message', (data) => {
            this.addChatMessage(data);
        });

        this.socket.on('chat_accepted', (data) => {
            this.onChatAccepted(data);
        });

        this.socket.on('chat_closed', (data) => {
            this.onChatClosed(data);
        });

        this.socket.on('ticket_reply', (data) => {
            this.onTicketReply(data);
        });

        this.socket.on('ticket_status_updated', (data) => {
            this.onTicketStatusUpdated(data);
        });
    }

    // تنظیم event listeners برای فرم‌ها و دکمه‌ها
    setupEventListeners() {
        document.getElementById('newTicketForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTicket();
        });

        document.getElementById('chatMessageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });

        document.getElementById('replyMessage').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const ticketId = document.getElementById('ticketModal').dataset.ticketId;
                if (ticketId) {
                    this.sendReply(ticketId, document.getElementById('replyMessage').value);
                }
            }
        });
    }
}

// راه‌اندازی سیستم پشتیبانی
const supportSystem = new SupportSystem();

// توابع عمومی برای استفاده در HTML
function loadTickets() {
    supportSystem.loadTickets();
}

function startLiveChat() {
    supportSystem.startLiveChat();
}

function sendChatMessage() {
    supportSystem.sendChatMessage();
}

function closeChat() {
    supportSystem.closeChat();
} 