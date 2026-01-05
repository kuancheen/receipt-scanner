// Configuration management
const CONFIG_KEYS = ['gemini-api-key', 'oauth-client-id', 'spreadsheet-id'];
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.0-flash';
const config = {};

// Google Auth State
let tokenClient;
let accessToken = null;

// Application State
let processingQueue = [];
let processedResults = [];
let isProcessing = false;
let currentModalImageIndex = 0;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    setupEventListeners();
    // initGoogleAuth will be called by gisLoaded or after config save
});

// Global callback for GIS library load
window.gisLoaded = () => {
    console.log('GIS library loaded');
    initGoogleAuth();
};

function loadConfig() {
    CONFIG_KEYS.forEach(key => {
        const val = localStorage.getItem(key);
        if (val) {
            config[key] = val;
            document.getElementById(key).value = val;
        }
    });
}

function saveConfig() {
    const geminiKey = document.getElementById('gemini-api-key').value.trim();
    const oauthId = document.getElementById('oauth-client-id').value.trim();

    // Basic validation
    if (geminiKey.includes('.apps.googleusercontent.com')) {
        showMessage('Error: It looks like you pasted an OAuth Client ID into the Gemini API Key field.', 'error', 'config-status');
        return;
    }
    if (oauthId.startsWith('AIzaSy')) {
        showMessage('Error: It looks like you pasted a Gemini API Key into the OAuth Client ID field.', 'error', 'config-status');
        return;
    }

    CONFIG_KEYS.forEach(key => {
        const val = document.getElementById(key).value.trim();
        config[key] = val;
        localStorage.setItem(key, val);
    });
    showMessage('Configuration saved!', 'success', 'config-status');
    initGoogleAuth(); // Re-init auth if client ID changed
}

function clearConfig() {
    const btn = document.getElementById('clear-config');
    if (!btn.dataset.confirming) {
        btn.dataset.confirming = 'true';
        btn.dataset.originalText = btn.textContent;
        btn.textContent = 'Are you sure? Click again to confirm';
        btn.classList.add('confirming');

        // Timeout to revert button
        if (window.configClearTimeout) clearTimeout(window.configClearTimeout);
        window.configClearTimeout = setTimeout(() => {
            btn.textContent = btn.dataset.originalText;
            btn.classList.remove('confirming');
            delete btn.dataset.confirming;
        }, 3000);
        return;
    }

    // Second click logic
    CONFIG_KEYS.forEach(key => {
        localStorage.removeItem(key);
        document.getElementById(key).value = '';
        delete config[key];
    });

    btn.textContent = btn.dataset.originalText;
    btn.classList.remove('confirming');
    delete btn.dataset.confirming;
    if (window.configClearTimeout) clearTimeout(window.configClearTimeout);

    showMessage('Configuration cleared', 'info', 'config-status');
    initGoogleAuth();
}

function toggleVisibility(id, btn) {
    const input = document.getElementById(id);
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁️';
    }
}

function setupEventListeners() {
    document.getElementById('save-config').addEventListener('click', saveConfig);

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFiles(Array.from(e.target.files));
    });

    document.getElementById('clear-config').addEventListener('click', clearConfig);

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('active');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('active'));

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('active');
        if (e.dataTransfer.files.length > 0) handleFiles(Array.from(e.dataTransfer.files));
    });

    document.getElementById('reset-btn').addEventListener('click', resetScan);
    document.getElementById('scan-btn').addEventListener('click', startBatchProcessing);
    document.getElementById('copy-btn').addEventListener('click', copyToClipboard);
    document.getElementById('export-btn').addEventListener('click', exportToSheet);

    document.getElementById('sign-in-btn').addEventListener('click', handleSignIn);
    document.getElementById('sign-out-btn').addEventListener('click', handleSignOut);

    // Modal Events
    document.getElementById('modal-close').addEventListener('click', hideModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'modal-overlay') hideModal();
    });
}

async function handleFiles(files) {
    const validFiles = files.filter(file => file.type.startsWith('image/'));

    if (validFiles.length === 0) {
        showMessage('Please upload image files (PNG, JPG).', 'error', 'scan-status');
        return;
    }

    // Prepare queue and load base64 for preview
    processingQueue = await Promise.all(validFiles.map(async (file) => {
        const base64 = await fileToBase64Full(file);
        return {
            file,
            base64,
            status: 'pending',
            result: null
        };
    }));

    processedResults = [];

    // Render file list
    const fileList = document.getElementById('file-list-preview');
    fileList.innerHTML = '';
    processingQueue.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.textContent = item.file.name;
        div.onclick = () => openImageModal(index);
        fileList.appendChild(div);
    });

    renderResultsTable();

    document.getElementById('preview-container').classList.remove('hidden');
    document.getElementById('drop-zone').classList.add('hidden');

    showMessage(`${validFiles.length} file(s) ready for analysis.`, 'info', 'scan-status');
}

function fileToBase64Full(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Google Auth Logic
function initGoogleAuth() {
    const clientId = config['oauth-client-id'];
    if (!clientId) return;

    if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
        console.log('GIS library not yet loaded. Waiting for callback...');
        return;
    }

    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/spreadsheets',
            callback: (response) => {
                if (response.error !== undefined) {
                    throw (response);
                }
                accessToken = response.access_token;
                updateAuthState(true);
            },
        });
        console.log('Token client initialized');
    } catch (err) {
        console.error('Error initializing GIS:', err);
    }
}

function handleSignIn() {
    if (!tokenClient) {
        const clientId = config['oauth-client-id'];
        if (!clientId) {
            showMessage('Please enter an OAuth Client ID in the Configuration section first.', 'error', 'scan-status');
            return;
        }

        // Attempt re-init if Client ID exists but client is missing
        initGoogleAuth();

        if (!tokenClient) {
            showMessage('The Google Identity library is still loading. Please wait a moment and try again.', 'info', 'scan-status');
            return;
        }
    }
    tokenClient.requestAccessToken({ prompt: 'consent' });
}

function handleSignOut() {
    google.accounts.oauth2.revokeToken(accessToken);
    accessToken = null;
    updateAuthState(false);
}

function updateAuthState(isSignedIn) {
    document.getElementById('sign-in-btn').classList.toggle('hidden', isSignedIn);
    document.getElementById('sign-out-btn').classList.toggle('hidden', !isSignedIn);
    const hint = document.getElementById('auth-hint');
    if (hint) hint.classList.toggle('hidden', isSignedIn);
}

// Gemini API Logic
// Gemini API Logic
async function startBatchProcessing() {
    if (isProcessing) return;

    const apiKey = config['gemini-api-key'];
    if (!apiKey) {
        showMessage('Please enter your Gemini API Key in the Configuration section.', 'error', 'scan-status');
        return;
    }

    if (processingQueue.length === 0) {
        showMessage('No files selected for processing.', 'info', 'scan-status');
        return;
    }

    isProcessing = true;
    toggleLoading(true);
    document.getElementById('results-section').classList.remove('hidden');

    processedResults = []; // Clear previous results
    processingQueue.forEach(item => {
        item.status = 'pending';
        item.result = null;
    });
    renderResultsTable();

    try {
        for (let i = 0; i < processingQueue.length; i++) {
            const item = processingQueue[i];
            item.status = 'processing';
            renderResultsTable();

            try {
                const result = await summarizeReceipt(item.file, apiKey);
                item.status = 'completed';
                item.result = result;
                processedResults.push(result);
            } catch (err) {
                console.error(`Error processing file ${i}:`, err);
                item.status = 'error';
                item.error = err.message;
            }
            renderResultsTable();
        }
        showMessage('Processing complete!', 'success', 'scan-status');
    } finally {
        isProcessing = false;
        toggleLoading(false);
    }
}

async function summarizeReceipt(file, apiKey) {
    const base64Data = await fileToBase64(file);
    const mimeType = file.type;

    const prompt = `Analyze this receipt. Extract and summarize the purchase into a JSON format with these exact keys:
"date": "Date of purchase (YYYY-MM-DD)",
"company": "The name of the company or seller that issued the receipt",
"details": "A concise summary of what was purchased, highlighting one or two notable items as examples",
"amount": "The total amount paid as a number (without currency symbols)"

Ensure the response is ONLY the JSON object.`;

    const response = await fetch(`${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: prompt },
                    { inline_data: { mime_type: mimeType, data: base64Data } }
                ]
            }]
        })
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.message || 'Gemini API Error');
    }

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('No analysis results returned from AI.');
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    const jsonMatch = textResponse.match(/\{.*\}/s);
    if (!jsonMatch) throw new Error('Failed to parse AI response');

    return JSON.parse(jsonMatch[0]);
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function renderResultsTable() {
    const body = document.getElementById('results-body');
    body.innerHTML = '';

    processingQueue.forEach((item, index) => {
        const tr = document.createElement('tr');

        if (item.status === 'completed' && item.result) {
            tr.innerHTML = `
                <td>${item.result.date || 'N/A'}</td>
                <td>${item.result.company || 'N/A'}</td>
                <td>${item.result.details || 'N/A'}</td>
                <td>${item.result.amount || 'N/A'}</td>
            `;
        } else {
            const statusText = item.status === 'processing' ? '⏳ Analyzing...' :
                item.status === 'error' ? `❌ Error: ${item.error}` : '🕒 Pending';
            tr.innerHTML = `
                <td colspan="4" style="text-align: center; color: var(--text-dim); font-style: italic;">
                    ${item.file.name}: ${statusText}
                </td>
            `;
        }
        body.appendChild(tr);
    });
}

function toggleLoading(isLoading) {
    document.getElementById('loading-indicator').classList.toggle('hidden', !isLoading);
    document.getElementById('scan-btn').disabled = isLoading;
}

// Google Sheets Logic
async function exportToSheet() {
    const spreadsheetId = config['spreadsheet-id'];
    if (!spreadsheetId) {
        showMessage('Please enter a Google Sheet ID in the Configuration section.', 'error', 'export-status');
        return;
    }

    if (!accessToken) {
        showMessage('Please sign in with Google first.', 'info', 'export-status');
        return;
    }

    if (processedResults.length === 0) {
        showMessage('No results to export.', 'info', 'export-status');
        return;
    }

    try {
        // 1. Fetch available sheets
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (response.status === 401) {
            accessToken = null;
            updateAuthState(false);
            throw new Error('Sign-in session expired. Please sign in again.');
        }

        if (!response.ok) throw new Error('Failed to fetch spreadsheet metadata.');
        const data = await response.json();
        const sheets = data.sheets.map(s => s.properties.title);

        showSheetSelectorModal(sheets);
    } catch (error) {
        console.error('Export Error:', error);
        showMessage('Failed to connect to Google Sheets: ' + error.message, 'error', 'export-status');
    }
}

function showSheetSelectorModal(sheets) {
    const template = document.getElementById('sheet-selector-template');
    const content = template.content.cloneNode(true);

    const dropdown = content.querySelector('#sheet-dropdown');
    sheets.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        dropdown.appendChild(opt);
    });

    const newBtn = content.querySelector('#new-sheet-btn');
    const newContainer = content.querySelector('#new-sheet-input-container');
    newBtn.onclick = () => newContainer.classList.toggle('hidden');

    const confirmBtn = content.querySelector('#confirm-export');
    const cancelBtn = content.querySelector('#cancel-export');

    cancelBtn.onclick = hideModal;

    // Handle Enter keypress for quick export
    const handleKeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            confirmBtn.click();
        }
    };
    dropdown.onkeydown = handleKeydown;
    content.querySelector('#new-sheet-name').onkeydown = handleKeydown;

    confirmBtn.onclick = async () => {
        const isNew = !newContainer.classList.contains('hidden');
        const sheetName = isNew ? document.getElementById('new-sheet-name').value.trim() : dropdown.value;

        if (isNew && !sheetName) {
            alert('Please enter a name for the new sheet.');
            return;
        }

        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Exporting...';

        try {
            if (isNew) {
                await createNewSheet(sheetName);
            }
            await performAppend(sheetName);
            hideModal();
            showMessage(`Success! Data exported to "${sheetName}".`, 'success', 'export-status');
        } catch (err) {
            alert('Export failed: ' + err.message);
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Export';
        }
    };

    showModal('selector', content);
}

async function createNewSheet(title) {
    const spreadsheetId = config['spreadsheet-id'];
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            requests: [{ addSheet: { properties: { title } } }]
        })
    });

    if (response.status === 401) {
        accessToken = null;
        updateAuthState(false);
        throw new Error('Sign-in session expired. Please sign in again.');
    }

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error.message);
    }
}

async function performAppend(sheetName) {
    const spreadsheetId = config['spreadsheet-id'];

    // 1. Check if sheet is empty
    const checkResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName}'!A1:A2`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (checkResponse.status === 401) {
        accessToken = null;
        updateAuthState(false);
        throw new Error('Sign-in session expired. Please sign in again.');
    }

    const checkData = await checkResponse.json();
    const needsHeader = !checkData.values || checkData.values.length === 0;

    if (needsHeader) {
        // Prepare header row and formatting
        const headers = ["Date", "Company", "Summary & Highlights", "Amount"];

        // Add header
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName}'!A1:append?valueInputOption=USER_ENTERED`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ values: [headers] })
        });

        // Apply formatting (Bold, Freeze, Filter)
        // First get the sheet ID
        const sheetMetadata = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (sheetMetadata.status === 401) {
            accessToken = null;
            updateAuthState(false);
            throw new Error('Sign-in session expired. Please sign in again.');
        }

        const meta = await sheetMetadata.json();
        const sheetId = meta.sheets.find(s => s.properties.title === sheetName).properties.sheetId;

        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requests: [
                    {
                        repeatCell: {
                            range: { sheetId: sheetId, startRowIndex: 0, endRowIndex: 1 },
                            cell: { userEnteredFormat: { textFormat: { bold: true } } },
                            fields: 'userEnteredFormat.textFormat.bold'
                        }
                    },
                    {
                        updateSheetProperties: {
                            properties: { sheetId: sheetId, gridProperties: { frozenRowCount: 1, columnCount: 4 } },
                            fields: 'gridProperties.frozenRowCount,gridProperties.columnCount'
                        }
                    },
                    {
                        setBasicFilter: {
                            filter: { range: { sheetId: sheetId, startRowIndex: 0, endRowIndex: 1 } }
                        }
                    }
                ]
            })
        });
    }

    const rows = processedResults.map(res => [
        res.date || '',
        res.company || '',
        res.details || '',
        res.amount || ''
    ]);

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName}'!A1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: rows })
    });

    if (response.status === 401) {
        accessToken = null;
        updateAuthState(false);
        throw new Error('Sign-in session expired. Please sign in again.');
    }

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error.message);
    }
}

function copyToClipboard() {
    if (processedResults.length === 0) {
        showMessage('No results to copy.', 'info', 'export-status');
        return;
    }

    // TSV Format: Date, Company, Details, Amount
    const header = "Date\tCompany\tSummary & Highlights\tAmount";
    const rows = processedResults.map(res =>
        [res.date, res.company, res.details, res.amount].join('\t')
    );

    const tsvContent = [header, ...rows].join('\n');

    navigator.clipboard.writeText(tsvContent).then(() => {
        showMessage('Copied as TSV (Excel ready)!', 'success', 'export-status');
    }).catch(err => {
        console.error('Clipboard Error:', err);
        showMessage('Failed to copy to clipboard.', 'error', 'export-status');
    });
}

function showMessage(text, type = 'info', targetId = null) {
    const msgBox = targetId ? document.getElementById(targetId) : null;
    if (!msgBox) return;

    msgBox.textContent = text;
    msgBox.className = `status-box status-${type}`;

    const timeoutKey = `timeout_${targetId}`;
    if (window[timeoutKey]) clearTimeout(window[timeoutKey]);
    window[timeoutKey] = setTimeout(() => {
        msgBox.classList.add('hidden');
    }, 5000);
}
// Modal Management
function showModal(type, contentNode) {
    const overlay = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-content');
    container.innerHTML = '';
    container.appendChild(contentNode);
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent scroll
}

function hideModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
}

function openImageModal(index) {
    currentModalImageIndex = index;
    const template = document.getElementById('image-viewer-template');
    const content = template.content.cloneNode(true);

    updateModalImage(content);

    // Zoom toggle and Panning
    const display = content.querySelector('.image-display');
    const img = content.querySelector('#modal-image');

    display.onmousemove = (e) => {
        if (!display.classList.contains('zoom-2') &&
            !display.classList.contains('zoom-3') &&
            !display.classList.contains('zoom-4')) return;

        const rect = display.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        img.style.transformOrigin = `${x}% ${y}%`;
    };

    display.onclick = () => {
        if (display.classList.contains('zoom-2')) {
            display.classList.remove('zoom-2');
            display.classList.add('zoom-3');
        } else if (display.classList.contains('zoom-3')) {
            display.classList.remove('zoom-3');
            display.classList.add('zoom-4');
        } else if (display.classList.contains('zoom-4')) {
            display.classList.remove('zoom-4');
            img.style.transformOrigin = 'center';
        } else {
            display.classList.add('zoom-2');
        }
    };

    // Wire up paging
    content.querySelector('#prev-img').onclick = () => {
        if (currentModalImageIndex > 0) {
            currentModalImageIndex--;
            updateModalImage(document);
        }
    };
    content.querySelector('#next-img').onclick = () => {
        if (currentModalImageIndex < processingQueue.length - 1) {
            currentModalImageIndex++;
            updateModalImage(document);
        }
    };

    showModal('image', content);
}

function updateModalImage(root) {
    const item = processingQueue[currentModalImageIndex];
    const img = root.getElementById('modal-image');
    const prev = root.getElementById('prev-img');
    const next = root.getElementById('next-img');
    const indexText = root.getElementById('modal-image-index');

    img.src = item.base64;
    indexText.textContent = `Receipt ${currentModalImageIndex + 1} of ${processingQueue.length} (${item.file.name})`;

    prev.disabled = currentModalImageIndex === 0;
    next.disabled = currentModalImageIndex === processingQueue.length - 1;
}

function resetScan() {
    processingQueue = [];
    processedResults = [];
    isProcessing = false;

    document.getElementById('file-list-preview').innerHTML = '';
    document.getElementById('results-body').innerHTML = '';
    document.getElementById('preview-container').classList.add('hidden');
    document.getElementById('results-section').classList.add('hidden');
    document.getElementById('drop-zone').classList.remove('hidden');
    document.getElementById('file-input').value = ''; // Clear file input
}
