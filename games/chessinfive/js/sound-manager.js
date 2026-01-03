/**
 * SOUND MANAGER
 * Handles all game sounds using Howler.js
 */

const SoundManager = {
    enabled: true,

    sounds: {},

    /**
     * Initialize sound manager
     */
    init() {
        // Create sounds using Howler.js with simple base64 encoded tones
        this.sounds = {
            place: new Howl({
                src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmckBTOLzu63dyMFl2us'],
                volume: 0.4
            }),
            move: new Howl({
                src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmckBTOLzu63dyMFl2us'],
                volume: 0.3,
                rate: 1.2
            }),
            select: new Howl({
                src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmckBTOLzu63dyMFl2us'],
                volume: 0.2,
                rate: 1.5
            }),
            invalid: new Howl({
                src: ['data:audio/wav;base64,UklGRhQDAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YfACAAC4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4QEBAQEBAQEBAQEBAQEBAQEBAuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4QEBAQEBAQEBAQEBAQEBAQEBA'],
                volume: 0.3
            }),
            win: new Howl({
                src: ['data:audio/wav;base64,UklGRhQEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YfADAADIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg'],
                volume: 0.6
            }),
            phase_change: new Howl({
                src: ['data:audio/wav;base64,UklGRhQEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YfADAADIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg'],
                volume: 0.5,
                rate: 0.8
            })
        };

        // Load sound preference from localStorage
        const savedPref = localStorage.getItem('chessinfiveSound');
        if (savedPref === 'disabled') {
            this.enabled = false;
        }

        console.log('🔊 Sound manager initialized');
    },

    /**
     * Play a sound
     */
    play(soundName) {
        if (!this.enabled) return;
        if (!this.sounds[soundName]) {
            console.warn('⚠️ Sound not found:', soundName);
            return;
        }

        this.sounds[soundName].play();
    },

    /**
     * Toggle sound on/off
     */
    toggle() {
        this.enabled = !this.enabled;

        // Save preference
        localStorage.setItem('chessinfiveSound', this.enabled ? 'enabled' : 'disabled');

        console.log('🔊 Sound', this.enabled ? 'enabled' : 'disabled');

        // Reproducir sonido de confirmación al activar
        if (this.enabled) {
            this.play('select');
        }

        return this.enabled;
    },

    /**
     * Check if sound is enabled
     */
    isEnabled() {
        return this.enabled;
    }
};
