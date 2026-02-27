require('dotenv').config();
const { Client } = require('pg');
async function check() {
    const c = new Client({ connectionString: process.env.DATABASE_URL });
    await c.connect();
    const cols = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`);
    console.log('=== USERS COLUMNS ===');
    cols.rows.forEach(r => console.log(r.column_name));
    console.log('=== ALL TABLES ===');
    const tables = await c.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
    tables.rows.forEach(r => console.log(r.table_name));
    await c.end();
}
check().catch(e => { console.error(e.message); process.exit(1); });
