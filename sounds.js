// PathFinder Pro - Sound System
class SoundManager {
    constructor() {
        this.enabled = true;
        this.volume = 0.3;
        this.sounds = {};
        this.audioContext = null;
        
        this.initializeAudioContext();
        this.createSounds();
        this.setupVolumeControl();
    }

    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }

    createSounds() {
        // Create synthetic sounds using Web Audio API
        this.sounds = {
            click: () => this.createTone(800, 0.1, 'square'),
            wallPlace: () => this.createTone(400, 0.15, 'sawtooth'),
            wallRemove: () => this.createTone(600, 0.1, 'sine'),
            startMove: () => this.createTone(523, 0.2, 'sine'), // C5
            endMove: () => this.createTone(659, 0.2, 'sine'), // E5
            algorithmStart: () => this.createChord([261, 329, 392], 0.3), // C major
            pathFound: () => this.createSuccessSound(),
            nodeVisited: () => this.createTone(1000, 0.05, 'sine'),
            mazeGenerate: () => this.createMazeSound(),
            buttonHover: () => this.createTone(1200, 0.05, 'sine'),
            tabSwitch: () => this.createTone(880, 0.1, 'triangle'),
            error: () => this.createErrorSound(),
            reset: () => this.createResetSound()
        };
    }

    createTone(frequency, duration, waveType = 'sine') {
        if (!this.audioContext || !this.enabled) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = waveType;

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    createChord(frequencies, duration) {
        if (!this.audioContext || !this.enabled) return;

        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.createTone(freq, duration, 'sine');
            }, index * 50);
        });
    }

    createSuccessSound() {
        if (!this.audioContext || !this.enabled) return;

        // Play ascending notes
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, index) => {
            setTimeout(() => {
                this.createTone(freq, 0.3, 'sine');
            }, index * 100);
        });
    }

    createMazeSound() {
        if (!this.audioContext || !this.enabled) return;

        // Create a sweeping sound
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                this.createTone(200 + i * 50, 0.1, 'sawtooth');
            }, i * 30);
        }
    }

    createErrorSound() {
        if (!this.audioContext || !this.enabled) return;

        // Descending error sound
        const frequencies = [400, 350, 300, 250];
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.createTone(freq, 0.2, 'square');
            }, index * 100);
        });
    }

    createResetSound() {
        if (!this.audioContext || !this.enabled) return;

        // Quick descending sweep
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.createTone(800 - i * 100, 0.1, 'triangle');
            }, i * 50);
        }
    }

    play(soundName) {
        if (!this.enabled || !this.sounds[soundName]) return;

        try {
            // Resume audio context if suspended (required by some browsers)
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            this.sounds[soundName]();
        } catch (error) {
            console.warn('Error playing sound:', error);
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    setupVolumeControl() {
        // Add volume control to the UI
        const volumeControl = document.createElement('div');
        volumeControl.className = 'volume-control';
        volumeControl.innerHTML = `
            <div class="volume-slider-container">
                <i class="fas fa-volume-up volume-icon"></i>
                <input type="range" id="volume-slider" min="0" max="1" step="0.1" value="${this.volume}" class="volume-slider">
                <button id="mute-btn" class="mute-btn">
                    <i class="fas fa-volume-up"></i>
                </button>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .volume-control {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                border: 1px solid #00d4ff;
                border-radius: 25px;
                padding: 0.5rem 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .volume-slider-container {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .volume-icon {
                color: #00d4ff;
                font-size: 0.9rem;
            }

            .volume-slider {
                width: 80px;
                height: 4px;
                background: linear-gradient(90deg, #ff6b6b, #00d4ff);
                border-radius: 2px;
                outline: none;
                -webkit-appearance: none;
            }

            .volume-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 12px;
                height: 12px;
                background: #00d4ff;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 0 5px rgba(0, 212, 255, 0.8);
            }

            .mute-btn {
                background: transparent;
                border: 1px solid #00d4ff;
                color: #00d4ff;
                padding: 0.3rem;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.3s ease;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .mute-btn:hover {
                background: #00d4ff;
                color: #000;
            }

            .mute-btn.muted {
                background: #ff6b6b;
                border-color: #ff6b6b;
                color: #fff;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(volumeControl);

        // Bind events
        const volumeSlider = document.getElementById('volume-slider');
        const muteBtn = document.getElementById('mute-btn');

        volumeSlider.addEventListener('input', (e) => {
            this.setVolume(parseFloat(e.target.value));
            this.play('click'); // Test sound
        });

        muteBtn.addEventListener('click', () => {
            const isEnabled = this.toggle();
            muteBtn.classList.toggle('muted', !isEnabled);
            muteBtn.innerHTML = isEnabled ? 
                '<i class="fas fa-volume-up"></i>' : 
                '<i class="fas fa-volume-mute"></i>';
        });
    }

    // Method to play ambient background music
    playAmbientMusic() {
        if (!this.audioContext || !this.enabled) return;

        const playNote = (frequency, startTime, duration) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(frequency, startTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.1, startTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };

        // Ambient chord progression
        const chords = [
            [261, 329, 392], // C major
            [294, 369, 440], // D minor
            [329, 415, 493], // E minor
            [349, 440, 523]  // F major
        ];

        let currentTime = this.audioContext.currentTime;
        chords.forEach((chord, chordIndex) => {
            chord.forEach(frequency => {
                playNote(frequency, currentTime + chordIndex * 4, 3.8);
            });
        });

        // Schedule next iteration
        setTimeout(() => {
            if (this.enabled) {
                this.playAmbientMusic();
            }
        }, 16000);
    }
}

// Initialize sound manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.soundManager = new SoundManager();
    
    // Start ambient music after user interaction
    let musicStarted = false;
    const startMusic = () => {
        if (!musicStarted) {
            window.soundManager.playAmbientMusic();
            musicStarted = true;
            document.removeEventListener('click', startMusic);
            document.removeEventListener('keydown', startMusic);
        }
    };
    
    document.addEventListener('click', startMusic);
    document.addEventListener('keydown', startMusic);
});
