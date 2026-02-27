// ============================================================
// Financial Hub Seed — Uses raw pg with correct snake_case
// ============================================================

require('dotenv').config();
const { Client } = require('pg');

async function seed() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    console.log('Seeding Financial Hub data...');

    // Find user — use the actual phone format in DB
    let userResult = await client.query(`SELECT id, phone FROM users LIMIT 1`);
    if (userResult.rows.length === 0) {
        console.log('No users found. Please run the main seed first.');
        await client.end();
        return;
    }
    const userId = userResult.rows[0].id;
    const phone = userResult.rows[0].phone;
    console.log(`Using user: ${phone} (${userId})`);

    // Update User with Financial Hub fields
    console.log('1. Updating user fields...');
    await client.query(`
        UPDATE users SET
            gig_score = 650,
            genesis_score = 650,
            onboarding_tier = 3,
            active_savings_deduction_rate = 25
        WHERE id = $1
    `, [userId]);
    console.log('   Done (gigScore=650, tier=3)');

    // Clean old data
    console.log('2. Cleaning old Financial Hub data...');
    await client.query(`DELETE FROM gig_score_history WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM digital_gold_holdings WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM savings_goals WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM credit_lines WHERE user_id = $1`, [userId]);
    console.log('   Done');

    // GigScore History (4 months trending up)
    console.log('3. Seeding GigScore history...');
    const scores = [
        { m: 4, c: 55, r: 60, t: 30, e: 50, d: 40, total: 420 },
        { m: 3, c: 65, r: 75, t: 45, e: 60, d: 55, total: 500 },
        { m: 2, c: 75, r: 85, t: 55, e: 70, d: 65, total: 580 },
        { m: 1, c: 82, r: 92, t: 65, e: 78, d: 75, total: 650 },
    ];
    for (const s of scores) {
        const month = new Date();
        month.setMonth(month.getMonth() - s.m);
        month.setDate(1);
        await client.query(`
            INSERT INTO gig_score_history (user_id, month, earnings_consistency_score, repayment_history_score, platform_tenure_score, engagement_score, financial_discipline_score, total_score)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [userId, month, s.c, s.r, s.t, s.e, s.d, s.total]);
    }
    console.log('   Done (420 -> 500 -> 580 -> 650)');

    // Digital Gold
    console.log('4. Seeding digital gold...');
    await client.query(`
        INSERT INTO digital_gold_holdings (user_id, total_grams, average_purchase_price)
        VALUES ($1, 0.35, 6800)
    `, [userId]);
    console.log('   Done (0.35g at Rs6,800/g)');

    // Savings Goals
    console.log('5. Seeding savings goals...');
    await client.query(`
        INSERT INTO savings_goals (user_id, title, target_amount, current_amount, daily_deduction_limit, is_completed)
        VALUES ($1, 'Phone Repair Fund', 2000, 0, 0, false)
    `, [userId]);
    console.log('   Done (Phone Repair new)');

    // Credit History
    console.log('6. Seeding credit history...');
    await client.query(`
        INSERT INTO credit_lines (user_id, type, principal_amount, outstanding_amount, daily_repayment_rate, status)
        VALUES ($1, 'EMERGENCY', 500, 0, 20, 'REPAID')
    `, [userId]);
    await client.query(`
        INSERT INTO credit_lines (user_id, type, principal_amount, outstanding_amount, daily_repayment_rate, status)
        VALUES ($1, 'EMERGENCY', 1000, 0, 20, 'REPAID')
    `, [userId]);
    console.log('   Done (2 repaid: Rs500 + Rs1000)');

    await client.end();
    console.log('\nSeed complete! Start the backend and frontend to test.');
}

seed().catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
});
