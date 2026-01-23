# Changelog

![Version](https://img.shields.io/badge/version-v1.5.5-blue)
All notable changes to this project will be documented in this file.

## [v1.5.5] - 2026-01-24
### Changed
- **Model Migration**: Migrated from `gemini-2.0-flash` to `gemini-2.5-flash` as the 2.0 models are being discontinued by Google.

## [v1.5.4] - 2026-01-08
### Changed
- **UI Text Refinement**: Updated the locale date detection hint to be more human-friendly (e.g., "Using date format: DD/MM/YYYY (en-GB) based on your browser setting").

## [v1.5.3] - 2026-01-08
### Changed
- **Unified Toggle Colors**: Both extraction modes now use the same orange gradient when selected for visual consistency.
- **Multi-Row Detailed Display**: In "Detailed" mode, each line item now appears as a separate table row (instead of multi-line in one cell) for better readability.
- **Cleaner Loading**: Removed redundant "AI is analyzing..." text since the table already shows per-file status.

## [v1.5.2] - 2026-01-08
### Changed
- **UI Logic**: In "Detailed" mode, the table now displays the full itemized breakdown (multiline) instead of just the item count.
- **UI Text**: Renamed the scan button to "**🔍 Scan**" and table header to "**Summary / Details**" for clarity.

## [v1.5.1] - 2026-01-08
### Fixed
- **UI Visibility**: Fixed an issue where the "Summarized" button background was invisible due to a CSS variable mismatch.
- **Contextual Help**: Added hover tooltips to the "Extraction Mode" toggle to clearly explain the difference between Summarized and Detailed modes.

## [v1.5.0] - 2026-01-08
### Added
- **Invoice Number Extraction**: A new dedicated column supports extracting invoice/receipt numbers.
- **Multi-Row Detailed Exports**: The "Detailed" mode now exports separate rows for every line item (instead of one summary row), with Date/Invoice/Company repeated for each row to enable pivot table analysis.
- **Enhanced UI**: Completely redesigned the Extraction Mode toggle for better visibility, making it easier to switch between Summary and Detailed views.

## [v1.4.0] - 2026-01-08
### Added
- **Detailed Extraction Mode**: New toggle switch allows you to choose between "Summarized" (concise) and "Detailed" (full itemized breakdown) modes.
- **Enhanced Formatting**: Detailed mode exports include line items, taxes, discounts, and subtotals formatted as multi-line text within the existing spreadsheet structure.

## [v1.3.2] - 2026-01-07
### Changed
- **Refined UI**: The date format hint is now smaller, styled as an info badge, and clearer to read.
- **Strict Date Output**: The AI is now explicitly instructed to *always* output dates in `YYYY-MM-DD` format (ISO 8601), regardless of the input's locale format, ensuring consistent database sorting.

## [v1.3.1] - 2026-01-07
### Added
- **Locale-Aware Date Parsing**: The AI now automatically detects your browser's region (e.g., `en-GB` vs `en-US`) to correctly interpret ambiguous dates (like 06/01/2026 as Jan 6th or June 1st).
- **Date Format Indicator**: A new helper text appears below the scan buttons showing exactly which date format (DD/MM/YYYY or MM/DD/YYYY) is being used for analysis.

## [v1.3.0] - 2026-01-06
### Added
- **PDF Scanning Support**: You can now upload PDF receipts in addition to images.
- **PDF Previews**: Automatically generates a high-quality preview of the first page of any uploaded PDF for inspection in the modal viewer.
- **Improved File Handling**: Unified processing queue for images and PDFs.

## [v1.2.0] - 2026-01-06
### Added
- **Interactive Inspection Suit**: Combining multi-level zoom (up to 4x) with a new **Pan-to-Zoom** mouse-tracking system for high-detail receipt review.
- **Smart Sheet Streamlining**: Automated removal of unused columns in Google Sheets for a cleaner database view.
- **Authentication Resilience**: Explicit detection and recovery for expired Google sign-in sessions.
- **Keyboard Accessibility**: You can now press **Enter** in the Sheet Selector modal to quickly confirm your export.

## [v1.1.5] - 2026-01-06
### Added
- **Pan-to-Zoom**: When zoomed in, the image now follows your mouse movements, allowing you to easily pan and inspect every corner of the receipt without extra controls.

## [v1.1.4] - 2026-01-06
### Changed
- **Enhanced Multi-Level Zoom**: Added a 4x zoom level. Clicking now cycles through 1x → 2x → 3x → 4x → 1x.
- **Improved Cursor Feedback**: The zoom cursor now correctly displays a "+" sign until the final 4x magnification, and switching to a "-" sign only when the next click will zoom back out.

## [v1.1.3] - 2026-01-06
### Added
- **Multi-Level Zoom**: Clicking images in the preview modal now cycles through multiple zoom levels (1x → 2x → 3x) for even better data visibility.

## [v1.1.2] - 2026-01-06
### Changed
- **Sheets Streamlining**: New or empty sheets are now automatically trimmed to exactly 4 columns, removing unused extra columns for a cleaner spreadsheet.
- **UI Refinement**: Simplified the main title rebranding in the header.

## [v1.1.1] - 2026-01-06
### Fixed
- **Authentication Resilience**: Added explicit handling for `401 Unauthorized` errors. If your session expires, the app will now automatically clear the expired token and prompt you to sign in again.
- **Cache Busting**: Version bumped to `v1.1.1` to force browsers to load the latest logic.

## [v1.1.0] - 2026-01-05
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
