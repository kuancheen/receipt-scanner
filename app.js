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
    CONFIG_KEYS.forEach(key => {
        const val = document.getElementById(key).value.trim();
        config[key] = val;
        localStorage.setItem(key, val);
    });
    alert('Configuration saved!');
    initGoogleAuth(); // Re-init auth if client ID changed
}

function setupEventListeners() {
    document.getElementById('save-config').addEventListener('click', saveConfig);

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });

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
        alert('Please upload an image file (PNG, JPG).');
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
            alert('Please enter an OAuth Client ID in the Configuration section first.');
            return;
        }

        // Attempt re-init if Client ID exists but client is missing
        initGoogleAuth();

        if (!tokenClient) {
            alert('The Google Identity library is still loading. Please wait a moment and try again.');
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
        alert('Please enter your Gemini API Key in the Configuration section.');
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

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
        const textResponse = data.candidates[0].content.parts[0].text;

        // Basic JSON parsing from AI response
        const jsonMatch = textResponse.match(/\\{.*\\}/s);
        if (!jsonMatch) throw new Error('Failed to parse AI response');

        const result = JSON.parse(jsonMatch[0]);

        document.getElementById('res-date').value = result.date;
        document.getElementById('res-details').value = result.details;
        document.getElementById('res-amount').value = result.amount;

    } catch (error) {
        console.error('Scan Error:', error);
        alert('Failed to analyze receipt. Check your API key or image quality.');
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
        alert('Please enter a Google Sheet ID in the Configuration section.');
        return;
    }

    if (!accessToken) {
        alert('Please sign in with Google first.');
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
            alert('Transfer successful! Check your Google Sheet.');
        } else {
            const err = await response.json();
            throw new Error(err.error.message);
        }
    } catch (error) {
        console.error('Export Error:', error);
        alert('Failed to export to Google Sheets: ' + error.message);
    }
}
