import { useState, useRef, useCallback } from 'react';
import { sendVoiceMessage, sendTextMessage } from '../services/voice.api';

/**
 * Custom hook for voice chat — manages recording, API calls, and audio playback
 * States: idle | listening | processing | speaking | error
 */
export const useVoiceChat = () => {
    const [status, setStatus] = useState('idle'); // idle | listening | processing | speaking | error
    const [transcript, setTranscript] = useState('');
    const [reply, setReply] = useState('');
    const [error, setError] = useState(null);
    const [conversation, setConversation] = useState([]);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioPlayerRef = useRef(null);

    /**
     * Start recording audio from microphone
     */
    const startListening = useCallback(async () => {
        try {
            setError(null);
            setTranscript('');
            setReply('');

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });

            let options = {};
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                options = { mimeType: 'audio/webm;codecs=opus' };
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                options = { mimeType: 'audio/webm' };
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                options = { mimeType: 'audio/mp4' };
            }

            const mediaRecorder = new MediaRecorder(stream, options);

            audioChunksRef.current = [];
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // Stop all tracks
                stream.getTracks().forEach((track) => track.stop());

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await processAudio(audioBlob);
            };

            mediaRecorder.start();
            setStatus('listening');
        } catch (err) {
            console.error('Mic access denied:', err);
            setError(`Mic Error: ${err.message || 'Access Denied'}`);
            setStatus('error');
        }
    }, []);

    /**
     * Stop recording and trigger processing
     */
    const stopListening = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setStatus('processing');
        }
    }, []);

    /**
     * Send recorded audio to backend for processing
     */
    const processAudio = async (audioBlob) => {
        setStatus('processing');

        try {
            const result = await sendVoiceMessage(audioBlob);
            const { transcript: txt, reply: rep, audioBase64, languageCode } = result;

            setTranscript(txt);
            setReply(rep);

            // Add to conversation history
            setConversation((prev) => [
                ...prev,
                { role: 'user', text: txt, language: languageCode },
                { role: 'assistant', text: rep, language: languageCode },
            ]);

            // Play TTS audio if available
            if (audioBase64) {
                setStatus('speaking');
                await playAudio(audioBase64);
            }

            setStatus('idle');
        } catch (err) {
            console.error('Voice processing failed:', err);
            setError('Could not process your voice. Please try again.');
            setStatus('error');
        }
    };

    /**
     * Send text message (keyboard input)
     */
    const sendText = useCallback(async (message) => {
        if (!message.trim()) return;

        setStatus('processing');
        setTranscript(message);
        setError(null);

        try {
            const result = await sendTextMessage(message);
            setReply(result.reply);

            setConversation((prev) => [
                ...prev,
                { role: 'user', text: message },
                { role: 'assistant', text: result.reply },
            ]);

            // Play TTS audio if available
            if (result.audioBase64) {
                setStatus('speaking');
                await playAudio(result.audioBase64);
            }

            setStatus('idle');
        } catch (err) {
            console.error('Text chat failed:', err);
            setError('Could not process your message. Please try again.');
            setStatus('error');
        }
    }, []);

    /**
     * Play base64 audio
     */
    const playAudio = async (base64Audio) => {
        return new Promise((resolve) => {
            try {
                console.log('Playing TTS audio, length:', base64Audio.length);
                // Convert base64 to blob for better browser compatibility
                const byteChars = atob(base64Audio);
                const byteArray = new Uint8Array(byteChars.length);
                for (let i = 0; i < byteChars.length; i++) {
                    byteArray[i] = byteChars.charCodeAt(i);
                }
                const blob = new Blob([byteArray], { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(blob);

                const audio = new Audio(audioUrl);
                audioPlayerRef.current = audio;

                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                };
                audio.onerror = (e) => {
                    console.error('Audio playback error:', e);
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                };
                audio.play().catch((e) => {
                    console.error('Audio play() failed:', e);
                    resolve();
                });
            } catch (e) {
                console.error('Audio decode error:', e);
                resolve();
            }
        });
    };

    /**
     * Stop any playing audio
     */
    const stopSpeaking = useCallback(() => {
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current = null;
        }
        setStatus('idle');
    }, []);

    /**
     * Reset state
     */
    const reset = useCallback(() => {
        setStatus('idle');
        setTranscript('');
        setReply('');
        setError(null);
    }, []);

    return {
        status,
        transcript,
        reply,
        error,
        conversation,
        startListening,
        stopListening,
        sendText,
        stopSpeaking,
        reset,
    };
};
