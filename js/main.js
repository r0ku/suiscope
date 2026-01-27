/**
 * Main application file for SuiScope
 */

class SuiScopeApp {
    constructor() {
        this.stats = {
            totalTransactions: 0,
            totalObjects: 0,
            activeAddresses: 0,
            networkTPS: 0
        };
        
        this.recentActivity = [];
        this.statsUpdateInterval = null;
        this.activityUpdateInterval = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadInitialData();
        this.startPeriodicUpdates();
    }

    bindEvents() {
        // Mobile menu toggle
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('.nav');
        
        if (mobileMenuToggle && nav) {
            mobileMenuToggle.addEventListener('click', () => {
                nav.classList.toggle('active');
                mobileMenuToggle.classList.toggle('active');
            });
        }

        // Navigation links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(link);
            });
        });

        // Stat cards click effects
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach(card => {
            card.addEventListener('click', () => {
                this.handleStatCardClick(card);
            });
        });

        // Activity item clicks
        document.addEventListener('click', (e) => {
            const activityItem = e.target.closest('.activity-item');
            if (activityItem) {
                this.handleActivityClick(activityItem);
            }
        });

        // Scroll effects
        window.addEventListener('scroll', SuiScopeUtils.throttle(() => {
            this.handleScroll();
        }, 100));

        // Resize effects
        window.addEventListener('resize', SuiScopeUtils.throttle(() => {
            this.handleResize();
        }, 250));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Visibility change (for pausing/resuming updates when tab is hidden)
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    }

    async loadInitialData() {
        try {
            // Load network statistics
            await this.updateNetworkStats();
            
            // Load recent activity
            await this.updateRecentActivity();
            
            // Animation delay for stats cards
            this.animateStatsCards();
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
            SuiScopeUtils.showNotification('Failed to load some data. Retrying...', 'error');
            
            // Retry after delay
            setTimeout(() => {
                this.loadInitialData();
            }, 5000);
        }
    }

    async updateNetworkStats() {
        try {
            const stats = await SuiScopeAPI.getNetworkStats();
            
            this.stats = { ...this.stats, ...stats };
            this.displayStats();
            
        } catch (error) {
            console.error('Failed to update network stats:', error);
        }
    }

    displayStats() {
        const elements = {
            totalTransactions: document.getElementById('totalTransactions'),
            totalObjects: document.getElementById('totalObjects'),
            activeAddresses: document.getElementById('activeAddresses'),
            networkTPS: document.getElementById('networkTPS')
        };

        // Animate number changes
        Object.keys(elements).forEach(key => {
            const element = elements[key];
            if (element) {
                const newValue = this.stats[key];
                if (key === 'networkTPS') {
                    this.animateNumber(element, parseFloat(element.textContent) || 0, newValue, 'TPS');
                } else {
                    this.animateNumber(element, this.parseNumberFromElement(element), newValue);
                }
            }
        });
    }

    animateNumber(element, from, to, suffix = '') {
        if (isNaN(from) || isNaN(to)) {
            element.textContent = SuiScopeUtils.formatLargeNumber(to) + (suffix ? ` ${suffix}` : '');
            return;
        }

        const duration = 1500;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            
            const current = from + (to - from) * easeOutQuart;
            element.textContent = SuiScopeUtils.formatLargeNumber(Math.floor(current)) + (suffix ? ` ${suffix}` : '');
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    parseNumberFromElement(element) {
        const text = element.textContent.replace(/[^\d.-]/g, '');
        return parseFloat(text) || 0;
    }

    animateStatsCards() {
        const statCards = document.querySelectorAll('.stat-card');
        
        statCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    async updateRecentActivity() {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;

        try {
            // Show loading state
            activityList.innerHTML = '<div class="activity-loading">Loading recent transactions...</div>';
            
            const latestTransactions = await SuiScopeAPI.getLatestTransactions(10);
            this.recentActivity = latestTransactions.data || [];
            
            this.displayRecentActivity();
            
        } catch (error) {
            console.error('Failed to update recent activity:', error);
            
            if (activityList) {
                activityList.innerHTML = SuiScopeUtils.createErrorElement(
                    'Failed to load recent activity',
                    true,
                    () => this.updateRecentActivity()
                ).outerHTML;
            }
        }
    }

    displayRecentActivity() {
        const activityList = document.getElementById('activityList');
        if (!activityList || !this.recentActivity.length) return;

        const html = this.recentActivity.map(tx => this.renderActivityItem(tx)).join('');
        activityList.innerHTML = html;
    }

    renderActivityItem(tx) {
        const digest = tx.digest;
        const timestamp = parseInt(tx.timestampMs) || Date.now();
        const success = tx.effects?.status?.status === 'success';
        const gasUsed = tx.effects?.gasUsed?.computationCost || 0;

        return `
            <div class="activity-item" data-tx="${digest}">
                <div class="activity-header">
                    <div class="activity-type">
                        ${success ? '✅' : '❌'} TX
                    </div>
                    <div class="activity-time">${SuiScopeUtils.formatRelativeTime(timestamp)}</div>
                </div>
                <div class="activity-content">
                    <a href="#" class="activity-hash" data-hash="${digest}">
                        ${SuiScopeUtils.truncateHash(digest)}
                    </a>
                    <span class="activity-amount">Gas: ${SuiScopeUtils.formatNumber(gasUsed)}</span>
                </div>
            </div>
        `;
    }

    handleNavigation(link) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        
        // Add active class to clicked link
        link.classList.add('active');
        
        // Handle navigation based on text content
        const section = link.textContent.trim().toLowerCase();
        
        switch (section) {
            case 'explorer':
                // Already on explorer page - scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
            case 'analytics':
                this.showComingSoon('Analytics Dashboard');
                break;
            case 'api':
                this.showComingSoon('API Documentation');
                break;
            case 'about':
                this.showComingSoon('About SuiScope');
                break;
        }
        
        // Close mobile menu if open
        const nav = document.querySelector('.nav');
        const toggle = document.querySelector('.mobile-menu-toggle');
        if (nav && toggle) {
            nav.classList.remove('active');
            toggle.classList.remove('active');
        }
    }

    handleStatCardClick(card) {
        // Add click animation
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
            card.style.transform = '';
        }, 150);

        // Show more info based on stat type
        const label = card.querySelector('.stat-label')?.textContent.toLowerCase();
        
        switch (true) {
            case label?.includes('transaction'):
                this.showComingSoon('Transaction Analytics');
                break;
            case label?.includes('object'):
                this.showComingSoon('Object Explorer');
                break;
            case label?.includes('address'):
                this.showComingSoon('Address Analytics');
                break;
            case label?.includes('tps'):
                this.showComingSoon('Network Performance');
                break;
            default:
                SuiScopeUtils.showNotification('Feature coming soon!', 'info');
        }
    }

    handleActivityClick(activityItem) {
        const txHash = activityItem.dataset.tx;
        if (txHash) {
            // Simulate searching for the transaction
            const searchInput = document.getElementById('searchInput');
            if (searchInput && window.searchManager) {
                searchInput.value = txHash;
                window.searchManager.handleSearch(txHash);
            }
        }
    }

    handleScroll() {
        const header = document.querySelector('.header');
        if (!header) return;

        const scrolled = window.scrollY > 20;
        
        if (scrolled) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    handleResize() {
        // Close mobile menu on resize to larger screen
        if (window.innerWidth > 1023) {
            const nav = document.querySelector('.nav');
            const toggle = document.querySelector('.mobile-menu-toggle');
            
            if (nav && toggle) {
                nav.classList.remove('active');
                toggle.classList.remove('active');
            }
        }
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Escape to clear search or close overlays
        if (e.key === 'Escape') {
            const searchInput = document.getElementById('searchInput');
            if (searchInput === document.activeElement) {
                searchInput.blur();
            }
            
            // Close mobile menu
            const nav = document.querySelector('.nav');
            const toggle = document.querySelector('.mobile-menu-toggle');
            if (nav?.classList.contains('active')) {
                nav.classList.remove('active');
                toggle?.classList.remove('active');
            }
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.pauseUpdates();
        } else {
            this.resumeUpdates();
        }
    }

    startPeriodicUpdates() {
        // Update stats every 30 seconds
        this.statsUpdateInterval = setInterval(() => {
            this.updateNetworkStats();
        }, 30000);
        
        // Update activity every 15 seconds
        this.activityUpdateInterval = setInterval(() => {
            this.updateRecentActivity();
        }, 15000);
    }

    pauseUpdates() {
        if (this.statsUpdateInterval) {
            clearInterval(this.statsUpdateInterval);
        }
        if (this.activityUpdateInterval) {
            clearInterval(this.activityUpdateInterval);
        }
    }

    resumeUpdates() {
        this.startPeriodicUpdates();
        // Immediately update when resuming
        this.updateNetworkStats();
        this.updateRecentActivity();
    }

    showComingSoon(feature) {
        SuiScopeUtils.showNotification(`${feature} coming soon! 🚀`, 'info', 4000);
    }

    // Cleanup method
    destroy() {
        this.pauseUpdates();
        
        // Remove event listeners
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('keydown', this.handleKeyboardShortcuts);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
}

// Initialize app when DOM is ready
SuiScopeUtils.ready(() => {
    // Create global app instance
    window.suiScopeApp = new SuiScopeApp();
    
    console.log('🔍 SuiScope initialized successfully!');
    
    // Add some helpful console commands for development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🔧 Development mode detected. Available commands:');
        console.log('- suiScopeApp.updateNetworkStats() - Refresh network statistics');
        console.log('- suiScopeApp.updateRecentActivity() - Refresh recent activity');
        console.log('- SuiScopeAPI.search("query") - Test search functionality');
        console.log('- SuiScopeUtils.showNotification("message", "type") - Test notifications');
    }
});