# 🧾 Receipt Scanner AI

![Version](https://img.shields.io/badge/version-v0.2.3-blue)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Semantic Versioning](https://img.shields.io/badge/semver-2.0.0-blue)
![Views](https://hits.sh/kuancheen.github.io/receipt-scanner.svg?view=today-total&style=flat&label=👁️%20Views&extraCount=0&color=6366f1)
![Status](https://img.shields.io/badge/status-active-success)
[![Live Demo](https://img.shields.io/badge/demo-online-green.svg)](https://kuancheen.github.io/receipt-scanner)

> You can view the live demo by clicking the badge above or by [visiting this link](https://kuancheen.github.io/receipt-scanner).

An intelligent web application to scan, summarize, and export receipts to Google Sheets using Gemini AI.

## ✨ Features
- **AI-Powered OCR**: Uses Gemini 1.5 Flash to extract text and summarize purchases.
- **Smart Summarization**: Automatically identifies the date, total amount, and provides a concise summary of items.
- **Direct Export**: Securely appends data to a specified Google Sheet via OAuth.
- **Premium UI**: Modern dark-mode design with glassmorphism and smooth animations.
- **Privacy First**: API keys and OAuth configurations are stored locally in your browser.

## 🚀 Quick Start

### 1. Credentials Needed
1.  **Gemini API Key**: Get it from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  **OAuth Client ID**: Create a "Web application" client ID in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
3.  **Google Sheet ID**: Create a Google Sheet and copy its ID from the URL.

### 2. How to Use
1.  Enter your credentials in the **Configuration** section.
2.  Sign in with Google to authorize Sheets access.
3.  Upload or take a photo of a receipt.
4.  Click **Summarize with AI**.
5.  Review the results and click **Export to Google Sheet**.

## 🛡️ Privacy & Security
- All processing happens in your browser.
- Credentials are saved in `localStorage`.
- Direct communication with Google APIs (no middleman).

## 📝 License
MIT

---
&copy; 2026 [kuancheen](https://github.com/kuancheen)
