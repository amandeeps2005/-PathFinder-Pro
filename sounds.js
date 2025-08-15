// PathFinder Pro - Sound System
class SoundManager {
    constructor() {
        this.enabled = true;
        this.volume = 0.3; // Fixed volume
        this.sounds = {};
        this.audioContext = null;
        this.masterGain = null;
        
        this.initializeAudioContext();
        this.createSounds();
    }

    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (this.audioContext) {
                this.masterGain = this.audioContext.createGain();
                this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
                this.masterGain.connect(this.audioContext.destination);
            }
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
        gainNode.connect(this.masterGain);

        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = waveType;

        // Individual sound gain - masterGain will control the overall volume
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(1.0, this.audioContext.currentTime + 0.01); // Full volume for the tone
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

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    // Method to play ambient background music
    playAmbientMusic() {
        if (!this.audioContext || !this.enabled) return;

        const playNote = (frequency, startTime, duration) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);

            oscillator.frequency.setValueAtTime(frequency, startTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.1); // Ambient music is quieter
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
