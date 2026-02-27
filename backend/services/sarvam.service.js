// ============================================================
// Sarvam AI Service — STT (Saaras v3) + TTS (Bulbul v2)
// ============================================================

const axios = require('axios');
const logger = require('../utils/logger.utils');

const SARVAM_BASE = 'https://api.sarvam.ai';
const API_KEY = process.env.SARVAM_API_KEY;

const SarvamService = {
    /**
     * Speech-to-Text: Convert audio buffer → text
     * Supports 22 Indian languages with auto-detection
     * @param {Buffer} audioBuffer - Audio file buffer (WebM/WAV/MP3)
     * @param {string} [languageCode] - Optional hint e.g. "hi-IN", "mr-IN"
     * @returns {{ transcript: string, languageCode: string }}
     */
    async speechToText(audioBuffer, languageCode = 'hi-IN') {
        // Use native FormData-like approach with axios
        const FormData = require('form-data');
        const form = new FormData();

        form.append('file', audioBuffer, {
            filename: 'recording.webm',
            contentType: 'audio/webm',
        });
        form.append('model', process.env.SARVAM_STT_MODEL || 'saaras:v2');
        form.append('language_code', languageCode);

        try {
            logger.info('Sarvam STT request', { audioSize: audioBuffer.length, language: languageCode });

            const { data } = await axios.post(`${SARVAM_BASE}/speech-to-text`, form, {
                headers: {
                    ...form.getHeaders(),
                    'api-subscription-key': API_KEY,
                },
                maxContentLength: 50 * 1024 * 1024,
                timeout: 30000,
            });

            logger.info('Sarvam STT result', {
                transcript: data.transcript?.substring(0, 80),
                language: data.language_code,
            });

            return {
                transcript: data.transcript || '',
                languageCode: data.language_code || languageCode,
            };
        } catch (error) {
            const errData = error.response?.data;
            const errStatus = error.response?.status;
            logger.error('Sarvam STT failed', {
                status: errStatus,
                error: typeof errData === 'string' ? errData : JSON.stringify(errData),
                message: error.message,
            });
            throw new Error(`STT failed (${errStatus}): ${JSON.stringify(errData) || error.message}`);
        }
    },

    /**
     * Text-to-Speech: Convert text → audio (base64)
     * @param {string} text - Text to speak
     * @param {string} [languageCode] - e.g. "hi-IN", "mr-IN", "en-IN"
     * @returns {{ audioBase64: string }}
     */
    async textToSpeech(text, languageCode = 'hi-IN') {
        try {
            logger.info('Sarvam TTS request', { textLength: text.length, language: languageCode });

            const { data } = await axios.post(
                `${SARVAM_BASE}/text-to-speech`,
                {
                    inputs: [text],
                    target_language_code: languageCode,
                    model: process.env.SARVAM_TTS_MODEL || 'bulbul:v2',
                    speaker: process.env.SARVAM_TTS_SPEAKER || 'anushka',
                    enable_preprocessing: true,
                },
                {
                    headers: {
                        'api-subscription-key': API_KEY,
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000,
                }
            );

            logger.info('Sarvam TTS completed', { language: languageCode });
            return {
                audioBase64: data.audios?.[0] || '',
            };
        } catch (error) {
            const errData = error.response?.data;
            const errStatus = error.response?.status;
            logger.error('Sarvam TTS failed', {
                status: errStatus,
                error: typeof errData === 'string' ? errData : JSON.stringify(errData),
            });
            // Don't throw — return empty so text response still works
            return { audioBase64: '' };
        }
    },
};

module.exports = SarvamService;
