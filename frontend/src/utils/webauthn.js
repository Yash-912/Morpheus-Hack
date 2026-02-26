// ============================================================
// WebAuthn Helpers — Biometric credential creation & verification
// Used by cashout flow for fingerprint/face authentication
// ============================================================

/**
 * Check if WebAuthn is supported in this browser.
 * @returns {boolean}
 */
export function isWebAuthnSupported() {
    return !!(
        window.PublicKeyCredential &&
        navigator.credentials &&
        navigator.credentials.create &&
        navigator.credentials.get
    );
}

/**
 * Register a new WebAuthn credential (fingerprint/face).
 * Call this once during onboarding or first cashout.
 *
 * @param {object} options
 * @param {string} options.userId — GigPay user ID
 * @param {string} options.userName — Display name (phone or name)
 * @param {string} options.challenge — Base64-encoded challenge from server
 * @returns {Promise<object>} — { credentialId, publicKey } to store on server
 */
export async function registerCredential({ userId, userName, challenge }) {
    if (!isWebAuthnSupported()) {
        throw new Error('Biometric authentication is not supported on this device');
    }

    const challengeBuffer = base64ToBuffer(challenge);
    const userIdBuffer = new TextEncoder().encode(userId);

    const credential = await navigator.credentials.create({
        publicKey: {
            challenge: challengeBuffer,
            rp: {
                name: 'GigPay',
                id: window.location.hostname,
            },
            user: {
                id: userIdBuffer,
                name: userName,
                displayName: userName,
            },
            pubKeyCredParams: [
                { alg: -7, type: 'public-key' },   // ES256
                { alg: -257, type: 'public-key' },  // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: 'platform', // Device biometric only
                userVerification: 'required',
                residentKey: 'preferred',
            },
            timeout: 60000,
            attestation: 'none',
        },
    });

    return {
        credentialId: bufferToBase64(credential.rawId),
        publicKey: bufferToBase64(credential.response.getPublicKey?.() || new ArrayBuffer(0)),
        attestationObject: bufferToBase64(credential.response.attestationObject),
        clientDataJSON: bufferToBase64(credential.response.clientDataJSON),
    };
}

/**
 * Verify a WebAuthn credential (biometric prompt for cashout).
 * The user places their finger or shows their face.
 *
 * @param {object} options
 * @param {string} options.credentialId — Base64-encoded credential ID from registration
 * @param {string} options.challenge — Base64-encoded challenge from server
 * @returns {Promise<object>} — Assertion result to send to server for verification
 */
export async function verifyCredential({ credentialId, challenge }) {
    if (!isWebAuthnSupported()) {
        throw new Error('Biometric authentication is not supported on this device');
    }

    const challengeBuffer = base64ToBuffer(challenge);
    const credentialIdBuffer = base64ToBuffer(credentialId);

    const assertion = await navigator.credentials.get({
        publicKey: {
            challenge: challengeBuffer,
            allowCredentials: [
                {
                    id: credentialIdBuffer,
                    type: 'public-key',
                    transports: ['internal'],
                },
            ],
            userVerification: 'required',
            timeout: 60000,
        },
    });

    return {
        credentialId: bufferToBase64(assertion.rawId),
        authenticatorData: bufferToBase64(assertion.response.authenticatorData),
        clientDataJSON: bufferToBase64(assertion.response.clientDataJSON),
        signature: bufferToBase64(assertion.response.signature),
    };
}

// ── Utility functions ───────────────────────────────────────

/**
 * Convert Base64 string to ArrayBuffer.
 */
function base64ToBuffer(base64) {
    // Handle URL-safe base64
    const base64Std = base64.replace(/-/g, '+').replace(/_/g, '/');
    const binaryStr = atob(base64Std);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Convert ArrayBuffer to Base64 URL-safe string.
 */
function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
