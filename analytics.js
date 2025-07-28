// Google Analytics Configuration and Tracking
class Analytics {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    init() {
        // Check if gtag is available
        if (typeof gtag !== 'undefined') {
            this.isInitialized = true;
            console.log('Google Analytics initialized');
        } else {
            console.warn('Google Analytics not loaded');
        }
    }

    // Track page views
    trackPageView(pageTitle = null, pageLocation = null) {
        if (!this.isInitialized) return;

        const title = pageTitle || document.title;
        const location = pageLocation || window.location.href;

        gtag('event', 'page_view', {
            page_title: title,
            page_location: location
        });

        console.log('Page view tracked:', title);
    }

    // Track custom events
    trackEvent(eventName, parameters = {}) {
        if (!this.isInitialized) return;

        gtag('event', eventName, parameters);
        console.log('Event tracked:', eventName, parameters);
    }

    // Track e-commerce events
    trackEcommerce(eventName, parameters = {}) {
        if (!this.isInitialized) return;

        // Add e-commerce specific parameters
        const ecommerceParams = {
            ...parameters,
            currency: parameters.currency || 'IRR',
            transaction_id: parameters.transaction_id || this.generateTransactionId()
        };

        gtag('event', eventName, ecommerceParams);
        console.log('E-commerce event tracked:', eventName, ecommerceParams);
    }

    // Track user engagement
    trackUserEngagement(engagementTime = 1000) {
        if (!this.isInitialized) return;

        gtag('event', 'user_engagement', {
            engagement_time_msec: engagementTime
        });
    }

    // Track add to cart
    trackAddToCart(product) {
        this.trackEcommerce('add_to_cart', {
            currency: 'IRR',
            value: product.price,
            items: [{
                item_id: product._id,
                item_name: product.name,
                price: product.price,
                quantity: 1
            }]
        });
    }

    // Track remove from cart
    trackRemoveFromCart(product, quantity = 1) {
        this.trackEcommerce('remove_from_cart', {
            currency: 'IRR',
            value: product.price * quantity,
            items: [{
                item_id: product._id,
                item_name: product.name,
                price: product.price,
                quantity: quantity
            }]
        });
    }

    // Track begin checkout
    trackBeginCheckout(cartItems, total) {
        this.trackEcommerce('begin_checkout', {
            currency: 'IRR',
            value: total,
            items: cartItems.map(item => ({
                item_id: item._id,
                item_name: item.name,
                price: item.price,
                quantity: item.quantity
            }))
        });
    }

    // Track purchase
    trackPurchase(transactionId, cartItems, total, tax = 0, shipping = 0) {
        this.trackEcommerce('purchase', {
            transaction_id: transactionId,
            currency: 'IRR',
            value: total,
            tax: tax,
            shipping: shipping,
            items: cartItems.map(item => ({
                item_id: item._id,
                item_name: item.name,
                price: item.price,
                quantity: item.quantity
            }))
        });
    }

    // Track user login
    trackLogin(method = 'email') {
        this.trackEvent('login', {
            method: method
        });
    }

    // Track user logout
    trackLogout() {
        this.trackEvent('logout');
    }

    // Track search
    trackSearch(searchTerm) {
        this.trackEvent('search', {
            search_term: searchTerm
        });
    }

    // Track video views
    trackVideoView(videoTitle, videoId) {
        this.trackEvent('video_view', {
            video_title: videoTitle,
            video_id: videoId
        });
    }

    // Track course enrollment
    trackCourseEnrollment(courseName, courseId, price = 0) {
        this.trackEcommerce('course_enrollment', {
            currency: 'IRR',
            value: price,
            items: [{
                item_id: courseId,
                item_name: courseName,
                price: price,
                quantity: 1
            }]
        });
    }

    // Generate unique transaction ID
    generateTransactionId() {
        return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Track scroll depth
    trackScrollDepth() {
        let maxScroll = 0;
        let ticking = false;

        function updateScrollDepth() {
            const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                
                // Track at 25%, 50%, 75%, 100%
                if (maxScroll >= 25 && maxScroll < 50) {
                    analytics.trackEvent('scroll_depth', { depth: 25 });
                } else if (maxScroll >= 50 && maxScroll < 75) {
                    analytics.trackEvent('scroll_depth', { depth: 50 });
                } else if (maxScroll >= 75 && maxScroll < 100) {
                    analytics.trackEvent('scroll_depth', { depth: 75 });
                } else if (maxScroll >= 100) {
                    analytics.trackEvent('scroll_depth', { depth: 100 });
                }
            }
            
            ticking = false;
        }

        function requestTick() {
            if (!ticking) {
                requestAnimationFrame(updateScrollDepth);
                ticking = true;
            }
        }

        window.addEventListener('scroll', requestTick);
    }

    // Track time on page
    trackTimeOnPage() {
        const startTime = Date.now();
        
        window.addEventListener('beforeunload', () => {
            const timeOnPage = Date.now() - startTime;
            this.trackEvent('time_on_page', {
                time_milliseconds: timeOnPage,
                time_seconds: Math.round(timeOnPage / 1000)
            });
        });
    }

    // Initialize all tracking
    initTracking() {
        this.trackPageView();
        this.trackUserEngagement();
        this.trackScrollDepth();
        this.trackTimeOnPage();
    }
}

// Initialize analytics
const analytics = new Analytics();

// Make analytics available globally
window.analytics = analytics; 