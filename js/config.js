/* ==========================================================================
   CONFIG.JS
   Central place for API keys and constants.

  ⚠️ IMPORTANT — before running the AI Workspace:
  1. Get a GROQ API key from your provider.
  2. Paste it below as GROQ_API_KEY.
   3. Never commit a real API key to a public GitHub repo.
   ========================================================================== */

const CONFIG = {
  // Paste your GROQ API key between the quotes below.
  GROQ_API_KEY: "YOUR_GROQ_API_KEY",

  // GROQ model + endpoint (official)
  GROQ_MODEL: "llama-3.3-70b-versatile",
  GROQ_ENDPOINT: "https://api.groq.com/openai/v1/chat/completions",

  // localStorage keys
  STORAGE_KEY_HISTORY: "accessai_history",
  STORAGE_KEY_THEME: "accessai_theme",

  // History settings
  MAX_HISTORY_ITEMS: 8,

  // OCR settings
  TESSERACT_LANG: "eng",
};
