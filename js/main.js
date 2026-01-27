/**
 * SuiScope - Multi-Network Sui Explorer Search
 * Simple tool to search across all Sui networks and external explorers
 */

class SuiScope {
    constructor() {
        this.searchInput = null;
        this.searchForm = null;
        this.searchButton = null;
        this.searchSpinner = null;
        this.searchText = null;
        this.typeIndicator = null;
        this.typeValue = null;
        this.resultsSection = null;
        this.resultsGrid = null;
        
        this.networks = ['mainnet', 'testnet', 'devnet'];
        this.explorers = [
            {
                name: 'SuiScan',
                domain: 'suiscan.xyz',
                mainnet: 'https://suiscan.xyz/mainnet',
                testnet: 'https://suiscan.xyz/testnet',
                devnet: 'https://suiscan.xyz/devnet'
            },
            {
                name: 'SuiVision', 
                domain: 'suivision.xyz',
                mainnet: 'https://suivision.xyz',
                testnet: 'https://testnet.suivision.xyz',
                devnet: 'https://devnet.suivision.xyz'
            }
        ];
        
        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.loadFromURL();
    }

    bindElements() {
        this.searchInput = document.getElementById('searchInput');
        this.searchForm = document.getElementById('searchForm');
        this.searchButton = document.getElementById('searchButton');
        this.searchSpinner = document.getElementById('searchSpinner');
        this.searchText = this.searchButton?.querySelector('.search-text');
        this.typeIndicator = document.getElementById('typeIndicator');
        this.typeValue = document.getElementById('typeValue');
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsGrid = document.getElementById('resultsGrid');
    }

    bindEvents() {
        // Search form submission
        this.searchForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch();
        });

        // Input type detection as user types
        this.searchInput?.addEventListener('input', (e) => {
            this.detectInputType(e.target.value);
        });

        // Clear type indicator when input is empty
        this.searchInput?.addEventListener('input', (e) => {
            if (!e.target.value.trim()) {
                this.hideTypeIndicator();
            }
        });

        // Load from URL parameters on page load
        this.loadFromURL();
    }

    /**
     * Detect what type of input the user has entered
     * @param {string} input - The user input
     * @returns {string|null} - The detected type or null
     */
    detectInputType(input) {
        const trimmed = input.trim();
        
        if (!trimmed) {
            this.hideTypeIndicator();
            return null;
        }

        let detectedType = null;
        
        // Transaction hash: 64 hex characters
        if (/^[a-fA-F0-9]{64}$/.test(trimmed)) {
            detectedType = 'Transaction Hash';
        }
        // Sui address: 0x followed by 40 hex characters
        else if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
            detectedType = 'Address';
        }
        // Object ID: 0x followed by hex characters (variable length, typically 64)
        else if (/^0x[a-fA-F0-9]{8,}$/.test(trimmed)) {
            detectedType = 'Object ID';
        }
        // Partial hex input starting with 0x
        else if (/^0x[a-fA-F0-9]*$/.test(trimmed) && trimmed.length > 2) {
            detectedType = 'Partial Input (keep typing...)';
        }
        // Raw hex (no 0x prefix) - suggest adding 0x
        else if (/^[a-fA-F0-9]{8,}$/.test(trimmed)) {
            detectedType = 'Raw Hex (try adding 0x prefix)';
        }

        if (detectedType) {
            this.showTypeIndicator(detectedType);
        } else {
            this.hideTypeIndicator();
        }

        return detectedType;
    }

    showTypeIndicator(type) {
        if (this.typeIndicator && this.typeValue) {
            this.typeValue.textContent = type;
            this.typeIndicator.style.display = 'flex';
        }
    }

    hideTypeIndicator() {
        if (this.typeIndicator) {
            this.typeIndicator.style.display = 'none';
        }
    }

    /**
     * Handle search submission
     */
    async handleSearch() {
        const query = this.searchInput?.value?.trim();
        
        if (!query) {
            this.showError('Please enter a transaction hash, address, or object ID');
            return;
        }

        const inputType = this.detectInputType(query);
        
        if (!inputType || inputType.includes('Partial') || inputType.includes('Raw Hex')) {
            this.showError('Please enter a complete and valid transaction hash, address, or object ID');
            return;
        }

        this.showLoading();
        this.updateURL(query);
        
        // Simulate search delay for better UX
        setTimeout(() => {
            this.displayResults(query, inputType);
            this.hideLoading();
        }, 500);
    }

    /**
     * Display search results from all networks and explorers
     * @param {string} query - The search query
     * @param {string} inputType - The detected input type
     */
    displayResults(query, inputType) {
        if (!this.resultsGrid) return;

        // Clear previous results
        this.resultsGrid.innerHTML = '';

        // Generate results for each network and explorer combination
        const results = [];

        this.networks.forEach(network => {
            this.explorers.forEach(explorer => {
                const url = this.buildExplorerURL(explorer, network, query, inputType);
                if (url) {
                    results.push({
                        explorer: explorer.name,
                        network: network,
                        url: url,
                        query: query,
                        type: inputType
                    });
                }
            });
        });

        if (results.length === 0) {
            this.showNoResults();
            return;
        }

        // Render results
        results.forEach(result => {
            const card = this.createResultCard(result);
            this.resultsGrid.appendChild(card);
        });

        // Show results section
        this.resultsSection.style.display = 'block';

        // Scroll to results
        this.resultsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    /**
     * Build URL for specific explorer, network, and query type
     * @param {Object} explorer - Explorer configuration
     * @param {string} network - Network name (mainnet/testnet/devnet)
     * @param {string} query - Search query
     * @param {string} inputType - Input type
     * @returns {string|null} - Generated URL or null if not supported
     */
    buildExplorerURL(explorer, network, query, inputType) {
        const baseUrl = explorer[network];
        if (!baseUrl) return null;

        // Determine the path based on input type and explorer
        let path = '';
        
        if (explorer.name === 'SuiScan') {
            switch (inputType) {
                case 'Transaction Hash':
                    path = `/tx/${query}`;
                    break;
                case 'Address':
                    path = `/account/${query}`;
                    break;
                case 'Object ID':
                    path = `/object/${query}`;
                    break;
                default:
                    return null;
            }
        } else if (explorer.name === 'SuiVision') {
            switch (inputType) {
                case 'Transaction Hash':
                    path = `/txblock/${query}`;
                    break;
                case 'Address':
                    path = `/address/${query}`;
                    break;
                case 'Object ID':
                    path = `/object/${query}`;
                    break;
                default:
                    return null;
            }
        }

        return baseUrl + path;
    }

    /**
     * Create a result card element
     * @param {Object} result - Result data
     * @returns {HTMLElement} - Result card element
     */
    createResultCard(result) {
        const card = document.createElement('a');
        card.className = 'result-card';
        card.href = result.url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';

        card.innerHTML = `
            <div class="result-header">
                <div class="result-explorer">${result.explorer}</div>
                <div class="result-network ${result.network}">${result.network}</div>
            </div>
            <div class="result-type">${result.type}</div>
            <div class="result-id">${this.truncateText(result.query, 50)}</div>
            <div class="result-action">
                View on ${result.explorer}
            </div>
        `;

        // Add click tracking (optional)
        card.addEventListener('click', () => {
            console.log(`Opening ${result.explorer} ${result.network} for ${result.type}: ${result.query}`);
        });

        return card;
    }

    /**
     * Truncate text for better display
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} - Truncated text
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        
        // For hashes and IDs, show start and end
        if (text.startsWith('0x') && text.length > 20) {
            const start = text.substring(0, 10);
            const end = text.substring(text.length - 6);
            return `${start}...${end}`;
        }
        
        return text.substring(0, maxLength - 3) + '...';
    }

    /**
     * Show loading state
     */
    showLoading() {
        if (this.searchButton) {
            this.searchButton.disabled = true;
        }
        if (this.searchText) {
            this.searchText.style.display = 'none';
        }
        if (this.searchSpinner) {
            this.searchSpinner.style.display = 'inline';
        }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        if (this.searchButton) {
            this.searchButton.disabled = false;
        }
        if (this.searchText) {
            this.searchText.style.display = 'inline';
        }
        if (this.searchSpinner) {
            this.searchSpinner.style.display = 'none';
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (!this.resultsGrid) return;

        this.resultsGrid.innerHTML = `
            <div class="error-message" style="grid-column: 1 / -1;">
                <div class="error-title">Invalid Input</div>
                <p>${message}</p>
            </div>
        `;

        this.resultsSection.style.display = 'block';
    }

    /**
     * Show no results message
     */
    showNoResults() {
        if (!this.resultsGrid) return;

        this.resultsGrid.innerHTML = `
            <div class="no-results" style="grid-column: 1 / -1;">
                <h3>Unable to Generate Explorer Links</h3>
                <p>Please check your input format and try again.</p>
            </div>
        `;

        this.resultsSection.style.display = 'block';
    }

    /**
     * Update URL with search query
     * @param {string} query - Search query
     */
    updateURL(query) {
        const url = new URL(window.location);
        if (query) {
            url.searchParams.set('q', query);
        } else {
            url.searchParams.delete('q');
        }
        window.history.pushState({}, '', url);
    }

    /**
     * Load search from URL parameters
     */
    loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        const query = params.get('q');
        
        if (query && this.searchInput) {
            this.searchInput.value = query;
            this.detectInputType(query);
            this.handleSearch();
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.suiScope = new SuiScope();
    console.log('🔍 SuiScope initialized - Multi-network Sui explorer search ready!');
});