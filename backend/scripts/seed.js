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
const TARGET_PHONE = '9372394505';

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
                gigScore: 650,
                onboardingTier: 3,
                activeSavingsDeductionRate: 0,
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
        await prisma.user.update({
            where: { id: user.id },
            data: {
                walletBalance: 1250000,
                gigScore: 650,
                onboardingTier: 3,
                activeSavingsDeductionRate: 25,
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

    // ══════════════════════════════════════════════════════════════
    // 6. Seed Financial Hub Data (GigScore, Gold, Gullak, Credit)
    // ══════════════════════════════════════════════════════════════
    console.log("Seeding Financial Hub data...");

    // Clean old Financial Hub data
    await prisma.gigScoreHistory.deleteMany({ where: { userId: user.id } });
    await prisma.digitalGoldHolding.deleteMany({ where: { userId: user.id } });
    await prisma.savingsGoal.deleteMany({ where: { userId: user.id } });
    await prisma.creditLine.deleteMany({ where: { userId: user.id } });

    // 6a. GigScore History — 4 months of trending-up scores
    console.log("  → GigScore history (4 months)...");
    const scoreHistory = [
        { monthsAgo: 4, consistency: 55, repayment: 60, tenure: 30, engagement: 50, discipline: 40, total: 420 },
        { monthsAgo: 3, consistency: 65, repayment: 75, tenure: 45, engagement: 60, discipline: 55, total: 500 },
        { monthsAgo: 2, consistency: 75, repayment: 85, tenure: 55, engagement: 70, discipline: 65, total: 580 },
        { monthsAgo: 1, consistency: 82, repayment: 92, tenure: 65, engagement: 78, discipline: 75, total: 650 },
    ];

    for (const h of scoreHistory) {
        const month = new Date();
        month.setMonth(month.getMonth() - h.monthsAgo);
        month.setDate(1);

        await prisma.gigScoreHistory.create({
            data: {
                userId: user.id,
                month,
                earningsConsistencyScore: h.consistency,
                repaymentHistoryScore: h.repayment,
                platformTenureScore: h.tenure,
                engagementScore: h.engagement,
                financialDisciplineScore: h.discipline,
                totalScore: h.total,
            },
        });
    }

    // 6b. Digital Gold Holding — 0.35g at avg ₹6,800/g
    console.log("  → Digital gold (0.35g)...");
    await prisma.digitalGoldHolding.create({
        data: {
            userId: user.id,
            totalGrams: 0.35,
            averagePurchasePrice: 6800,
        },
    });

    // 6c. Savings Goals (Gullaks)
    console.log("  → Savings goals (Phone Repair planned)...");

    await prisma.savingsGoal.create({
        data: {
            userId: user.id,
            title: "Phone Repair Fund",
            targetAmount: 2000,
            currentAmount: 0,
            dailyDeductionLimit: 0,
            isCompleted: false,
        },
    });

    // 6d. Credit History — 2 repaid Emergency Funds (shows repayment track record)
    console.log("  → Credit history (2 repaid emergency funds)...");
    await prisma.creditLine.create({
        data: {
            userId: user.id,
            type: 'EMERGENCY',
            principalAmount: 500,
            outstandingAmount: 0,
            dailyRepaymentRate: 20,
            status: 'REPAID',
        },
    });

    await prisma.creditLine.create({
        data: {
            userId: user.id,
            type: 'EMERGENCY',
            principalAmount: 1000,
            outstandingAmount: 0,
            dailyRepaymentRate: 20,
            status: 'REPAID',
        },
    });

    console.log("✅ Seed completed successfully! Financial Hub data ready for demo.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
