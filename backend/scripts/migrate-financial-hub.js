// ============================================================
// Financial Hub Migration — Uses raw pg, correct snake_case names
// Drops wrong PascalCase tables, creates correct ones
// ============================================================

require('dotenv').config();
const { Client } = require('pg');

async function migrate() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    console.log('Starting Financial Hub migration...');

    // 0. Drop incorrectly-named PascalCase tables from previous run
    console.log('0. Cleaning up old PascalCase tables...');
    await client.query(`DROP TABLE IF EXISTS "CreditLine" CASCADE`);
    await client.query(`DROP TABLE IF EXISTS "SavingsGoal" CASCADE`);
    await client.query(`DROP TABLE IF EXISTS "DigitalGoldHolding" CASCADE`);
    await client.query(`DROP TABLE IF EXISTS "GigScoreHistory" CASCADE`);
    await client.query(`DROP TYPE IF EXISTS "CreditLineType" CASCADE`);
    await client.query(`DROP TYPE IF EXISTS "CreditLineStatus" CASCADE`);
    console.log('   Done');

    // 1. Add new columns to users table
    console.log('1. Adding columns to users...');
    await client.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS genesis_score INTEGER,
        ADD COLUMN IF NOT EXISTS onboarding_tier INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS active_savings_deduction_rate DOUBLE PRECISION DEFAULT 0
    `);
    console.log('   Done');

    // 2. Create enums
    console.log('2. Creating enums...');
    await client.query(`
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CreditLineType') THEN
                CREATE TYPE "CreditLineType" AS ENUM ('EMERGENCY', 'NBFC');
            END IF;
        END $$
    `);
    await client.query(`
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CreditLineStatus') THEN
                CREATE TYPE "CreditLineStatus" AS ENUM ('ACTIVE', 'REPAID', 'DEFAULT');
            END IF;
        END $$
    `);
    console.log('   Done');

    // 3. Create gig_score_history
    console.log('3. Creating gig_score_history...');
    await client.query(`
        CREATE TABLE IF NOT EXISTS gig_score_history (
            id TEXT NOT NULL DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            month TIMESTAMP(3) NOT NULL,
            earnings_consistency_score DOUBLE PRECISION NOT NULL DEFAULT 0,
            repayment_history_score DOUBLE PRECISION NOT NULL DEFAULT 0,
            platform_tenure_score DOUBLE PRECISION NOT NULL DEFAULT 0,
            engagement_score DOUBLE PRECISION NOT NULL DEFAULT 0,
            financial_discipline_score DOUBLE PRECISION NOT NULL DEFAULT 0,
            total_score INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (id)
        )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_gsh_user_month ON gig_score_history(user_id, month)`);
    console.log('   Done');

    // 4. Create digital_gold_holdings
    console.log('4. Creating digital_gold_holdings...');
    await client.query(`
        CREATE TABLE IF NOT EXISTS digital_gold_holdings (
            id TEXT NOT NULL DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            total_grams DOUBLE PRECISION NOT NULL DEFAULT 0,
            average_purchase_price DOUBLE PRECISION NOT NULL DEFAULT 0,
            PRIMARY KEY (id)
        )
    `);
    console.log('   Done');

    // 5. Create savings_goals
    console.log('5. Creating savings_goals...');
    await client.query(`
        CREATE TABLE IF NOT EXISTS savings_goals (
            id TEXT NOT NULL DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            target_amount DOUBLE PRECISION NOT NULL,
            current_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
            daily_deduction_limit DOUBLE PRECISION NOT NULL DEFAULT 0,
            is_completed BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sg_user ON savings_goals(user_id)`);
    console.log('   Done');

    // 6. Create credit_lines
    console.log('6. Creating credit_lines...');
    await client.query(`
        CREATE TABLE IF NOT EXISTS credit_lines (
            id TEXT NOT NULL DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type "CreditLineType" NOT NULL DEFAULT 'EMERGENCY',
            principal_amount DOUBLE PRECISION NOT NULL,
            outstanding_amount DOUBLE PRECISION NOT NULL,
            daily_repayment_rate DOUBLE PRECISION NOT NULL DEFAULT 20,
            status "CreditLineStatus" NOT NULL DEFAULT 'ACTIVE',
            created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cl_user_status ON credit_lines(user_id, status)`);
    console.log('   Done');

    await client.end();
    console.log('\nMigration complete! Run: node scripts/seed-financial-hub.js');
}

migrate().catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
});
