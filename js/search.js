/**
 * Search functionality for SuiScope
 */

class SearchManager {
    constructor() {
        this.searchForm = null;
        this.searchInput = null;
        this.searchButton = null;
        this.suggestionsContainer = null;
        this.resultsSection = null;
        this.resultsList = null;
        this.resultsCount = null;
        this.loadingOverlay = null;
        
        this.currentQuery = '';
        this.currentResults = [];
        this.currentPage = 1;
        this.resultsPerPage = 10;
        this.activeFilter = 'all';
        
        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.loadInitialParams();
    }

    bindElements() {
        const { $ } = SuiScopeUtils;
        
        this.searchForm = $('#searchForm');
        this.searchInput = $('#searchInput');
        this.searchButton = this.searchForm?.querySelector('.search-button');
        this.suggestionsContainer = $('#searchSuggestions');
        this.resultsSection = $('#resultsSection');
        this.resultsList = $('#resultsList');
        this.resultsCount = $('#resultsCount');
        this.loadingOverlay = $('#loadingOverlay');
    }

    bindEvents() {
        if (!this.searchForm) return;

        // Search form submission
        this.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch();
        });

        // Search input events
        if (this.searchInput) {
            // Debounced suggestions
            const debouncedSuggestions = SuiScopeUtils.debounce((value) => {
                this.updateSuggestions(value);
            }, 300);

            this.searchInput.addEventListener('input', (e) => {
                debouncedSuggestions(e.target.value);
            });

            this.searchInput.addEventListener('focus', (e) => {
                if (e.target.value.trim()) {
                    this.updateSuggestions(e.target.value);
                }
            });

            this.searchInput.addEventListener('blur', () => {
                // Hide suggestions after a delay to allow for clicks
                setTimeout(() => {
                    this.hideSuggestions();
                }, 200);
            });

            // Handle keyboard navigation
            this.searchInput.addEventListener('keydown', (e) => {
                this.handleKeyNavigation(e);
            });
        }

        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-button');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.setActiveFilter(button.dataset.filter);
            });
        });

        // Pagination
        const prevButton = document.getElementById('prevPage');
        const nextButton = document.getElementById('nextPage');
        
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                this.previousPage();
            });
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                this.nextPage();
            });
        }

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.searchForm?.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    }

    loadInitialParams() {
        const params = SuiScopeUtils.getURLParams();
        
        if (params.q) {
            this.searchInput.value = params.q;
            this.handleSearch(params.q);
        }
        
        if (params.filter) {
            this.setActiveFilter(params.filter);
        }
    }

    async handleSearch(query = null) {
        const searchQuery = query || this.searchInput?.value?.trim();
        
        if (!searchQuery) {
            SuiScopeUtils.showNotification('Please enter a search term', 'error');
            return;
        }

        this.currentQuery = searchQuery;
        this.currentPage = 1;
        
        // Update URL
        SuiScopeUtils.updateURL({ q: searchQuery, filter: this.activeFilter });
        
        // Show loading
        this.showLoading();
        
        try {
            const searchResults = await SuiScopeAPI.search(searchQuery);
            this.currentResults = searchResults.results || [];
            
            this.hideLoading();
            this.displayResults();
            
            if (this.currentResults.length === 0) {
                this.showNoResults();
            }
            
        } catch (error) {
            console.error('Search failed:', error);
            this.hideLoading();
            this.showError('Search failed. Please try again.');
        }
    }

    async updateSuggestions(query) {
        if (!query || query.length < 2) {
            this.hideSuggestions();
            return;
        }

        try {
            const suggestions = await SuiScopeAPI.getSearchSuggestions(query);
            this.displaySuggestions(suggestions);
        } catch (error) {
            console.error('Failed to get suggestions:', error);
        }
    }

    displaySuggestions(suggestions) {
        if (!this.suggestionsContainer || suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        const html = suggestions.map(suggestion => `
            <div class="suggestion-item" data-value="${suggestion.text}">
                <span class="suggestion-icon">${suggestion.icon}</span>
                <span class="suggestion-text">${SuiScopeUtils.truncateText(suggestion.text, 50)}</span>
                <span class="suggestion-type">${suggestion.type}</span>
            </div>
        `).join('');

        this.suggestionsContainer.innerHTML = html;
        this.suggestionsContainer.classList.add('visible');

        // Add click events to suggestions
        this.suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectSuggestion(item.dataset.value);
            });
        });
    }

    hideSuggestions() {
        if (this.suggestionsContainer) {
            this.suggestionsContainer.classList.remove('visible');
        }
    }

    selectSuggestion(value) {
        if (this.searchInput) {
            this.searchInput.value = value;
            this.hideSuggestions();
            this.handleSearch(value);
        }
    }

    handleKeyNavigation(e) {
        const suggestions = this.suggestionsContainer?.querySelectorAll('.suggestion-item');
        if (!suggestions || suggestions.length === 0) return;

        const currentActive = this.suggestionsContainer.querySelector('.suggestion-item.active');
        let activeIndex = currentActive ? Array.from(suggestions).indexOf(currentActive) : -1;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                activeIndex = (activeIndex + 1) % suggestions.length;
                break;
            case 'ArrowUp':
                e.preventDefault();
                activeIndex = activeIndex <= 0 ? suggestions.length - 1 : activeIndex - 1;
                break;
            case 'Enter':
                if (currentActive) {
                    e.preventDefault();
                    this.selectSuggestion(currentActive.dataset.value);
                    return;
                }
                break;
            case 'Escape':
                this.hideSuggestions();
                return;
            default:
                return;
        }

        // Update active suggestion
        suggestions.forEach((item, index) => {
            item.classList.toggle('active', index === activeIndex);
        });
    }

    displayResults() {
        if (!this.resultsSection || !this.resultsList) return;

        const filteredResults = this.getFilteredResults();
        const paginatedResults = this.getPaginatedResults(filteredResults);

        // Update results count
        this.updateResultsCount(filteredResults.length);

        // Show results section
        this.resultsSection.style.display = 'block';

        // Render results
        this.resultsList.innerHTML = paginatedResults.map(result => {
            return this.renderResultItem(result);
        }).join('');

        // Add click events to results
        this.bindResultEvents();

        // Update pagination
        this.updatePagination(filteredResults.length);

        // Scroll to results
        this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    renderResultItem(result) {
        const { type, data } = result;

        switch (type) {
            case 'transaction':
                return this.renderTransactionResult(data);
            case 'address':
                return this.renderAddressResult(data);
            case 'object':
                return this.renderObjectResult(data);
            default:
                return this.renderGenericResult(result);
        }
    }

    renderTransactionResult(tx) {
        const digest = tx.digest;
        const timestamp = parseInt(tx.timestampMs) || Date.now();
        const success = tx.effects?.status?.status === 'success';

        return `
            <div class="result-item" data-type="transaction" data-id="${digest}">
                <div class="result-header">
                    <div class="result-type">
                        📝 Transaction
                    </div>
                    <div class="result-timestamp">${SuiScopeUtils.formatRelativeTime(timestamp)}</div>
                </div>
                <div class="result-title">${SuiScopeUtils.truncateHash(digest)}</div>
                <div class="result-summary">
                    Transaction ${success ? 'executed successfully' : 'failed'}
                </div>
                <div class="result-details">
                    <div class="result-detail">
                        <span class="result-detail-label">Status</span>
                        <span class="result-detail-value">
                            <span class="status-badge ${success ? 'success' : 'failed'}">
                                <span class="status-dot"></span>
                                ${success ? 'Success' : 'Failed'}
                            </span>
                        </span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Gas Used</span>
                        <span class="result-detail-value">${SuiScopeUtils.formatNumber(tx.effects?.gasUsed?.computationCost || 0)}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Objects Changed</span>
                        <span class="result-detail-value">${tx.effects?.mutated?.length || 0}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderAddressResult(addressData) {
        const { address, balance, transactions, objects } = addressData;
        const suiBalance = parseInt(balance.totalBalance) / 1000000000; // Convert from MIST to SUI

        return `
            <div class="result-item" data-type="address" data-id="${address}">
                <div class="result-header">
                    <div class="result-type">
                        👤 Address
                    </div>
                </div>
                <div class="result-title">${SuiScopeUtils.truncateHash(address)}</div>
                <div class="result-summary">
                    Sui Address with ${SuiScopeUtils.formatNumber(suiBalance)} SUI
                </div>
                <div class="result-details">
                    <div class="result-detail">
                        <span class="result-detail-label">SUI Balance</span>
                        <span class="result-detail-value">${SuiScopeUtils.formatNumber(suiBalance.toFixed(2))} SUI</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Objects Owned</span>
                        <span class="result-detail-value">${objects.data?.length || 0}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Recent Transactions</span>
                        <span class="result-detail-value">${transactions.data?.length || 0}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderObjectResult(obj) {
        const objectId = obj.data?.objectId;
        const type = obj.data?.type || 'Unknown';
        const owner = obj.data?.owner;

        return `
            <div class="result-item" data-type="object" data-id="${objectId}">
                <div class="result-header">
                    <div class="result-type">
                        🔷 Object
                    </div>
                </div>
                <div class="result-title">${SuiScopeUtils.truncateHash(objectId)}</div>
                <div class="result-summary">
                    ${SuiScopeUtils.truncateText(type, 80)}
                </div>
                <div class="result-details">
                    <div class="result-detail">
                        <span class="result-detail-label">Type</span>
                        <span class="result-detail-value">${SuiScopeUtils.truncateText(type, 30)}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Owner</span>
                        <span class="result-detail-value">
                            ${owner?.AddressOwner ? SuiScopeUtils.truncateHash(owner.AddressOwner) : 
                              owner?.ObjectOwner ? 'Object' : 
                              owner?.Shared ? 'Shared' : 
                              'Immutable'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    renderGenericResult(result) {
        return `
            <div class="result-item" data-type="${result.type}">
                <div class="result-header">
                    <div class="result-type">
                        🔍 ${result.type}
                    </div>
                </div>
                <div class="result-title">Search Result</div>
                <div class="result-summary">
                    ${JSON.stringify(result.data).substring(0, 100)}...
                </div>
            </div>
        `;
    }

    bindResultEvents() {
        const resultItems = this.resultsList?.querySelectorAll('.result-item');
        
        resultItems?.forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                const id = item.dataset.id;
                
                if (id) {
                    this.openResultDetails(type, id);
                }
            });

            // Add copy functionality to hash elements
            const title = item.querySelector('.result-title');
            if (title) {
                title.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const success = await SuiScopeUtils.copyToClipboard(title.textContent);
                    if (success) {
                        SuiScopeUtils.showNotification('Copied to clipboard', 'success');
                    }
                });
            }
        });
    }

    openResultDetails(type, id) {
        // In a real application, this would open a detailed view
        // For now, we'll show a notification
        SuiScopeUtils.showNotification(`Opening ${type}: ${SuiScopeUtils.truncateHash(id)}`, 'info');
        
        // You could navigate to a detail page:
        // window.location.href = `/${type}/${id}`;
    }

    getFilteredResults() {
        if (this.activeFilter === 'all') {
            return this.currentResults;
        }
        
        return this.currentResults.filter(result => {
            switch (this.activeFilter) {
                case 'transactions':
                    return result.type === 'transaction';
                case 'addresses':
                    return result.type === 'address';
                case 'objects':
                    return result.type === 'object';
                case 'packages':
                    return result.type === 'package';
                default:
                    return true;
            }
        });
    }

    getPaginatedResults(results) {
        const startIndex = (this.currentPage - 1) * this.resultsPerPage;
        const endIndex = startIndex + this.resultsPerPage;
        return results.slice(startIndex, endIndex);
    }

    setActiveFilter(filter) {
        this.activeFilter = filter;
        
        // Update filter buttons
        const filterButtons = document.querySelectorAll('.filter-button');
        filterButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.filter === filter);
        });
        
        // Reset page and update results
        this.currentPage = 1;
        
        if (this.currentResults.length > 0) {
            this.displayResults();
        }
        
        // Update URL
        SuiScopeUtils.updateURL({ filter: filter !== 'all' ? filter : null });
    }

    updateResultsCount(count) {
        if (this.resultsCount) {
            this.resultsCount.textContent = `${count} result${count !== 1 ? 's' : ''}`;
        }
    }

    updatePagination(totalResults) {
        const totalPages = Math.ceil(totalResults / this.resultsPerPage);
        const paginationInfo = document.getElementById('paginationInfo');
        const prevButton = document.getElementById('prevPage');
        const nextButton = document.getElementById('nextPage');
        const pagination = document.getElementById('resultsPagination');

        if (totalPages <= 1) {
            if (pagination) pagination.style.display = 'none';
            return;
        }

        if (pagination) pagination.style.display = 'flex';
        
        if (paginationInfo) {
            paginationInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
        }
        
        if (prevButton) {
            prevButton.disabled = this.currentPage <= 1;
        }
        
        if (nextButton) {
            nextButton.disabled = this.currentPage >= totalPages;
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.displayResults();
        }
    }

    nextPage() {
        const filteredResults = this.getFilteredResults();
        const totalPages = Math.ceil(filteredResults.length / this.resultsPerPage);
        
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.displayResults();
        }
    }

    showLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'flex';
        }
        
        if (this.searchButton) {
            this.searchButton.disabled = true;
            this.searchButton.textContent = 'Searching...';
        }
    }

    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'none';
        }
        
        if (this.searchButton) {
            this.searchButton.disabled = false;
            this.searchButton.innerHTML = `
                <svg class="search-icon" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
                    <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2"/>
                </svg>
                Search
            `;
        }
    }

    showNoResults() {
        if (this.resultsList) {
            this.resultsList.innerHTML = `
                <div class="error-message">
                    <div class="error-icon">🔍</div>
                    <h3 class="error-title">No Results Found</h3>
                    <p class="error-description">
                        We couldn't find anything matching "${this.currentQuery}". 
                        Try a different search term or check your input format.
                    </p>
                </div>
            `;
        }
        
        if (this.resultsSection) {
            this.resultsSection.style.display = 'block';
        }
    }

    showError(message) {
        if (this.resultsList) {
            this.resultsList.innerHTML = SuiScopeUtils.createErrorElement(
                message, 
                true, 
                () => this.handleSearch()
            ).outerHTML;
        }
        
        if (this.resultsSection) {
            this.resultsSection.style.display = 'block';
        }
        
        SuiScopeUtils.showNotification(message, 'error');
    }
}

// Initialize search manager when DOM is ready
SuiScopeUtils.ready(() => {
    window.searchManager = new SearchManager();
});