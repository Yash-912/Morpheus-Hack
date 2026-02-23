// ============================================================
// Express App Setup — middleware chain, route mounting, error handling
// ============================================================

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const logger = require('./utils/logger.utils');
const errorHandler = require('./middleware/errorHandler.middleware');

const app = express();

// ---- Security Headers ----
app.use(helmet());

// ---- CORS ----
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ---- Compression ----
app.use(compression());

// ---- Request Logging ----
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: { write: (msg) => logger.http(msg.trim()) },
  })
);

// ---- Body Parsing ----
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---- Health Check ----
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'gigpay-backend', timestamp: new Date().toISOString() });
});

// ---- API Routes ----
app.use('/api', require('./routes'));

// ---- 404 Handler ----
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'The requested resource does not exist' },
  });
});

// ---- Global Error Handler ----
app.use(errorHandler);

module.exports = app;
