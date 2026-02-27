// ============================================================
// SMS Routes — Phase 2: parsing + transactions
// ============================================================

const router = require('express').Router();
const authMiddleware = require('../middleware/auth.middleware');
const {
    syncSms,
    getLastSync,
    getSyncHistory,
    processSms,
    getTransactions,
    getTransactionSummary,
} = require('../controllers/sms.controller');

// Phase 1 endpoints
router.post('/sync', authMiddleware, syncSms);
router.get('/last-sync', authMiddleware, getLastSync);
router.get('/history', authMiddleware, getSyncHistory);

// Phase 2 endpoints
router.post('/process', authMiddleware, processSms);
router.get('/transactions', authMiddleware, getTransactions);
router.get('/transactions/summary', authMiddleware, getTransactionSummary);

module.exports = router;
