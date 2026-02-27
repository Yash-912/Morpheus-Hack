const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed for mock earnings/expenses...');

    // 1. Get or create a default user
    let user = await prisma.user.findFirst({
        where: { phone: '+919999999999' }
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                phone: '+919999999999',
                name: 'Demo Rider',
                kycStatus: 'verified',
                walletBalance: 15450,
                walletLifetimeEarned: 45000,
                gigScore: 780,
            }
        });
        console.log(`Created demo user: ${user.id}`);
    } else {
        console.log(`Using existing user: ${user.id}`);
    }

    // 2. Generate Earnings for the last 30 days
    const today = new Date();
    const earnings = [];

    for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);

        // Random earnings between 500 and 2500 per day
        const grossVal = Math.floor(Math.random() * 2000) + 500;
        const isSwiggy = Math.random() > 0.5;

        earnings.push({
            userId: user.id,
            platform: isSwiggy ? 'swiggy' : 'zomato',
            date: d,
            grossAmount: grossVal,
            platformDeductions: Math.floor(grossVal * 0.05), // 5% deduction
            netAmount: Math.floor(grossVal * 0.95),
            hoursWorked: Math.floor(Math.random() * 6) + 4, // 4-10 hours
            tripsCount: Math.floor(Math.random() * 15) + 5, // 5-20 trips
            source: 'api',
            status: 'settled',
            verified: true
        });
    }

    console.log('Inserting Earnings...');
    await prisma.earning.createMany({
        data: earnings
    });

    // 3. Generate Expenses for the last 30 days
    const expenses = [];
    for (let i = 0; i < 15; i++) { // ~15 expenses in 30 days
        const d = new Date();
        d.setDate(today.getDate() - Math.floor(Math.random() * 30));

        const categories = ['fuel', 'maintenance', 'food', 'mobile_recharge'];
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const amt = Math.floor(Math.random() * 500) + 100;

        expenses.push({
            userId: user.id,
            category: cat,
            amount: amt,
            date: d,
            source: 'manual',
            isTaxDeductible: cat === 'fuel' || cat === 'maintenance'
        });
    }

    console.log('Inserting Expenses...');
    await prisma.expense.createMany({
        data: expenses
    });

    // 4. Generate some recent payouts (withdrawals)
    const payouts = [];
    for (let i = 0; i < 3; i++) {
        const d = new Date();
        d.setDate(today.getDate() - (i * 7)); // roughly weekly

        payouts.push({
            userId: user.id,
            amount: 5000,
            fee: 0,
            netAmount: 5000,
            type: 'instant',
            status: 'completed',
            initiatedAt: d,
            completedAt: d
        });
    }

    console.log('Inserting Payouts...');
    await prisma.payout.createMany({
        data: payouts
    });

    console.log('✅ Seeding completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
