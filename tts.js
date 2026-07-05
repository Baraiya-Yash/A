/* ==========================================================================
   TTS.JS
   Text-to-speech using the browser's built-in Web Speech API.
   No external service or API key required.
   ========================================================================== */

const TTS = {
  _utterance: null,
  _paused: false,

  /** Returns true if the browser supports speech synthesis. */
  isSupported() {
    return "speechSynthesis" in window;
  },

  /** Speaks `text` aloud. Cancels any speech already in progress first. */
  speak(text, { lang = "en-US", rate = 1, onEnd } = {}) {
    if (!this.isSupported()) {
      showToast("Text-to-speech isn't supported in this browser.");
      return;
    }
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.onend = () => {
      if (typeof onEnd === "function") onEnd();
    };
    utterance.onerror = (event) => {
      console.error("TTS error:", event);
      if (typeof onEnd === "function") onEnd();
    };

    this._utterance = utterance;
    window.speechSynthesis.speak(utterance);
    this._paused = false;
  },

  /** Stops any speech currently playing. */
  stop() {
    if (this.isSupported() && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    this._paused = false;
  },

  /** True while speech is actively playing. */
  isSpeaking() {
    return this.isSupported() && window.speechSynthesis.speaking;
  },

  /** Pause speech if supported and currently speaking. */
  pause() {
    if (!this.isSupported()) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      this._paused = true;
    }
  },

  /** Resume previously paused speech. */
  resume() {
    if (!this.isSupported()) return;
    if (this._paused && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      this._paused = false;
    }
  },

  /** True if speech is currently paused. */
  isPaused() {
    return !!this._paused;
  },
};
