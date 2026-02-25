/**
 * gpsPointSeed.js — Generate 500 synthetic Mumbai GPS points for DBSCAN clustering.
 *
 * Usage:  node backend/prisma/seeds/gpsPointSeed.js
 *
 * Uses seedrandom for deterministic, reproducible Gaussian noise.
 * Points are concentrated around 10 real Mumbai food ordering hotspots.
 */

const { PrismaClient } = require('@prisma/client');
const seedrandom = require('seedrandom');

const prisma = new PrismaClient();
const rng = seedrandom('gigpay2023');

// ── Hub definitions ─────────────────────────────────────────────
const HUBS = [
    { name: 'Bandra West', lat: 19.0596, lng: 72.8295, points: 80, type: 'mixed' },
    { name: 'Andheri East', lat: 19.1136, lng: 72.8697, points: 70, type: 'commercial' },
    { name: 'BKC', lat: 19.0680, lng: 72.8650, points: 60, type: 'commercial' },
    { name: 'Juhu', lat: 19.1075, lng: 72.8263, points: 40, type: 'residential' },
    { name: 'Dadar', lat: 19.0178, lng: 72.8478, points: 50, type: 'transit' },
    { name: 'Powai', lat: 19.1197, lng: 72.9050, points: 45, type: 'commercial' },
    { name: 'Worli', lat: 19.0099, lng: 72.8175, points: 35, type: 'mixed' },
    { name: 'Lower Parel', lat: 18.9966, lng: 72.8302, points: 40, type: 'commercial' },
    { name: 'Kurla', lat: 19.0653, lng: 72.8849, points: 45, type: 'transit' },
    { name: 'Malad West', lat: 19.1874, lng: 72.8484, points: 35, type: 'residential' },
];

// ── Zone type configs ───────────────────────────────────────────
const BASE_EARNINGS = {
    commercial: 180,
    mixed: 150,
    transit: 140,
    residential: 110,
};

const WORKER_RATIO = {
    commercial: 0.8,
    mixed: 0.6,
    transit: 0.7,
    residential: 0.5,
};

// ── Mumbai bounding box ─────────────────────────────────────────
const BOUNDS = { latMin: 18.85, latMax: 19.30, lngMin: 72.77, lngMax: 73.15 };

// ── Gaussian from uniform via Box-Muller ────────────────────────
function gaussianNoise(mean, std) {
    let u1, u2;
    do { u1 = rng(); } while (u1 === 0);
    u2 = rng();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + std * z;
}

// ── Haversine distance in km ────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Generate points ─────────────────────────────────────────────
function generatePoints() {
    const records = [];

    for (const hub of HUBS) {
        const base = BASE_EARNINGS[hub.type];
        const workerRatio = WORKER_RATIO[hub.type];

        for (let i = 0; i < hub.points; i++) {
            // Scatter with Gaussian noise (std=0.008 ≈ 800m)
            let lat, lng;
            let attempts = 0;
            do {
                lat = hub.lat + gaussianNoise(0, 0.008);
                lng = hub.lng + gaussianNoise(0, 0.008);
                attempts++;
            } while (
                (lat < BOUNDS.latMin || lat > BOUNDS.latMax ||
                    lng < BOUNDS.lngMin || lng > BOUNDS.lngMax) &&
                attempts < 20
            );
            // If still out of bounds after 20 attempts, clamp
            lat = Math.max(BOUNDS.latMin, Math.min(BOUNDS.latMax, lat));
            lng = Math.max(BOUNDS.lngMin, Math.min(BOUNDS.lngMax, lng));

            // Distance from hub center
            const distKm = haversineKm(hub.lat, hub.lng, lat, lng);
            const distanceFactor = Math.max(0, 1 - distKm / 1.5);

            // Earnings — clamp 80 to 220
            let avgEarnings = base * distanceFactor;
            avgEarnings = Math.max(80, Math.min(220, avgEarnings));
            avgEarnings = Math.round(avgEarnings * 100) / 100;

            // Incentives
            let avgIncentives = 0;
            if (avgEarnings > 160) {
                avgIncentives = (avgEarnings - 140) * 0.4;
            } else if (avgEarnings > 120) {
                avgIncentives = (avgEarnings - 120) * 0.25;
            }
            avgIncentives = Math.round(avgIncentives * 100) / 100;

            // Orders — clamp 2 to 6
            let totalOrders = avgEarnings / 38;
            totalOrders = Math.max(2, Math.min(6, totalOrders));
            totalOrders = Math.round(totalOrders * 10) / 10;

            // Workers
            let activeWorkers = Math.round(totalOrders * workerRatio);
            activeWorkers = Math.max(1, activeWorkers);

            records.push({
                lat: Math.round(lat * 10000) / 10000,
                lng: Math.round(lng * 10000) / 10000,
                avgEarnings,
                avgIncentives,
                totalOrders,
                activeWorkers,
                areaHint: hub.name,
            });
        }
    }

    return records;
}

// ── Validate ────────────────────────────────────────────────────
function validate(records) {
    let ok = true;
    for (const r of records) {
        if (r.avgEarnings < 80 || r.avgEarnings > 220) {
            console.error(`❌ earnings out of range: ${r.avgEarnings} at ${r.areaHint}`);
            ok = false;
        }
        if (r.totalOrders < 2 || r.totalOrders > 6) {
            console.error(`❌ orders out of range: ${r.totalOrders} at ${r.areaHint}`);
            ok = false;
        }
        if (r.avgIncentives < 0) {
            console.error(`❌ negative incentives at ${r.areaHint}`);
            ok = false;
        }
        if (r.lat < BOUNDS.latMin || r.lat > BOUNDS.latMax) {
            console.error(`❌ lat out of bounds: ${r.lat}`);
            ok = false;
        }
        if (r.lng < BOUNDS.lngMin || r.lng > BOUNDS.lngMax) {
            console.error(`❌ lng out of bounds: ${r.lng}`);
            ok = false;
        }
    }
    return ok;
}

// ── Summary ─────────────────────────────────────────────────────
function printSummary(records) {
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║    Mumbai GPS Seed — Summary                ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  Total points inserted: ${String(records.length).padStart(4)}               ║`);
    console.log('╠══════════════════════════════════════════════╣');

    const byHub = {};
    let globalMin = Infinity, globalMax = -Infinity;

    for (const r of records) {
        if (!byHub[r.areaHint]) byHub[r.areaHint] = { count: 0, totalEarnings: 0 };
        byHub[r.areaHint].count++;
        byHub[r.areaHint].totalEarnings += r.avgEarnings;
        globalMin = Math.min(globalMin, r.avgEarnings);
        globalMax = Math.max(globalMax, r.avgEarnings);
    }

    console.log('║  Hub               | Pts | Avg Earnings     ║');
    console.log('║  ------------------+-----+------------------║');
    for (const [hub, data] of Object.entries(byHub)) {
        const avg = (data.totalEarnings / data.count).toFixed(1);
        console.log(`║  ${hub.padEnd(18)}| ${String(data.count).padStart(3)} | ₹${avg.padStart(6)}/hr       ║`);
    }

    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  Min earnings: ₹${globalMin.toFixed(1).padStart(6)}                    ║`);
    console.log(`║  Max earnings: ₹${globalMax.toFixed(1).padStart(6)}                    ║`);
    console.log('╚══════════════════════════════════════════════╝');
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
    console.log('Generating 500 Mumbai GPS points…');

    const records = generatePoints();

    // Validate before inserting
    if (!validate(records)) {
        console.error('\n❌ Validation failed — aborting.');
        process.exit(1);
    }
    console.log('✅ All 500 points passed validation.');

    // Clear existing data
    const deleted = await prisma.mumbaiGpsPoint.deleteMany();
    if (deleted.count > 0) {
        console.log(`🗑  Cleared ${deleted.count} existing records.`);
    }

    // Bulk insert
    const result = await prisma.mumbaiGpsPoint.createMany({ data: records });
    console.log(`✅ Inserted ${result.count} records into mumbai_gps_points.`);

    printSummary(records);
}

main()
    .catch((e) => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
