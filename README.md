# 🧾 Receipt Scanner (v1.5.3)

![Version](https://img.shields.io/badge/version-v1.5.3-blue)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Semantic Versioning](https://img.shields.io/badge/semver-2.0.0-blue)
![Views](https://hits.sh/kuancheen.github.io/receipt-scanner.svg?view=today-total&style=flat&label=👁️%20Views&extraCount=0&color=6366f1)
![Status](https://img.shields.io/badge/status-active-success)
[![Live Demo](https://img.shields.io/badge/demo-online-green.svg)](https://kuancheen.github.io/receipt-scanner)

> Efficient receipt management with Gemini-powered scanning and smart Google Sheets export. Now supporting **Images and PDFs**.

## ✨ Features
- 📸 **Multi-Format Batch Processing**: Upload and analyze multiple images (JPG, PNG) and **PDFs** at once.
- 🤖 **Gemini 2.0 Flash**: State-of-the-art AI for accurate extraction containing an **Invoice No** column.
- 🎛️ **Dual Extraction Modes**: 
  - **Summarized**: Concise highlights (One row per receipt).
  - **Detailed**: Full multi-row breakdown of every item for pivot table analysis.
- 🌍 **Locale-Aware Dates**: Automatically detects your region to correctly interpret ambiguous dates.
- 📊 **Table View**: Review all results in a clean, interactive table.
- 🔍 **Pro Inspection Viewer**: Full-screen modal with multi-level zoom (4x), mouse-tracking pan, and **PDF previews**.
- 📝 **Smart Sheet Export**: Automatic headers, freezing, and filtering with automated column trimming (5 columns).
- 📋 **TSV Clipboard**: Copy results in a format optimized for Excel/Sheets.
- 🔒 **Privacy First**: Client-side processing (API keys stored locally).

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
