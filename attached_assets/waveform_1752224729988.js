// Waveform visualization module
export class WaveformVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas?.getContext('2d');
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.animationId = null;
        this.isPlaying = false;
        this.dataArray = null;
        this.bufferLength = 0;
        
        this.settings = {
            barWidth: 2,
            barSpacing: 1,
            barColor: '#6366f1',
            backgroundColor: 'transparent',
            smoothing: 0.8,
            minHeight: 2,
            maxHeight: 50
        };

        this.init();
    }

    init() {
        if (!this.canvas || !this.ctx) {
            console.warn('Waveform canvas not found');
            return;
        }

        this.setupCanvas();
        this.setupAudioContext();
    }

    setupCanvas() {
        // Set canvas size
        this.resizeCanvas();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }

    resizeCanvas() {
        if (!this.canvas) return;

        const rect = this.canvas.getBoundingClientRect();
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * devicePixelRatio;
        this.canvas.height = rect.height * devicePixelRatio;
        
        this.ctx.scale(devicePixelRatio, devicePixelRatio);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    setupAudioContext() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.analyser = this.audioContext.createAnalyser();
            
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = this.settings.smoothing;
            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }

    loadAudio(audioElement) {
        if (!this.audioContext || !this.analyser) return;

        try {
            // Disconnect previous source if exists
            if (this.source) {
                this.source.disconnect();
            }

            // Create new source
            this.source = this.audioContext.createMediaElementSource(audioElement);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
        } catch (error) {
            console.warn('Failed to connect audio source:', error);
        }
    }

    start() {
        if (!this.analyser || this.isPlaying) return;

        this.isPlaying = true;
        this.animate();
    }

    stop() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.drawStatic();
    }

    animate() {
        if (!this.isPlaying || !this.analyser) return;

        this.animationId = requestAnimationFrame(() => this.animate());
        
        this.analyser.getByteFrequencyData(this.dataArray);
        this.draw();
    }

    draw() {
        if (!this.ctx || !this.canvas) return;

        const canvasWidth = this.canvas.width / (window.devicePixelRatio || 1);
        const canvasHeight = this.canvas.height / (window.devicePixelRatio || 1);

        // Clear canvas
        this.ctx.fillStyle = this.settings.backgroundColor;
        this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        if (!this.dataArray) {
            this.drawStatic();
            return;
        }

        const barCount = Math.floor(canvasWidth / (this.settings.barWidth + this.settings.barSpacing));
        const dataStep = Math.floor(this.bufferLength / barCount);

        this.ctx.fillStyle = this.settings.barColor;

        for (let i = 0; i < barCount; i++) {
            const dataIndex = i * dataStep;
            const amplitude = this.dataArray[dataIndex] || 0;
            
            // Normalize amplitude
            const normalizedAmplitude = amplitude / 255;
            
            // Calculate bar height
            const barHeight = Math.max(
                this.settings.minHeight,
                normalizedAmplitude * this.settings.maxHeight
            );

            // Calculate position
            const x = i * (this.settings.barWidth + this.settings.barSpacing);
            const y = (canvasHeight - barHeight) / 2;

            // Draw bar
            this.ctx.fillRect(x, y, this.settings.barWidth, barHeight);
        }
    }

    drawStatic() {
        if (!this.ctx || !this.canvas) return;

        const canvasWidth = this.canvas.width / (window.devicePixelRatio || 1);
        const canvasHeight = this.canvas.height / (window.devicePixelRatio || 1);

        // Clear canvas
        this.ctx.fillStyle = this.settings.backgroundColor;
        this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw static waveform
        const barCount = Math.floor(canvasWidth / (this.settings.barWidth + this.settings.barSpacing));
        
        this.ctx.fillStyle = this.settings.barColor;
        this.ctx.globalAlpha = 0.3;

        for (let i = 0; i < barCount; i++) {
            // Generate pseudo-random heights for static display
            const randomHeight = Math.random() * this.settings.maxHeight * 0.5 + this.settings.minHeight;
            
            const x = i * (this.settings.barWidth + this.settings.barSpacing);
            const y = (canvasHeight - randomHeight) / 2;

            this.ctx.fillRect(x, y, this.settings.barWidth, randomHeight);
        }

        this.ctx.globalAlpha = 1;
    }

    // Alternative circular waveform
    drawCircular() {
        if (!this.ctx || !this.canvas || !this.dataArray) return;

        const canvasWidth = this.canvas.width / (window.devicePixelRatio || 1);
        const canvasHeight = this.canvas.height / (window.devicePixelRatio || 1);
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const radius = Math.min(centerX, centerY) * 0.8;

        // Clear canvas
        this.ctx.fillStyle = this.settings.backgroundColor;
        this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        this.ctx.strokeStyle = this.settings.barColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        const angleStep = (Math.PI * 2) / this.bufferLength;

        for (let i = 0; i < this.bufferLength; i++) {
            const amplitude = this.dataArray[i] / 255;
            const angle = i * angleStep;
            const distance = radius + (amplitude * 20);

            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.closePath();
        this.ctx.stroke();
    }

    // Update settings
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        if (this.analyser) {
            this.analyser.smoothingTimeConstant = this.settings.smoothing;
        }
    }

    // Get current frequency data for external use
    getFrequencyData() {
        if (!this.analyser || !this.dataArray) return null;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        return Array.from(this.dataArray);
    }

    // Get time domain data
    getTimeDomainData() {
        if (!this.analyser) return null;
        
        const dataArray = new Uint8Array(this.bufferLength);
        this.analyser.getByteTimeDomainData(dataArray);
        return Array.from(dataArray);
    }

    // Cleanup
    destroy() {
        this.stop();
        
        if (this.source) {
            this.source.disconnect();
        }
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
    }

    // Preset configurations
    static presets = {
        default: {
            barWidth: 2,
            barSpacing: 1,
            barColor: '#6366f1',
            smoothing: 0.8,
            minHeight: 2,
            maxHeight: 50
        },
        minimal: {
            barWidth: 1,
            barSpacing: 2,
            barColor: '#ffffff',
            smoothing: 0.9,
            minHeight: 1,
            maxHeight: 30
        },
        retro: {
            barWidth: 4,
            barSpacing: 2,
            barColor: '#ff6b6b',
            smoothing: 0.6,
            minHeight: 3,
            maxHeight: 60
        },
        neon: {
            barWidth: 3,
            barSpacing: 1,
            barColor: '#00ffff',
            smoothing: 0.7,
            minHeight: 2,
            maxHeight: 45
        }
    };

    loadPreset(presetName) {
        const preset = WaveformVisualizer.presets[presetName];
        if (preset) {
            this.updateSettings(preset);
        }
    }
}
