// سیستم اعلان‌های زنده
class LiveNotificationSystem {
    constructor() {
        this.socket = null;
        this.notifications = [];
        this.notificationContainer = null;
        this.isInitialized = false;
        this.notificationSound = null;
        this.settings = this.loadSettings();
        this.desktopNotificationSupported = 'Notification' in window;
    }

    // بارگذاری تنظیمات
    loadSettings() {
        const defaultSettings = {
            enableNotifications: true,
            enableSound: true,
            enableDesktopNotifications: false,
            enableMobileNotifications: true,
            notificationDuration: 5,
            notificationPosition: 'top-right',
            notificationVolume: 30,
            notifyTypes: {
                message: true,
                friend_request: true,
                purchase: true,
                system: true
            }
        };

        try {
            const stored = localStorage.getItem('notificationSettings');
            return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
        } catch (error) {
            console.error('خطا در بارگذاری تنظیمات:', error);
            return defaultSettings;
        }
    }

    // ذخیره تنظیمات
    saveSettings() {
        try {
            localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('خطا در ذخیره تنظیمات:', error);
        }
    }

    // به‌روزرسانی تنظیمات
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        this.applySettings();
    }

    // اعمال تنظیمات
    applySettings() {
        if (this.notificationContainer) {
            this.updateNotificationPosition();
        }
    }

    // به‌روزرسانی موقعیت اعلان‌ها
    updateNotificationPosition() {
        if (!this.notificationContainer) return;

        // حذف کلاس‌های موقعیت قبلی
        this.notificationContainer.className = 'live-notifications-container';
        
        // اضافه کردن کلاس موقعیت جدید
        this.notificationContainer.classList.add(`position-${this.settings.notificationPosition.replace('-', '-')}`);
    }

    // راه‌اندازی سیستم
    init() {
        if (this.isInitialized) return;
        
        this.createNotificationContainer();
        this.setupWebSocket();
        this.loadExistingNotifications();
        this.setupNotificationSound();
        this.applySettings();
        this.isInitialized = true;
        
        console.log('🔔 سیستم اعلان‌های زنده راه‌اندازی شد');
    }

    // ایجاد کانتینر اعلان‌ها
    createNotificationContainer() {
        // حذف کانتینر قبلی اگر وجود دارد
        const existingContainer = document.getElementById('live-notifications-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        // ایجاد کانتینر جدید
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'live-notifications-container';
        this.notificationContainer.className = 'live-notifications-container';
        
        // اضافه کردن به body
        document.body.appendChild(this.notificationContainer);
    }

    // راه‌اندازی WebSocket
    setupWebSocket() {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('🔌 اتصال WebSocket برقرار شد');
            this.socket.emit('authenticate', { token });
        });
        
        this.socket.on('live_notification', (notification) => {
            this.handleIncomingNotification(notification);
        });
        
        this.socket.on('disconnect', () => {
            console.log('🔌 اتصال WebSocket قطع شد');
        });
    }

    // مدیریت اعلان ورودی
    handleIncomingNotification(notification) {
        // بررسی فعال بودن اعلان‌ها
        if (!this.settings.enableNotifications) return;

        // بررسی نوع اعلان
        if (!this.settings.notifyTypes[notification.type]) return;

        // نمایش اعلان
        this.showNotification(notification);

        // پخش صدا
        if (this.settings.enableSound) {
            this.playNotificationSound();
        }

        // اعلان مرورگر
        if (this.settings.enableDesktopNotifications && this.desktopNotificationSupported) {
            this.showDesktopNotification(notification);
        }
    }

    // نمایش اعلان مرورگر
    showDesktopNotification(notification) {
        if (Notification.permission === 'granted') {
            const desktopNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `notification-${notification.id}`,
                requireInteraction: false,
                silent: !this.settings.enableSound
            });

            // کلیک روی اعلان مرورگر
            desktopNotification.onclick = () => {
                window.focus();
                this.handleNotificationClick(notification);
                desktopNotification.close();
            };

            // بستن خودکار
            setTimeout(() => {
                desktopNotification.close();
            }, this.settings.notificationDuration * 1000);
        }
    }

    // درخواست مجوز اعلان مرورگر
    async requestNotificationPermission() {
        if (!this.desktopNotificationSupported) {
            throw new Error('مرورگر شما از اعلان‌های مرورگر پشتیبانی نمی‌کند');
        }

        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this.settings.enableDesktopNotifications = true;
                this.saveSettings();
                return true;
            } else {
                throw new Error('مجوز اعلان رد شد');
            }
        } else if (Notification.permission === 'denied') {
            throw new Error('مجوز اعلان قبلاً رد شده است. لطفاً در تنظیمات مرورگر تغییر دهید');
        }

        return Notification.permission === 'granted';
    }

    // بارگذاری اعلان‌های موجود
    async loadExistingNotifications() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch('/api/notifications/live', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.notifications = data.notifications || [];
                this.updateNotificationBadge();
            }
        } catch (error) {
            console.error('خطا در بارگذاری اعلان‌ها:', error);
        }
    }

    // نمایش اعلان جدید
    showNotification(notification) {
        // اضافه کردن به لیست
        this.notifications.unshift(notification);
        this.updateNotificationBadge();
        
        // ایجاد عنصر اعلان
        const notificationElement = this.createNotificationElement(notification);
        
        // اضافه کردن به کانتینر
        this.notificationContainer.appendChild(notificationElement);
        
        // انیمیشن ورود
        setTimeout(() => {
            notificationElement.classList.add('show');
        }, 100);
        
        // حذف خودکار
        if (this.settings.notificationDuration > 0) {
            setTimeout(() => {
                this.removeNotification(notificationElement);
            }, this.settings.notificationDuration * 1000);
        }
        
        // ذخیره در localStorage
        this.saveNotifications();
    }

    // ایجاد عنصر اعلان
    createNotificationElement(notification) {
        const element = document.createElement('div');
        element.className = 'live-notification';
        element.dataset.notificationId = notification.id;
        element.dataset.type = notification.type;
        
        // تعیین آیکون بر اساس نوع
        const icon = this.getNotificationIcon(notification.type);
        const color = this.getNotificationColor(notification.type);
        
        element.innerHTML = `
            <div class="notification-icon" style="background: ${color}">
                <i class="${icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${this.formatTime(notification.createdAt)}</div>
            </div>
            <button class="notification-close" onclick="liveNotifications.removeNotification(this.parentElement)">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // کلیک روی اعلان
        element.addEventListener('click', (e) => {
            if (!e.target.closest('.notification-close')) {
                this.handleNotificationClick(notification);
            }
        });
        
        return element;
    }

    // دریافت آیکون بر اساس نوع اعلان
    getNotificationIcon(type) {
        const icons = {
            'message': 'fas fa-comment',
            'friend_request': 'fas fa-user-plus',
            'purchase': 'fas fa-shopping-cart',
            'system': 'fas fa-bell'
        };
        return icons[type] || 'fas fa-bell';
    }

    // دریافت رنگ بر اساس نوع اعلان
    getNotificationColor(type) {
        const colors = {
            'message': '#007bff',
            'friend_request': '#28a745',
            'purchase': '#ffc107',
            'system': '#6c757d'
        };
        return colors[type] || '#6c757d';
    }

    // فرمت کردن زمان
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // کمتر از 1 دقیقه
            return 'همین الان';
        } else if (diff < 3600000) { // کمتر از 1 ساعت
            const minutes = Math.floor(diff / 60000);
            return `${minutes} دقیقه پیش`;
        } else if (diff < 86400000) { // کمتر از 1 روز
            const hours = Math.floor(diff / 3600000);
            return `${hours} ساعت پیش`;
        } else {
            return date.toLocaleDateString('fa-IR');
        }
    }

    // حذف اعلان
    removeNotification(element) {
        element.classList.add('hiding');
        setTimeout(() => {
            if (element.parentElement) {
                element.parentElement.removeChild(element);
            }
        }, 300);
    }

    // به‌روزرسانی نشانگر تعداد اعلان‌ها
    updateNotificationBadge() {
        const unreadCount = this.notifications.filter(n => !n.isRead).length;
        
        // به‌روزرسانی badge در منو
        const menuBadge = document.querySelector('.nav-link[href="/notifications.html"] .badge');
        if (menuBadge) {
            if (unreadCount > 0) {
                menuBadge.textContent = unreadCount;
                menuBadge.style.display = 'inline';
            } else {
                menuBadge.style.display = 'none';
            }
        }
        
        // به‌روزرسانی title صفحه
        if (unreadCount > 0) {
            document.title = `(${unreadCount}) ${document.title.replace(/^\(\d+\)\s*/, '')}`;
        } else {
            document.title = document.title.replace(/^\(\d+\)\s*/, '');
        }
    }

    // مدیریت کلیک روی اعلان
    handleNotificationClick(notification) {
        // علامت‌گذاری به عنوان خوانده شده
        this.markAsRead(notification.id);
        
        // هدایت بر اساس نوع اعلان
        switch (notification.type) {
            case 'message':
                if (notification.data && notification.data.conversationId) {
                    window.location.href = `/messenger.html?chat=${notification.data.conversationId}`;
                }
                break;
            case 'friend_request':
                window.location.href = '/profile.html?tab=friend-requests';
                break;
            case 'purchase':
                window.location.href = '/profile.html?tab=orders';
                break;
            case 'system':
                window.location.href = '/notifications.html';
                break;
        }
    }

    // علامت‌گذاری به عنوان خوانده شده
    async markAsRead(notificationId) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            await fetch(`/api/notifications/live/${notificationId}/read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // به‌روزرسانی وضعیت محلی
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.isRead = true;
                this.updateNotificationBadge();
            }
        } catch (error) {
            console.error('خطا در علامت‌گذاری اعلان:', error);
        }
    }

    // پخش صدای اعلان
    setupNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            
            this.notificationSound = () => {
                const volume = this.settings.notificationVolume / 100;
                gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
            };
        } catch (error) {
            console.log('صدای اعلان غیرفعال است');
        }
    }

    playNotificationSound() {
        if (this.notificationSound && this.settings.enableSound) {
            this.notificationSound();
        }
    }

    // ذخیره اعلان‌ها در localStorage
    saveNotifications() {
        try {
            localStorage.setItem('liveNotifications', JSON.stringify(this.notifications.slice(0, 50)));
        } catch (error) {
            console.error('خطا در ذخیره اعلان‌ها:', error);
        }
    }

    // بارگذاری اعلان‌ها از localStorage
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('liveNotifications');
            if (stored) {
                this.notifications = JSON.parse(stored);
                this.updateNotificationBadge();
            }
        } catch (error) {
            console.error('خطا در بارگذاری اعلان‌ها:', error);
        }
    }

    // ارسال درخواست دوستی
    async sendFriendRequest(toUserId) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('توکن احراز هویت یافت نشد');

            const response = await fetch('/api/friend-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ toUserId })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showSystemNotification('درخواست دوستی ارسال شد', 'success');
                return data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.showSystemNotification(error.message, 'error');
            throw error;
        }
    }

    // نمایش اعلان سیستمی
    showSystemNotification(message, type = 'info') {
        const notification = {
            id: Date.now(),
            type: 'system',
            title: type === 'success' ? 'موفقیت' : type === 'error' ? 'خطا' : 'اطلاعیه',
            message: message,
            createdAt: new Date().toISOString()
        };
        
        this.showNotification(notification);
    }

    // تست اعلان
    testNotification() {
        const testNotification = {
            id: Date.now(),
            type: 'system',
            title: 'تست اعلان',
            message: 'این یک اعلان تست است برای بررسی عملکرد سیستم',
            createdAt: new Date().toISOString()
        };
        
        this.showNotification(testNotification);
        
        if (this.settings.enableSound) {
            this.playNotificationSound();
        }
    }

    // پاک کردن همه اعلان‌ها
    clearAllNotifications() {
        this.notifications = [];
        this.updateNotificationBadge();
        this.saveNotifications();
        
        // حذف همه عناصر اعلان
        const elements = this.notificationContainer.querySelectorAll('.live-notification');
        elements.forEach(element => {
            this.removeNotification(element);
        });
        
        this.showSystemNotification('همه اعلان‌ها پاک شدند', 'success');
    }

    // دریافت تعداد اعلان‌های نخوانده
    getUnreadCount() {
        return this.notifications.filter(n => !n.isRead).length;
    }

    // دریافت همه اعلان‌ها
    getAllNotifications() {
        return this.notifications;
    }

    // دریافت تنظیمات
    getSettings() {
        return this.settings;
    }

    // بررسی وضعیت مجوز اعلان مرورگر
    getNotificationPermissionStatus() {
        if (!this.desktopNotificationSupported) {
            return 'not-supported';
        }
        return Notification.permission;
    }
}

// ایجاد نمونه سراسری
const liveNotifications = new LiveNotificationSystem();

// راه‌اندازی خودکار
document.addEventListener('DOMContentLoaded', () => {
    liveNotifications.init();
    
    // راه‌اندازی تنظیمات در صفحه تنظیمات
    if (window.location.pathname === '/settings.html') {
        setupNotificationSettings();
    }
});

// راه‌اندازی مجدد در صورت تغییر صفحه
window.addEventListener('focus', () => {
    if (liveNotifications.isInitialized) {
        liveNotifications.loadFromStorage();
    }
});

// توابع برای صفحه تنظیمات
function setupNotificationSettings() {
    const settings = liveNotifications.getSettings();
    
    // تنظیم مقادیر اولیه
    document.getElementById('enableNotifications').checked = settings.enableNotifications;
    document.getElementById('enableSound').checked = settings.enableSound;
    document.getElementById('enableDesktopNotifications').checked = settings.enableDesktopNotifications;
    document.getElementById('enableMobileNotifications').checked = settings.enableMobileNotifications;
    document.getElementById('notificationDuration').value = settings.notificationDuration;
    document.getElementById('notificationPosition').value = settings.notificationPosition;
    document.getElementById('notificationVolume').value = settings.notificationVolume;
    document.getElementById('volumeValue').textContent = settings.notificationVolume + '%';
    
    document.getElementById('notifyMessages').checked = settings.notifyTypes.message;
    document.getElementById('notifyFriendRequests').checked = settings.notifyTypes.friend_request;
    document.getElementById('notifyPurchases').checked = settings.notifyTypes.purchase;
    document.getElementById('notifySystem').checked = settings.notifyTypes.system;
    
    // اضافه کردن event listeners
    document.getElementById('enableNotifications').addEventListener('change', updateSettings);
    document.getElementById('enableSound').addEventListener('change', updateSettings);
    document.getElementById('enableDesktopNotifications').addEventListener('change', updateSettings);
    document.getElementById('enableMobileNotifications').addEventListener('change', updateSettings);
    document.getElementById('notificationDuration').addEventListener('change', updateSettings);
    document.getElementById('notificationPosition').addEventListener('change', updateSettings);
    document.getElementById('notificationVolume').addEventListener('input', updateVolume);
    
    document.getElementById('notifyMessages').addEventListener('change', updateNotificationTypes);
    document.getElementById('notifyFriendRequests').addEventListener('change', updateNotificationTypes);
    document.getElementById('notifyPurchases').addEventListener('change', updateNotificationTypes);
    document.getElementById('notifySystem').addEventListener('change', updateNotificationTypes);
}

function updateSettings() {
    const newSettings = {
        enableNotifications: document.getElementById('enableNotifications').checked,
        enableSound: document.getElementById('enableSound').checked,
        enableDesktopNotifications: document.getElementById('enableDesktopNotifications').checked,
        enableMobileNotifications: document.getElementById('enableMobileNotifications').checked,
        notificationDuration: parseInt(document.getElementById('notificationDuration').value),
        notificationPosition: document.getElementById('notificationPosition').value
    };
    
    liveNotifications.updateSettings(newSettings);
}

function updateVolume() {
    const volume = document.getElementById('notificationVolume').value;
    document.getElementById('volumeValue').textContent = volume + '%';
    
    liveNotifications.updateSettings({ notificationVolume: parseInt(volume) });
}

function updateNotificationTypes() {
    const notifyTypes = {
        message: document.getElementById('notifyMessages').checked,
        friend_request: document.getElementById('notifyFriendRequests').checked,
        purchase: document.getElementById('notifyPurchases').checked,
        system: document.getElementById('notifySystem').checked
    };
    
    liveNotifications.updateSettings({ notifyTypes });
}

function testNotification() {
    liveNotifications.testNotification();
}

function clearAllNotifications() {
    if (confirm('آیا مطمئن هستید که می‌خواهید همه اعلان‌ها را پاک کنید؟')) {
        liveNotifications.clearAllNotifications();
    }
}

async function requestNotificationPermission() {
    try {
        await liveNotifications.requestNotificationPermission();
        alert('مجوز اعلان‌های مرورگر اعطا شد!');
        document.getElementById('enableDesktopNotifications').checked = true;
        updateSettings();
    } catch (error) {
        alert('خطا: ' + error.message);
    }
} 