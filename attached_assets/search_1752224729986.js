// Search functionality module
export class Search {
    constructor() {
        this.searchCache = new Map();
    }

    search(query, data) {
        const normalizedQuery = query.toLowerCase().trim();
        
        if (this.searchCache.has(normalizedQuery)) {
            return this.searchCache.get(normalizedQuery);
        }

        const results = this.performSearch(normalizedQuery, data);
        this.searchCache.set(normalizedQuery, results);
        
        return results;
    }

    performSearch(query, data) {
        const results = [];
        const words = query.split(' ').filter(word => word.length > 0);

        for (const track of data) {
            const score = this.calculateScore(track, words);
            if (score > 0) {
                results.push({ ...track, score });
            }
        }

        // Sort by relevance score (higher is better)
        return results.sort((a, b) => b.score - a.score);
    }

    calculateScore(track, words) {
        let score = 0;
        const trackText = `${track.title} ${track.artist} ${track.album || ''} ${track.genre}`.toLowerCase();

        for (const word of words) {
            // Exact matches in title get highest score
            if (track.title.toLowerCase().includes(word)) {
                score += 100;
                if (track.title.toLowerCase().startsWith(word)) {
                    score += 50; // Bonus for starting with search term
                }
            }

            // Artist matches get high score
            if (track.artist.toLowerCase().includes(word)) {
                score += 80;
                if (track.artist.toLowerCase().startsWith(word)) {
                    score += 40;
                }
            }

            // Album matches get medium score
            if (track.album && track.album.toLowerCase().includes(word)) {
                score += 40;
            }

            // Genre matches get lower score
            if (track.genre.toLowerCase().includes(word)) {
                score += 20;
            }

            // General text search
            if (trackText.includes(word)) {
                score += 10;
            }
        }

        return score;
    }

    getSuggestions(query, data) {
        const normalizedQuery = query.toLowerCase().trim();
        const suggestions = [];
        const maxSuggestions = 5;

        // Get track suggestions
        const trackMatches = data.filter(track => 
            track.title.toLowerCase().includes(normalizedQuery) ||
            track.artist.toLowerCase().includes(normalizedQuery)
        ).slice(0, 3);

        for (const track of trackMatches) {
            suggestions.push({
                type: 'track',
                id: track.id,
                title: track.title,
                subtitle: `by ${track.artist}`
            });
        }

        // Get artist suggestions
        const artists = [...new Set(data.map(track => track.artist))];
        const artistMatches = artists.filter(artist =>
            artist.toLowerCase().includes(normalizedQuery)
        ).slice(0, 2);

        for (const artist of artistMatches) {
            suggestions.push({
                type: 'artist',
                id: artist,
                title: artist,
                subtitle: 'Artist'
            });
        }

        return suggestions.slice(0, maxSuggestions);
    }

    getSearchHistory() {
        try {
            return JSON.parse(localStorage.getItem('searchHistory') || '[]');
        } catch {
            return [];
        }
    }

    addToSearchHistory(query) {
        if (!query.trim()) return;

        const history = this.getSearchHistory();
        const normalizedQuery = query.trim();

        // Remove existing entry if it exists
        const existingIndex = history.indexOf(normalizedQuery);
        if (existingIndex > -1) {
            history.splice(existingIndex, 1);
        }

        // Add to beginning
        history.unshift(normalizedQuery);

        // Keep only last 10 searches
        const trimmedHistory = history.slice(0, 10);

        try {
            localStorage.setItem('searchHistory', JSON.stringify(trimmedHistory));
        } catch (error) {
            console.warn('Could not save search history:', error);
        }
    }

    clearSearchHistory() {
        try {
            localStorage.removeItem('searchHistory');
        } catch (error) {
            console.warn('Could not clear search history:', error);
        }
    }

    // Advanced search with filters
    advancedSearch(query, data, filters = {}) {
        let results = this.search(query, data);

        // Apply genre filter
        if (filters.genre && filters.genre !== 'all') {
            results = results.filter(track => track.genre === filters.genre);
        }

        // Apply mood filter
        if (filters.mood && filters.mood !== 'all') {
            results = results.filter(track => track.mood === filters.mood);
        }

        // Apply duration filter
        if (filters.minDuration) {
            results = results.filter(track => track.duration >= filters.minDuration);
        }

        if (filters.maxDuration) {
            results = results.filter(track => track.duration <= filters.maxDuration);
        }

        // Apply date filter
        if (filters.dateFrom) {
            results = results.filter(track => 
                new Date(track.releaseDate) >= new Date(filters.dateFrom)
            );
        }

        if (filters.dateTo) {
            results = results.filter(track => 
                new Date(track.releaseDate) <= new Date(filters.dateTo)
            );
        }

        return results;
    }

    // Search autocomplete
    getAutocompleteSuggestions(query, data) {
        const normalizedQuery = query.toLowerCase().trim();
        const suggestions = new Set();

        // Add title completions
        data.forEach(track => {
            const title = track.title.toLowerCase();
            if (title.startsWith(normalizedQuery)) {
                suggestions.add(track.title);
            }
        });

        // Add artist completions
        data.forEach(track => {
            const artist = track.artist.toLowerCase();
            if (artist.startsWith(normalizedQuery)) {
                suggestions.add(track.artist);
            }
        });

        return Array.from(suggestions).slice(0, 5);
    }

    // Fuzzy search for typos
    fuzzySearch(query, data, threshold = 0.6) {
        const results = [];
        const normalizedQuery = query.toLowerCase().trim();

        for (const track of data) {
            const titleSimilarity = this.calculateSimilarity(normalizedQuery, track.title.toLowerCase());
            const artistSimilarity = this.calculateSimilarity(normalizedQuery, track.artist.toLowerCase());
            
            const maxSimilarity = Math.max(titleSimilarity, artistSimilarity);
            
            if (maxSimilarity >= threshold) {
                results.push({ ...track, similarity: maxSimilarity });
            }
        }

        return results.sort((a, b) => b.similarity - a.similarity);
    }

    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) {
            return 1.0;
        }
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }
}
