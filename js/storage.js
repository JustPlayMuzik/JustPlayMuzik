// Local storage management
export class Storage {
    constructor() {
        this.storagePrefix = 'justplay_';
        this.keys = {
            favorites: 'favorites',
            playlists: 'playlists',
            userPreferences: 'user_preferences',
            playHistory: 'play_history',
            downloads: 'downloads'
        };
    }

    // Generic storage methods
    setItem(key, value) {
        try {
            localStorage.setItem(this.storagePrefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    getItem(key) {
        try {
            const item = localStorage.getItem(this.storagePrefix + key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    removeItem(key) {
        try {
            localStorage.removeItem(this.storagePrefix + key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }

    // Favorites management
    getFavorites() {
        return this.getItem(this.keys.favorites) || [];
    }

    addToFavorites(trackId) {
        const favorites = this.getFavorites();
        if (!favorites.includes(trackId)) {
            favorites.push(trackId);
            this.setItem(this.keys.favorites, favorites);
            return true;
        }
        return false;
    }

    removeFromFavorites(trackId) {
        const favorites = this.getFavorites();
        const index = favorites.indexOf(trackId);
        if (index > -1) {
            favorites.splice(index, 1);
            this.setItem(this.keys.favorites, favorites);
            return true;
        }
        return false;
    }

    isFavorite(trackId) {
        const favorites = this.getFavorites();
        return favorites.includes(trackId);
    }

    // Playlists management
    getPlaylists() {
        return this.getItem(this.keys.playlists) || [];
    }

    createPlaylist(name, description = '') {
        const playlists = this.getPlaylists();
        const playlist = {
            id: this.generateId(),
            name: name,
            description: description,
            tracks: [],
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };
        
        playlists.push(playlist);
        this.setItem(this.keys.playlists, playlists);
        return playlist;
    }

    updatePlaylist(playlistId, updates) {
        const playlists = this.getPlaylists();
        const index = playlists.findIndex(p => p.id === playlistId);
        
        if (index > -1) {
            playlists[index] = {
                ...playlists[index],
                ...updates,
                updated: new Date().toISOString()
            };
            this.setItem(this.keys.playlists, playlists);
            return playlists[index];
        }
        return null;
    }

    deletePlaylist(playlistId) {
        const playlists = this.getPlaylists();
        const index = playlists.findIndex(p => p.id === playlistId);
        
        if (index > -1) {
            playlists.splice(index, 1);
            this.setItem(this.keys.playlists, playlists);
            return true;
        }
        return false;
    }

    addTrackToPlaylist(playlistId, trackId) {
        const playlists = this.getPlaylists();
        const playlist = playlists.find(p => p.id === playlistId);
        
        if (playlist && !playlist.tracks.includes(trackId)) {
            playlist.tracks.push(trackId);
            playlist.updated = new Date().toISOString();
            this.setItem(this.keys.playlists, playlists);
            return true;
        }
        return false;
    }

    removeTrackFromPlaylist(playlistId, trackId) {
        const playlists = this.getPlaylists();
        const playlist = playlists.find(p => p.id === playlistId);
        
        if (playlist) {
            const index = playlist.tracks.indexOf(trackId);
            if (index > -1) {
                playlist.tracks.splice(index, 1);
                playlist.updated = new Date().toISOString();
                this.setItem(this.keys.playlists, playlists);
                return true;
            }
        }
        return false;
    }

    // Play history management
    getPlayHistory() {
        return this.getItem(this.keys.playHistory) || [];
    }

    addToPlayHistory(trackId) {
        const history = this.getPlayHistory();
        const entry = {
            trackId: trackId,
            playedAt: new Date().toISOString()
        };
        
        // Remove existing entry for this track
        const existingIndex = history.findIndex(h => h.trackId === trackId);
        if (existingIndex > -1) {
            history.splice(existingIndex, 1);
        }
        
        // Add to beginning
        history.unshift(entry);
        
        // Keep only last 100 entries
        history.splice(100);
        
        this.setItem(this.keys.playHistory, history);
    }

    getRecentlyPlayed(limit = 10) {
        const history = this.getPlayHistory();
        return history.slice(0, limit);
    }

    // User preferences management
    getUserPreferences() {
        return this.getItem(this.keys.userPreferences) || {
            theme: 'dark',
            volume: 0.7,
            autoplay: true,
            shuffle: false,
            repeat: 'none', // 'none', 'one', 'all'
            quality: 'high'
        };
    }

    updateUserPreferences(preferences) {
        const current = this.getUserPreferences();
        const updated = { ...current, ...preferences };
        this.setItem(this.keys.userPreferences, updated);
        return updated;
    }

    // Downloads management
    getDownloads() {
        return this.getItem(this.keys.downloads) || [];
    }

    addToDownloads(trackId) {
        const downloads = this.getDownloads();
        const entry = {
            trackId: trackId,
            downloadedAt: new Date().toISOString()
        };
        
        if (!downloads.find(d => d.trackId === trackId)) {
            downloads.push(entry);
            this.setItem(this.keys.downloads, downloads);
            return true;
        }
        return false;
    }

    removeFromDownloads(trackId) {
        const downloads = this.getDownloads();
        const index = downloads.findIndex(d => d.trackId === trackId);
        
        if (index > -1) {
            downloads.splice(index, 1);
            this.setItem(this.keys.downloads, downloads);
            return true;
        }
        return false;
    }

    isDownloaded(trackId) {
        const downloads = this.getDownloads();
        return downloads.some(d => d.trackId === trackId);
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    clearAllData() {
        const keys = Object.values(this.keys);
        keys.forEach(key => this.removeItem(key));
    }

    exportData() {
        const data = {};
        Object.values(this.keys).forEach(key => {
            data[key] = this.getItem(key);
        });
        return data;
    }

    importData(data) {
        Object.keys(data).forEach(key => {
            if (Object.values(this.keys).includes(key)) {
                this.setItem(key, data[key]);
            }
        });
    }

    // Storage info
    getStorageInfo() {
        let totalSize = 0;
        const itemSizes = {};
        
        Object.values(this.keys).forEach(key => {
            const item = localStorage.getItem(this.storagePrefix + key);
            if (item) {
                const size = new Blob([item]).size;
                itemSizes[key] = size;
                totalSize += size;
            }
        });
        
        return {
            totalSize: totalSize,
            itemSizes: itemSizes,
            maxSize: 5 * 1024 * 1024 // 5MB typical localStorage limit
        };
    }
}
