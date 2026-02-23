// ============================================================
// Webhooks Routes — Razorpay + WhatsApp (no auth, signature verified)
// ============================================================

const { Router } = require('express');
const webhooksController = require('../controllers/webhooks.controller');

const router = Router();

// NOTE: No authMiddleware — these are external webhooks.
// Signature verification happens inside the controller.

// POST /api/webhooks/razorpay — Razorpay payout events
router.post('/razorpay', webhooksController.razorpay);

// POST /api/webhooks/whatsapp — WhatsApp / Meta Business API
router.post('/whatsapp', webhooksController.whatsapp);

module.exports = router;
