/* ==========================================================================
   STORAGE.JS
   Wraps localStorage for saving recent document history, entirely on-device.
   ========================================================================== */

const HistoryStore = {
  /** Returns the full history array, newest first. Never throws. */
  getAll() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEY_HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error("HistoryStore.getAll failed:", err);
      return [];
    }
  },

  /**
   * Adds a new entry to history and trims it to CONFIG.MAX_HISTORY_ITEMS.
   * entry: { id, createdAt, sourceText, explanation, summary, thumbnail }
   */
  add(entry) {
    try {
      const items = this.getAll();
      items.unshift(entry);
      const trimmed = items.slice(0, CONFIG.MAX_HISTORY_ITEMS);
      localStorage.setItem(CONFIG.STORAGE_KEY_HISTORY, JSON.stringify(trimmed));
      return trimmed;
    } catch (err) {
      console.error("HistoryStore.add failed:", err);
      showToast("Couldn't save to history (storage may be full).");
      return this.getAll();
    }
  },

  /** Returns a single history entry by id, or null if not found. */
  getById(id) {
    return this.getAll().find((item) => item.id === id) || null;
  },

  /** Removes everything from history. */
  clear() {
    try {
      localStorage.removeItem(CONFIG.STORAGE_KEY_HISTORY);
    } catch (err) {
      console.error("HistoryStore.clear failed:", err);
    }
  },
};

const ThemeStore = {
  get() {
    try {
      return localStorage.getItem(CONFIG.STORAGE_KEY_THEME);
    } catch {
      return null;
    }
  },
  set(theme) {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY_THEME, theme);
    } catch (err) {
      console.error("ThemeStore.set failed:", err);
    }
  },
};
