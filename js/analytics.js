// Enhanced Analytics Manager with 10+ Features
class AnalyticsManager {
    constructor() {
        this.trackingEnabled = true;
        this.userProperties = {};
        this.sessionStart = Date.now();
        this.pageViews = [];
        this.events = [];
        
        this.initializeAnalytics();
        this.setupAnalyticsEvents();
    }

    initializeAnalytics() {
        this.loadUserPreferences();
        this.setupUserProperties();
        this.startSession();
    }

    setupAnalyticsEvents() {
        // Page view tracking
        window.addEventListener('hashchange', () => {
            this.trackPageView();
        });

        // Session duration tracking
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
        });

        // Error tracking
        window.addEventListener('error', (e) => {
            this.trackError(e.error);
        });

        // Performance tracking
        window.addEventListener('load', () => {
            this.trackPerformance();
        });
    }

    setupUserProperties() {
        this.userProperties = {
            userId: utils.currentUser?._id || 'anonymous',
            role: utils.currentUser?.role || 'guest',
            location: utils.currentUser?.profile?.location?.county || 'unknown',
            joinDate: utils.currentUser?.createdAt || new Date().toISOString(),
            device: this.getDeviceInfo(),
            browser: this.getBrowserInfo()
        };
    }

    // Feature 1: Page View Tracking
    trackPageView(page = null) {
        if (!this.trackingEnabled) return;

        const pageView = {
            type: 'pageview',
            page: page || window.location.hash.substring(1) || 'home',
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId(),
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            ...this.userProperties
        };

        this.pageViews.push(pageView);
        this.sendToAnalytics('pageview', pageView);
    }

    // Feature 2: Event Tracking
    trackEvent(category, action, label = null, value = null) {
        if (!this.trackingEnabled) return;

        const event = {
            type: 'event',
            category,
            action,
            label,
            value,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId(),
            ...this.userProperties
        };

        this.events.push(event);
        this.sendToAnalytics('event', event);
    }

    // Feature 3: E-commerce Tracking
    trackEcommerceEvent(eventType, data) {
        this.trackEvent('ecommerce', eventType, null, data.value);
        
        const ecommerceEvent = {
            type: 'ecommerce',
            eventType,
            ...data,
            timestamp: new Date().toISOString(),
            ...this.userProperties
        };

        this.sendToAnalytics('ecommerce', ecommerceEvent);
    }

    // Feature 4: User Journey Tracking
    trackUserJourney(step, data = {}) {
        const journeyEvent = {
            type: 'journey',
            step,
            ...data,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId(),
            ...this.userProperties
        };

        this.sendToAnalytics('journey', journeyEvent);
    }

    // Feature 5: Performance Monitoring
    trackPerformance() {
        if (!('performance' in window)) return;

        const navigation = performance.getEntriesByType('navigation')[0];
        const resources = performance.getEntriesByType('resource');

        const perfData = {
            type: 'performance',
            dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            request: navigation.responseStart - navigation.requestStart,
            response: navigation.responseEnd - navigation.responseStart,
            domLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
            pageLoad: navigation.loadEventEnd - navigation.navigationStart,
            resources: resources.length,
            timestamp: new Date().toISOString(),
            ...this.userProperties
        };

        this.sendToAnalytics('performance', perfData);
    }

    // Feature 6: Error Tracking
    trackError(error, context = {}) {
        const errorEvent = {
            type: 'error',
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            ...this.userProperties
        };

        this.sendToAnalytics('error', errorEvent);
    }

    // Feature 7: Feature Usage Tracking
    trackFeatureUsage(feature, data = {}) {
        const featureEvent = {
            type: 'feature_usage',
            feature,
            ...data,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId(),
            ...this.userProperties
        };

        this.sendToAnalytics('feature_usage', featureEvent);
    }

    // Feature 8: Conversion Tracking
    trackConversion(conversionType, value, data = {}) {
        const conversionEvent = {
            type: 'conversion',
            conversionType,
            value,
            ...data,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId(),
            ...this.userProperties
        };

        this.sendToAnalytics('conversion', conversionEvent);
    }

    // Feature 9: A/B Testing Tracking
    trackExperiment(experimentId, variant, data = {}) {
        const experimentEvent = {
            type: 'experiment',
            experimentId,
            variant,
            ...data,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId(),
            ...this.userProperties
        };

        this.sendToAnalytics('experiment', experimentEvent);
    }

    // Feature 10: Real-time Analytics Dashboard
    getRealTimeStats() {
        const now = Date.now();
        const fiveMinutesAgo = now - 5 * 60 * 1000;

        const recentPageViews = this.pageViews.filter(pv => 
            new Date(pv.timestamp).getTime() > fiveMinutesAgo
        );

        const recentEvents = this.events.filter(event =>
            new Date(event.timestamp).getTime() > fiveMinutesAgo
        );

        return {
            activeUsers: this.getActiveSessions(),
            pageViews: recentPageViews.length,
            events: recentEvents.length,
            conversions: recentEvents.filter(e => e.type === 'conversion').length,
            topPages: this.getTopPages(recentPageViews)
        };
    }

    // Session Management
    startSession() {
        this.sessionStart = Date.now();
        this.sessionId = utils.generateId();
        
        const sessionEvent = {
            type: 'session_start',
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            ...this.userProperties
        };

        this.sendToAnalytics('session', sessionEvent);
    }

    trackSessionEnd() {
        const sessionDuration = Date.now() - this.sessionStart;
        
        const sessionEvent = {
            type: 'session_end',
            sessionId: this.sessionId,
            duration: sessionDuration,
            pageViews: this.pageViews.length,
            events: this.events.length,
            timestamp: new Date().toISOString(),
            ...this.userProperties
        };

        this.sendToAnalytics('session', sessionEvent);
    }

    getSessionId() {
        return this.sessionId;
    }

    getActiveSessions() {
        // This would typically come from server-side analytics
        return Math.floor(Math.random() * 50) + 10; // Simulated data
    }

    // Data Sending and Storage
    async sendToAnalytics(type, data) {
        if (!this.trackingEnabled) return;

        try {
            // In a real implementation, this would send to your analytics service
            console.log(`[Analytics] ${type}:`, data);

            // Store locally for offline sync
            this.storeLocally(type, data);

            // Send to backend if online
            if (navigator.onLine) {
                await this.sendToBackend(type, data);
            }

        } catch (error) {
            console.warn('Analytics sending failed:', error);
            // Queue for retry
            this.queueForRetry(type, data);
        }
    }

    async sendToBackend(type, data) {
        // Simulate API call to analytics endpoint
        await utils.apiCall('/analytics', {
            method: 'POST',
            body: JSON.stringify({ type, data })
        });
    }

    storeLocally(type, data) {
        const stored = JSON.parse(localStorage.getItem('analyticsQueue')) || [];
        stored.push({ type, data, timestamp: new Date().toISOString() });
        
        // Keep only last 1000 events
        if (stored.length > 1000) {
            stored.splice(0, stored.length - 1000);
        }
        
        localStorage.setItem('analyticsQueue', JSON.stringify(stored));
    }

    queueForRetry(type, data) {
        const retryQueue = JSON.parse(localStorage.getItem('analyticsRetryQueue')) || [];
        retryQueue.push({ type, data, timestamp: new Date().toISOString() });
        localStorage.setItem('analyticsRetryQueue', JSON.stringify(retryQueue));
    }

    async retryFailedEvents() {
        if (!navigator.onLine) return;

        const retryQueue = JSON.parse(localStorage.getItem('analyticsRetryQueue')) || [];
        
        for (const event of retryQueue) {
            try {
                await this.sendToBackend(event.type, event.data);
                // Remove from queue on success
                retryQueue.splice(retryQueue.indexOf(event), 1);
            } catch (error) {
                console.warn('Retry failed for event:', event);
            }
        }

        localStorage.setItem('analyticsRetryQueue', JSON.stringify(retryQueue));
    }

    // Utility Methods
    getDeviceInfo() {
        const ua = navigator.userAgent;
        
        return {
            isMobile: /Mobile|Android|iPhone|iPad/.test(ua),
            isTablet: /iPad|Tablet/.test(ua),
            isDesktop: !/Mobile|Android|iPhone|iPad|Tablet/.test(ua),
            userAgent: ua
        };
    }

    getBrowserInfo() {
        const ua = navigator.userAgent;
        
        return {
            name: this.getBrowserName(ua),
            version: this.getBrowserVersion(ua),
            language: navigator.language,
            platform: navigator.platform
        };
    }

    getBrowserName(ua) {
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return 'Unknown';
    }

    getBrowserVersion(ua) {
        const matches = ua.match(/(Chrome|Firefox|Safari|Edge)\/([0-9.]+)/);
        return matches ? matches[2] : 'Unknown';
    }

    getTopPages(pageViews, limit = 5) {
        const pageCounts = {};
        
        pageViews.forEach(pv => {
            pageCounts[pv.page] = (pageCounts[pv.page] || 0) + 1;
        });

        return Object.entries(pageCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([page, count]) => ({ page, count }));
    }

    // User Preferences
    loadUserPreferences() {
        this.trackingEnabled = localStorage.getItem('analyticsEnabled') !== 'false';
    }

    setTrackingEnabled(enabled) {
        this.trackingEnabled = enabled;
        localStorage.setItem('analyticsEnabled', enabled.toString());
    }

    // Analytics Dashboard Data
    getDashboardData(timeRange = '24h') {
        const now = new Date();
        let startTime;

        switch (timeRange) {
            case '1h':
                startTime = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '24h':
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }

        const filteredPageViews = this.pageViews.filter(pv =>
            new Date(pv.timestamp) >= startTime
        );

        const filteredEvents = this.events.filter(event =>
            new Date(event.timestamp) >= startTime
        );

        return {
            timeRange,
            totalPageViews: filteredPageViews.length,
            totalEvents: filteredEvents.length,
            uniqueUsers: new Set(filteredPageViews.map(pv => pv.userId)).size,
            topPages: this.getTopPages(filteredPageViews),
            popularEvents: this.getPopularEvents(filteredEvents),
            conversionRate: this.calculateConversionRate(filteredEvents)
        };
    }

    getPopularEvents(events, limit = 10) {
        const eventCounts = {};
        
        events.forEach(event => {
            const key = `${event.category}.${event.action}`;
            eventCounts[key] = (eventCounts[key] || 0) + 1;
        });

        return Object.entries(eventCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([event, count]) => ({ event, count }));
    }

    calculateConversionRate(events) {
        const conversions = events.filter(e => e.type === 'conversion').length;
        const totalSessions = new Set(events.map(e => e.sessionId)).size;
        
        return totalSessions > 0 ? (conversions / totalSessions) * 100 : 0;
    }

    // Heartbeat for real-time monitoring
    sendHeartbeat(page) {
        const heartbeat = {
            type: 'heartbeat',
            page,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            ...this.userProperties
        };

        this.sendToAnalytics('heartbeat', heartbeat);
    }
}

// Initialize analytics manager
const analytics = new AnalyticsManager();
