const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments.controller');
const { protect } = require('../middleware/auth.middleware');

// POST /api/payments/create-intent
router.post('/create-intent', protect, paymentsController.createPaymentIntent);

module.exports = router;
