// ============================================================
// Prisma Client Singleton — PostgreSQL via Neon Serverless (WebSocket)
// Bypasses ISP/network TCP port blocking by using WebSockets
// ============================================================

const { Pool, neonConfig } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { PrismaClient } = require('@prisma/client');
const ws = require('ws');

// Tell Neon serverless to use WebSocket transport via the `ws` package
neonConfig.webSocketConstructor = ws;
// Use the secure WebSocket proxy endpoint provided by Neon
neonConfig.useSecureWebSocket = true;
// Patch fetch to use global fetch (node 18+) for DNS-over-HTTPS resolution
neonConfig.pipelineTLS = false;
neonConfig.pipelineConnect = false;

let prisma;

function createPrismaClient(logLevel) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);

  return new PrismaClient({
    adapter,
    log: logLevel,
  });
}

if (process.env.NODE_ENV === 'production') {
  prisma = createPrismaClient(['error', 'warn']);
} else {
  // Prevent multiple instances during hot-reload in development
  if (!global.__prisma) {
    global.__prisma = createPrismaClient(['query', 'info', 'warn', 'error']);
  }
  prisma = global.__prisma;
}

/**
 * Connect to the database and run migrations in production.
 * Call this once at server startup.
 */
async function connectDatabase() {
  try {
    // Verify connection by running a simple query
    await prisma.$queryRaw`SELECT 1 AS connected`;
    console.log('✅ PostgreSQL connected via Neon Serverless (WebSocket)');

    // Run pending migrations in production
    if (process.env.NODE_ENV === 'production') {
      const { execSync } = require('child_process');
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
