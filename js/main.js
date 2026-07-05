/* ==========================================================================
   MAIN.JS
   App entry point. Wires up navigation, theme toggling (shared across all
   pages), and the AI Workspace page logic. Every DOM lookup is guarded so
   this single file can safely run on every page without errors.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNav();
  initWorkspace();
  initContactForm();
});

/* ==========================================================================
   THEME (dark / light mode) — shared across every page
   ========================================================================== */
function initTheme() {
  const root = document.documentElement;
  const toggleBtn = qs("#themeToggle");

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const saved = ThemeStore.get();
  const initial = saved || (prefersDark ? "dark" : "light");
  applyTheme(initial);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      ThemeStore.set(next);
    });
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (toggleBtn) {
      toggleBtn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      toggleBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }
  }
}

/* ==========================================================================
   NAVIGATION — mobile menu toggle
   ========================================================================== */
function initNav() {
  const navToggle = qs("#navToggle");
  const navLinks = qs("#navLinks");
  if (!navToggle || !navLinks) return;

  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.classList.toggle("open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });

  // Close the mobile menu after a link is chosen
  qsa("a", navLinks).forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* ==========================================================================
   CONTACT FORM (contact.html) — client-side only, no backend
   ========================================================================== */
function initContactForm() {
  const form = qs("#contactForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const status = qs("#formStatus");
    if (!form.checkValidity()) {
      if (status) status.textContent = "Please fill in every field before sending.";
      return;
    }
    // No backend in this static build — acknowledge the message locally.
    if (status) status.textContent = "Thanks! Your message has been noted. We'll be in touch soon.";
    form.reset();
    showToast("Message sent!");
  });
}

/* ==========================================================================
   AI WORKSPACE (workspace.html)
   ========================================================================== */
function initWorkspace() {
  const dropzone = qs("#dropzone");
  if (!dropzone) return; // Not on this page — nothing else to do.

  // ---- Element references ----
  const fileInput = qs("#fileInput");
  const previewArea = qs("#previewArea");
  const imagePreview = qs("#imagePreview");
  const changeImageBtn = qs("#changeImageBtn");
  const ocrStatus = qs("#ocrStatus");
  const ocrOutput = qs("#ocrOutput");
  const explainBtn = qs("#explainBtn");
  const summarizeBtn = qs("#summarizeBtn");
  const clearBtn = qs("#clearBtn");
  const tabExplain = qs("#tabExplain");
  const tabSummary = qs("#tabSummary");
  const languageSelect = qs("#languageSelect");
  const resultOutput = qs("#resultOutput");
  const speakBtn = qs("#speakBtn");
  const copyBtn = qs("#copyBtn");
  const downloadBtn = qs("#downloadBtn");
  const historyList = qs("#historyList");
  const clearHistoryBtn = qs("#clearHistoryBtn");

  // ---- State ----
  let sourceText = "";
  let currentExplanation = "";
  let currentSummary = "";
  let activeTab = "explain"; // "explain" | "summary"

  renderHistory();

  // Populate translation dropdown with the exact language list required.
  if (languageSelect) {
    const languages = [
      "English",
      "Hindi",
      "Gujarati",
      "Marathi",
      "Tamil",
      "Telugu",
      "Kannada",
      "Malayalam",
      "Punjabi",
      "Bengali",
      "Urdu",
      "Spanish",
      "French",
      "German",
      "Japanese",
      "Chinese",
      "Arabic",
    ];
    languageSelect.innerHTML = "<option value=\"\">Translate to…</option>" +
      languages.map((l) => `<option value="${l}">${l}</option>`).join("");
  }

  /* ---- Upload: click / keyboard ---- */
  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });

  /* ---- Upload: drag & drop ---- */
  ["dragenter", "dragover"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add("drag-over");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove("drag-over");
    })
  );
  dropzone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  });

  /* ---- Upload: file picker ---- */
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  });

  changeImageBtn.addEventListener("click", () => fileInput.click());

  /* ---- Clear everything ---- */
  clearBtn.addEventListener("click", resetWorkspace);

  /* ---- Explain / Summarize ---- */
  explainBtn.addEventListener("click", () => runAIAction("explain"));
  summarizeBtn.addEventListener("click", () => runAIAction("summary"));

  /* ---- Result tabs ---- */
  tabExplain.addEventListener("click", () => switchTab("explain"));
  tabSummary.addEventListener("click", () => switchTab("summary"));

  /* ---- Translate ---- */
  languageSelect.addEventListener("change", async () => {
    const targetLang = languageSelect.value;
    const baseText = activeTab === "explain" ? currentExplanation : currentSummary;
    if (!baseText) return;

    // If no target or English selected, show the original text
    if (!targetLang || targetLang === "English") {
      renderResult(baseText);
      return;
    }
    try {
      setResultLoading();
      const translated = await Translate.translate(baseText, targetLang);
      renderResult(translated);
    } catch (err) {
      handleError(err, "Translation failed");
    }
  });

  /* ---- Listen / Copy / Download ---- */
  speakBtn.addEventListener("click", () => {
    const text = resultOutput.textContent.trim();
    if (!text) return;

    // Determine language code from selection when possible
    const langMap = {
      English: "en-US",
      Hindi: "hi-IN",
      Gujarati: "gu-IN",
      Marathi: "mr-IN",
      Tamil: "ta-IN",
      Telugu: "te-IN",
      Kannada: "kn-IN",
      Malayalam: "ml-IN",
      Punjabi: "pa-IN",
      Bengali: "bn-IN",
      Urdu: "ur-IN",
      Spanish: "es-ES",
      French: "fr-FR",
      German: "de-DE",
      Japanese: "ja-JP",
      Chinese: "zh-CN",
      Arabic: "ar-SA",
    };
    const selectedLang = (languageSelect && languageSelect.value) || "English";
    const langCode = langMap[selectedLang] || "en-US";

    // States: not speaking -> start; speaking -> pause; paused -> resume
    if (!TTS.isSpeaking() && !TTS.isPaused()) {
      setSpeakButtonState("speaking");
      TTS.speak(text, { lang: langCode, onEnd: () => setSpeakButtonState("idle") });
      return;
    }

    if (TTS.isSpeaking() && !TTS.isPaused()) {
      // Pause
      TTS.pause();
      setSpeakButtonState("paused");
      return;
    }

    if (TTS.isPaused()) {
      // Resume
      TTS.resume();
      setSpeakButtonState("speaking");
      return;
    }
  });

  copyBtn.addEventListener("click", async () => {
    const text = resultOutput.textContent.trim();
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      showToast("✓ Copied Successfully");
    } else {
      showToast("Couldn't copy — please copy manually.");
    }
  });

  downloadBtn.addEventListener("click", () => {
    const text = resultOutput.textContent.trim();
    if (!text) return;
    downloadTextFile(text, `response.txt`);
    showToast("Download started");
  });

  /* ---- History list interactions ---- */
  clearHistoryBtn.addEventListener("click", () => {
    HistoryStore.clear();
    renderHistory();
    showToast("History cleared");
  });

  /* ======================================================================
     CORE FLOWS
     ====================================================================== */

  /** Handles a newly chosen/dropped image file: preview + run OCR. */
  async function handleFile(file) {
    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file (JPG, PNG, or WEBP).");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    imagePreview.src = objectUrl;
    imagePreview.alt = `Preview of ${file.name}`;
    dropzone.hidden = true;
    previewArea.hidden = false;

    setOcrStatus("busy", "Reading document…");
    ocrOutput.innerHTML = renderSkeleton(4);
    resetResults();

    try {
      const text = await OCR.recognize(file, (progress) => {
        setOcrStatus("busy", `Reading document… ${Math.round(progress * 100)}%`);
      });
      sourceText = text;
      ocrOutput.textContent = text;
      setOcrStatus("ready", "Text extracted");
      explainBtn.disabled = false;
      summarizeBtn.disabled = false;
    } catch (err) {
      handleError(err, "Couldn't read this image");
      setOcrStatus("error", "Extraction failed");
      ocrOutput.innerHTML = `<p class="empty-state">${escapeHtml(err.message || "Please try a clearer photo.")}</p>`;
    }
  }

  /** Calls GROQ to explain or summarize the extracted text. */
  async function runAIAction(kind) {
    if (!sourceText) return;
    switchTab(kind);
    setResultLoading();

    try {
      const result = kind === "explain"
        ? await AI.explain(sourceText)
        : await AI.summarize(sourceText);

      if (kind === "explain") currentExplanation = result;
      else currentSummary = result;

      renderResult(result);
      enableResultActions(true);
      saveToHistory();
    } catch (err) {
      handleError(err, kind === "explain" ? "Explanation failed" : "Summary failed");
    }
  }

  /** Switches between the Explanation and Summary tabs. */
  function switchTab(kind) {
    activeTab = kind;
    tabExplain.setAttribute("aria-selected", String(kind === "explain"));
    tabSummary.setAttribute("aria-selected", String(kind === "summary"));
    languageSelect.value = "";

    const text = kind === "explain" ? currentExplanation : currentSummary;
    if (text) {
      renderResult(text);
      enableResultActions(true);
    } else {
      resultOutput.innerHTML = `<p class="empty-state">Choose <strong>${kind === "explain" ? "Explain" : "Summarize"}</strong> on the left to generate this.</p>`;
      enableResultActions(false);
    }
  }

  function renderResult(text) {
    resultOutput.textContent = text;
  }

  function setResultLoading() {
    resultOutput.innerHTML = renderSkeleton(3);
    enableResultActions(false);
  }

  function enableResultActions(enabled) {
    speakBtn.disabled = !enabled;
    copyBtn.disabled = !enabled;
    downloadBtn.disabled = !enabled;
  }

  function setSpeakButtonState(state) {
    // state: "idle" | "speaking" | "paused"
    const span = speakBtn.querySelector("span");
    if (!span) return;
    if (state === "speaking") span.textContent = "Pause";
    else if (state === "paused") span.textContent = "Resume";
    else span.textContent = "Listen";
  }

  function setOcrStatus(state, label) {
    ocrStatus.textContent = label;
    ocrStatus.className = `status-pill ${state}`;
  }

  function renderSkeleton(lines) {
    return Array.from({ length: lines }, () => `<div class="skeleton-line"></div>`).join("");
  }

  function resetResults() {
    currentExplanation = "";
    currentSummary = "";
    explainBtn.disabled = true;
    summarizeBtn.disabled = true;
    resultOutput.innerHTML = `<p class="empty-state">Upload a document and choose <strong>Explain</strong> or <strong>Summarize</strong> to see results here.</p>`;
    enableResultActions(false);
    languageSelect.value = "";
  }

  /** Fully resets the workspace back to its empty state. */
  function resetWorkspace() {
    sourceText = "";
    TTS.stop();
    dropzone.hidden = false;
    previewArea.hidden = true;
    fileInput.value = "";
    setOcrStatus("", "Waiting for upload");
    ocrOutput.innerHTML = `<p class="empty-state">Extracted text will appear here once you upload a document.</p>`;
    resetResults();
  }

  /** Saves the current document + results into local history. */
  function saveToHistory() {
    HistoryStore.add({
      id: generateId(),
      createdAt: Date.now(),
      sourceText: truncate(sourceText, 4000),
      explanation: currentExplanation,
      summary: currentSummary,
    });
    renderHistory();
  }

  /** Renders the recent-history list from localStorage. */
  function renderHistory() {
    const items = HistoryStore.getAll();
    if (!items.length) {
      historyList.innerHTML = `<li class="empty-state">Your recent documents will show up here.</li>`;
      return;
    }

    historyList.innerHTML = items
      .map(
        (item) => `
        <li class="history-card" data-id="${item.id}" tabindex="0" role="button" aria-label="Reopen this document from history">
          <p class="history-card-title">${escapeHtml(truncate(item.sourceText, 60))}</p>
          <p class="history-card-date">${formatDate(item.createdAt)}</p>
        </li>`
      )
      .join("");

    qsa(".history-card", historyList).forEach((card) => {
      const open = () => loadFromHistory(card.dataset.id);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
  }

  /** Restores a past document's text + results from history into the UI. */
  function loadFromHistory(id) {
    const item = HistoryStore.getById(id);
    if (!item) return;

    sourceText = item.sourceText;
    currentExplanation = item.explanation || "";
    currentSummary = item.summary || "";

    dropzone.hidden = true;
    previewArea.hidden = true; // no image stored locally, only text
    ocrOutput.textContent = sourceText;
    setOcrStatus("ready", "Loaded from history");
    explainBtn.disabled = false;
    summarizeBtn.disabled = false;

    switchTab(currentExplanation ? "explain" : "summary");
    showToast("Loaded from history");
  }

  /** Central error handler: logs, shows a toast, and re-enables safe defaults. */
  function handleError(err, context) {
    console.error(`${context}:`, err);
    showToast(`${context}: ${err.message || "please try again."}`);
  }
}
