// ============================================================
// Prisma Client Singleton — PostgreSQL connection via Prisma
// ============================================================

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: { url: process.env.DATABASE_URL },
    },
  });
} else {
  // Prevent multiple instances during hot-reload in development
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      datasources: {
        db: { url: process.env.DATABASE_URL },
      },
    });
  }
  prisma = global.__prisma;
}

/**
 * Connect to the database and run migrations in production.
 * Call this once at server startup.
 */
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected via Prisma');

    // Run pending migrations in production
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Running prisma migrate deploy...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ Migrations applied');
    }
  } catch (error) {
    console.warn('⚠️  PostgreSQL connection failed (will retry on first query):', error.message);
    console.warn('   If using Neon free-tier, the database may be sleeping — it will wake on next request.');
  }
}

/**
 * Disconnect gracefully. Called during server shutdown.
 */
async function disconnect() {
  await prisma.$disconnect();
  console.log('🔌 PostgreSQL disconnected');
}

module.exports = {
  prisma,
  connectDatabase,
  disconnect,
};
