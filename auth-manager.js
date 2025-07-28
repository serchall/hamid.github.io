// Authentication Manager for Chat Widget
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.init();
    }

    init() {
        this.loadUserFromStorage();
        this.setupAuthListeners();
    }

    loadUserFromStorage() {
        const token = localStorage.getItem('authToken');
        const userName = localStorage.getItem('userName');
        const userEmail = localStorage.getItem('userEmail');

        if (token && userName) {
            this.token = token;
            this.currentUser = {
                name: userName,
                email: userEmail || '',
                token: token
            };
            console.log('User loaded from storage:', this.currentUser.name);
        }
    }

    setupAuthListeners() {
        // Listen for auth events from other parts of the app
        window.addEventListener('storage', (e) => {
            if (e.key === 'authToken' || e.key === 'userName') {
                this.loadUserFromStorage();
                this.notifyAuthChange();
            }
        });

        // Listen for custom auth events
        window.addEventListener('userLoggedIn', (e) => {
            this.loadUserFromStorage();
            this.notifyAuthChange();
        });

        window.addEventListener('userLoggedOut', () => {
            this.clearUser();
            this.notifyAuthChange();
        });
    }

    login(userData) {
        this.currentUser = userData;
        this.token = userData.token;
        
        // Save to localStorage
        localStorage.setItem('authToken', userData.token);
        localStorage.setItem('userName', userData.name);
        localStorage.setItem('userEmail', userData.email);
        
        this.notifyAuthChange();
        console.log('User logged in:', userData.name);
    }

    logout() {
        this.clearUser();
        this.notifyAuthChange();
        console.log('User logged out');
    }

    clearUser() {
        this.currentUser = null;
        this.token = null;
        
        // Clear from localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
    }

    isAuthenticated() {
        return !!this.currentUser && !!this.token;
    }

    getUser() {
        return this.currentUser;
    }

    getToken() {
        return this.token;
    }

    notifyAuthChange() {
        // Dispatch custom event for chat widget
        const event = new CustomEvent('authStateChanged', {
            detail: {
                user: this.currentUser,
                isAuthenticated: this.isAuthenticated()
            }
        });
        window.dispatchEvent(event);
    }

    // API methods for authentication
    async loginWithCredentials(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (data.success) {
                this.login({
                    name: data.user.name,
                    email: data.user.email,
                    token: data.token
                });
                return { success: true, user: data.user };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'خطا در اتصال به سرور' };
        }
    }

    async register(userData) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            
            if (data.success) {
                this.login({
                    name: data.user.name,
                    email: data.user.email,
                    token: data.token
                });
                return { success: true, user: data.user };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, message: 'خطا در اتصال به سرور' };
        }
    }

    async validateToken() {
        if (!this.token) {
            return false;
        }

        try {
            const response = await fetch('/api/auth/validate', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }
}

// Global auth manager instance
window.authManager = new AuthManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
} 