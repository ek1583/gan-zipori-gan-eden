// ===== Text-to-Speech Engine =====
const TTS = {
    enabled: true,
    speaking: false,

    init() {
        const settings = Storage.getSettings();
        this.enabled = settings.soundEnabled;
        this.updateButton();
    },

    speak(text) {
        if (!this.enabled || !text) return;
        if (!('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'he-IL';
        utterance.rate = 0.9;
        utterance.pitch = 1.1;

        // Try to find Hebrew voice
        const voices = window.speechSynthesis.getVoices();
        const hebrewVoice = voices.find(v => v.lang.startsWith('he'));
        if (hebrewVoice) {
            utterance.voice = hebrewVoice;
        }

        utterance.onstart = () => { this.speaking = true; };
        utterance.onend = () => { this.speaking = false; };
        utterance.onerror = () => { this.speaking = false; };

        window.speechSynthesis.speak(utterance);
    },

    toggle() {
        this.enabled = !this.enabled;
        const settings = Storage.getSettings();
        settings.soundEnabled = this.enabled;
        Storage.saveSettings(settings);
        this.updateButton();

        if (!this.enabled) {
            window.speechSynthesis.cancel();
        }
    },

    updateButton() {
        const btn = document.getElementById('btn-sound');
        if (!btn) return;
        const icon = btn.querySelector('.sound-icon');
        if (this.enabled) {
            btn.classList.remove('sound-off');
            btn.classList.add('sound-on');
            if (icon) icon.textContent = '🔊';
        } else {
            btn.classList.remove('sound-on');
            btn.classList.add('sound-off');
            if (icon) icon.textContent = '🔇';
        }
    },

    // Preload voices
    preload() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.getVoices();
            };
        }
    }
};
