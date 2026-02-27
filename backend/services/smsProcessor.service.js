// ============================================================
// SMS Processor Service — Phase 2: batch processing orchestrator
// Now also creates/upserts Earning records for gig income SMS
// ============================================================

const { prisma } = require('../config/database');
const { parseSms } = require('./smsParser.service');
const logger = require('../utils/logger.utils');

const BATCH_SIZE = 50;

// Map gig sender IDs → Prisma Platform enum values
const SENDER_TO_PLATFORM = {
    ZOMATO: 'zomato',
    SWIGGY: 'swiggy',
    OLARIDE: 'ola',
    UBERIND: 'uber',
    DUNZOW: 'dunzo',
    BLINKT: 'other',
    ZEPTON: 'other',
};

/**
 * Detect platform from SMS sender ID.
 * @param {string} sender e.g. "AD-ZOMATO"
 * @returns {string} Prisma Platform enum value
 */
function detectPlatform(sender) {
    const upper = (sender || '').toUpperCase();
    for (const [key, platform] of Object.entries(SENDER_TO_PLATFORM)) {
        if (upper.includes(key)) return platform;
    }
    return 'other';
}

/**
 * Upsert an Earning record for a given day.
 * Same-day earnings from multiple SMS are aggregated into ONE row.
 * @param {string} userId
 * @param {string} platform - Prisma Platform enum
 * @param {Date} smsDate - timestamp of the SMS
 * @param {number} amountRupees - amount in rupees
 * @param {number|null} tripsCount - extracted trip count (if any)
 */
async function upsertDailyEarning(userId, platform, smsDate, amountRupees, tripsCount) {
    // Normalise date to midnight (strip time component)
    const dayStart = new Date(smsDate);
    dayStart.setHours(0, 0, 0, 0);

    const amountPaise = BigInt(Math.round(amountRupees * 100));

    // Try to find existing earning for this user + platform + date
    const existing = await prisma.earning.findFirst({
        where: {
            userId,
            platform,
            date: dayStart,
            source: 'sms_auto',
        },
    });

    if (existing) {
        // Aggregate: add to existing row
        const newGross = BigInt(existing.grossAmount) + amountPaise;
        const newTrips = (existing.tripsCount || 0) + (tripsCount || 0);

        await prisma.earning.update({
            where: { id: existing.id },
            data: {
                grossAmount: newGross,
                netAmount: newGross, // same as gross (no deduction info from SMS)
                tripsCount: newTrips,
            },
        });

        logger.info(`Earning UPDATED (aggregated) for ${platform} on ${dayStart.toISOString().slice(0, 10)}: +₹${amountRupees} → total ₹${Number(newGross) / 100}`, {
            userId, platform, date: dayStart,
        });
    } else {
        // New day → create new row
        await prisma.earning.create({
            data: {
                userId,
                platform,
                date: dayStart,
                grossAmount: amountPaise,
                netAmount: amountPaise,
                platformDeductions: BigInt(0),
                tripsCount: tripsCount || 0,
                source: 'sms_auto',
            },
        });

        logger.info(`Earning CREATED for ${platform} on ${dayStart.toISOString().slice(0, 10)}: ₹${amountRupees}`, {
            userId, platform, date: dayStart,
        });
    }
}

/**
 * Process all unprocessed RawSms records for a given user.
 * Creates Transaction records and marks RawSms as processed.
 * For INCOME transactions, also upserts daily Earning records.
 * Returns summary: { processed, created, skipped, errors, earningsCreated }
 */
async function processUnprocessedSms(userId) {
    let processed = 0;
    let created = 0;
    let skipped = 0;
    let errors = 0;
    let earningsCreated = 0;

    try {
        // Fetch unprocessed SMS in batches
        while (true) {
            const batch = await prisma.rawSms.findMany({
                where: {
                    userId,
                    processedAt: null,
                    isRelevant: true,
                },
                take: BATCH_SIZE,
                orderBy: { smsTimestamp: 'asc' },
            });

            if (batch.length === 0) break;

            for (const sms of batch) {
                try {
                    // Check if transaction already exists for this SMS
                    const existing = await prisma.transaction.findUnique({
                        where: { rawSmsId: sms.id },
                    });

                    if (existing) {
                        // Already processed — just mark as processed
                        await prisma.rawSms.update({
                            where: { id: sms.id },
                            data: { processedAt: new Date() },
                        });
                        skipped++;
                        processed++;
                        continue;
                    }

                    // Parse the SMS
                    const parsed = parseSms(sms.sender, sms.body);

                    // Create transaction + update RawSms in a transaction
                    await prisma.$transaction([
                        prisma.transaction.create({
                            data: {
                                userId: sms.userId,
                                rawSmsId: sms.id,
                                amount: parsed.amount,
                                direction: parsed.direction,
                                category: parsed.category,
                                merchant: parsed.merchant,
                                sender: sms.sender,
                                smsTimestamp: sms.smsTimestamp,
                                confidence: parsed.confidence,
                                rawBody: sms.body,
                            },
                        }),
                        prisma.rawSms.update({
                            where: { id: sms.id },
                            data: { processedAt: new Date() },
                        }),
                    ]);

                    created++;
                    processed++;

                    // ── NEW: If this is INCOME from a gig platform, upsert into Earning ──
                    if (parsed.category === 'INCOME' && parsed.amount > 0) {
                        try {
                            const platform = detectPlatform(sms.sender);
                            await upsertDailyEarning(
                                sms.userId,
                                platform,
                                sms.smsTimestamp,
                                parsed.amount,
                                parsed.tripsCount || null,
                            );
                            earningsCreated++;
                        } catch (earningsErr) {
                            logger.error(`Failed to upsert earning for SMS ${sms.id}:`, earningsErr);
                            // Don't fail the whole processing — transaction was still created
                        }
                    }
                } catch (err) {
                    logger.error(`Failed to process SMS ${sms.id}:`, err);
                    // Mark as processed to avoid infinite loop on bad records
                    await prisma.rawSms.update({
                        where: { id: sms.id },
                        data: { processedAt: new Date() },
                    }).catch(() => { });
                    errors++;
                    processed++;
                }
            }
        }

        logger.info(`SMS processing complete for user ${userId}`, {
            processed, created, skipped, errors, earningsCreated,
        });

        return { processed, created, skipped, errors, earningsCreated };
    } catch (error) {
        logger.error('SMS processing failed:', error);
        throw error;
    }
}

module.exports = { processUnprocessedSms };
