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
}

function handleFiles(files) {
    const validFiles = files.filter(file => file.type.startsWith('image/'));

    if (validFiles.length === 0) {
        showMessage('Please upload image files (PNG, JPG).', 'error', 'scan-status');
        return;
    }

    processingQueue = validFiles.map(file => ({
        file,
        status: 'pending',
        result: null
    }));

    processedResults = [];

    // Render file list
    const fileList = document.getElementById('file-list-preview');
    fileList.innerHTML = '';
    validFiles.forEach(file => {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.textContent = file.name;
        fileList.appendChild(item);
    });

    renderResultsTable();

    document.getElementById('preview-container').classList.remove('hidden');
    document.getElementById('drop-zone').classList.add('hidden');

    showMessage(`${validFiles.length} file(s) ready for analysis.`, 'info', 'scan-status');
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

    const rows = processedResults.map(res => [
        res.date || '',
        res.company || '',
        res.details || '',
        res.amount || ''
    ]);

    try {
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: rows
            })
        });

        if (response.ok) {
            showMessage(`Success! ${rows.length} row(s) added to Google Sheet.`, 'success', 'export-status');
        } else {
            const err = await response.json();
            throw new Error(err.error.message);
        }
    } catch (error) {
        console.error('Export Error:', error);
        showMessage('Failed to export to Google Sheets: ' + error.message, 'error', 'export-status');
    }
}

function copyToClipboard() {
    if (processedResults.length === 0) {
        showMessage('No results to copy.', 'info', 'export-status');
        return;
    }

    const text = processedResults.map(res =>
        `Date: ${res.date || 'N/A'}\nCompany: ${res.company || 'N/A'}\nDetails: ${res.details || 'N/A'}\nAmount: ${res.amount || 'N/A'}\n---`
    ).join('\n');

    navigator.clipboard.writeText(text).then(() => {
        showMessage('Copied to clipboard!', 'success', 'export-status');
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
