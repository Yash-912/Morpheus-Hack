// ============================================================
// AI Routes — Voice + Text chat endpoints
// ============================================================

const router = require('express').Router();
const multer = require('multer');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const aiController = require('../controllers/ai.controller');

// Dedicated audio upload — accepts audio/* MIME types up to 10MB
const audioUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('audio/') || file.mimetype === 'application/octet-stream') {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported audio type: ${file.mimetype}`));
        }
    },
});

// All AI routes require authentication
router.use(authMiddleware);

// POST /api/ai/voice — Full voice pipeline (audio in → audio out)
router.post('/voice', audioUpload.single('audio'), aiController.voiceChat);

// POST /api/ai/chat — Text-only chat
router.post(
    '/chat',
    [body('message').notEmpty().withMessage('Message is required')],
    validate,
    aiController.textChat
);

// POST /api/ai/explain-insights — Summarize and speak JSON dashboard data
router.post(
    '/explain-insights',
    [body('insightData').isObject().withMessage('insightData must be an object')],
    validate,
    aiController.generateInsightsSummary
);

module.exports = router;
