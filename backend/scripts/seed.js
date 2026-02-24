// scripts/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// A helper to generate random numbers in a range
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// A helper to subtract days from today
const getPastDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d;
};

// Target user phone number to seed data for 
// (assuming standard testing phone number from onboarding)
const TARGET_PHONE = '9876543210';

async function main() {
    console.log(`Starting DB Seed for user with phone: ${TARGET_PHONE}`);

    // 1. Find or create the target user
    let user = await prisma.user.findUnique({ where: { phone: TARGET_PHONE } });

    if (!user) {
        console.log("User not found. Creating test user...");
        user = await prisma.user.create({
            data: {
                phone: TARGET_PHONE,
                name: "Gig Worker",
                gigScore: 720,
                city: "bangalore",
                homeLat: 12.9716,
                homeLng: 77.5946,
                walletBalance: 1250000, // ₹12,500
                walletLifetimeEarned: 4500000,
                kycStatus: "verified"
            }
        });
    } else {
        console.log(`Found existing user: ${user.id}`);
        // Ensure wallet has some funds and they are verified
        await prisma.user.update({
            where: { id: user.id },
            data: {
                walletBalance: 1250000,
                gigScore: Math.max(user.gigScore, 650),
                kycStatus: "verified"
            }
        });
    }

    // 2. Clear old test data for this user to avoid huge buildup
    console.log("Cleaning old data...");
    await prisma.earning.deleteMany({ where: { userId: user.id } });
    await prisma.payout.deleteMany({ where: { userId: user.id } });
    await prisma.communityJob.deleteMany({ where: { postedById: user.id } });
    // Note: The schema for savings might be grouped differently, let's just skip deleting savings for this seed
    // to avoid Prisma schema errors.
    console.log("Seeding 14 days of historical earnings...");
    const platforms = ['zomato', 'swiggy'];
    let totalEarnings = 0;

    for (let i = 14; i >= 0; i--) {
        const date = getPastDate(i);

        for (const platform of platforms) {
            // Random chance to not work on a platform that day
            if (Math.random() > 0.8) continue;

            const trips = rand(8, 20);
            const hours = rand(4, 10);
            const gross = rand(500, 1500) * 100; // 500 to 1500 INR
            const deductions = Math.floor(gross * 0.05);
            const net = gross - deductions;

            totalEarnings += net;

            await prisma.earning.create({
                data: {
                    userId: user.id,
                    platform,
                    date,
                    grossAmount: gross,
                    platformDeductions: deductions,
                    netAmount: net,
                    hoursWorked: hours,
                    tripsCount: trips,
                    avgPerTrip: Math.floor(net / trips),
                    source: "api",
                    verified: true
                }
            });
        }
    }

    // 4. Seed Payouts (Instant cashouts)
    console.log("Seeding recent payouts...");
    for (let i = 5; i > 0; i--) {
        const amt = rand(1000, 3000) * 100;
        await prisma.payout.create({
            data: {
                userId: user.id,
                amount: amt,
                fee: 500, // 5 rs fee
                netAmount: amt - 500,
                type: "instant",
                status: "completed",
                initiatedAt: getPastDate(i),
                completedAt: getPastDate(i)
            }
        });
    }

    // 5. Seed Community Jobs (Nearby)
    // We create jobs posted by "other" dummy users around Bangalore
    console.log("Seeding dummy users and nearby community jobs...");
    const dummyNames = ["Ramesh K", "Suresh M", "Priya S", "Amit Patel"];

    // Create dummy users
    const dummyUsers = [];
    for (let i = 0; i < dummyNames.length; i++) {
        const phone = `555000100${i}`;
        let du = await prisma.user.findUnique({ where: { phone } });
        if (!du) {
            du = await prisma.user.create({
                data: { phone, name: dummyNames[i], city: "bangalore" }
            });
        }
        dummyUsers.push(du);
    }

    // Clear old jobs from dummies
    await prisma.communityJob.deleteMany({
        where: { postedById: { in: dummyUsers.map(u => u.id) } }
    });

    const jobTypes = ['local_delivery', 'home_service', 'ride', 'freelance'];
    const jobTitles = [
        "Deliver documents to Indiranagar",
        "Fix leaky sink pipe",
        "Drop off bike at mechanic",
        "Help move 2 boxes to HSR"
    ];

    // Bangalore base coords ~ 12.9716, 77.5946
    for (let i = 0; i < 6; i++) {
        const dummy = dummyUsers[i % dummyUsers.length];

        // Slight offset for variation (approx 1-5km)
        const latOffset = (Math.random() - 0.5) * 0.05;
        const lngOffset = (Math.random() - 0.5) * 0.05;

        // Note: For PostGIS queries to work immediately, we set geoLat/geoLng mapped columns if defined, 
        // but the schema uses raw sql for actual geography. The schema uses a mix of pickupLat / geoLat.
        // Looking at schema: geoLat / geoLng / location (raw).

        // We'll just create the basic record. The `nearbyJobs` controller uses raw PostGIS on a `location` column.
        // We need to do a raw insert or update to set the PostGIS point if the schema uses raw SQL.

        const job = await prisma.communityJob.create({
            data: {
                postedById: dummy.id,
                type: jobTypes[i % jobTypes.length],
                title: jobTitles[i % jobTitles.length],
                description: "Need someone reliable. Will pay instantly.",
                city: "bangalore",
                offeredPrice: rand(150, 500) * 100,
                status: "open",
                paymentStatus: "escrowed",
                escrowAmount: rand(150, 500) * 100,
                geoLat: 12.9716 + latOffset,
                geoLng: 77.5946 + lngOffset
            }
        });
    }

    console.log("✅ Seed completed successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
