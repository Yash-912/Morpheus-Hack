import { useState, useEffect } from 'react';

export const useSmsReader = () => {
    const [isSupported, setIsSupported] = useState('OTPCredential' in window);
    const [receivedSms, setReceivedSms] = useState(null);

    useEffect(() => {
        if (!isSupported) return;

        const abortController = new AbortController();

        const listenForSms = async () => {
            try {
                const content = await navigator.credentials.get({
                    otp: { transport: ['sms'] },
                    signal: abortController.signal
                });

                if (content && content.code) {
                    setReceivedSms(content.code);
                }
            } catch (err) {
                console.log('WebOTP API error/timeout:', err);
            }
        };

        listenForSms();

        return () => {
            abortController.abort();
        };
    }, [isSupported]);

    return { isSupported, receivedSms };
};
