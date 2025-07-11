// Main application module
import { Search } from './search.js';
import { Storage } from './storage.js';
import { AudioPlayer } from './audio-player.js';
import { 
    musicData, 
    genres, 
    moods, 
    artistsData, 
    getTrendingArtists, 
    getArtistById, 
    getSongsByArtist,
    formatDuration,
    formatNumber
} from './data.js';

class JustPlayApp {
    constructor() {
        this.search = new Search();
        this.storage = new Storage();
        this.audioPlayer = new AudioPlayer();
        this.currentSection = 'home';
        this.supabase = null;
        
        this.init();
    }

    // Notification system
    showNotification(title, message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const iconMap = {
            error: 'fas fa-exclamation-triangle',
            success: 'fas fa-check-circle',
            info: 'fas fa-info-circle'
        };

        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${iconMap[type]}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.add('fade-out');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, 5000);
    }

    async init() {
        this.initializeSupabase();
        this.setupEventListeners();
        this.loadInitialData();
        this.setupSearch();
        this.loadUserData();
        this.setupAudio();
    }

    initializeSupabase() {
        // Initialize Supabase client
        this.supabase = supabase.createClient(
            'https://iomdmhpiscyqtuudojmm.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbWRtaHBpc2N5cXR1dWRvam1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxODE2MTAsImV4cCI6MjA2Nzc1NzYxMH0.Pl3PnPzXhl1fIJTDc3YA8eR0d_Y607QJ0IJSz8hiFgw'
        );
        
        // Initialize audio player with Supabase
        this.audioPlayer.init(this.supabase);
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.navigateToSection(section);
            });
        });

        // Filter controls
        document.getElementById('genreFilter')?.addEventListener('change', () => {
            this.filterMusic();
        });

        document.getElementById('moodFilter')?.addEventListener('change', () => {
            this.filterMusic();
        });

        document.getElementById('sortFilter')?.addEventListener('change', () => {
            this.filterMusic();
        });

        // Global play button click handler
        document.addEventListener('click', (e) => {
            if (e.target.closest('.play-btn')) {
                e.preventDefault();
                const playBtn = e.target.closest('.play-btn');
                const trackId = playBtn.dataset.trackId;
                this.playTrack(trackId);
            }
        });

        // Global favorite button click handler
        document.addEventListener('click', (e) => {
            if (e.target.closest('.favorite-btn')) {
                e.preventDefault();
                const favoriteBtn = e.target.closest('.favorite-btn');
                const trackId = favoriteBtn.dataset.trackId;
                this.toggleFavorite(trackId);
            }
        });

        // Global download button click handler
        document.addEventListener('click', (e) => {
            if (e.target.closest('.download-btn')) {
                e.preventDefault();
                const downloadBtn = e.target.closest('.download-btn');
                const trackId = downloadBtn.dataset.trackId;
                this.downloadTrack(trackId);
            }
        });

        // Artist link click handler
        document.addEventListener('click', (e) => {
            if (e.target.closest('.artist-link')) {
                e.preventDefault();
                const artistLink = e.target.closest('.artist-link');
                const artistId = artistLink.dataset.artistId;
                this.showArtistDetail(artistId);
            }
        });
    }

    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchSuggestions = document.getElementById('searchSuggestions');

        searchInput?.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 0) {
                const suggestions = this.search.getSuggestions(query, musicData);
                this.displaySearchSuggestions(suggestions);
            } else {
                searchSuggestions.classList.remove('show');
            }
        });

        searchInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = e.target.value.trim();
                if (query) {
                    this.performSearch(query);
                }
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                searchSuggestions?.classList.remove('show');
            }
        });

        // Handle suggestion clicks
        searchSuggestions?.addEventListener('click', (e) => {
            const suggestion = e.target.closest('.suggestion-item');
            if (suggestion) {
                const text = suggestion.querySelector('.suggestion-text').textContent;
                searchInput.value = text;
                this.performSearch(text);
                searchSuggestions.classList.remove('show');
            }
        });
    }

    setupAudio() {
        // Set up audio player callbacks
        this.audioPlayer.onTrackChange = (track) => {
            console.log('Track changed:', track.title);
            this.storage.addToPlayHistory(track.id);
        };

        this.audioPlayer.onPlaylistEnd = () => {
            console.log('Playlist ended');
        };
    }

    loadInitialData() {
        this.renderFeaturedMusic();
        this.renderGenres();
        this.renderBrowseMusic();
        this.renderTrendingMusic();
        this.renderArtists();
        this.populateFilterOptions();
        this.setupSubmitForm();
    }

    loadUserData() {
        this.renderFavorites();
    }

    navigateToSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

        // Show section
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(section)?.classList.add('active');

        this.currentSection = section;

        // Load section-specific data
        if (section === 'favorites') {
            this.renderFavorites();
        } else if (section === 'artists') {
            this.renderArtists();
        }
    }

    renderFeaturedMusic() {
        const container = document.getElementById('featuredMusic');
        if (!container) return;

        const featured = musicData.filter(track => track.featured).slice(0, 6);
        container.innerHTML = featured.map(track => this.createMusicCard(track)).join('');
    }

    renderGenres() {
        const container = document.getElementById('genreGrid');
        if (!container) return;

        container.innerHTML = genres.map(genre => `
            <div class="genre-card" data-genre="${genre.id}">
                <i class="${genre.icon}"></i>
                <h4>${genre.name}</h4>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.genre-card').forEach(card => {
            card.addEventListener('click', () => {
                const genreId = card.dataset.genre;
                this.filterByGenre(genreId);
            });
        });
    }

    renderBrowseMusic() {
        const container = document.getElementById('browseMusic');
        if (!container) return;

        container.innerHTML = musicData.map(track => this.createMusicCard(track)).join('');
    }

    renderTrendingMusic() {
        const container = document.getElementById('trendingMusic');
        const countElement = document.getElementById('trendingCount');
        
        if (!container) return;

        const trending = musicData.filter(track => track.trending);
        container.innerHTML = trending.map(track => this.createMusicCard(track)).join('');
        
        if (countElement) {
            countElement.textContent = trending.length;
        }
    }

    renderArtists() {
        const trendingContainer = document.getElementById('trendingArtists');
        const allContainer = document.getElementById('allArtists');
        
        if (trendingContainer) {
            const trending = getTrendingArtists();
            trendingContainer.innerHTML = trending.map(artist => this.createArtistCard(artist)).join('');
        }

        if (allContainer) {
            allContainer.innerHTML = artistsData.map(artist => this.createArtistCard(artist)).join('');
        }
    }

    renderFavorites() {
        const container = document.getElementById('favoritesMusic');
        const emptyState = document.getElementById('emptyFavorites');
        
        if (!container) return;

        const favorites = this.storage.getFavorites();
        const favoritesTracks = musicData.filter(track => favorites.includes(track.id));

        if (favoritesTracks.length === 0) {
            container.innerHTML = '';
            emptyState?.style.setProperty('display', 'block');
        } else {
            container.innerHTML = favoritesTracks.map(track => this.createMusicCard(track)).join('');
            emptyState?.style.setProperty('display', 'none');
        }
    }

    createMusicCard(track) {
        const isFavorite = this.storage.isFavorite(track.id);
        const isDownloaded = this.storage.isDownloaded(track.id);

        return `
            <div class="music-card">
                <div class="track-image">
                    ${track.coverImage ? 
                        `<img src="${track.coverImage}" alt="${track.title}" onerror="this.style.display='none'">` : 
                        `<i class="fas fa-music"></i>`
                    }
                </div>
                <h4>${track.title}</h4>
                <p class="artist-link" data-artist-id="${this.getArtistIdByName(track.artist)}">${track.artist}</p>
                <p>${track.album}</p>
                <div class="track-stats">
                    <span><i class="fas fa-play"></i> ${formatNumber(track.playCount)}</span>
                    <span><i class="fas fa-clock"></i> ${formatDuration(track.duration)}</span>
                </div>
                <div class="card-actions">
                    <button class="btn btn-primary play-btn" data-track-id="${track.id}">
                        <i class="fas fa-play"></i> Play
                    </button>
                    <div class="card-actions-row">
                        <button class="btn btn-ghost favorite-btn ${isFavorite ? 'active' : ''}" data-track-id="${track.id}">
                            <i class="fas fa-heart"></i>
                        </button>
                        <button class="btn btn-ghost download-btn ${isDownloaded ? 'active' : ''}" data-track-id="${track.id}">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
                <div class="audio-player" id="player-${track.id}" style="display: none;">
                    <audio controls preload="metadata">
                        <source type="audio/mpeg">
                        Your browser does not support the audio element.
                    </audio>
                </div>
            </div>
        `;
    }

    createArtistCard(artist) {
        return `
            <div class="artist-card artist-link" data-artist-id="${artist.id}">
                <div class="artist-image">
                    ${artist.image ? 
                        `<img src="${artist.image}" alt="${artist.name}" onerror="this.style.display='none'">` : 
                        `<i class="fas fa-user"></i>`
                    }
                </div>
                <h4>${artist.name}</h4>
                <p>${artist.genre}</p>
                <div class="artist-stats">
                    <span><i class="fas fa-play"></i> ${formatNumber(artist.totalPlays)}</span>
                    <span><i class="fas fa-music"></i> ${artist.songs.length} songs</span>
                </div>
            </div>
        `;
    }

    async playTrack(trackId) {
        const track = musicData.find(t => t.id === trackId);
        if (!track) {
            console.error('Track not found:', trackId);
            return;
        }

        try {
            // Show loading state
            const playBtn = document.querySelector(`[data-track-id="${trackId}"]`);
            if (playBtn) {
                const originalHTML = playBtn.innerHTML;
                playBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                playBtn.disabled = true;

                // Reset button after a delay
                setTimeout(() => {
                    playBtn.innerHTML = originalHTML;
                    playBtn.disabled = false;
                }, 3000);
            }

            // Show inline audio player
            const audioPlayer = document.getElementById(`player-${trackId}`);
            if (audioPlayer) {
                const audio = audioPlayer.querySelector('audio');
                
                // Get signed URL for the audio file
                const { data, error } = await this.supabase
                    .storage
                    .from('songs')
                    .createSignedUrl(track.audioFile, 60);

                if (error) {
                    throw error;
                }

                if (!data?.signedUrl) {
                    throw new Error('No signed URL returned');
                }

                // Set the audio source
                audio.src = data.signedUrl;
                audioPlayer.style.display = 'block';
                
                // Play the audio
                await audio.play();
                
                // Update play count (in real app, this would be server-side)
                track.playCount++;
                
                // Add to play history
                this.storage.addToPlayHistory(track.id);
                
                console.log('Playing track:', track.title);
                
                // Reset button
                if (playBtn) {
                    playBtn.innerHTML = '<i class="fas fa-pause"></i> Playing';
                    playBtn.disabled = false;
                }
            }
        } catch (error) {
            console.error('Error playing track:', error);
            this.showNotification('Track Unavailable', 'Sorry, this track is currently unavailable. Please try another song.', 'error');
            
            // Reset button
            const playBtn = document.querySelector(`[data-track-id="${trackId}"]`);
            if (playBtn) {
                playBtn.innerHTML = '<i class="fas fa-play"></i> Play';
                playBtn.disabled = false;
            }
        }
    }

    toggleFavorite(trackId) {
        const isFavorite = this.storage.isFavorite(trackId);
        const favoriteBtn = document.querySelector(`[data-track-id="${trackId}"].favorite-btn`);
        
        if (isFavorite) {
            this.storage.removeFromFavorites(trackId);
            favoriteBtn?.classList.remove('active');
        } else {
            this.storage.addToFavorites(trackId);
            favoriteBtn?.classList.add('active');
        }
        
        // Update favorites section if currently viewing
        if (this.currentSection === 'favorites') {
            this.renderFavorites();
        }
    }

    async downloadTrack(trackId) {
        const track = musicData.find(t => t.id === trackId);
        if (!track) return;

        try {
            const downloadBtn = document.querySelector(`[data-track-id="${trackId}"].download-btn`);
            if (downloadBtn) {
                downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                downloadBtn.disabled = true;
            }

            // Get signed URL for download
            const { data, error } = await this.supabase
                .storage
                .from('songs')
                .createSignedUrl(track.audioFile, 60);

            if (error) {
                throw error;
            }

            if (!data?.signedUrl) {
                throw new Error('No signed URL returned');
            }

            // Create download link
            const link = document.createElement('a');
            link.href = data.signedUrl;
            link.download = `${track.artist} - ${track.title}.mp3`;
            link.click();

            // Add to downloads
            this.storage.addToDownloads(trackId);
            
            // Update download count
            track.downloadCount++;
            
            // Update button
            if (downloadBtn) {
                downloadBtn.innerHTML = '<i class="fas fa-check"></i>';
                downloadBtn.classList.add('active');
                downloadBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error downloading track:', error);
            this.showNotification('Download Unavailable', 'Sorry, this track is currently unavailable for download. Please try again later.', 'error');
            
            const downloadBtn = document.querySelector(`[data-track-id="${trackId}"].download-btn`);
            if (downloadBtn) {
                downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
                downloadBtn.disabled = false;
            }
        }
    }

    showArtistDetail(artistId) {
        const artist = getArtistById(artistId);
        if (!artist) return;

        const songs = getSongsByArtist(artistId);
        
        // Show artist detail section
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById('artist-detail')?.classList.add('active');

        // Populate artist profile
        const profileContainer = document.getElementById('artistProfile');
        if (profileContainer) {
            profileContainer.innerHTML = `
                <div class="artist-profile-header">
                    <div class="artist-image-large">
                        ${artist.image ? 
                            `<img src="${artist.image}" alt="${artist.name}">` : 
                            `<i class="fas fa-user"></i>`
                        }
                    </div>
                    <div class="artist-info">
                        <h2>${artist.name}</h2>
                        <p class="artist-genre">${artist.genre}</p>
                        <p class="artist-bio">${artist.bio}</p>
                        <div class="artist-stats">
                            <div class="stat">
                                <span class="stat-number">${formatNumber(artist.totalPlays)}</span>
                                <span class="stat-label">Total Plays</span>
                            </div>
                            <div class="stat">
                                <span class="stat-number">${songs.length}</span>
                                <span class="stat-label">Songs</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Populate songs
        const songsContainer = document.getElementById('artistSongs');
        if (songsContainer) {
            songsContainer.innerHTML = songs.map(track => this.createMusicCard(track)).join('');
        }
    }

    populateFilterOptions() {
        const genreFilter = document.getElementById('genreFilter');
        const moodFilter = document.getElementById('moodFilter');

        if (genreFilter) {
            genres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre.id;
                option.textContent = genre.name;
                genreFilter.appendChild(option);
            });
        }

        if (moodFilter) {
            moods.forEach(mood => {
                const option = document.createElement('option');
                option.value = mood.id;
                option.textContent = mood.name;
                moodFilter.appendChild(option);
            });
        }
    }

    filterMusic() {
        const genreFilter = document.getElementById('genreFilter')?.value;
        const moodFilter = document.getElementById('moodFilter')?.value;
        const sortFilter = document.getElementById('sortFilter')?.value;

        let filteredMusic = [...musicData];

        // Apply genre filter
        if (genreFilter) {
            filteredMusic = filteredMusic.filter(track => track.genre === genreFilter);
        }

        // Apply mood filter
        if (moodFilter) {
            filteredMusic = filteredMusic.filter(track => track.mood === moodFilter);
        }

        // Apply sorting
        if (sortFilter) {
            switch (sortFilter) {
                case 'title':
                    filteredMusic.sort((a, b) => a.title.localeCompare(b.title));
                    break;
                case 'artist':
                    filteredMusic.sort((a, b) => a.artist.localeCompare(b.artist));
                    break;
                case 'duration':
                    filteredMusic.sort((a, b) => a.duration - b.duration);
                    break;
            }
        }

        // Update browse section
        const container = document.getElementById('browseMusic');
        if (container) {
            container.innerHTML = filteredMusic.map(track => this.createMusicCard(track)).join('');
        }
    }

    filterByGenre(genreId) {
        // Navigate to browse section
        this.navigateToSection('browse');
        
        // Set genre filter
        const genreFilter = document.getElementById('genreFilter');
        if (genreFilter) {
            genreFilter.value = genreId;
            this.filterMusic();
        }
    }

    displaySearchSuggestions(suggestions) {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        if (!suggestionsContainer) return;

        if (suggestions.length === 0) {
            suggestionsContainer.classList.remove('show');
            return;
        }

        suggestionsContainer.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item">
                <i class="fas ${this.getSuggestionIcon(suggestion.type)}"></i>
                <div class="suggestion-text">${suggestion.text}</div>
                <div class="suggestion-type">${suggestion.subtitle}</div>
            </div>
        `).join('');

        suggestionsContainer.classList.add('show');
    }

    getSuggestionIcon(type) {
        switch (type) {
            case 'song': return 'fa-music';
            case 'artist': return 'fa-user';
            case 'album': return 'fa-compact-disc';
            default: return 'fa-search';
        }
    }

    performSearch(query) {
        const results = this.search.search(query, musicData);
        
        // Navigate to browse section
        this.navigateToSection('browse');
        
        // Display results
        const container = document.getElementById('browseMusic');
        if (container) {
            if (results.results.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h3>No results found</h3>
                        <p>Try searching for something else.</p>
                    </div>
                `;
            } else {
                container.innerHTML = results.results.map(track => this.createMusicCard(track)).join('');
            }
        }

        // Hide search suggestions
        document.getElementById('searchSuggestions')?.classList.remove('show');
    }

    setupSubmitForm() {
        const form = document.getElementById('submitForm');
        form?.addEventListener('submit', (e) => {
            this.handleSubmitForm(e);
        });

        // Populate genre and mood options in submit form
        const genreSelect = document.getElementById('songGenre');
        const moodSelect = document.getElementById('songMood');

        if (genreSelect) {
            genres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre.id;
                option.textContent = genre.name;
                genreSelect.appendChild(option);
            });
        }

        if (moodSelect) {
            moods.forEach(mood => {
                const option = document.createElement('option');
                option.value = mood.id;
                option.textContent = mood.name;
                moodSelect.appendChild(option);
            });
        }
    }

    handleSubmitForm(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const songData = {
            title: formData.get('songTitle'),
            artist: formData.get('artistName'),
            album: formData.get('albumName'),
            genre: formData.get('songGenre'),
            mood: formData.get('songMood'),
            description: formData.get('songDescription'),
            audioFile: formData.get('audioFile'),
            artworkFile: formData.get('artworkFile')
        };

        console.log('Form submitted:', songData);
        this.showNotification('Submission Received', 'Thank you for your submission! We will review your track and get back to you.', 'success');
        
        // Reset form
        e.target.reset();
    }

    getArtistIdByName(artistName) {
        const artist = artistsData.find(a => a.name === artistName);
        return artist ? artist.id : 'unknown';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JustPlayApp();
});