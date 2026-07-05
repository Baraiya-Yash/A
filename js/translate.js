/* ==========================================================================
  TRANSLATE.JS
  Uses the same GROQ model to translate a result into the user's
  chosen language, keeping the plain-language tone intact.
  ========================================================================== */

const Translate = {
  /**
   * Translates `text` into `targetLanguage` (e.g. "Spanish").
   * Reuses AI._generate so there's one single place that talks to GROQ.
   */
  async translate(text, targetLanguage) {
    if (!targetLanguage) return text;

    const prompt = `Translate the following text into ${targetLanguage}.
Keep the tone simple and plain, exactly as it is in the original. Only return the translated text, with no extra notes, labels, or commentary.

Text:
"""
${text}
"""

Translation:`;
    return AI._generate(prompt);
  },
};
