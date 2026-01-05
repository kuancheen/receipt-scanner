// Configuration management
const CONFIG_KEYS = ['gemini-api-key', 'oauth-client-id', 'spreadsheet-id'];
const config = {};

// Google Auth State
let tokenClient;
let accessToken = null;

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
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
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
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });

    document.getElementById('scan-btn').addEventListener('click', summarizeReceipt);
    document.getElementById('export-btn').addEventListener('click', exportToSheet);

    document.getElementById('sign-in-btn').addEventListener('click', handleSignIn);
    document.getElementById('sign-out-btn').addEventListener('click', handleSignOut);
}

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showMessage('Please upload an image file (PNG, JPG).', 'error', 'scan-status');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('image-preview');
        preview.src = e.target.result;
        document.getElementById('preview-container').classList.remove('hidden');
        document.getElementById('drop-zone').classList.add('hidden');
    };
    reader.readAsDataURL(file);
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
async function summarizeReceipt() {
    const apiKey = config['gemini-api-key'];
    if (!apiKey) {
        showMessage('Please enter your Gemini API Key in the Configuration section.', 'error', 'scan-status');
        return;
    }

    const preview = document.getElementById('image-preview');
    if (!preview.src) return;

    toggleLoading(true);
    document.getElementById('results-section').classList.remove('hidden');

    try {
        const base64Data = preview.src.split(',')[1];
        const mimeType = preview.src.split(';')[0].split(':')[1];

        const prompt = `Analyze this receipt. Extract and summarize the purchase into a JSON format with these exact keys:
"date": "Date of purchase (YYYY-MM-DD)",
"details": "A concise summary of what was purchased, highlighting one or two notable items as examples",
"amount": "The total amount paid as a number (without currency symbols)"

Ensure the response is ONLY the JSON object.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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

        // Basic JSON parsing from AI response
        const jsonMatch = textResponse.match(/\{.*\}/s);
        if (!jsonMatch) throw new Error('Failed to parse AI response');

        const result = JSON.parse(jsonMatch[0]);

        document.getElementById('res-date').value = result.date || '';
        document.getElementById('res-details').value = result.details || '';
        document.getElementById('res-amount').value = result.amount || '';

    } catch (error) {
        console.error('Scan Error:', error);
        const errorMessage = error.message || '';
        const msg = errorMessage.includes('API key not valid')
            ? 'Invalid Gemini API Key. Please check your configuration.'
            : 'Failed to analyze receipt: ' + errorMessage;
        showMessage(msg, 'error', 'scan-status');
    } finally {
        toggleLoading(false);
    }
}

function toggleLoading(isLoading) {
    document.getElementById('loading-indicator').classList.toggle('hidden', !isLoading);
    document.getElementById('analysis-results').classList.toggle('hidden', isLoading);
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

    const row = [
        document.getElementById('res-date').value,
        document.getElementById('res-details').value,
        document.getElementById('res-amount').value
    ];

    try {
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: [row]
            })
        });

        if (response.ok) {
            showMessage('Transfer successful! Check your Google Sheet.', 'success', 'export-status');
        } else {
            const err = await response.json();
            throw new Error(err.error.message);
        }
    } catch (error) {
        console.error('Export Error:', error);
        showMessage('Failed to export to Google Sheets: ' + error.message, 'error', 'export-status');
    }
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
