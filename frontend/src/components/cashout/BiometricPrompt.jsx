import { useState } from 'react';
import { isWebAuthnSupported, verifyCredential } from '../../utils/webauthn';

/**
 * BiometricPrompt — Triggers WebAuthn for cashout verification.
 * Fallback to PIN if biometric not available.
 *
 * @param {object} props
 * @param {string} props.credentialId — Base64 credential ID from registration
 * @param {string} props.challenge — Base64 challenge from server
 * @param {Function} props.onSuccess — Called with assertion data
 * @param {Function} props.onError — Called with error
 * @param {Function} [props.onCancel]
 */
const BiometricPrompt = ({
    credentialId,
    challenge,
    onSuccess,
    onError,
    onCancel,
}) => {
    const [status, setStatus] = useState('idle'); // idle | prompting | success | error
    const [errorMsg, setErrorMsg] = useState('');

    const supported = isWebAuthnSupported();

    const handleVerify = async () => {
        if (!supported) {
            setStatus('error');
            setErrorMsg('Biometric auth not supported on this device');
            onError?.(new Error('WebAuthn not supported'));
            return;
        }

        try {
            setStatus('prompting');
            const assertion = await verifyCredential({ credentialId, challenge });
            setStatus('success');
            onSuccess?.(assertion);
        } catch (err) {
            setStatus('error');
            const msg = err.name === 'NotAllowedError'
                ? 'Verification cancelled or timed out'
                : 'Verification failed. Please try again.';
            setErrorMsg(msg);
            onError?.(err);
        }
    };

    return (
        <div className="card text-center">
            {/* Icon */}
            <div className="text-5xl mb-4">
                {status === 'prompting' ? '👆' : status === 'success' ? '✅' : status === 'error' ? '❌' : '🔐'}
            </div>

            {/* Title */}
            <h3 className="text-heading-md text-gigpay-navy mb-2">
                {status === 'prompting'
                    ? 'Touch your sensor'
                    : status === 'success'
                        ? 'Verified!'
                        : status === 'error'
                            ? 'Verification Failed'
                            : 'Verify Identity'}
            </h3>

            {/* Description */}
            <p className="text-body-md text-gigpay-text-secondary mb-5">
                {status === 'prompting'
                    ? 'Place your finger on the sensor or look at the camera'
                    : status === 'error'
                        ? errorMsg
                        : 'Use fingerprint or face ID to confirm this withdrawal'}
            </p>

            {/* Actions */}
            {status === 'idle' && (
                <div className="flex flex-col gap-2">
                    <button onClick={handleVerify} className="btn-primary w-full">
                        {supported ? '👆 Verify with Biometric' : '🔢 Enter PIN'}
                    </button>
                    {onCancel && (
                        <button onClick={onCancel} className="btn-ghost">Cancel</button>
                    )}
                </div>
            )}

            {status === 'prompting' && (
                <div className="flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-[#C8F135] border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {status === 'error' && (
                <div className="flex flex-col gap-2">
                    <button onClick={handleVerify} className="btn-primary w-full">
                        Try Again
                    </button>
                    {onCancel && (
                        <button onClick={onCancel} className="btn-ghost">Cancel</button>
                    )}
                </div>
            )}

            {status === 'success' && (
                <div className="text-green-600 text-body-md font-semibold animate-pulse">
                    Processing withdrawal...
                </div>
            )}
        </div>
    );
};

export default BiometricPrompt;
