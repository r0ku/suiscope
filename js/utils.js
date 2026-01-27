/**
 * Utility functions for SuiScope
 */

// DOM utility functions
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => parent.querySelectorAll(selector);

// Wait for DOM to be ready
const ready = (fn) => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
};

// Debounce function for search input
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Throttle function for scroll events
const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
};

// Format numbers with commas
const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '-';
    return num.toLocaleString();
};

// Format large numbers with K/M/B suffixes
const formatLargeNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '-';
    
    const absNum = Math.abs(num);
    
    if (absNum >= 1e9) {
        return (num / 1e9).toFixed(1) + 'B';
    } else if (absNum >= 1e6) {
        return (num / 1e6).toFixed(1) + 'M';
    } else if (absNum >= 1e3) {
        return (num / 1e3).toFixed(1) + 'K';
    }
    
    return formatNumber(num);
};

// Format timestamp to relative time
const formatRelativeTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
        return 'Just now';
    }
};

// Format timestamp to human readable date
const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Truncate text with ellipsis
const truncateText = (text, maxLength = 50) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// Truncate hash/address in the middle
const truncateHash = (hash, startLength = 6, endLength = 6) => {
    if (!hash || hash.length <= startLength + endLength) return hash;
    return `${hash.substring(0, startLength)}...${hash.substring(hash.length - endLength)}`;
};

// Validate if string is a valid hash (64 hex characters)
const isValidHash = (str) => {
    return /^[a-fA-F0-9]{64}$/.test(str);
};

// Validate if string is a valid Sui address
const isValidSuiAddress = (str) => {
    return /^0x[a-fA-F0-9]{40}$/.test(str);
};

// Detect search input type
const detectSearchType = (input) => {
    const trimmed = input.trim();
    
    if (isValidHash(trimmed)) {
        return 'transaction';
    } else if (isValidSuiAddress(trimmed)) {
        return 'address';
    } else if (trimmed.startsWith('0x') && trimmed.length > 2) {
        return 'object';
    } else {
        return 'unknown';
    }
};

// Copy text to clipboard
const copyToClipboard = async (text) => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        }
    } catch (err) {
        console.error('Failed to copy text: ', err);
        return false;
    }
};

// Show notification/toast
const showNotification = (message, type = 'info', duration = 3000) => {
    // Remove existing notifications
    const existing = $('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
        <div class="notification__content">
            <span class="notification__message">${message}</span>
            <button class="notification__close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        transform: translateX(100%);
        transition: transform 0.3s ease-in-out;
        max-width: 400px;
        font-size: 14px;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Add close functionality
    const closeBtn = notification.querySelector('.notification__close');
    const close = () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    };
    
    closeBtn.addEventListener('click', close);
    
    // Auto-close
    if (duration > 0) {
        setTimeout(close, duration);
    }
};

// Create loading state
const createLoadingElement = (text = 'Loading...') => {
    const loading = document.createElement('div');
    loading.className = 'loading-state';
    loading.innerHTML = `
        <div class="loading-spinner"></div>
        <p>${text}</p>
    `;
    loading.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        color: var(--text-muted);
    `;
    return loading;
};

// Create error state
const createErrorElement = (message = 'Something went wrong', showRetry = false, onRetry = null) => {
    const error = document.createElement('div');
    error.className = 'error-state';
    error.innerHTML = `
        <div class="error-icon">⚠️</div>
        <h3 class="error-title">Oops!</h3>
        <p class="error-description">${message}</p>
        ${showRetry ? '<button class="retry-button">Try Again</button>' : ''}
    `;
    
    if (showRetry && onRetry) {
        const retryBtn = error.querySelector('.retry-button');
        retryBtn.addEventListener('click', onRetry);
    }
    
    return error;
};

// URL management
const updateURL = (params) => {
    const url = new URL(window.location);
    Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
            url.searchParams.set(key, params[key]);
        } else {
            url.searchParams.delete(key);
        }
    });
    window.history.replaceState({}, '', url);
};

const getURLParams = () => {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
};

// Local storage helpers
const storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    },
    
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('Failed to read from localStorage:', e);
            return defaultValue;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('Failed to remove from localStorage:', e);
        }
    }
};

// Export utilities
window.SuiScopeUtils = {
    $,
    $$,
    ready,
    debounce,
    throttle,
    formatNumber,
    formatLargeNumber,
    formatRelativeTime,
    formatDate,
    truncateText,
    truncateHash,
    isValidHash,
    isValidSuiAddress,
    detectSearchType,
    copyToClipboard,
    showNotification,
    createLoadingElement,
    createErrorElement,
    updateURL,
    getURLParams,
    storage
};