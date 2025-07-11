// Local storage management module
export class Storage {
    constructor() {
        this.keys = {
            favorites: 'justplay_favorites',
            playlists: 'justplay_playlists',
            settings: 'justplay_settings',
            history: 'justplay_history',
            user: 'justplay_user'
        };
        
        this.initializeDefaults();
    }

    initializeDefaults() {
        // Initialize with default values if not exist
        if (!this.getFavorites()) {
            this.setItem(this.keys.favorites, []);
        }
        
        if (!this.getPlaylists()) {
            this.setItem(this.keys.playlists, []);
        }
        
        if (!this.getSettings()) {
            this.setItem(this.keys.settings, {
                volume: 0.8,
                autoplay: true,
                shuffle: false,
                repeat: false,
                theme: 'dark',
                notifications: true
            });
        }
        
        if (!this.getHistory()) {
            this.setItem(this.keys.history, []);
        }
    }

    // Generic storage methods
    setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    }

    getItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage retrieval error:', error);
            return defaultValue;
        }
    }

    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage removal error:', error);
            return false;
        }
    }

    // Favorites management
    getFavorites() {
        return this.getItem(this.keys.favorites, []);
    }

    addFavorite(trackId) {
        const favorites = this.getFavorites();
        if (!favorites.includes(trackId)) {
            favorites.push(trackId);
            this.setItem(this.keys.favorites, favorites);
            this.addToHistory('favorite_added', { trackId });
            return true;
        }
        return false;
    }

    removeFavorite(trackId) {
        const favorites = this.getFavorites();
        const index = favorites.indexOf(trackId);
        if (index > -1) {
            favorites.splice(index, 1);
            this.setItem(this.keys.favorites, favorites);
            this.addToHistory('favorite_removed', { trackId });
            return true;
        }
        return false;
    }

    isFavorite(trackId) {
        return this.getFavorites().includes(trackId);
    }

    // Playlists management
    getPlaylists() {
        return this.getItem(this.keys.playlists, []);
    }

    getPlaylist(playlistId) {
        const playlists = this.getPlaylists();
        return playlists.find(playlist => playlist.id === playlistId);
    }

    addPlaylist(playlist) {
        const playlists = this.getPlaylists();
        const newPlaylist = {
            id: playlist.id || this.generateId(),
            name: playlist.name,
            description: playlist.description || '',
            tracks: playlist.tracks || [],
            created: playlist.created || new Date().toISOString(),
            modified: new Date().toISOString(),
            image: playlist.image || null
        };
        
        playlists.push(newPlaylist);
        this.setItem(this.keys.playlists, playlists);
        this.addToHistory('playlist_created', { playlistId: newPlaylist.id });
        return newPlaylist;
    }

    updatePlaylist(playlistId, updates) {
        const playlists = this.getPlaylists();
        const index = playlists.findIndex(p => p.id === playlistId);
        
        if (index > -1) {
            playlists[index] = {
                ...playlists[index],
                ...updates,
                modified: new Date().toISOString()
            };
            this.setItem(this.keys.playlists, playlists);
            this.addToHistory('playlist_updated', { playlistId });
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
            this.addToHistory('playlist_deleted', { playlistId });
            return true;
        }
        return false;
    }

    addTrackToPlaylist(playlistId, trackId) {
        const playlist = this.getPlaylist(playlistId);
        if (playlist && !playlist.tracks.includes(trackId)) {
            playlist.tracks.push(trackId);
            this.updatePlaylist(playlistId, { tracks: playlist.tracks });
            this.addToHistory('track_added_to_playlist', { playlistId, trackId });
            return true;
        }
        return false;
    }

    removeTrackFromPlaylist(playlistId, trackId) {
        const playlist = this.getPlaylist(playlistId);
        if (playlist) {
            const index = playlist.tracks.indexOf(trackId);
            if (index > -1) {
                playlist.tracks.splice(index, 1);
                this.updatePlaylist(playlistId, { tracks: playlist.tracks });
                this.addToHistory('track_removed_from_playlist', { playlistId, trackId });
                return true;
            }
        }
        return false;
    }

    // Settings management
    getSettings() {
        return this.getItem(this.keys.settings);
    }

    updateSettings(newSettings) {
        const currentSettings = this.getSettings();
        const updatedSettings = { ...currentSettings, ...newSettings };
        this.setItem(this.keys.settings, updatedSettings);
        return updatedSettings;
    }

    getSetting(key, defaultValue = null) {
        const settings = this.getSettings();
        return settings && settings.hasOwnProperty(key) ? settings[key] : defaultValue;
    }

    setSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        this.setItem(this.keys.settings, settings);
    }

    // History management
    getHistory() {
        return this.getItem(this.keys.history, []);
    }

    addToHistory(action, data = {}) {
        const history = this.getHistory();
        const entry = {
            id: this.generateId(),
            action,
            data,
            timestamp: new Date().toISOString()
        };
        
        history.unshift(entry);
        
        // Keep only last 100 entries
        if (history.length > 100) {
            history.splice(100);
        }
        
        this.setItem(this.keys.history, history);
    }

    clearHistory() {
        this.setItem(this.keys.history, []);
    }

    getRecentHistory(limit = 10) {
        const history = this.getHistory();
        return history.slice(0, limit);
    }

    // Recently played tracks
    addRecentlyPlayed(trackId) {
        const recentKey = 'justplay_recently_played';
        const recent = this.getItem(recentKey, []);
        
        // Remove if already exists
        const index = recent.indexOf(trackId);
        if (index > -1) {
            recent.splice(index, 1);
        }
        
        // Add to beginning
        recent.unshift(trackId);
        
        // Keep only last 20
        if (recent.length > 20) {
            recent.splice(20);
        }
        
        this.setItem(recentKey, recent);
    }

    getRecentlyPlayed(limit = 10) {
        const recentKey = 'justplay_recently_played';
        const recent = this.getItem(recentKey, []);
        return recent.slice(0, limit);
    }

    // User statistics
    updateStats(stats) {
        const currentStats = this.getItem('justplay_stats', {});
        const updatedStats = { ...currentStats, ...stats };
        this.setItem('justplay_stats', updatedStats);
    }

    getStats() {
        return this.getItem('justplay_stats', {
            totalPlays: 0,
            totalListeningTime: 0,
            favoriteGenre: null,
            mostPlayedTrack: null,
            streakDays: 0,
            songsDiscovered: 0
        });
    }

    incrementPlayCount(trackId) {
        const stats = this.getStats();
        stats.totalPlays = (stats.totalPlays || 0) + 1;
        
        // Track most played
        const playCountKey = 'justplay_play_counts';
        const playCounts = this.getItem(playCountKey, {});
        playCounts[trackId] = (playCounts[trackId] || 0) + 1;
        this.setItem(playCountKey, playCounts);
        
        // Find most played track
        let mostPlayedTrack = null;
        let maxPlays = 0;
        for (const [trackId, plays] of Object.entries(playCounts)) {
            if (plays > maxPlays) {
                maxPlays = plays;
                mostPlayedTrack = trackId;
            }
        }
        stats.mostPlayedTrack = mostPlayedTrack;
        
        this.updateStats(stats);
        this.addRecentlyPlayed(trackId);
    }

    addListeningTime(seconds) {
        const stats = this.getStats();
        stats.totalListeningTime = (stats.totalListeningTime || 0) + seconds;
        this.updateStats(stats);
    }

    // Export/Import functionality
    exportData() {
        const data = {
            favorites: this.getFavorites(),
            playlists: this.getPlaylists(),
            settings: this.getSettings(),
            stats: this.getStats(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.favorites) {
                this.setItem(this.keys.favorites, data.favorites);
            }
            
            if (data.playlists) {
                this.setItem(this.keys.playlists, data.playlists);
            }
            
            if (data.settings) {
                this.setItem(this.keys.settings, data.settings);
            }
            
            if (data.stats) {
                this.setItem('justplay_stats', data.stats);
            }
            
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }

    // Clear all data
    clearAllData() {
        const keys = Object.values(this.keys);
        keys.forEach(key => this.removeItem(key));
        this.removeItem('justplay_stats');
        this.removeItem('justplay_play_counts');
        this.removeItem('justplay_recently_played');
        this.initializeDefaults();
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Storage quota check
    checkStorageQuota() {
        try {
            const test = 'storage_test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.warn('Storage quota exceeded or unavailable');
            return false;
        }
    }

    getStorageUsage() {
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length + key.length;
            }
        }
        return {
            used: totalSize,
            usedMB: (totalSize / (1024 * 1024)).toFixed(2)
        };
    }
}
