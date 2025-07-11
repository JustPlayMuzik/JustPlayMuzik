// Audio player functionality
export class AudioPlayer {
    constructor() {
        this.currentTrack = null;
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.volume = 0.7;
        this.isMuted = false;
        this.isShuffled = false;
        this.repeatMode = 'none'; // 'none', 'one', 'all'
        this.audioElements = new Map(); // Track audio elements
        this.onTrackChange = null;
        this.onPlaylistEnd = null;
        this.supabase = null;
        this.signedUrls = new Map(); // Cache for signed URLs
    }

    // Initialize with Supabase client
    init(supabaseClient) {
        this.supabase = supabaseClient;
    }

    // Get or create audio element for a track
    getAudioElement(trackId) {
        if (!this.audioElements.has(trackId)) {
            const audio = new Audio();
            audio.preload = 'metadata';
            audio.volume = this.volume;
            
            // Add event listeners
            audio.addEventListener('loadstart', () => this.handleLoadStart(trackId));
            audio.addEventListener('loadedmetadata', () => this.handleLoadedMetadata(trackId));
            audio.addEventListener('canplay', () => this.handleCanPlay(trackId));
            audio.addEventListener('play', () => this.handlePlay(trackId));
            audio.addEventListener('pause', () => this.handlePause(trackId));
            audio.addEventListener('ended', () => this.handleEnded(trackId));
            audio.addEventListener('timeupdate', () => this.handleTimeUpdate(trackId));
            audio.addEventListener('error', (e) => this.handleError(trackId, e));
            
            this.audioElements.set(trackId, audio);
        }
        
        return this.audioElements.get(trackId);
    }

    // Get signed URL for audio file
    async getSignedUrl(audioFile) {
        if (!this.supabase) {
            throw new Error('Supabase client not initialized');
        }

        // Check cache first
        if (this.signedUrls.has(audioFile)) {
            const cached = this.signedUrls.get(audioFile);
            // Check if URL is still valid (expires in 60 seconds)
            if (Date.now() - cached.timestamp < 50000) {
                return cached.url;
            }
        }

        try {
            const { data, error } = await this.supabase
                .storage
                .from('songs')
                .createSignedUrl(audioFile, 60);

            if (error) {
                throw error;
            }

            if (!data?.signedUrl) {
                throw new Error('No signed URL returned');
            }

            // Cache the URL
            this.signedUrls.set(audioFile, {
                url: data.signedUrl,
                timestamp: Date.now()
            });

            return data.signedUrl;
        } catch (error) {
            console.error('Error getting signed URL:', error);
            throw error;
        }
    }

    // Load and play a track
    async playTrack(track) {
        try {
            if (!track.audioFile) {
                throw new Error('Track has no audio file');
            }

            // Stop current track if playing
            if (this.currentTrack) {
                this.pause();
            }

            this.currentTrack = track;
            const audio = this.getAudioElement(track.id);
            
            // Get signed URL for the audio file
            const signedUrl = await this.getSignedUrl(track.audioFile);
            
            // Set audio source if not already set or if URL changed
            if (audio.src !== signedUrl) {
                audio.src = signedUrl;
            }

            // Play the audio
            await audio.play();
            this.isPlaying = true;

            // Trigger callback
            if (this.onTrackChange) {
                this.onTrackChange(track);
            }

            return true;
        } catch (error) {
            console.error('Error playing track:', error);
            throw error;
        }
    }

    // Pause current track
    pause() {
        if (this.currentTrack) {
            const audio = this.getAudioElement(this.currentTrack.id);
            audio.pause();
            this.isPlaying = false;
        }
    }

    // Resume current track
    resume() {
        if (this.currentTrack) {
            const audio = this.getAudioElement(this.currentTrack.id);
            audio.play();
            this.isPlaying = true;
        }
    }

    // Stop current track
    stop() {
        if (this.currentTrack) {
            const audio = this.getAudioElement(this.currentTrack.id);
            audio.pause();
            audio.currentTime = 0;
            this.isPlaying = false;
        }
    }

    // Set volume (0-1)
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.audioElements.forEach(audio => {
            audio.volume = this.volume;
        });
    }

    // Mute/unmute
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.audioElements.forEach(audio => {
            audio.muted = this.isMuted;
        });
    }

    // Seek to position (0-1)
    seek(position) {
        if (this.currentTrack) {
            const audio = this.getAudioElement(this.currentTrack.id);
            if (audio.duration) {
                audio.currentTime = position * audio.duration;
            }
        }
    }

    // Get current playback position (0-1)
    getCurrentPosition() {
        if (this.currentTrack) {
            const audio = this.getAudioElement(this.currentTrack.id);
            if (audio.duration) {
                return audio.currentTime / audio.duration;
            }
        }
        return 0;
    }

    // Get current time and duration
    getTimeInfo() {
        if (this.currentTrack) {
            const audio = this.getAudioElement(this.currentTrack.id);
            return {
                currentTime: audio.currentTime,
                duration: audio.duration,
                position: audio.duration ? audio.currentTime / audio.duration : 0
            };
        }
        return { currentTime: 0, duration: 0, position: 0 };
    }

    // Set playlist
    setPlaylist(tracks, startIndex = 0) {
        this.playlist = tracks;
        this.currentIndex = startIndex;
    }

    // Play next track
    async playNext() {
        if (this.playlist.length === 0) return;

        let nextIndex = this.currentIndex + 1;
        
        if (nextIndex >= this.playlist.length) {
            if (this.repeatMode === 'all') {
                nextIndex = 0;
            } else {
                if (this.onPlaylistEnd) {
                    this.onPlaylistEnd();
                }
                return;
            }
        }

        this.currentIndex = nextIndex;
        await this.playTrack(this.playlist[this.currentIndex]);
    }

    // Play previous track
    async playPrevious() {
        if (this.playlist.length === 0) return;

        let prevIndex = this.currentIndex - 1;
        
        if (prevIndex < 0) {
            if (this.repeatMode === 'all') {
                prevIndex = this.playlist.length - 1;
            } else {
                return;
            }
        }

        this.currentIndex = prevIndex;
        await this.playTrack(this.playlist[this.currentIndex]);
    }

    // Toggle shuffle
    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        // TODO: Implement shuffle logic
    }

    // Toggle repeat mode
    toggleRepeat() {
        const modes = ['none', 'one', 'all'];
        const currentIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIndex + 1) % modes.length];
    }

    // Event handlers
    handleLoadStart(trackId) {
        console.log(`Loading started for track ${trackId}`);
    }

    handleLoadedMetadata(trackId) {
        console.log(`Metadata loaded for track ${trackId}`);
    }

    handleCanPlay(trackId) {
        console.log(`Can play track ${trackId}`);
    }

    handlePlay(trackId) {
        console.log(`Playing track ${trackId}`);
        this.isPlaying = true;
    }

    handlePause(trackId) {
        console.log(`Paused track ${trackId}`);
        this.isPlaying = false;
    }

    handleEnded(trackId) {
        console.log(`Ended track ${trackId}`);
        this.isPlaying = false;
        
        if (this.repeatMode === 'one') {
            // Repeat current track
            const audio = this.getAudioElement(trackId);
            audio.currentTime = 0;
            audio.play();
        } else {
            // Play next track
            this.playNext();
        }
    }

    handleTimeUpdate(trackId) {
        // This fires frequently, so we don't log it
        // Can be used to update UI progress
    }

    handleError(trackId, error) {
        console.error(`Error playing track ${trackId}:`, error);
        // Try to play next track on error
        this.playNext();
    }

    // Clean up resources
    cleanup() {
        this.audioElements.forEach(audio => {
            audio.pause();
            audio.src = '';
        });
        this.audioElements.clear();
        this.signedUrls.clear();
    }
}
