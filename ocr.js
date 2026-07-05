/* ==========================================================================
   OCR.JS
   Wraps Tesseract.js to extract text from an uploaded image, entirely
   in the browser — the image itself never leaves the user's device.
   ========================================================================== */

const OCR = {
  /**
   * Runs OCR on an image file (or object URL) and returns the extracted text.
   * @param {File|string} imageSource - a File object or an image URL/dataURL
   * @param {(progress: number) => void} onProgress - called with 0..1 progress
   * @returns {Promise<string>}
   */
  async recognize(imageSource, onProgress) {
    if (typeof Tesseract === "undefined") {
      throw new Error("Tesseract.js failed to load. Check your internet connection.");
    }

    const result = await Tesseract.recognize(imageSource, CONFIG.TESSERACT_LANG, {
      logger: (log) => {
        // log.status is like "recognizing text", log.progress is 0..1
        if (log.status === "recognizing text" && typeof onProgress === "function") {
          onProgress(log.progress);
        }
      },
    });

    const text = result?.data?.text?.trim();
    if (!text) {
      throw new Error("No readable text was found in this image.");
    }
    return text;
  },
};
