# Changelog

![Version](https://img.shields.io/badge/version-v1.1.1-blue)
All notable changes to this project will be documented in this file.

## [1.1.1] - 2026-01-06
### Fixed
- **Authentication Resilience**: Added explicit handling for `401 Unauthorized` errors. If your session expires, the app will now automatically clear the expired token and prompt you to sign in again.
- **Cache Busting**: Version bumped to `v1.1.1` to force browsers to load the latest logic.

## [1.1.0] - 2026-01-05
### Changed
- **Rebranding**: Renamed the application to **"Receipt Scanner"** (removed "AI" from the name).
- **Enhanced Export**: Exports to new/empty Google Sheets now automatically include bold headers, a frozen first row, and basic filters.
- **Improved Clipboard**: "Copy to Clipboard" now uses Tab-delimited (TSV) format for better compatibility with Excel.
- **UI Refinements**: Added icons to all action buttons (💾, 🧹, 🔄, 📋) and simplified button labels.
- **Better Security**: The OAuth Client ID field is now masked by default.

### Added
- **Image Zoom**: You can now click images in the preview modal to zoom in for better detail.

## [1.0.0] - 2026-01-05
### Added
- **Image Viewer Modal**: Click any filename in the list to view the receipt in a full-screen modal with paging (Prev/Next).
- **Advanced Sheet Export**: The app now fetches all tabs from your Google Sheet, allowing you to select a destination sheet or create a new one directly.
- **CSV Clipboard Support**: "Copy to Clipboard" now copies data in a standardized CSV table format for easy importing into other software.
- **Enhanced UI**: Custom modal system with glassmorphism and smooth transitions.

## [0.3.1] - 2026-01-05
### Fixed
- **Batch Preview**: Replaced the broken single-image preview with a dynamic file list that shows the names of all uploaded receipts.
- **Workflow Reset**: Added a "Start Over" button to allow users to clear the current queue and upload new images without refreshing the page.

## [0.3.0] - 2026-01-05
### Added
- **Batch Processing**: Support for uploading multiple receipts at once.
- **Table View**: Dynamic results table displaying Date, Company, Summary, and Amount.
- **New Field**: AI now extracts the "Company/Seller" name from receipts.
- **Bulk Export**: Export all processed results to Google Sheets in a single click.
- **Copy to Clipboard**: Added feature to copy summary results to the clipboard.

## [0.2.6] - 2026-01-05
### Changed
- Updated the AI model to `gemini-2.0-flash` for faster and more accurate receipt processing.
- Refactored API handling to use centralized constants for base URL and model name.

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
