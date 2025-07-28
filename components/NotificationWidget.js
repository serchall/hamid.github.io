// ویجت اعلان‌ها
class NotificationWidget {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.init();
    }

    async init() {
        await this.loadNotifications();
        this.render();
        this.startPolling();
    }

    async loadNotifications() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            
            if (result.success) {
                this.notifications = result.notifications;
                this.unreadCount = this.notifications.filter(n => !n.read).length;
            }
        } catch (error) {
            console.error('خطا در بارگذاری اعلان‌ها:', error);
        }
    }

    render() {
        // حذف ویجت قبلی اگر وجود دارد
        const existingWidget = document.getElementById('notification-widget');
        if (existingWidget) {
            existingWidget.remove();
        }

        // ایجاد ویجت جدید
        const widget = document.createElement('div');
        widget.id = 'notification-widget';
        widget.innerHTML = `
            <div class="notification-icon" onclick="notificationWidget.toggleDropdown()">
                🔔
                ${this.unreadCount > 0 ? `<span class="notification-badge">${this.unreadCount}</span>` : ''}
            </div>
            <div class="notification-dropdown" id="notification-dropdown">
                <div class="notification-header">
                    <h3>اعلان‌ها</h3>
                    ${this.unreadCount > 0 ? `<button onclick="notificationWidget.markAllAsRead()">علامت‌گذاری همه</button>` : ''}
                </div>
                <div class="notification-list">
                    ${this.notifications.length === 0 ? '<p>اعلانی وجود ندارد</p>' : ''}
                    ${this.notifications.map(notification => `
                        <div class="notification-item ${!notification.read ? 'unread' : ''}" onclick="notificationWidget.handleNotificationClick('${notification._id}', '${notification.link}')">
                            <div class="notification-content">
                                <div class="notification-title">${notification.title}</div>
                                <div class="notification-message">${notification.message}</div>
                                <div class="notification-time">${this.formatTime(notification.createdAt)}</div>
                            </div>
                            <button class="notification-delete" onclick="event.stopPropagation(); notificationWidget.deleteNotification('${notification._id}')">×</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // اضافه کردن استایل
        const style = document.createElement('style');
        style.textContent = `
            #notification-widget {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
            }
            .notification-icon {
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                position: relative;
            }
            .notification-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #e53935;
                color: #fff;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
            }
            .notification-dropdown {
                position: absolute;
                top: 60px;
                right: 0;
                width: 350px;
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.1);
                display: none;
                max-height: 400px;
                overflow-y: auto;
            }
            .notification-dropdown.show {
                display: block;
            }
            .notification-header {
                padding: 15px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .notification-header h3 {
                margin: 0;
                font-size: 16px;
            }
            .notification-header button {
                background: #1976d2;
                color: #fff;
                border: none;
                padding: 5px 10px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }
            .notification-list {
                padding: 0;
            }
            .notification-item {
                padding: 15px;
                border-bottom: 1px solid #eee;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
            }
            .notification-item:hover {
                background: #f5f5f5;
            }
            .notification-item.unread {
                background: #e3f2fd;
            }
            .notification-content {
                flex: 1;
            }
            .notification-title {
                font-weight: bold;
                margin-bottom: 5px;
            }
            .notification-message {
                color: #666;
                font-size: 14px;
                margin-bottom: 5px;
            }
            .notification-time {
                color: #999;
                font-size: 12px;
            }
            .notification-delete {
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                font-size: 18px;
                padding: 0;
                margin-left: 10px;
            }
            .notification-delete:hover {
                color: #e53935;
            }
        `;
        document.head.appendChild(style);

        // اضافه کردن به صفحه
        document.body.appendChild(widget);
    }

    toggleDropdown() {
        const dropdown = document.getElementById('notification-dropdown');
        dropdown.classList.toggle('show');
    }

    async markAllAsRead() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // علامت‌گذاری همه اعلان‌های نخوانده
            const unreadNotifications = this.notifications.filter(n => !n.read);
            for (const notification of unreadNotifications) {
                await fetch(`/api/notifications/${notification._id}/read`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }

            // به‌روزرسانی محلی
            this.notifications.forEach(n => n.read = true);
            this.unreadCount = 0;
            this.render();
        } catch (error) {
            console.error('خطا در علامت‌گذاری اعلان‌ها:', error);
        }
    }

    async deleteNotification(id) {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // حذف از لیست محلی
            this.notifications = this.notifications.filter(n => n._id !== id);
            this.unreadCount = this.notifications.filter(n => !n.read).length;
            this.render();
        } catch (error) {
            console.error('خطا در حذف اعلان:', error);
        }
    }

    async handleNotificationClick(id, link) {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // علامت‌گذاری به عنوان خوانده شده
            await fetch(`/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // به‌روزرسانی محلی
            const notification = this.notifications.find(n => n._id === id);
            if (notification) {
                notification.read = true;
                this.unreadCount = this.notifications.filter(n => !n.read).length;
                this.render();
            }

            // انتقال به لینک مربوطه
            if (link) {
                window.location.href = link;
            }
        } catch (error) {
            console.error('خطا در پردازش اعلان:', error);
        }
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'همین الان';
        if (minutes < 60) return `${minutes} دقیقه پیش`;
        if (hours < 24) return `${hours} ساعت پیش`;
        if (days < 7) return `${days} روز پیش`;
        
        return date.toLocaleDateString('fa-IR');
    }

    startPolling() {
        // بررسی اعلان‌های جدید هر 30 ثانیه
        setInterval(() => {
            this.loadNotifications().then(() => {
                this.render();
            });
        }, 30000);
    }
}

// ایجاد نمونه سراسری
window.notificationWidget = new NotificationWidget(); 