import { useState } from 'react';

export const useBiometric = () => {
    const [isSupported, setIsSupported] = useState(
        window.PublicKeyCredential !== undefined && typeof window.PublicKeyCredential === 'function'
    );

    const authenticate = async () => {
        if (!isSupported) throw new Error("Biometrics not supported");

        // In production, this would call navigator.credentials.get()
        // For now we mock the successful verification delay to show the Neobrutalist button animation
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, token: 'mock_webauthn_signature' });
            }, 1500);
        });
    };

    return { isSupported, authenticate };
};
