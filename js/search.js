// Search functionality
export class Search {
    constructor() {
        this.searchHistory = this.loadSearchHistory();
        this.searchCache = new Map();
        this.maxHistoryItems = 10;
    }

    // Get search suggestions based on query
    getSuggestions(query, data) {
        const lowerQuery = query.toLowerCase();
        
        // Check cache first
        if (this.searchCache.has(lowerQuery)) {
            return this.searchCache.get(lowerQuery);
        }

        const suggestions = [];

        // Search in songs
        data.forEach(track => {
            if (track.title.toLowerCase().includes(lowerQuery)) {
                suggestions.push({
                    type: 'song',
                    text: track.title,
                    subtitle: `by ${track.artist}`,
                    data: track
                });
            }
            
            if (track.artist.toLowerCase().includes(lowerQuery)) {
                suggestions.push({
                    type: 'artist',
                    text: track.artist,
                    subtitle: 'Artist',
                    data: track
                });
            }
            
            if (track.album.toLowerCase().includes(lowerQuery)) {
                suggestions.push({
                    type: 'album',
                    text: track.album,
                    subtitle: `Album by ${track.artist}`,
                    data: track
                });
            }
        });

        // Remove duplicates
        const uniqueSuggestions = suggestions.filter((item, index, self) => 
            index === self.findIndex(t => t.text === item.text && t.type === item.type)
        );

        // Limit to 8 suggestions
        const limitedSuggestions = uniqueSuggestions.slice(0, 8);

        // Cache the results
        this.searchCache.set(lowerQuery, limitedSuggestions);

        return limitedSuggestions;
    }

    // Perform search and return results
    search(query, data) {
        const lowerQuery = query.toLowerCase();
        
        // Add to search history
        this.addToHistory(query);
        
        const results = data.filter(track => {
            return track.title.toLowerCase().includes(lowerQuery) ||
                   track.artist.toLowerCase().includes(lowerQuery) ||
                   track.album.toLowerCase().includes(lowerQuery) ||
                   track.genre.toLowerCase().includes(lowerQuery);
        });

        return {
            query: query,
            results: results,
            count: results.length
        };
    }

    // Add query to search history
    addToHistory(query) {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return;

        // Remove if already exists
        this.searchHistory = this.searchHistory.filter(item => item !== trimmedQuery);
        
        // Add to beginning
        this.searchHistory.unshift(trimmedQuery);
        
        // Limit history size
        this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);
        
        // Save to localStorage
        this.saveSearchHistory();
    }

    // Get search history
    getHistory() {
        return this.searchHistory;
    }

    // Clear search history
    clearHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
    }

    // Load search history from localStorage
    loadSearchHistory() {
        try {
            const history = localStorage.getItem('justplay_search_history');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Error loading search history:', error);
            return [];
        }
    }

    // Save search history to localStorage
    saveSearchHistory() {
        try {
            localStorage.setItem('justplay_search_history', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    }

    // Clear search cache
    clearCache() {
        this.searchCache.clear();
    }

    // Get popular searches (mock data for now)
    getPopularSearches() {
        return [
            'Asake',
            'Burna Boy',
            'Rema',
            'Davido',
            'Afrobeats',
            'Sungba',
            'Calm Down',
            'Last Last'
        ];
    }

    // Advanced search with filters
    advancedSearch(query, data, filters = {}) {
        let results = this.search(query, data).results;

        // Apply genre filter
        if (filters.genre) {
            results = results.filter(track => track.genre === filters.genre);
        }

        // Apply mood filter
        if (filters.mood) {
            results = results.filter(track => track.mood === filters.mood);
        }

        // Apply date range filter
        if (filters.dateFrom || filters.dateTo) {
            results = results.filter(track => {
                const releaseDate = new Date(track.releaseDate);
                if (filters.dateFrom && releaseDate < new Date(filters.dateFrom)) {
                    return false;
                }
                if (filters.dateTo && releaseDate > new Date(filters.dateTo)) {
                    return false;
                }
                return true;
            });
        }

        // Apply duration filter
        if (filters.minDuration || filters.maxDuration) {
            results = results.filter(track => {
                if (filters.minDuration && track.duration < filters.minDuration) {
                    return false;
                }
                if (filters.maxDuration && track.duration > filters.maxDuration) {
                    return false;
                }
                return true;
            });
        }

        return {
            query: query,
            results: results,
            count: results.length,
            filters: filters
        };
    }

    // Search suggestions with history
    getSuggestionsWithHistory(query, data) {
        const suggestions = this.getSuggestions(query, data);
        
        if (query.length === 0) {
            // Return search history and popular searches when no query
            const history = this.getHistory().slice(0, 5);
            const popular = this.getPopularSearches().slice(0, 5);
            
            return [
                ...history.map(item => ({
                    type: 'history',
                    text: item,
                    subtitle: 'Recent search',
                    data: null
                })),
                ...popular.map(item => ({
                    type: 'popular',
                    text: item,
                    subtitle: 'Popular search',
                    data: null
                }))
            ];
        }
        
        return suggestions;
    }
}
