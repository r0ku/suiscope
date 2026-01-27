/**
 * API module for SuiScope
 * Handles all blockchain data fetching
 */

class SuiAPI {
    constructor() {
        this.baseURL = 'https://fullnode.mainnet.sui.io:443';
        this.requestId = 1;
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30 seconds
    }

    // Generic RPC call method
    async rpcCall(method, params = []) {
        const requestBody = {
            jsonrpc: '2.0',
            id: this.requestId++,
            method,
            params
        };

        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message || 'API Error');
            }

            return data.result;
        } catch (error) {
            console.error('RPC call failed:', error);
            throw error;
        }
    }

    // Cache helper methods
    getCacheKey(method, params) {
        return `${method}:${JSON.stringify(params)}`;
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // Get system state and statistics
    async getSystemState() {
        const cacheKey = this.getCacheKey('sui_getSystemState', []);
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const result = await this.rpcCall('sui_getSystemState');
            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Failed to get system state:', error);
            return null;
        }
    }

    // Get total transaction count
    async getTotalTransactionBlocks() {
        try {
            const result = await this.rpcCall('sui_getTotalTransactionBlocks');
            return parseInt(result);
        } catch (error) {
            console.error('Failed to get total transaction blocks:', error);
            return 0;
        }
    }

    // Get latest transactions
    async getLatestTransactions(limit = 10) {
        const cacheKey = this.getCacheKey('getLatestTransactions', [limit]);
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const result = await this.rpcCall('suix_queryTransactionBlocks', [{
                filter: null,
                options: {
                    showInput: true,
                    showEffects: true,
                    showObjectChanges: false,
                    showBalanceChanges: false,
                    showEvents: false
                }
            }, null, limit, true]);

            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Failed to get latest transactions:', error);
            return { data: [], hasNextPage: false, nextCursor: null };
        }
    }

    // Search for transaction by digest
    async getTransaction(digest) {
        const cacheKey = this.getCacheKey('getTransaction', [digest]);
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const result = await this.rpcCall('sui_getTransactionBlock', [{
                digest,
                options: {
                    showInput: true,
                    showEffects: true,
                    showObjectChanges: true,
                    showBalanceChanges: true,
                    showEvents: true
                }
            }]);

            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Failed to get transaction:', error);
            throw error;
        }
    }

    // Get object information
    async getObject(objectId) {
        const cacheKey = this.getCacheKey('getObject', [objectId]);
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const result = await this.rpcCall('sui_getObject', [objectId, {
                showType: true,
                showOwner: true,
                showPreviousTransaction: true,
                showDisplay: false,
                showContent: true,
                showBcs: false,
                showStorageRebate: true
            }]);

            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Failed to get object:', error);
            throw error;
        }
    }

    // Get objects owned by address
    async getOwnedObjects(address, limit = 50) {
        const cacheKey = this.getCacheKey('getOwnedObjects', [address, limit]);
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const result = await this.rpcCall('suix_getOwnedObjects', [address, {
                filter: null,
                options: {
                    showType: true,
                    showOwner: true,
                    showPreviousTransaction: false,
                    showDisplay: false,
                    showContent: false,
                    showBcs: false,
                    showStorageRebate: false
                }
            }, null, limit]);

            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Failed to get owned objects:', error);
            return { data: [], hasNextPage: false, nextCursor: null };
        }
    }

    // Get balance for address
    async getBalance(address, coinType = '0x2::sui::SUI') {
        try {
            const result = await this.rpcCall('suix_getBalance', [address, coinType]);
            return result;
        } catch (error) {
            console.error('Failed to get balance:', error);
            return { coinType, coinObjectCount: 0, totalBalance: '0', lockedBalance: {} };
        }
    }

    // Get all balances for address
    async getAllBalances(address) {
        try {
            const result = await this.rpcCall('suix_getAllBalances', [address]);
            return result;
        } catch (error) {
            console.error('Failed to get all balances:', error);
            return [];
        }
    }

    // Search for transactions by address
    async getTransactionsByAddress(address, limit = 20) {
        const cacheKey = this.getCacheKey('getTransactionsByAddress', [address, limit]);
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const result = await this.rpcCall('suix_queryTransactionBlocks', [{
                filter: {
                    FromOrToAddress: {
                        addr: address
                    }
                },
                options: {
                    showInput: true,
                    showEffects: true,
                    showObjectChanges: false,
                    showBalanceChanges: true,
                    showEvents: false
                }
            }, null, limit, true]);

            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Failed to get transactions by address:', error);
            return { data: [], hasNextPage: false, nextCursor: null };
        }
    }

    // Universal search method
    async search(query) {
        const trimmed = query.trim();
        const type = SuiScopeUtils.detectSearchType(trimmed);

        const results = [];

        try {
            switch (type) {
                case 'transaction':
                    try {
                        const tx = await this.getTransaction(trimmed);
                        results.push({
                            type: 'transaction',
                            data: tx,
                            relevance: 100
                        });
                    } catch (e) {
                        // Transaction not found
                    }
                    break;

                case 'address':
                    try {
                        // Get balance and recent transactions
                        const [balance, transactions, objects] = await Promise.all([
                            this.getBalance(trimmed),
                            this.getTransactionsByAddress(trimmed, 5),
                            this.getOwnedObjects(trimmed, 10)
                        ]);

                        results.push({
                            type: 'address',
                            data: {
                                address: trimmed,
                                balance,
                                transactions,
                                objects
                            },
                            relevance: 100
                        });
                    } catch (e) {
                        console.error('Address search failed:', e);
                    }
                    break;

                case 'object':
                    try {
                        const obj = await this.getObject(trimmed);
                        results.push({
                            type: 'object',
                            data: obj,
                            relevance: 100
                        });
                    } catch (e) {
                        // Object not found
                    }
                    break;

                default:
                    // For unknown types, try partial matching
                    if (trimmed.length >= 6) {
                        // This would require indexing service in real implementation
                        // For now, return empty results
                    }
                    break;
            }
        } catch (error) {
            console.error('Search failed:', error);
        }

        return {
            query: trimmed,
            results,
            totalCount: results.length
        };
    }

    // Mock statistics for demo (replace with real API calls)
    async getNetworkStats() {
        try {
            const [totalTx, systemState] = await Promise.all([
                this.getTotalTransactionBlocks(),
                this.getSystemState()
            ]);

            // Mock some statistics (in real app, these would come from dedicated endpoints)
            const stats = {
                totalTransactions: totalTx || 150000000,
                totalObjects: 75000000,
                activeAddresses: 850000,
                networkTPS: Math.floor(Math.random() * 100) + 50 // Mock TPS
            };

            return stats;
        } catch (error) {
            console.error('Failed to get network stats:', error);
            return {
                totalTransactions: '-',
                totalObjects: '-',
                activeAddresses: '-',
                networkTPS: '-'
            };
        }
    }

    // Get transaction suggestions for search autocomplete
    async getSearchSuggestions(query) {
        if (query.length < 3) return [];

        const suggestions = [];

        // Add type-based suggestions
        const type = SuiScopeUtils.detectSearchType(query);
        
        switch (type) {
            case 'transaction':
                if (query.length >= 8) {
                    suggestions.push({
                        text: query,
                        type: 'Transaction',
                        icon: '📝'
                    });
                }
                break;
                
            case 'address':
                if (query.length >= 8) {
                    suggestions.push({
                        text: query,
                        type: 'Address',
                        icon: '👤'
                    });
                }
                break;
                
            case 'object':
                if (query.length >= 8) {
                    suggestions.push({
                        text: query,
                        type: 'Object',
                        icon: '🔷'
                    });
                }
                break;
                
            default:
                // Add general suggestions
                suggestions.push(
                    {
                        text: '0x' + query,
                        type: 'Address/Object',
                        icon: '🔍'
                    }
                );
                break;
        }

        return suggestions;
    }
}

// Create global API instance
window.SuiScopeAPI = new SuiAPI();