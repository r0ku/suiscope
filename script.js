// ===== SuiScope - Simplified Sui Network Search =====

// ===== Theme Management =====
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('suiscope-theme') || 'auto';
        this.themeToggle = document.getElementById('themeToggle');
        this.init();
    }

    init() {
        this.applyTheme();
        this.themeToggle?.addEventListener('click', () => this.toggleTheme());
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (this.theme === 'auto') {
                this.applyTheme();
            }
        });
    }

    toggleTheme() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.theme = themes[nextIndex];
        this.saveTheme();
        this.applyTheme();
        this.updateThemeIcon();
    }

    applyTheme() {
        const root = document.documentElement;
        
        if (this.theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            root.setAttribute('data-theme', this.theme);
        }
        
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const iconMap = {
            'light': '🌙',
            'dark': '☀️',
            'auto': '🌓'
        };
        
        const icon = this.themeToggle?.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = iconMap[this.theme];
        }
    }

    saveTheme() {
        localStorage.setItem('suiscope-theme', this.theme);
    }
}

// ===== Toast Notifications =====
class ToastManager {
    constructor() {
        this.container = document.getElementById('toastContainer');
        this.toasts = new Set();
    }

    show(message, type = 'info', duration = 5000) {
        const toast = this.createToast(message, type);
        this.container.appendChild(toast);
        this.toasts.add(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });

        // Auto remove
        setTimeout(() => {
            this.remove(toast);
        }, duration);

        return toast;
    }

    createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
        `;

        // Click to dismiss
        toast.addEventListener('click', () => this.remove(toast));

        return toast;
    }

    remove(toast) {
        if (!this.toasts.has(toast)) return;

        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.toasts.delete(toast);
        }, 300);
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// ===== Input Type Detector =====
class InputTypeDetector {
    static detect(input) {
        const trimmed = input.trim();
        
        if (!trimmed) {
            return { type: 'unknown', confidence: 0 };
        }

        // Base58 Transaction digest: ~44 chars, Base58 alphabet only (no 0, O, I, l, +, /, =)
        if (/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{40,50}$/.test(trimmed)) {
            return { type: 'transaction', confidence: 0.95 };
        }

        // Base64 Transaction digest: 44 chars ending with =
        if (/^[A-Za-z0-9+/]{43}=$/.test(trimmed)) {
            return { type: 'transaction', confidence: 0.9 };
        }

        // Transaction digest: 0x + 64 hex characters (32 bytes)
        if (/^0x[a-fA-F0-9]{64}$/.test(trimmed)) {
            return { type: 'transaction', confidence: 0.85 };
        }

        // Address: 0x + up to 64 hex characters
        if (/^0x[a-fA-F0-9]{1,64}$/.test(trimmed) && trimmed.length <= 66) {
            return { type: 'address', confidence: 0.8 };
        }

        // Object ID: Similar to address but typically specific lengths
        if (/^0x[a-fA-F0-9]{1,64}$/.test(trimmed)) {
            return { type: 'object', confidence: 0.7 };
        }

        // If it starts with 0x but doesn't match patterns
        if (trimmed.startsWith('0x')) {
            return { type: 'unknown', confidence: 0.3 };
        }

        return { type: 'unknown', confidence: 0 };
    }
}

// ===== Search Manager =====
class SearchManager {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.searchSubmit = document.getElementById('searchSubmit');
        this.searchClear = document.getElementById('clearSearch');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.resultsSection = document.getElementById('resultsSection');
        this.noResults = document.getElementById('noResults');
        this.searchTypeDisplay = document.getElementById('searchTypeDisplay');
        this.searchTypeValue = document.getElementById('searchTypeValue');
        this.resultsList = document.getElementById('resultsList');
        this.resultsQuery = document.getElementById('resultsQuery');

        this.networks = ['mainnet', 'testnet', 'devnet'];
        this.explorers = {
            suiscan: {
                name: 'SuiScan',
                baseUrls: {
                    mainnet: 'https://suiscan.xyz/mainnet',
                    testnet: 'https://suiscan.xyz/testnet',
                    devnet: 'https://suiscan.xyz/devnet'
                }
            },
            suivision: {
                name: 'SuiVision',
                baseUrls: {
                    mainnet: 'https://suivision.xyz',
                    testnet: 'https://testnet.suivision.xyz',
                    devnet: 'https://devnet.suivision.xyz'
                }
            }
        };

        this.currentQuery = '';
        this.currentType = '';
        this.searchTimeout = null;

        this.init();
    }

    init() {
        // Search input events
        this.searchInput.addEventListener('input', () => this.onInputChange());
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Button events
        this.searchSubmit.addEventListener('click', () => this.performSearch());
        this.searchClear.addEventListener('click', () => this.clearSearch());

        // Explorer selection change
        document.addEventListener('change', (e) => {
            if (e.target.name === 'explorer' && this.currentQuery) {
                this.refreshResults();
            }
        });

        // Initial type detection
        this.onInputChange();
    }

    onInputChange() {
        clearTimeout(this.searchTimeout);
        
        const query = this.searchInput.value.trim();
        const detection = InputTypeDetector.detect(query);

        if (query && detection.type !== 'unknown') {
            this.searchTypeValue.textContent = `${detection.type} (${Math.round(detection.confidence * 100)}% confident)`;
            this.searchTypeDisplay.classList.add('visible');
            
            // Auto-search after typing stops for 1 second
            this.searchTimeout = setTimeout(() => {
                if (query.length >= 10) { // Only auto-search for longer inputs
                    this.performSearch();
                }
            }, 1000);
        } else if (query) {
            this.searchTypeValue.textContent = 'Unknown format';
            this.searchTypeDisplay.classList.add('visible');
        } else {
            this.searchTypeDisplay.classList.remove('visible');
        }
    }

    getSelectedExplorer() {
        const selected = document.querySelector('input[name="explorer"]:checked');
        return selected ? selected.value : 'suiscan';
    }

    clearSearch() {
        this.searchInput.value = '';
        this.searchInput.focus();
        this.currentQuery = '';
        this.currentType = '';
        this.hideAllSections();
        this.onInputChange();
        clearTimeout(this.searchTimeout);
    }

    async performSearch() {
        const query = this.searchInput.value.trim();
        
        if (!query) {
            window.toastManager.warning('Please enter a search query');
            return;
        }

        const detection = InputTypeDetector.detect(query);
        
        if (detection.type === 'unknown') {
            window.toastManager.error('Invalid format. Please enter a valid transaction hash, address, or object ID.');
            return;
        }

        this.currentQuery = query;
        this.currentType = detection.type;

        this.showLoading();
        this.hideAllSections();

        try {
            // Small delay to show loading animation
            await new Promise(resolve => setTimeout(resolve, 800));
            
            this.displayResults(query, detection.type);
            window.toastManager.success('Search completed successfully!');
        } catch (error) {
            console.error('Search error:', error);
            window.toastManager.error('Search failed. Please try again.');
            this.hideLoading();
        }
    }

    async refreshResults() {
        if (!this.currentQuery || !this.currentType) return;
        
        // Just refresh the iframes with new explorer
        this.resultsList.innerHTML = '';
        
        this.networks.forEach(network => {
            const resultElement = this.createResultElement({
                network,
                type: this.currentType,
                query: this.currentQuery
            });
            this.resultsList.appendChild(resultElement);
        });
    }

    displayResults(query, type) {
        this.hideLoading();
        this.resultsQuery.textContent = query;
        this.resultsList.innerHTML = '';

        // Create results for all networks
        this.networks.forEach(network => {
            const resultElement = this.createResultElement({
                network,
                type,
                query
            });
            this.resultsList.appendChild(resultElement);
        });

        this.resultsSection.classList.add('visible');
    }

    createResultElement(result) {
        const { network, type, query } = result;
        
        const resultDiv = document.createElement('div');
        resultDiv.className = 'result-item';
        
        const networkClass = network.toLowerCase();
        const typeClass = type.toLowerCase();
        
        resultDiv.innerHTML = `
            <div class="result-header">
                <div class="result-type-badge ${typeClass}">
                    <span class="badge-icon">${this.getTypeIcon(type)}</span>
                    ${type.charAt(0).toUpperCase() + type.slice(1)}
                </div>
                <div class="result-network">
                    <span class="network-badge ${networkClass}">${network.charAt(0).toUpperCase() + network.slice(1)}</span>
                </div>
            </div>
            <div class="iframe-container">
                <div class="iframe-loading">Loading ${network} results...</div>
                <iframe 
                    class="result-iframe" 
                    src="${this.buildExplorerUrl(type, query, network)}"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    referrerpolicy="no-referrer"
                    loading="lazy"
                ></iframe>
            </div>
        `;

        // Handle iframe load events
        const iframe = resultDiv.querySelector('.result-iframe');
        const loadingDiv = resultDiv.querySelector('.iframe-loading');
        
        iframe.addEventListener('load', () => {
            loadingDiv.style.display = 'none';
        });

        iframe.addEventListener('error', () => {
            loadingDiv.innerHTML = `
                <div class="iframe-error">
                    ❌ Failed to load ${network} results
                    <br>
                    <a href="${iframe.src}" target="_blank" style="color: var(--color-primary); text-decoration: underline;">
                        Open in new tab
                    </a>
                </div>
            `;
        });

        return resultDiv;
    }

    getTypeIcon(type) {
        const icons = {
            transaction: '📝',
            address: '👤',
            object: '📦'
        };
        return icons[type] || '🔍';
    }

    buildExplorerUrl(type, query, network) {
        const selectedExplorer = this.getSelectedExplorer();
        const explorer = this.explorers[selectedExplorer];
        
        if (!explorer || !explorer.baseUrls[network]) {
            return '#';
        }

        const baseUrl = explorer.baseUrls[network];
        
        // Build URLs based on explorer type and data type
        if (selectedExplorer === 'suiscan') {
            const paths = {
                transaction: '/tx/',
                address: '/account/',
                object: '/object/'
            };
            const path = paths[type] || '/search/';
            return `${baseUrl}${path}${encodeURIComponent(query)}`;
        } else if (selectedExplorer === 'suivision') {
            const paths = {
                transaction: '/txblock/',
                address: '/address/',
                object: '/object/'
            };
            const path = paths[type] || '/search/';
            return `${baseUrl}${path}${encodeURIComponent(query)}`;
        }
        
        return `${baseUrl}/search/${encodeURIComponent(query)}`;
    }

    showLoading() {
        this.loadingOverlay.classList.add('visible');
    }

    hideLoading() {
        this.loadingOverlay.classList.remove('visible');
    }

    showNoResults() {
        this.hideLoading();
        this.noResults.classList.add('visible');
    }

    hideAllSections() {
        this.resultsSection.classList.remove('visible');
        this.noResults.classList.remove('visible');
    }
}

// ===== Application Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize managers
    window.themeManager = new ThemeManager();
    window.toastManager = new ToastManager();
    window.searchManager = new SearchManager();

    // Welcome message
    console.log('🔍 SuiScope initialized - Simple Sui Network Search');
});

// ===== Utility Functions =====

// Copy to clipboard functionality
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text).then(() => {
            window.toastManager.success('Copied to clipboard');
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        window.toastManager.success('Copied to clipboard');
    } catch (err) {
        window.toastManager.error('Failed to copy to clipboard');
    }
    
    document.body.removeChild(textArea);
}

// Add copy functionality to result items
document.addEventListener('click', (e) => {
    if (e.target.closest('.result-query')) {
        const query = e.target.closest('.result-query').textContent.trim();
        copyToClipboard(query);
    }
});

// Handle external link clicks with analytics (optional)
document.addEventListener('click', (e) => {
    const link = e.target.closest('.explorer-link');
    if (link) {
        // Optional: Track external link clicks
        console.log('External explorer link clicked:', link.href);
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Focus search on '/' key
    if (e.key === '/' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
    
    // Clear search on 'Escape' key
    if (e.key === 'Escape' && document.activeElement === document.getElementById('searchInput')) {
        window.searchManager.clearSearch();
    }
});