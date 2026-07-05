/* ==========================================================================
   AI.JS
   GROQ Chat Completions integration (vanilla JS, no backend).

   Responsibilities implemented here:
   - Talk to the GROQ Chat Completions API using `Authorization: Bearer` header
   - Abort previous request when a new one starts
   - Prevent duplicate identical requests returning duplicate network traffic
   - Retry once on temporary network/server failures
   - Map HTTP errors (401/403/429/5xx) to user-friendly messages
   - Avoid printing or logging the API key
   - Disable the explain/summarize UI buttons while requests are in-flight
   - Never modify HTML structure or CSS files
   ========================================================================== */

const AI = (function () {
  let currentController = null;
  let inFlightPromise = null;
  let lastRequestHash = null;

  const DEFAULT_TIMEOUT = 30000; // ms
  const RETRY_DELAY = 900; // ms

  function safeHash(input) {
    // Quick stable hash for duplicate detection (not cryptographic)
    let s = typeof input === "string" ? input : JSON.stringify(input);
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h << 5) - h + s.charCodeAt(i);
      h |= 0;
    }
    return String(h);
  }

  function disableActionButtons(disabled) {
    try {
      const e = document.getElementById("explainBtn");
      const s = document.getElementById("summarizeBtn");
      if (e) e.disabled = disabled;
      if (s) s.disabled = disabled;
    } catch (_) {}
  }

  function mapStatusToMessage(status) {
    switch (status) {
      case 401:
        return "Unauthorized — the API key appears invalid. Check `js/config.js`.";
      case 403:
        return "Access denied — your key doesn't have permission to use this model.";
      case 429:
        return "Rate limit exceeded — please wait a moment and try again.";
      case 500:
      case 502:
      case 503:
      case 504:
        return "Server error — the AI service is temporarily unavailable. Try again shortly.";
      default:
        return `Request failed (${status}).`;
    }
  }

  async function doFetchWithRetry(body, opts, retry = true) {
    try {
      const res = await fetch(CONFIG.GROQ_ENDPOINT, opts);
      if (!res.ok) {
        // for temporary server errors consider retry
        if (retry && [502, 503, 504].includes(res.status)) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY));
          return doFetchWithRetry(body, opts, false);
        }
        const errBody = await res.json().catch(() => ({}));
        const message = errBody?.error?.message || mapStatusToMessage(res.status);
        const error = new Error(message);
        error.status = res.status;
        throw error;
      }
      return res.json().catch(() => ({}));
    } catch (err) {
      // network error (TypeError) — retry once
      if (retry && (err instanceof TypeError || err.name === "FetchError")) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
        return doFetchWithRetry(body, opts, false);
      }
      throw err;
    }
  }

  async function _generate(prompt, { timeout = DEFAULT_TIMEOUT } = {}) {
    if (!CONFIG.GROQ_API_KEY || CONFIG.GROQ_API_KEY === "YOUR_GROQ_API_KEY_HERE") {
      throw new Error("Missing GROQ API key. Add your key in js/config.js.");
    }

    const requestHash = safeHash(prompt + CONFIG.GROQ_MODEL);
    if (requestHash === lastRequestHash && inFlightPromise) {
      // Prevent duplicate requests: return existing promise
      return inFlightPromise;
    }

    // Abort previous request if running
    if (currentController) {
      try { currentController.abort(); } catch (_) {}
      currentController = null;
    }

    currentController = new AbortController();
    const signal = currentController.signal;

    // Build OpenAI-compatible chat completion body for GROQ endpoint
    const body = {
      model: CONFIG.GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 1024,
    };

    const opts = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CONFIG.GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal,
    };

    // Disable UI action buttons while request in flight
    disableActionButtons(true);

    const timeoutId = setTimeout(() => {
      try { currentController.abort(); } catch (_) {}
    }, timeout);

    // Save promise so duplicate calls reuse it
    inFlightPromise = (async () => {
      try {
        const data = await doFetchWithRetry(body, opts, true);

        // Try multiple possible response shapes
        const text =
          data?.choices?.[0]?.message?.content ||
          (typeof data?.choices?.[0]?.text === "string" ? data.choices[0].text : null) ||
          data?.choices?.[0]?.delta?.content ||
          null;

        if (!text) {
          throw new Error("The AI didn't return a usable response. Please try again.");
        }
        return String(text).trim();
      } finally {
        // cleanup handled below in finally block of outer try
      }
    })();

    try {
      const result = await inFlightPromise;
      return result;
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error("Request timed out or was canceled.");
      }
      // If the error has a status we already mapped it in doFetchWithRetry
      throw err;
    } finally {
      clearTimeout(timeoutId);
      currentController = null;
      inFlightPromise = null;
      lastRequestHash = requestHash; // remember last request
      // Re-enable UI action buttons
      disableActionButtons(false);
    }
  }

  // Public helper methods that mirror previous API (explain/summarize)
  async function explain(sourceText) {
    const prompt = `You are AccessAI, an assistant that helps people understand confusing documents.\nRewrite the following text in short, plain, simple language, as if explaining it to someone with no background in law, medicine, or government. Avoid jargon. Use short sentences. Keep the meaning fully accurate. Do not add information that isn't in the original text.\n\nText to explain:\n"""\n${sourceText}\n"""\n\nPlain-language explanation:`;
    return _generate(prompt);
  }

  async function summarize(sourceText) {
    const prompt = `You are AccessAI, an assistant that helps people understand confusing documents.\nReturn ONLY 3-5 short bullet points (use the bullet character • at the start of each line) capturing only the most important information a reader needs to know or act on. Use plain language. Do NOT include any introductory phrases, headings, labels, or commentary (no "Summary:", "Here is", "Below are", or mention of the number of bullets).\n\nText to summarize:\n"""\n${sourceText}\n"""\n\n`; 
    return _generate(prompt);
  }

  async function simplify(sourceText) {
    const prompt = `Simplify the following text into very short, plain sentences for a reader with limited literacy. Keep the exact meaning. Do not add information.\n\nText:\n"""\n${sourceText}\n"""\n\nSimplified:`;
    return _generate(prompt);
  }

  async function translate(text, targetLanguage) {
    if (!targetLanguage) return text;
    const prompt = `Translate the following text into ${targetLanguage}. Keep the tone simple and plain, exactly as it is in the original. Only return the translated text, with no extra notes, labels, or commentary.\n\nText:\n"""\n${text}\n"""\n\nTranslation:`;
    return _generate(prompt);
  }

  async function smartResponse(promptText) {
    const prompt = `You are AccessAI. Provide a concise, helpful response to this user input, keeping answers short and actionable.\n\nUser input:\n"""\n${promptText}\n"""\n\nResponse:`;
    return _generate(prompt);
  }

  return {
    _generate,
    explain,
    summarize,
    simplify,
    translate,
    smartResponse,
  };
})();
