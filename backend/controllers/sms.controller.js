// ============================================================
// SMS Controller — Phase 1: filtered ingestion + sync tracking
// ============================================================

const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');
const { processUnprocessedSms } = require('../services/smsProcessor.service');

// ---- Indian financial sender ID allowlist ----
// Sender IDs come as e.g. "AX-HDFCBK", "BZ-ICICIB", "VM-SWIGGY"
// We extract the suffix after the last hyphen and check against this set.
const FINANCIAL_SENDER_IDS = new Set([
    // Banks
    'HDFCBK', 'ICICIB', 'SBIINB', 'AXISBK', 'KOTAKB', 'YESBNK', 'INDBNK',
    'PNBSMS', 'BOIIND', 'CANBNK', 'UNIONB', 'CENTBK', 'IDBIBK', 'FEDERAL',
    'RBLBNK', 'SCBANK', 'CITIBK', 'HSBCIN', 'DEUTSC',
    // UPI / Payments
    'PYTMBN', 'PHONEPE', 'GPAY', 'BHIMUPI', 'MOBIKW', 'AMAZON', 'FREECHARGE',
    // Gig platforms
    'ZOMATO', 'SWIGGY', 'OLARIDE', 'UBERIND', 'DUNZOW', 'BLINKT', 'ZEPTON',
    // FASTag
    'FASTAG', 'NETCFL', 'IHMCL',
    // Telecom
    'AIRTEL', 'JIOTEL', 'BSNLIN', 'VFINL', 'MTNLIN',
]);

// ---- Demo / test sender phone numbers ----
// These personal numbers are allowed during dev/demo so you can
// text the device and have the SMS processed through the pipeline.
const DEMO_SENDER_PHONES = new Set([
    '9858107107', '+919858107107',
    '8104791797', '+918104791797',
]);

/**
 * Check if a sender ID matches the financial allowlist OR demo phones.
 * Handles formats like "AX-HDFCBK", "BZ-ICICIB", "+919876543210", "HDFCBK"
 */
function isFinancialSender(sender) {
    if (!sender) return false;
    const upper = sender.toUpperCase().trim();

    // Demo phone numbers (exact match, case-insensitive)
    if (DEMO_SENDER_PHONES.has(sender.trim())) return true;

    // Direct match (e.g. "HDFCBK")
    if (FINANCIAL_SENDER_IDS.has(upper)) return true;

    // Suffix after hyphen (e.g. "AX-HDFCBK" → "HDFCBK")
    const hyphenIdx = upper.lastIndexOf('-');
    if (hyphenIdx !== -1) {
        const suffix = upper.slice(hyphenIdx + 1);
        if (FINANCIAL_SENDER_IDS.has(suffix)) return true;
    }

    // Contains match (catches variations like "AD-SWIGGY", "VM-GPAY01")
    for (const id of FINANCIAL_SENDER_IDS) {
        if (upper.includes(id)) return true;
    }

    return false;
}

/**
 * POST /api/sms/sync
 * Body: { messages: [{ sender, body, timestamp }], totalScanned?: number }
 */
async function syncSms(req, res) {
    const userId = req.user.id;
    let session;

    try {
        const { messages, totalScanned } = req.body;

        // ---- Validation ----
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'messages must be a non-empty array' },
            });
        }

        if (messages.length > 500) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Maximum 500 messages per sync' },
            });
        }

        // ---- Create sync session ----
        session = await prisma.syncSession.create({
            data: {
                userId,
                totalScanned: totalScanned || messages.length,
                status: 'pending',
            },
        });

        // ---- Filter by sender ----
        const validMessages = messages.filter((m) => m.sender && m.body && m.timestamp);
        const relevant = [];
        let irrelevantCount = 0;

        for (const m of validMessages) {
            if (isFinancialSender(m.sender)) {
                relevant.push(m);
            } else {
                irrelevantCount++;
            }
        }

        // ---- Build records for relevant SMS ----
        const records = relevant.map((m) => ({
            userId,
            sender: String(m.sender).slice(0, 50),
            body: String(m.body).slice(0, 2000),
            smsTimestamp: new Date(m.timestamp),
            syncBatchId: session.id,
            isRelevant: true,
        }));

        // ---- Insert with dedup ----
        let newStored = 0;
        let duplicatesSkipped = 0;

        if (records.length > 0) {
            const result = await prisma.rawSms.createMany({
                data: records,
                skipDuplicates: true,
            });
            newStored = result.count;
            duplicatesSkipped = records.length - newStored;
        }

        // ---- Update sync session ----
        await prisma.syncSession.update({
            where: { id: session.id },
            data: {
                completedAt: new Date(),
                newStored,
                duplicatesSkipped,
                irrelevantDiscarded: irrelevantCount,
                status: 'success',
            },
        });

        logger.info(`SMS sync complete`, {
            userId,
            sessionId: session.id,
            totalScanned: totalScanned || messages.length,
            relevant: relevant.length,
            newStored,
            duplicatesSkipped,
            irrelevantDiscarded: irrelevantCount,
        });

        // ---- Auto-process SMS (non-blocking) ----
        let processingResult = null;
        if (newStored > 0) {
            try {
                processingResult = await processUnprocessedSms(userId);
            } catch (err) {
                logger.error('Auto-processing after sync failed:', err);
            }
        }

        return res.json({
            success: true,
            sessionId: session.id,
            synced: newStored,
            skipped: duplicatesSkipped,
            discarded: irrelevantCount,
            total: validMessages.length,
            processing: processingResult || null,
        });
    } catch (error) {
        logger.error('SMS sync failed:', error);

        // Mark session as failed if it was created
        if (session?.id) {
            await prisma.syncSession.update({
                where: { id: session.id },
                data: { completedAt: new Date(), status: 'failed' },
            }).catch(() => { });
        }

        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Failed to sync SMS messages' },
        });
    }
}

/**
 * GET /api/sms/last-sync
 * Returns the most recent SMS timestamp for this user (for incremental sync).
 */
async function getLastSync(req, res) {
    try {
        const userId = req.user.id;

        const latest = await prisma.rawSms.findFirst({
            where: { userId, isRelevant: true },
            orderBy: { smsTimestamp: 'desc' },
            select: { smsTimestamp: true },
        });

        return res.json({
            success: true,
            lastTimestamp: latest?.smsTimestamp?.toISOString() || null,
        });
    } catch (error) {
        logger.error('Get last sync failed:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Failed to get last sync info' },
        });
    }
}

/**
 * GET /api/sms/history
 * Returns the last 5 sync sessions for this user.
 */
async function getSyncHistory(req, res) {
    try {
        const userId = req.user.id;

        const sessions = await prisma.syncSession.findMany({
            where: { userId },
            orderBy: { startedAt: 'desc' },
            take: 5,
            select: {
                id: true,
                startedAt: true,
                completedAt: true,
                totalScanned: true,
                newStored: true,
                duplicatesSkipped: true,
                irrelevantDiscarded: true,
                status: true,
            },
        });

        return res.json({
            success: true,
            sessions,
        });
    } catch (error) {
        logger.error('Get sync history failed:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Failed to get sync history' },
        });
    }
}

/**
 * POST /api/sms/process
 * Manually trigger processing of unprocessed SMS.
 */
async function processSms(req, res) {
    try {
        const userId = req.user.id;
        const result = await processUnprocessedSms(userId);
        return res.json({ success: true, ...result });
    } catch (error) {
        logger.error('Manual SMS processing failed:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Processing failed' },
        });
    }
}

/**
 * GET /api/sms/transactions
 * Returns transactions for the authenticated user.
 * Query params: ?category=INCOME&limit=50
 */
async function getTransactions(req, res) {
    try {
        const userId = req.user.id;
        const { category, limit } = req.query;

        const where = { userId };
        if (category) where.category = category.toUpperCase();

        const transactions = await prisma.transaction.findMany({
            where,
            orderBy: { smsTimestamp: 'desc' },
            take: parseInt(limit) || 100,
        });

        return res.json({ success: true, transactions });
    } catch (error) {
        logger.error('Get transactions failed:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Failed to get transactions' },
        });
    }
}

/**
 * GET /api/sms/transactions/summary
 * Returns aggregated summary for the authenticated user.
 */
async function getTransactionSummary(req, res) {
    try {
        const userId = req.user.id;

        const transactions = await prisma.transaction.findMany({
            where: { userId },
            select: { amount: true, direction: true, category: true },
        });

        let totalIncome = 0;
        let totalExpenses = 0;
        const byCategory = {};

        for (const t of transactions) {
            if (t.direction === 'credit') {
                totalIncome += t.amount;
            } else {
                totalExpenses += t.amount;
            }
            byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
        }

        return res.json({
            success: true,
            summary: {
                total_income: Math.round(totalIncome * 100) / 100,
                total_expenses: Math.round(totalExpenses * 100) / 100,
                by_category: byCategory,
                transaction_count: transactions.length,
                period: 'all_time',
            },
        });
    } catch (error) {
        logger.error('Get transaction summary failed:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Failed to get summary' },
        });
    }
}

module.exports = { syncSms, getLastSync, getSyncHistory, processSms, getTransactions, getTransactionSummary };
