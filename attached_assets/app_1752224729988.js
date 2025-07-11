// Main application module
import { Search } from './search.js';
import { Storage } from './storage.js';
import { musicData, genres, moods, artistsData, getTrendingArtists, getArtistById, getSongsByArtist } from './data.js';

class JustPlayApp {
    constructor() {
        this.search = new Search();
        this.storage = new Storage();
        this.currentSection = 'home';
        this.currentPlaylist = [];
        this.currentTrackIndex = 0;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.setupSearch();
        this.loadUserData();
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

        // Create playlist modal
        const createPlaylistBtn = document.getElementById('createPlaylistBtn');
        const playlistModal = document.getElementById('playlistModal');
        const closePlaylistModal = document.getElementById('closePlaylistModal');
        const cancelPlaylist = document.getElementById('cancelPlaylist');
        const savePlaylist = document.getElementById('savePlaylist');

        createPlaylistBtn?.addEventListener('click', () => {
            this.showModal(playlistModal);
        });

        closePlaylistModal?.addEventListener('click', () => {
            this.hideModal(playlistModal);
        });

        cancelPlaylist?.addEventListener('click', () => {
            this.hideModal(playlistModal);
        });

        savePlaylist?.addEventListener('click', () => {
            this.createPlaylist();
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

        // Close modal on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal(e.target);
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
    }

    setupAudioPlayer() {
        this.audioPlayer.onTrackChange = (track) => {
            this.updatePlayerUI(track);
        };

        this.audioPlayer.onPlaylistEnd = () => {
            this.handlePlaylistEnd();
        };

        // Player control events
        document.getElementById('prevBtn')?.addEventListener('click', () => {
            this.playPrevious();
        });

        document.getElementById('nextBtn')?.addEventListener('click', () => {
            this.playNext();
        });

        document.getElementById('favoriteBtn')?.addEventListener('click', () => {
            this.toggleFavorite();
        });

        document.getElementById('shuffleBtn')?.addEventListener('click', () => {
            this.toggleShuffle();
        });

        document.getElementById('repeatBtn')?.addEventListener('click', () => {
            this.toggleRepeat();
        });
    }

    loadInitialData() {
        this.renderFeaturedMusic();
        this.renderGenres();
        this.renderBrowseMusic();
        this.renderTrendingMusic();
        this.renderArtists();
        this.populateFilterOptions();
        this.setupSubmitForm();
        this.setupArtistLinks();
    }

    loadUserData() {
        const favorites = this.storage.getFavorites();
        const playlists = this.storage.getPlaylists();
        
        this.renderFavorites();
        this.renderPlaylists();
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
        } else if (section === 'playlists') {
            this.renderPlaylists();
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

    renderPlaylists() {
        const container = document.getElementById('playlistGrid');
        if (!container) return;

        const playlists = this.storage.getPlaylists();
        
        if (playlists.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-music"></i>
                    <h3>No playlists yet</h3>
                    <p>Create your first playlist to get started!</p>
                </div>
            `;
        } else {
            container.innerHTML = playlists.map(playlist => this.createPlaylistCard(playlist)).join('');
        }
    }

  document.addEventListener('click', async (e) => {
  const playBtn = e.target.closest('.play-btn');
  if (playBtn) {
    e.preventDefault();
    const trackId = playBtn.dataset.trackId;
    const track = musicData.find(t => t.id === trackId);
    if (!track || !track.audioFile) {
      alert("This track does not have a valid audio file.");
      return;
    }

    const audio = playBtn.parentElement.querySelector("audio");

    if (!audio.src || audio.src.indexOf("supabase.co") === -1) {
      const { data, error } = await supabase
        .storage
        .from('songs')
        .createSignedUrl(track.audioFile, 60);

      if (error || !data?.signedUrl) {
        alert("Failed to get audio.");
        return;
      }

      audio.src = data.signedUrl;
    }

    audio.style.display = "block";
    audio.play();
  }
});


    createPlaylistCard(playlist) {
        return `
            <div class="playlist-card" data-playlist-id="${playlist.id}">
                <h4>${playlist.name}</h4>
                <p>${playlist.description || 'No description'}</p>
                <div class="playlist-meta">
                    <span>${playlist.tracks.length} tracks</span>
                    <span>Created ${new Date(playlist.created).toLocaleDateString()}</span>
                </div>
                <div class="card-actions">
                    <button class="btn btn-primary" onclick="playSong('${track.audioFile}', this)">
                        <i class="fas fa-play"></i> Play
                </button>
                <audio controls style="display: none;"></audio>

                    <button class="btn btn-secondary edit-playlist-btn" data-playlist-id="${playlist.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </div>
        `;
    }

    populateFilterOptions() {
        const genreFilter = document.getElementById('genreFilter');
        const moodFilter = document.getElementById('moodFilter');

        if (genreFilter) {
            genreFilter.innerHTML = '<option value="">All Genres</option>' +
                genres.map(genre => `<option value="${genre.id}">${genre.name}</option>`).join('');
        }

        if (moodFilter) {
            moodFilter.innerHTML = '<option value="">All Moods</option>' +
                moods.map(mood => `<option value="${mood.id}">${mood.name}</option>`).join('');
        }
    }

    filterMusic() {
        const genreFilter = document.getElementById('genreFilter')?.value;
        const moodFilter = document.getElementById('moodFilter')?.value;
        const sortFilter = document.getElementById('sortFilter')?.value;

        let filteredTracks = [...musicData];

        // Apply filters
        if (genreFilter) {
            filteredTracks = filteredTracks.filter(track => track.genre === genreFilter);
        }

        if (moodFilter) {
            filteredTracks = filteredTracks.filter(track => track.mood === moodFilter);
        }

        // Apply sorting
        if (sortFilter) {
            filteredTracks.sort((a, b) => {
                if (sortFilter === 'title') {
                    return a.title.localeCompare(b.title);
                } else if (sortFilter === 'artist') {
                    return a.artist.localeCompare(b.artist);
                } else if (sortFilter === 'duration') {
                    return a.duration - b.duration;
                }
                return 0;
            });
        }

        const container = document.getElementById('browseMusic');
        if (container) {
            container.innerHTML = filteredTracks.map(track => this.createMusicCard(track)).join('');
        }
    }

    filterByGenre(genreId) {
        document.getElementById('genreFilter').value = genreId;
        this.filterMusic();
        this.navigateToSection('browse');
    }

    displaySearchSuggestions(suggestions) {
        const container = document.getElementById('searchSuggestions');
        if (!container) return;

        if (suggestions.length === 0) {
            container.classList.remove('show');
            return;
        }

        container.innerHTML = suggestions.map(item => `
            <div class="suggestion-item" data-type="${item.type}" data-id="${item.id}">
                <strong>${item.title}</strong>
                ${item.subtitle ? `<br><small>${item.subtitle}</small>` : ''}
            </div>
        `).join('');

        container.classList.add('show');

        // Add click handlers
        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                const id = item.dataset.id;
                this.handleSuggestionClick(type, id);
                container.classList.remove('show');
            });
        });
    }

    performSearch(query) {
        const results = this.search.search(query, musicData);
        
        // Navigate to browse section and show results
        this.navigateToSection('browse');
        
        const container = document.getElementById('browseMusic');
        if (container) {
            if (results.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h3>No results found</h3>
                        <p>Try searching with different keywords</p>
                    </div>
                `;
            } else {
                container.innerHTML = results.map(track => this.createMusicCard(track)).join('');
            }
        }

        // Hide suggestions
        document.getElementById('searchSuggestions')?.classList.remove('show');
    }

    handleSuggestionClick(type, id) {
        if (type === 'track') {
            const track = musicData.find(t => t.id === id);
            if (track) {
                this.playTrack(track);
            }
        } else if (type === 'artist') {
            const results = musicData.filter(track => track.artist.toLowerCase().includes(id.toLowerCase()));
            this.showSearchResults(results);
        }
    }


    // 🔐 Secure Supabase Signed URL
    const { data, error } = await supabase
      .storage
      .from('songs')
      .createSignedUrl(track.audioFile, 60);

    if (error || !data?.signedUrl) {
        alert("Failed to get secure audio URL.");
        return;
    }

    // Inject the secure signed URL
    track.audioUrl = data.signedUrl;

    this.audioPlayer.loadTrack(track);
    this.audioPlayer.play();



    playNext() {
        if (this.currentPlaylist.length === 0) return;

        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.currentPlaylist.length;
        const nextTrack = this.currentPlaylist[this.currentTrackIndex];
        
        // Ensure player is visible
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer) {
            audioPlayer.style.display = 'block';
            audioPlayer.classList.remove('minimized');
        }
        
        this.audioPlayer.loadTrack(nextTrack);
        this.audioPlayer.play();
    }

    playPrevious() {
        if (this.currentPlaylist.length === 0) return;

        this.currentTrackIndex = this.currentTrackIndex === 0 
            ? this.currentPlaylist.length - 1 
            : this.currentTrackIndex - 1;
        
        const prevTrack = this.currentPlaylist[this.currentTrackIndex];
        
        // Ensure player is visible
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer) {
            audioPlayer.style.display = 'block';
            audioPlayer.classList.remove('minimized');
        }
        
        this.audioPlayer.loadTrack(prevTrack);
        this.audioPlayer.play();
    }

    toggleFavorite() {
        const currentTrack = this.audioPlayer.getCurrentTrack();
        if (!currentTrack) return;

        const favorites = this.storage.getFavorites();
        const isFavorite = favorites.includes(currentTrack.id);

        if (isFavorite) {
            this.storage.removeFavorite(currentTrack.id);
        } else {
            this.storage.addFavorite(currentTrack.id);
        }

        this.updateFavoriteButton();
        
        // Update favorites page if currently viewing
        if (this.currentSection === 'favorites') {
            this.renderFavorites();
        }
    }

    toggleShuffle() {
        this.audioPlayer.toggleShuffle();
        const shuffleBtn = document.getElementById('shuffleBtn');
        shuffleBtn?.classList.toggle('active');
    }

    toggleRepeat() {
        this.audioPlayer.toggleRepeat();
        const repeatBtn = document.getElementById('repeatBtn');
        repeatBtn?.classList.toggle('active');
    }

    updatePlayerUI(track) {
        document.getElementById('currentTrackTitle').textContent = track.title;
        document.getElementById('currentTrackArtist').textContent = track.artist;
        this.updateFavoriteButton();
    }

    updateFavoriteButton() {
        const currentTrack = this.audioPlayer.getCurrentTrack();
        const favoriteBtn = document.getElementById('favoriteBtn');
        
        if (!currentTrack || !favoriteBtn) return;

        const isFavorite = this.storage.getFavorites().includes(currentTrack.id);
        const icon = favoriteBtn.querySelector('i');
        
        if (isFavorite) {
            icon.className = 'fas fa-heart';
            favoriteBtn.classList.add('active');
        } else {
            icon.className = 'far fa-heart';
            favoriteBtn.classList.remove('active');
        }
    }

    createPlaylist() {
        const nameInput = document.getElementById('playlistName');
        const descriptionInput = document.getElementById('playlistDescription');
        
        const name = nameInput?.value.trim();
        if (!name) return;

        const playlist = {
            id: Date.now().toString(),
            name: name,
            description: descriptionInput?.value.trim() || '',
            tracks: [],
            created: new Date().toISOString()
        };

        this.storage.addPlaylist(playlist);
        this.renderPlaylists();
        this.hideModal(document.getElementById('playlistModal'));

        // Clear form
        if (nameInput) nameInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
    }

    showModal(modal) {
        modal?.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    hideModal(modal) {
        modal?.classList.remove('show');
        document.body.style.overflow = '';
    }

    handlePlaylistEnd() {
        if (this.audioPlayer.isRepeatMode()) {
            this.audioPlayer.play();
        } else {
            this.playNext();
        }
    }

    setupSubmitForm() {
        // Populate genre and mood dropdowns
        const genreSelect = document.getElementById('songGenre');
        const moodSelect = document.getElementById('songMood');
        
        if (genreSelect) {
            genreSelect.innerHTML = '<option value="">Select Genre</option>' +
                genres.map(genre => `<option value="${genre.id}">${genre.name}</option>`).join('');
        }
        
        if (moodSelect) {
            moodSelect.innerHTML = '<option value="">Select Mood</option>' +
                moods.map(mood => `<option value="${mood.id}">${mood.name}</option>`).join('');
        }

        // File upload handling
        this.setupFileUploads();
        
        // Form submission
        const submitForm = document.getElementById('submitForm');
        submitForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmitSong();
        });


    }

    setupFileUploads() {
        const audioFileInput = document.getElementById('audioFile');
        const artworkFileInput = document.getElementById('artworkFile');

        const handleFileUpload = (input, uploadDiv) => {
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                const display = uploadDiv.querySelector('.file-upload-display span');
                
                if (file) {
                    display.textContent = file.name;
                    uploadDiv.classList.add('has-file');
                } else {
                    display.textContent = input.id === 'audioFile' ? 
                        'Choose audio file or drag & drop' : 
                        'Choose image file or drag & drop';
                    uploadDiv.classList.remove('has-file');
                }
            });

            // Drag and drop
            uploadDiv.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadDiv.style.borderColor = 'var(--primary-color)';
            });

            uploadDiv.addEventListener('dragleave', () => {
                uploadDiv.style.borderColor = 'var(--border-color)';
            });

            uploadDiv.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadDiv.style.borderColor = 'var(--border-color)';
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    input.files = files;
                    input.dispatchEvent(new Event('change'));
                }
            });
        };

        if (audioFileInput) {
            handleFileUpload(audioFileInput, audioFileInput.closest('.file-upload'));
        }
        
        if (artworkFileInput) {
            handleFileUpload(artworkFileInput, artworkFileInput.closest('.file-upload'));
        }
    }

    handleSubmitSong() {
        const formData = new FormData(document.getElementById('submitForm'));
        
        // Enhanced validation
        const requiredFields = ['songTitle', 'artistName', 'songGenre'];
        const audioFile = document.getElementById('audioFile').files[0];
        const artworkFile = document.getElementById('artworkFile').files[0];
        
        if (!audioFile) {
            this.showNotification('Please select an audio file', 'error');
            return;
        }

        // File type validation
        const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
        
        if (!this.validateFileType(audioFile, allowedAudioTypes)) {
            this.showNotification('Please upload a valid audio file (MP3, WAV, or OGG)', 'error');
            return;
        }
        
        if (artworkFile && !this.validateFileType(artworkFile, allowedImageTypes)) {
            this.showNotification('Please upload a valid image file (JPEG, PNG, or WebP)', 'error');
            return;
        }
        
        // File size validation (max 50MB for audio, 5MB for images)
        if (!this.validateFileSize(audioFile, 50)) {
            this.showNotification('Audio file must be smaller than 50MB', 'error');
            return;
        }
        
        if (artworkFile && !this.validateFileSize(artworkFile, 5)) {
            this.showNotification('Image file must be smaller than 5MB', 'error');
            return;
        }

        for (const field of requiredFields) {
            const value = formData.get(field);
            if (!value || value.trim().length === 0) {
                this.showNotification(`Please fill in ${field.replace('song', '').replace('Name', ' Name')}`, 'error');
                return;
            }
            
            // Length validation
            if (value.length > 100) {
                this.showNotification(`${field.replace('song', '').replace('Name', ' Name')} must be less than 100 characters`, 'error');
                return;
            }
        }

        // For demo purposes, simulate submission
        this.showNotification('Uploading your song...', 'info');
        
        setTimeout(() => {
            // Create new track object
            const newTrack = {
                id: this.generateSecureId(),
                title: this.sanitizeInput(formData.get('songTitle')),
                artist: this.sanitizeInput(formData.get('artistName')),
                album: this.sanitizeInput(formData.get('albumName')) || 'Single',
                genre: this.sanitizeInput(formData.get('songGenre')),
                mood: this.sanitizeInput(formData.get('songMood')) || 'unknown',
                duration: 180, // Default 3 minutes
                releaseDate: new Date().toISOString().split('T')[0],
                featured: false,
                trending: false,
                audioUrl: URL.createObjectURL(audioFile), // Use actual file
                description: this.sanitizeInput(formData.get('songDescription')),
                submitted: true,
                submittedDate: new Date().toISOString()
            };

            // Add to local data (in real app, this would go to server)
            musicData.push(newTrack);
            
            // Clear form
            document.getElementById('submitForm').reset();
            document.querySelectorAll('.file-upload').forEach(upload => {
                upload.classList.remove('has-file');
                upload.querySelector('span').textContent = 
                    upload.querySelector('input').id === 'audioFile' ?
                    'Choose audio file or drag & drop' :
                    'Choose image file or drag & drop';
            });

            this.showNotification('Song submitted successfully! It will be reviewed and published soon.', 'success');
            
            // Refresh browse section
            this.renderBrowseMusic();
        }, 2000);
    }



    async downloadTrack(trackId) {
        const track = musicData.find(t => t.id === trackId);
        if (!track) return;

        try {
            this.showNotification(`Preparing download: "${track.title}" by ${track.artist}...`, 'info');
            
            // For demo tracks, generate a simple audio file
            if (!track.audioUrl || !track.audioUrl.startsWith('blob:')) {
                const audioBuffer = await this.generateDemoAudio(track);
                const blob = new Blob([audioBuffer], { type: 'audio/wav' });
                
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${track.artist} - ${track.title}.wav`;
                link.style.display = 'none';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Cleanup
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                
                this.showNotification(`Downloaded: "${track.title}"`, 'success');
            } else {
                // For uploaded tracks with real audio
                const link = document.createElement('a');
                link.href = track.audioUrl;
                link.download = `${track.artist} - ${track.title}.mp3`;
                link.style.display = 'none';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                this.showNotification(`Downloaded: "${track.title}"`, 'success');
            }
            
        } catch (error) {
            console.error('Download failed:', error);
            this.showNotification('Download failed. Please try again.', 'error');
        }
    }
    
    async generateDemoAudio(track) {
        // Generate a simple WAV file for demonstration
        const sampleRate = 44100;
        const duration = 30; // 30 seconds
        const numSamples = sampleRate * duration;
        const numChannels = 1;
        const bytesPerSample = 2;
        
        // Calculate buffer size
        const bufferSize = 44 + numSamples * numChannels * bytesPerSample;
        const buffer = new ArrayBuffer(bufferSize);
        const view = new DataView(buffer);
        
        // Write WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, bufferSize - 8, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true); // PCM format
        view.setUint16(20, 1, true); // Audio format
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
        view.setUint16(32, numChannels * bytesPerSample, true);
        view.setUint16(34, 8 * bytesPerSample, true);
        writeString(36, 'data');
        view.setUint32(40, numSamples * numChannels * bytesPerSample, true);
        
        // Generate audio data (simple melody based on track info)
        const baseFreq = 220 + (track.id % 10) * 55; // Different tone per track
        
        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            
            // Create a simple melody with fade in/out
            const envelope = Math.sin(Math.PI * t / duration);
            const note1 = Math.sin(2 * Math.PI * baseFreq * t);
            const note2 = Math.sin(2 * Math.PI * baseFreq * 1.5 * t) * 0.5;
            const sample = (note1 + note2) * envelope * 0.3;
            
            const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
            view.setInt16(44 + i * 2, intSample, true);
        }
        
        return buffer;
    }
    
    
    // Security Functions
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        // Remove HTML tags and dangerous characters
        return input
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/[<>&"']/g, (match) => { // Escape dangerous characters
                const escapeMap = {
                    '<': '&lt;',
                    '>': '&gt;',
                    '&': '&amp;',
                    '"': '&quot;',
                    "'": '&#x27;'
                };
                return escapeMap[match];
            })
            .trim()
            .substring(0, 200); // Limit length to prevent overflow
    }

    generateSecureId() {
        // Generate cryptographically secure random ID
        const timestamp = Date.now().toString(36);
        const randomBytes = new Uint8Array(8);
        crypto.getRandomValues(randomBytes);
        const randomString = Array.from(randomBytes, byte => byte.toString(36)).join('');
        return `${timestamp}-${randomString}`;
    }

    validateFileType(file, allowedTypes) {
        if (!file) return false;
        
        // Check MIME type
        if (!allowedTypes.includes(file.type)) {
            return false;
        }
        
        // Additional file extension check
        const extension = file.name.split('.').pop().toLowerCase();
        const allowedExtensions = {
            'audio/mpeg': ['mp3'],
            'audio/wav': ['wav'],
            'audio/ogg': ['ogg'],
            'image/jpeg': ['jpg', 'jpeg'],
            'image/png': ['png'],
            'image/webp': ['webp']
        };
        
        return allowedExtensions[file.type]?.includes(extension) || false;
    }

    validateFileSize(file, maxSizeMB) {
        if (!file) return false;
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        return file.size <= maxSizeBytes;
    }

    showNotification(message, type = 'info') {
        try {
            // Sanitize message to prevent XSS
            const sanitizedMessage = this.sanitizeInput(message);
            
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            
            // Use safe DOM manipulation instead of innerHTML
            const icon = document.createElement('i');
            icon.className = `fas fa-${type === 'success' ? 'check-circle' : 
                                type === 'error' ? 'exclamation-circle' : 
                                type === 'warning' ? 'exclamation-triangle' : 'info-circle'}`;
            
            const span = document.createElement('span');
            span.textContent = sanitizedMessage;
            
            notification.appendChild(icon);
            notification.appendChild(span);
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(${type === 'success' ? '--success-color' : 
                               type === 'error' ? '--error-color' : 
                               type === 'warning' ? '--warning-color' : '--primary-color'});
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
            box-shadow: var(--shadow-medium);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    // Artist-related methods
    renderArtists() {
        this.renderTrendingArtists();
        this.renderAllArtists();
    }

    renderTrendingArtists() {
        const container = document.getElementById('trendingArtists');
        if (!container) return;

        const trending = getTrendingArtists(6);
        container.innerHTML = trending.map(artist => this.createArtistCard(artist)).join('');
    }

    renderAllArtists() {
        const container = document.getElementById('allArtists');
        if (!container) return;

        container.innerHTML = artistsData.map(artist => this.createArtistCard(artist)).join('');
    }

    createArtistCard(artist) {
        return `
            <div class="artist-card" data-artist-id="${artist.id}">
                <div class="artist-image">
                    ${artist.image ? 
                        `<img src="${artist.image}" alt="${artist.name}" loading="lazy">` : 
                        '<i class="fas fa-user-music"></i>'
                    }
                </div>
                <h4>
                    ${this.sanitizeInput(artist.name)}
                    ${artist.verified ? '<i class="fas fa-check-circle verified-badge" title="Verified Artist"></i>' : ''}
                </h4>
                <div class="artist-genre">${this.sanitizeInput(artist.genre)}</div>
                <div class="artist-stats">
                    <div class="artist-stat">
                        <span class="artist-stat-number">${artist.totalPlays.toLocaleString()}</span>
                        <span>Plays</span>
                    </div>
                    <div class="artist-stat">
                        <span class="artist-stat-number">${artist.totalDownloads.toLocaleString()}</span>
                        <span>Downloads</span>
                    </div>
                    <div class="artist-stat">
                        <span class="artist-stat-number">${artist.followers.toLocaleString()}</span>
                        <span>Followers</span>
                    </div>
                </div>
                <div class="artist-bio">${this.sanitizeInput(artist.bio)}</div>
            </div>
        `;
    }

    showArtistProfile(artistId) {
        const artist = getArtistById(artistId);
        if (!artist) return;

        const artistSongs = getSongsByArtist(artist.name);
        
        // Show artist detail section
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById('artist-detail')?.classList.add('active');

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Render artist profile
        const profileContainer = document.getElementById('artistProfile');
        if (profileContainer) {
            profileContainer.innerHTML = `
                <div class="artist-profile-header">
                    <div class="artist-profile-image">
                        ${artist.image ? 
                            `<img src="${artist.image}" alt="${artist.name}">` : 
                            '<i class="fas fa-user-music"></i>'
                        }
                    </div>
                    <div class="artist-profile-info">
                        <h2>
                            ${this.sanitizeInput(artist.name)}
                            ${artist.verified ? '<i class="fas fa-check-circle verified-badge" title="Verified Artist"></i>' : ''}
                        </h2>
                        <div class="artist-genre">${this.sanitizeInput(artist.genre)} Artist</div>
                        <div class="artist-profile-stats">
                            <div class="profile-stat">
                                <span class="profile-stat-number">${artist.totalPlays.toLocaleString()}</span>
                                <span class="profile-stat-label">Total Plays</span>
                            </div>
                            <div class="profile-stat">
                                <span class="profile-stat-number">${artist.totalDownloads.toLocaleString()}</span>
                                <span class="profile-stat-label">Downloads</span>
                            </div>
                            <div class="profile-stat">
                                <span class="profile-stat-number">${artist.followers.toLocaleString()}</span>
                                <span class="profile-stat-label">Followers</span>
                            </div>
                            <div class="profile-stat">
                                <span class="profile-stat-number">${artistSongs.length}</span>
                                <span class="profile-stat-label">Songs</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="artist-bio-full">${this.sanitizeInput(artist.bio)}</div>
            `;
        }

        // Render artist songs
        const songsContainer = document.getElementById('artistSongs');
        if (songsContainer) {
            if (artistSongs.length > 0) {
                songsContainer.innerHTML = artistSongs.map(track => this.createMusicCard(track)).join('');
            } else {
                songsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-music"></i>
                        <h3>No songs available</h3>
                        <p>This artist hasn't released any tracks yet.</p>
                    </div>
                `;
            }
        }
    }

    setupArtistLinks() {
        document.addEventListener('click', (e) => {
            // Artist card clicks
            if (e.target.closest('.artist-card')) {
                e.preventDefault();
                const artistId = e.target.closest('.artist-card').dataset.artistId;
                this.showArtistProfile(artistId);
            }

            // Artist name clicks in music cards
            if (e.target.closest('.artist-link')) {
                e.preventDefault();
                const artistName = e.target.closest('.artist-link').textContent.trim();
                const artist = artistsData.find(a => a.name === artistName);
                if (artist) {
                    this.showArtistProfile(artist.id);
                }
            }
        });
    }

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Add global error handling
        window.addEventListener('error', (event) => {
            console.error('JavaScript error:', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            event.preventDefault();
        });

        window.justPlayApp = new JustPlayApp();
    } catch (error) {
        console.error('Failed to initialize application:', error);
        document.body.innerHTML = '<div style="text-align: center; padding: 2rem; color: #ef4444;">Failed to load application. Please refresh the page.</div>';
        return;
    }
    
    // Setup global event listeners for dynamically created elements
    document.addEventListener('click', async (e) => {
  const playBtn = e.target.closest('.play-btn');
  if (playBtn) {
    e.preventDefault();
    const trackId = playBtn.dataset.trackId;
    const track = musicData.find(t => t.id === trackId);
    if (!track || !track.audioFile) {
      alert("This track does not have a valid audio file.");
      return;
    }

    const audio = playBtn.parentElement.querySelector("audio");

    if (!audio.src || !audio.src.includes("supabase.co")) {
      const { data, error } = await supabase
        .storage
        .from("songs")
        .createSignedUrl(track.audioFile, 60);

      if (error || !data?.signedUrl) {
        alert("Failed to get audio.");
        return;
      }

      audio.src = data.signedUrl;
    }

    audio.style.display = "block";
    audio.play();
  }

  // Favorite toggle logic
  if (e.target.closest('.favorite-btn')) {
    e.preventDefault();
    const trackId = e.target.closest('.favorite-btn').dataset.trackId;
    const favorites = window.justPlayApp.storage.getFavorites();
    const isFavorite = favorites.includes(trackId);

    if (isFavorite) {
      window.justPlayApp.storage.removeFavorite(trackId);
    } else {
      window.justPlayApp.storage.addFavorite(trackId);
    }

    const icon = e.target.closest('.favorite-btn').querySelector('i');
    if (isFavorite) {
      icon.className = 'far fa-heart';
    } else {
      icon.className = 'fas fa-heart';
      icon.closest('.favorite-btn').classList.add('favorite-animation');
      setTimeout(() => {
        icon.closest('.favorite-btn')?.classList.remove('favorite-animation');
      }, 600);
    }

    if (window.justPlayApp.currentSection === 'favorites') {
      window.justPlayApp.renderFavorites();
    }
  }
});

        
    });
});