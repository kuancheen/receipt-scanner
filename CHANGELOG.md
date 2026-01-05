# Changelog

![Version](https://img.shields.io/badge/version-v0.2.5-blue)
All notable changes to this project will be documented in this file.

## [0.2.5] - 2026-01-05
### Fixed
- Reverted Gemini API endpoint to `v1beta` to ensure compatibility with the `gemini-1.5-flash` model identifier.

## [0.2.4] - 2026-01-05
### Fixed
- Switched Gemini API endpoint from `v1beta` to stable `v1` to resolve 404 errors for the `gemini-1.5-flash` model.

## [0.2.2] - 2026-01-05
### Fixed
- Fixed `TypeError: clearTimeout is not a function` by resolving a variable shadowing conflict in `app.js`.

## [0.2.1] - 2026-01-05
### Refined
- Replaced the browser `confirm()` pop-up with a sleek, two-step in-line confirmation button for "Clear All".
- Moved status messages inside their respective action cards (Configuration, Scan, and Results) for better context.

## [0.2.0] - 2026-01-05
### Added
- Modern in-line messaging system (replacing browser alerts) with themed feedback (success, error, info).
- "Clear Configuration" functionality to wipe credentials from the app.
- Visibility toggles (👁️/🙈) for Gemini API Key and OAuth Client ID.
- Input hints/placeholders for all configuration fields.

## [0.1.2] - 2026-01-05
### Fixed
- Fixed `ReferenceError: gisLoaded is not defined` by ensuring `app.js` is loaded before the Google Identity Services script.

## [0.1.1] - 2026-01-05
### Fixed
- Fixed critical syntax error in `app.js` caused by incorrect backslash escapes.
- Resolved OAuth initialization race condition to ensure the sign-in button works reliably.

## [0.1.0] - 2026-01-05
### Added
- Initial release of Receipt Scanner AI.
- Gemini 1.5 Flash integration for receipt summarization.
- Google Sheets export functionality via OAuth 2.0.
- Modern dark-mode UI with glassmorphism.
- Local configuration storage for API keys and IDs.
- Responsive design for mobile and desktop.
