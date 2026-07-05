/* ==========================================================================
   UTILS.JS
   Small, reusable helper functions shared across the app.
   ========================================================================== */

/** Shorthand for document.querySelector */
function qs(selector, scope) {
  return (scope || document).querySelector(selector);
}

/** Shorthand for document.querySelectorAll, returned as a real array */
function qsa(selector, scope) {
  return Array.from((scope || document).querySelectorAll(selector));
}

/** Escapes HTML special characters so user/AI text can't break the page. */
function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Debounce: delays calling fn until `wait` ms have passed since the last call. */
function debounce(fn, wait) {
  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), wait);
  };
}

/** Generates a short unique id, good enough for local history entries. */
function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Formats a timestamp (ms) into a short, human-readable date/time. */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Truncates a string to a max length, adding an ellipsis if needed. */
function truncate(str, maxLength) {
  if (!str) return "";
  return str.length > maxLength ? str.slice(0, maxLength).trim() + "…" : str;
}

/** Shows a short-lived toast notification at the bottom of the screen. */
function showToast(message, duration = 2800) {
  const toast = qs("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._timeoutId);
  showToast._timeoutId = setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

/** Triggers a browser download of `text` as a .txt file named `filename`. */
function downloadTextFile(text, filename) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Copies text to the clipboard, with a safe fallback for older browsers. */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for non-secure contexts (e.g. plain http://localhost in some setups)
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return true;
  } catch (err) {
    console.error("copyToClipboard failed:", err);
    return false;
  }
}
