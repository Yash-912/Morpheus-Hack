// ============================================================
// Forecast Controller — CSV upload, storage, and ML prediction
// ============================================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger.utils');
const axios = require('axios');
const FormData = require('form-data');

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
            const lines = csvText.trim().split('\n');

            if (lines.length < 2) {
                return res.status(400).json({ success: false, error: 'CSV must have a header and at least one data row' });
            }

            const header = lines[0].split(',').map(h => h.trim());
            const requiredCols = ['worker_id', 'date', 'worked', 'rainfall_mm', 'temp_celsius',
                'average_rating', 'incentives_earned', 'net_earnings', 'efficiency_ratio'];

            const missing = requiredCols.filter(c => !header.includes(c));
            if (missing.length > 0) {
                return res.status(400).json({ success: false, error: `Missing columns: ${missing.join(', ')}` });
            }

            const colIdx = {};
            header.forEach((h, i) => { colIdx[h] = i; });

            // Parse rows
            const records = [];
            for (let i = 1; i < lines.length; i++) {
                const vals = lines[i].split(',').map(v => v.trim());
                if (vals.length < header.length) continue;

                records.push({
                    userId,
                    date: new Date(vals[colIdx['date']]),
                    worked: parseInt(vals[colIdx['worked']]) || 0,
                    rainfallMm: parseFloat(vals[colIdx['rainfall_mm']]) || 0,
                    tempCelsius: parseFloat(vals[colIdx['temp_celsius']]) || 0,
                    averageRating: parseFloat(vals[colIdx['average_rating']]) || 0,
                    incentivesEarned: parseFloat(vals[colIdx['incentives_earned']]) || 0,
                    netEarnings: parseFloat(vals[colIdx['net_earnings']]) || 0,
                    efficiencyRatio: parseFloat(vals[colIdx['efficiency_ratio']]) || 0,
                });
            }

            // Upsert each row (unique on userId + date)
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
                    },
                    create: rec,
                });
                inserted++;
            }

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
     * POST /api/forecast/predict
     * Reconstruct CSV from stored ForecastData, POST to ML service, return predictions.
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

            next(error);
        }
    },
};

module.exports = forecastController;
