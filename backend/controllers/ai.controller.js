// ============================================================
// AI Controller — Voice + Text chat pipeline
// Sarvam STT/TTS + OpenRouter (GPT-4o) brain
// ============================================================

const { prisma } = require('../config/database');
const SarvamService = require('../services/sarvam.service');
const axios = require('axios');
const logger = require('../utils/logger.utils');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

/**
 * Simple language detection from text (for TTS language_code)
 */
function detectLanguage(text) {
    // Check for Devanagari script (Hindi/Marathi)
    const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
    const totalChars = text.replace(/\s/g, '').length;
    if (totalChars > 0 && devanagariCount / totalChars > 0.3) return 'hi-IN';
    return 'en-IN';
}

/**
 * Build a system prompt with live user data
 */
async function buildSystemPrompt(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const walletRupees = Number(user?.walletBalance || 0) / 100;

    // Get today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEarnings = await prisma.earning.aggregate({
        where: { userId, date: { gte: today } },
        _sum: { netAmount: true },
    });
    const todayRupees = Number(todayEarnings._sum.netAmount || 0) / 100;

    // Get active loan
    const activeLoan = await prisma.loan.findFirst({
        where: { userId, status: 'active' },
    });
    const loanInfo = activeLoan
        ? `Active loan: ₹${Number(activeLoan.amount) / 100} (repaid ₹${Number(activeLoan.repaidAmount) / 100})`
        : 'No active loans';

    // Get linked platforms
    const platforms = await prisma.earning.findMany({
        where: { userId },
        distinct: ['platform'],
        select: { platform: true },
    });
    const platformList = platforms.map((p) => p.platform).join(', ') || 'None linked';

    return `You are GigPay Assistant — a friendly, helpful financial advisor for Indian gig workers.

IMPORTANT RULES:
- Reply in the SAME language the user speaks. If they speak Marathi, reply in Marathi. If Hindi, reply in Hindi. If English, reply in English. If Hinglish mix, reply in Hinglish.
- Keep replies SHORT — 2-3 sentences max. Gig workers are busy.
- Use simple, everyday language. No jargon.
- Always mention exact amounts in ₹ rupees.
- Be warm and encouraging.

LIVE USER DATA:
- Name: ${user?.name || 'Worker'}
- Wallet Balance: ₹${walletRupees.toFixed(2)}
- Today's Earnings: ₹${todayRupees.toFixed(2)}
- ${loanInfo}
- Linked Platforms: ${platformList}
- Cashout Fee: 1.2% (minimum ₹5)

YOU CAN HELP WITH:
- Checking balance and earnings ("kitna paisa hai?", "माझा बॅलन्स किती?")
- Explaining cashout fees and process
- Loan repayment status
- General financial tips for gig workers
- Savings advice

If the user asks to cashout or withdraw, tell them to use the Withdraw button on the Wallet page. Don't perform transactions yourself.`;
}

/**
 * Call OpenRouter (GPT-4o) for chat completion
 */
async function callLLM(systemPrompt, userMessage) {
    try {
        const { data } = await axios.post(
            OPENROUTER_URL,
            {
                model: 'openai/gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                max_tokens: 200,
                temperature: 0.7,
            },
            {
                headers: {
                    Authorization: `Bearer ${OPENROUTER_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://gigpay.app',
                    'X-Title': 'GigPay Voice Assistant',
                },
            }
        );

        return data.choices?.[0]?.message?.content || 'Sorry, I could not process that.';
    } catch (error) {
        logger.error('OpenRouter LLM call failed', { error: error.response?.data || error.message });
        return 'Sorry, the AI service is temporarily unavailable. Please try again.';
    }
}

const aiController = {
    /**
     * POST /api/ai/voice
     * Full voice pipeline: Audio → STT → LLM → TTS → Audio
     */
    async voiceChat(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'NO_AUDIO', message: 'Audio file is required' },
                });
            }

            logger.info('Voice chat request', {
                fileSize: req.file.size,
                mimetype: req.file.mimetype,
                fieldname: req.file.fieldname,
            });

            // Step 1: Sarvam STT — audio → text
            let transcript = '';
            let languageCode = 'hi-IN';
            try {
                const sttResult = await SarvamService.speechToText(req.file.buffer);
                transcript = sttResult.transcript;
                languageCode = sttResult.languageCode;
            } catch (sttError) {
                logger.error('STT failed in voiceChat', { error: sttError.message });
                return res.status(422).json({
                    success: false,
                    error: {
                        code: 'STT_FAILED',
                        message: 'Could not process your voice. Please try again or type your question.',
                        detail: sttError.message,
                    },
                });
            }

            if (!transcript || transcript.trim() === '') {
                return res.status(422).json({
                    success: false,
                    error: { code: 'STT_EMPTY', message: 'Could not understand the audio. Please try again.' },
                });
            }

            // Step 2: Build system prompt with live user data
            const systemPrompt = await buildSystemPrompt(req.user.id);

            // Step 3: OpenRouter LLM — get response
            const reply = await callLLM(systemPrompt, transcript);

            // Step 4: Sarvam TTS — text → audio (non-blocking, won't fail)
            const ttsResult = await SarvamService.textToSpeech(reply, languageCode);
            const audioBase64 = ttsResult.audioBase64 || '';

            res.json({
                success: true,
                data: {
                    transcript,
                    reply,
                    audioBase64,
                    languageCode,
                },
            });
        } catch (error) {
            logger.error('voiceChat unexpected error', { error: error.message, stack: error.stack });
            next(error);
        }
    },

    /**
     * POST /api/ai/chat
     * Text-only chat (no audio)
     */
    async textChat(req, res, next) {
        try {
            const { message } = req.body;
            if (!message || message.trim() === '') {
                return res.status(400).json({
                    success: false,
                    error: { code: 'NO_MESSAGE', message: 'Message is required' },
                });
            }

            const systemPrompt = await buildSystemPrompt(req.user.id);
            const reply = await callLLM(systemPrompt, message);

            // Detect language from reply and generate TTS
            const langCode = detectLanguage(reply);
            const ttsResult = await SarvamService.textToSpeech(reply, langCode);

            res.json({
                success: true,
                data: {
                    reply,
                    audioBase64: ttsResult.audioBase64 || '',
                    languageCode: langCode,
                },
            });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = aiController;
