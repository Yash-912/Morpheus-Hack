#!/usr/bin/env node
// ============================================================
// Dev Server — starts the API without requiring a database
// Use this to explore endpoints while Neon DB is not set up.
// Once you configure DATABASE_URL, use `node server.js` instead.
// ============================================================

require('dotenv').config();

const http = require('http');
const app = require('./app');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger.utils');

const PORT = process.env.PORT || 5001;

const server = http.createServer(app);

async function start() {
  await connectRedis();           // uses MemoryRedis mock when REDIS_URL is empty
  server.listen(PORT, () => {
    console.log('\n============================================');
    console.log('  GigPay Backend — Dev Server (no DB mode)');
    console.log('============================================');
    console.log(`  URL:     http://localhost:${PORT}`);
    console.log(`  Health:  http://localhost:${PORT}/health`);
    console.log(`  API:     http://localhost:${PORT}/api/...`);
    console.log('  Press Ctrl+C to stop\n');
    logger.info(`Dev server running on port ${PORT}`);
  });
}

process.on('SIGINT', () => { server.close(); process.exit(0); });
start();
