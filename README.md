# AccessAI

## 🚀 AccessAI - CTRL + V Hackathon Submission

AccessAI is an AI-powered accessibility tool that removes barriers in understanding documents, images, and text. It helps users extract, simplify, summarize, translate, and listen to information instantly in the browser.

Built to improve access to information for education, healthcare, services, and everyday communication.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Screenshots](#screenshots)
- [Future Improvements](#future-improvements)
- [License](#license)

---

## Overview

Millions of people struggle to understand important documents because they're written in complex language, or in a language they don't read. This creates real barriers to healthcare, education, government services, and opportunity.

AccessAI removes that barrier in four steps: **Upload → Scan → Understand → Listen or save.**

## Features

- 🔎 **Text extraction (OCR)** — reads text out of any photo or screenshot, entirely in-browser (Tesseract.js)
- 💡 **Plain-language explanation** — rewrites dense or technical text simply (GROQ API)
- 📝 **Instant summary** — 3–5 bullet points capturing the key information
- 🌐 **Translation** — translate any result into Spanish, Hindi, Mandarin, Arabic, French, Portuguese, Bengali, Urdu, and more
- 🔊 **Read aloud** — built-in text-to-speech (Web Speech API)
- 📋 **Copy & download** — copy results to clipboard or save as a `.txt` file
- 🕘 **Recent history** — last 8 documents saved locally via `localStorage`, no account required
- 🌓 **Dark / light mode** — respects system preference, remembers your choice
- ♿ **Accessible by design** — semantic HTML, ARIA labels, full keyboard navigation, visible focus states, `prefers-reduced-motion` support

## Tech Stack

- **HTML5 / CSS3 / Vanilla JavaScript (ES6)** — no framework, no build step
- **[Tesseract.js](https://github.com/naptha/tesseract.js)** — in-browser OCR
- **GROQ API** — explanation, summarization, translation
- **Web Speech API** — text-to-speech, built into the browser
- **localStorage** — private, on-device history

No React, Vue, Angular, TypeScript, Node.js backend, or Firebase. This is a fully static site — it runs by opening `index.html` in a browser.

## Project Structure

```
accessai/
├── index.html              Home page
├── workspace.html          AI Workspace (the core tool)
├── about.html               About page
├── contact.html              Contact page
├── README.md
├── .gitignore
├── css/
│   ├── style.css            Layout & components
│   ├── themes.css           Dark/light color & type tokens
│   └── animations.css       Motion, loading states, the "Clarity Scan"
├── js/
│   ├── config.js             API keys & constants
│   ├── main.js                Shared UI logic + Workspace controller
│   ├── ocr.js                  Tesseract.js wrapper
│   ├── ai.js                   GROQ explain/summarize calls
│   ├── translate.js            GROQ-powered translation
│   ├── tts.js                   Web Speech API wrapper
│   ├── storage.js              localStorage history & theme
│   └── utils.js                 Shared helper functions
└── assets/
    ├── icons/
    └── images/
```

## Installation

No build tools, no `npm install`, no server required.

1. **Get a GROQ API key** from your provider.
2. Open `js/config.js` and paste your key in place of `"YOUR_GROQ_API_KEY_HERE":
    ```js
    GROQ_API_KEY: "your-real-key-here",
    ```
3. Open the project folder in **VS Code**.
4. Open `index.html` directly in your browser (double-click it, or use the "Live Server" VS Code extension for the best experience with fetch requests).

That's it — no dependencies to install.

## Usage

1. Go to **AI Workspace** from the top navigation.
2. Upload a photo or screenshot of a document (click the upload area or drag a file onto it).
3. Wait for the extracted text to appear.
4. Click **Explain** for a plain-language rewrite, or **Summarize** for key bullet points.
5. Optionally pick a language from the **Translate to…** dropdown.
6. Use **Listen**, **Copy**, or **Download** on the result.
7. Revisit past documents anytime from **Recent history** at the bottom of the page.

## Screenshots

> _Add screenshots here before submitting — e.g._
>
> `assets/images/screenshot-home.png`
> `assets/images/screenshot-workspace.png`
> `assets/images/screenshot-dark-mode.png`

## Future Improvements

- Support multi-page PDF uploads
- Offline mode using a cached/local language model
- Save history to an account (optional cloud sync) for use across devices
- Support for handwriting recognition
- Voice input for hands-free use
- Browser extension version for one-click page explanation

## License

This project was built for the CTRL-V Hackathon and is released under the [MIT License](https://opensource.org/licenses/MIT). Feel free to fork, learn from, and build on it.
