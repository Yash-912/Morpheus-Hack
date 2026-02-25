// ============================================================
// Server Entry Point — HTTP server, Socket.io, startup sequence
// ============================================================

require('dotenv').config();

const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const app = require('./app');
const { connectDatabase, disconnect: disconnectDB } = require('./config/database');
const { connectRedis, disconnectRedis } = require('./config/redis');
const logger = require('./utils/logger.utils');

const PORT = process.env.PORT || 5001;

// ---- Create HTTP Server ----
const server = http.createServer(app);

// ---- Attach Socket.io ----
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001'
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Make io accessible to routes/controllers via app
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  // Join user-specific room for targeted notifications
  socket.on('join:user', (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
      logger.debug(`Socket ${socket.id} joined room user:${userId}`);
    }
  });

  // Join city room for hot zone broadcasts
  socket.on('join:city', (city) => {
    if (city) {
      socket.join(`city:${city}`);
      logger.debug(`Socket ${socket.id} joined room city:${city}`);
    }
  });

  socket.on('disconnect', (reason) => {
    logger.debug(`Socket disconnected: ${socket.id} — ${reason}`);
  });
});

// ---- Startup Sequence ----
async function startServer() {
  try {
    // 1. Connect to PostgreSQL
    await connectDatabase();

    // 2. Connect to Redis
    await connectRedis();

    // 3. Make Socket.io accessible globally for workers
    global.__io = io;

    // 4. Start Bull queue workers
    require('./jobs/workers/payout.worker');
    require('./jobs/workers/settlement.worker');
    require('./jobs/workers/notification.worker');
    require('./jobs/workers/sms.worker');
    require('./jobs/workers/zone.worker');
    require('./jobs/workers/loan.worker');
    logger.info('Bull queue workers started');

    // 5. Start cron schedulers
    const { startSettlementScheduler } = require('./jobs/schedulers/settlement.scheduler');
    const { startZoneScheduler } = require('./jobs/schedulers/zone.scheduler');
    const { startLoanScheduler } = require('./jobs/schedulers/loan.scheduler');
    const { startNotificationScheduler } = require('./jobs/schedulers/notification.scheduler');
    startSettlementScheduler();
    startZoneScheduler();
    startLoanScheduler();
    startNotificationScheduler();
    logger.info('Cron schedulers started');

    // 6. Listen
    server.listen(PORT, () => {
      logger.info(`🚀 GigPay Backend running on port ${PORT}`);
      logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`   Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// ---- Graceful Shutdown ----
async function gracefulShutdown(signal) {
  logger.info(`\n${signal} received — shutting down gracefully...`);

  // Stop accepting new connections
  server.close(async () => {
    try {
      const { closeAllQueues } = require('./jobs/queues');
      await closeAllQueues();
      await disconnectDB();
      await disconnectRedis();
      logger.info('👋 Server shut down cleanly');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown:', err);
      process.exit(1);
    }
  });

  // Force exit after 10s if graceful shutdown stalls
  setTimeout(() => {
    logger.error('⏱️  Forced exit after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// ---- Start ----
startServer();

module.exports = { server, io };
