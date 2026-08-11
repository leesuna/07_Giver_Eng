/**
 * TTS (Text-to-Speech) Audio Engine wrapper for Web Speech API
 */

class TTSEngine {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voice = null;
    this.rate = 1.0;
    this.pitch = 1.0;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.onSentenceStart = null;
    this.onSentenceEnd = null;
    this.onStateChange = null;

    this.initVoices();
  }

  initVoices() {
    if (!this.synth) return;
    
    const loadVoices = () => {
      const voices = this.synth.getVoices();
      // Select best English voice (US or UK preferred)
      const englishVoices = voices.filter(v => v.lang.startsWith('en'));
      const preferred = englishVoices.find(v => 
        v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('Natural')
      ) || englishVoices[0] || voices[0];
      
      this.voice = preferred;
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  setRate(newRate) {
    this.rate = parseFloat(newRate) || 1.0;
  }

  speakSentence(text, options = {}) {
    if (!this.synth) return;
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) utterance.voice = this.voice;
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;

    utterance.onstart = () => {
      this.isPlaying = true;
      this.isPaused = false;
      this.currentUtterance = utterance;
      if (options.onStart) options.onStart();
      if (this.onSentenceStart) this.onSentenceStart(text);
      if (this.onStateChange) this.onStateChange(true);
    };

    utterance.onend = () => {
      this.isPlaying = false;
      this.isPaused = false;
      this.currentUtterance = null;
      if (options.onEnd) options.onEnd();
      if (this.onSentenceEnd) this.onSentenceEnd(text);
      if (this.onStateChange) this.onStateChange(false);
    };

    utterance.onerror = (e) => {
      console.warn('TTS Speech error:', e);
      this.isPlaying = false;
      this.isPaused = false;
      this.currentUtterance = null;
      if (options.onError) options.onError(e);
      if (this.onStateChange) this.onStateChange(false);
    };

    this.synth.speak(utterance);
  }

  speakWord(word) {
    if (!word) return;
    const cleanWord = word.toLowerCase().trim().replace(/[^a-z'-]/g, '');
    if (!cleanWord) return;

    let played = false;

    // 1. Try direct Audio URL first for natural human pronunciation
    try {
      const audioUrl = `https://dict.youdao.com/dictvoice?type=2&audio=${encodeURIComponent(cleanWord)}`;
      const audio = new Audio(audioUrl);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          played = true;
        }).catch(() => {
          this.speakWordWithSynth(cleanWord);
        });
      }
    } catch (e) {
      this.speakWordWithSynth(cleanWord);
    }

    // Backup trigger if Audio API stalls
    setTimeout(() => {
      if (!played) {
        this.speakWordWithSynth(cleanWord);
      }
    }, 600);
  }

  speakWordWithSynth(word) {
    if (!this.synth) return;
    try {
      this.synth.cancel(); // Clear any stuck speech queue in Chrome/Edge

      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';

      if (!this.voice) {
        const voices = this.synth.getVoices();
        const englishVoices = voices.filter(v => v.lang.startsWith('en'));
        this.voice = englishVoices.find(v => 
          v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('Natural')
        ) || englishVoices[0] || voices[0];
      }

      if (this.voice) {
        utterance.voice = this.voice;
      }

      utterance.rate = 0.85;
      utterance.pitch = 1.0;

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis speakWord error:', e);
    }
  }

  pause() {
    if (this.synth && this.isPlaying) {
      this.synth.pause();
      this.isPaused = true;
      if (this.onStateChange) this.onStateChange(false);
    }
  }

  resume() {
    if (this.synth && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
      this.isPlaying = true;
      if (this.onStateChange) this.onStateChange(true);
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isPlaying = false;
      this.isPaused = false;
      this.currentUtterance = null;
      if (this.onStateChange) this.onStateChange(false);
    }
  }
}

export const ttsEngine = new TTSEngine();
