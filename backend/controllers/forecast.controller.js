// ============================================================
// Forecast Controller — CSV upload, storage, and ML prediction
// ============================================================

const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const fs = require('fs');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

const forecastController = {
    /**
     * POST /api/forecast/upload-csv
     * Accepts a CSV file, stores rows into ForecastData, returns success.
     */
    async uploadCsv(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'No CSV file uploaded' });
            }

            const userId = req.user.id;
            const csvText = req.file.buffer.toString('utf-8');
            const rows = _parseCsv(csvText, userId);

            if (!rows || rows.length === 0) {
                return res.status(400).json({ success: false, error: 'CSV must have a header and at least one data row' });
            }

            const inserted = await _upsertRows(rows);

            logger.info('Forecast CSV uploaded', { userId, rows: inserted });

            res.json({
                success: true,
                message: `${inserted} rows uploaded successfully`,
                rowCount: inserted,
            });
        } catch (error) {
            logger.error('Forecast CSV upload failed:', error.message);
            next(error);
        }
    },

    /**
     * POST /api/forecast/seed
     * Auto-load the sample CSV from ml-service directory into ForecastData.
     * This is for demo purposes — loads the 60-day earnings dataset.
     */
    async seedCsv(req, res, next) {
        try {
            const userId = req.user.id;

            // Look for the sample CSV in the local data directory
            const csvPath = path.resolve(__dirname, '../data/sample_earnings_60days.csv');

            if (!fs.existsSync(csvPath)) {
                return res.status(404).json({
                    success: false,
                    error: 'Sample CSV not found at backend/data/sample_earnings_60days.csv',
                });
            }

            const csvText = fs.readFileSync(csvPath, 'utf-8');
            const rows = _parseCsv(csvText, userId);

            if (!rows || rows.length === 0) {
                return res.status(400).json({ success: false, error: 'CSV is empty or invalid' });
            }

            // Clear old forecast data for this user before re-seeding
            await prisma.forecastData.deleteMany({ where: { userId } });

            const inserted = await _upsertRows(rows);

            logger.info('Forecast data seeded from sample CSV', { userId, rows: inserted });

            res.json({
                success: true,
                message: `${inserted} days of earnings data seeded successfully`,
                rowCount: inserted,
            });
        } catch (error) {
            logger.error('Forecast seed failed:', error.message);
            next(error);
        }
    },

    /**
     * GET /api/forecast/has-data
     * Check if the logged-in user has forecast data already.
     */
    async hasData(req, res, next) {
        try {
            const count = await prisma.forecastData.count({
                where: { userId: req.user.id },
            });

            res.json({ success: true, hasData: count > 0, rowCount: count });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/forecast/earnings-trend
     * Returns daily earnings from ForecastData for the graph.
     * Response: { data: [{ date, totalEarnings, netEarnings }] }
     */
    async earningsTrend(req, res, next) {
        try {
            const userId = req.user.id;

            const rows = await prisma.forecastData.findMany({
                where: { userId },
                orderBy: { date: 'asc' },
                select: {
                    date: true,
                    totalEarnings: true,
                    netEarnings: true,
                    worked: true,
                },
            });

            const data = rows.map(r => ({
                date: r.date.toISOString().split('T')[0],
                totalEarnings: r.totalEarnings,
                netEarnings: r.netEarnings,
                worked: r.worked,
            }));

            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/forecast/predict
     * Reconstruct CSV from stored ForecastData, POST to ML service, return predictions.
     * NOTE: totalEarnings is NEVER included in the CSV sent to the ML service.
     */
    async predict(req, res, next) {
        try {
            const userId = req.user.id;

            // Fetch all rows for this user, sorted chronologically
            const rows = await prisma.forecastData.findMany({
                where: { userId },
                orderBy: { date: 'asc' },
            });

            if (rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No forecast data found. Please upload a CSV first.',
                });
            }

            // Reconstruct CSV for the ML service
            // IMPORTANT: Only the 9 raw feature columns — totalEarnings is EXCLUDED
            const header = 'worker_id,date,worked,rainfall_mm,temp_celsius,average_rating,incentives_earned,net_earnings,efficiency_ratio';
            const csvLines = [header];

            for (const r of rows) {
                const dateStr = r.date.toISOString().split('T')[0];
                csvLines.push([
                    1, // worker_id = 1 for the current user
                    dateStr,
                    r.worked,
                    r.rainfallMm,
                    r.tempCelsius,
                    r.averageRating,
                    r.incentivesEarned,
                    r.netEarnings,
                    r.efficiencyRatio,
                ].join(','));
            }

            const csvContent = csvLines.join('\n');

            // POST CSV to ML service as multipart form
            const form = new FormData();
            form.append('file', Buffer.from(csvContent), {
                filename: 'forecast.csv',
                contentType: 'text/csv',
            });

            const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict/earnings`, form, {
                headers: form.getHeaders(),
                timeout: 30000,
            });

            const predictions = mlResponse.data;

            logger.info('Forecast predictions received', { userId, count: predictions.length });

            res.json({
                success: true,
                data: predictions[0] || predictions, // Single worker → return first result
            });
        } catch (error) {
            logger.error('Forecast prediction failed:', error.message);

            if (error.response) {
                return res.status(502).json({
                    success: false,
                    error: `ML service error: ${error.response.data?.detail || error.message}`,
                });
            }

            return res.status(503).json({
                success: false,
                error: `ML Service Offline: Could not connect to the local Python ML service at ${ML_SERVICE_URL}. Ensure uvicorn is running.`
            });
        }
    },
};

// ── Helpers ────────────────────────────────────────────────────

/**
 * Parse CSV text into an array of ForecastData record objects.
 * Computes totalEarnings = netEarnings + incentivesEarned.
 */
function _parseCsv(csvText, userId) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return null;

    const header = lines[0].split(',').map(h => h.trim());
    const requiredCols = ['worker_id', 'date', 'worked', 'rainfall_mm', 'temp_celsius',
        'average_rating', 'incentives_earned', 'net_earnings', 'efficiency_ratio'];

    const missing = requiredCols.filter(c => !header.includes(c));
    if (missing.length > 0) {
        throw new Error(`Missing columns: ${missing.join(', ')}`);
    }

    const colIdx = {};
    header.forEach((h, i) => { colIdx[h] = i; });

    const records = [];
    for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.trim());
        if (vals.length < header.length) continue;

        const netEarnings = parseFloat(vals[colIdx['net_earnings']]) || 0;
        const incentivesEarned = parseFloat(vals[colIdx['incentives_earned']]) || 0;

        records.push({
            userId,
            date: new Date(vals[colIdx['date']]),
            worked: parseInt(vals[colIdx['worked']]) || 0,
            rainfallMm: parseFloat(vals[colIdx['rainfall_mm']]) || 0,
            tempCelsius: parseFloat(vals[colIdx['temp_celsius']]) || 0,
            averageRating: parseFloat(vals[colIdx['average_rating']]) || 0,
            incentivesEarned,
            netEarnings,
            efficiencyRatio: parseFloat(vals[colIdx['efficiency_ratio']]) || 0,
            totalEarnings: netEarnings + incentivesEarned, // for graph only
        });
    }

    return records;
}

/**
 * Upsert an array of ForecastData records (unique on userId + date).
 */
async function _upsertRows(records) {
    let inserted = 0;
    for (const rec of records) {
        await prisma.forecastData.upsert({
            where: {
                userId_date: { userId: rec.userId, date: rec.date },
            },
            update: {
                worked: rec.worked,
                rainfallMm: rec.rainfallMm,
                tempCelsius: rec.tempCelsius,
                averageRating: rec.averageRating,
                incentivesEarned: rec.incentivesEarned,
                netEarnings: rec.netEarnings,
                efficiencyRatio: rec.efficiencyRatio,
                totalEarnings: rec.totalEarnings,
            },
            create: rec,
        });
        inserted++;
    }
    return inserted;
}

module.exports = forecastController;
