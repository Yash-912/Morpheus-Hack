import api from './api.service';

/**
 * Send voice audio for processing (STT → LLM → TTS)
 * @param {Blob} audioBlob - Recorded audio blob
 * @param {string} langPref - 'en' | 'hi' | 'mr'
 * @returns {{ transcript, reply, audioBase64, languageCode }}
 */
export const sendVoiceMessage = async (audioBlob, langPref = 'en') => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    formData.append('languagePref', langPref);

    const { data } = await api.post('/ai/voice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000, // voice pipeline can take up to 30s
    });
    return data.data;
};

/**
 * Send text message for chat (no audio)
 * @param {string} message 
 * @param {string} langPref - 'en' | 'hi' | 'mr'
 * @returns {{ reply }}
 */
export const sendTextMessage = async (message, langPref = 'en') => {
    const { data } = await api.post('/ai/chat', { message, languagePref: langPref });
    return data.data;
};
