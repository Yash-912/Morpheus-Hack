const { PrismaClient } = require('@prisma/client');
const FinanceService = require('../services/finance.service');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting MVP Database Seed (4-Month Time Machine)...');

    // 1. Create Hackathon User
    const phone = '+919999900000';
    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
        user = await prisma.user.create({
            data: {
                phone,
                name: 'Test Worker',
                languagePref: 'en',
                city: 'Mumbai',
                homeLat: 19.0760,
                homeLng: 72.8777,
                walletBalance: 0,
                walletLifetimeEarned: 0
            }
        });
        console.log('Created new Hackathon User:', user.id);
    } else {
        // Reset User for fresh seed
        await prisma.earning.deleteMany({ where: { userId: user.id } });
        await prisma.expense.deleteMany({ where: { userId: user.id } });
        await prisma.creditLine.deleteMany({ where: { userId: user.id } });
        await prisma.savingsGoal.deleteMany({ where: { userId: user.id } });
        await prisma.gigScoreHistory.deleteMany({ where: { userId: user.id } });

        await prisma.user.update({
            where: { id: user.id },
            data: { walletBalance: 0, walletLifetimeEarned: 0, gigScore: 600 }
        });
        console.log('Reset existing Hackathon User:', user.id);
    }

    // 2. Setup Financial Products (The Targets)
    // Emergency Fund: ₹5,000 (500000 paise)
    await prisma.creditLine.create({
        data: {
            userId: user.id,
            type: 'EMERGENCY',
            principalAmount: BigInt(5000_00),
            outstandingAmount: BigInt(5000_00),
            dailyRepaymentRate: 10, // 10% deduction from daily earnings
            reason: 'Medical Emergency',
            status: 'ACTIVE'
        }
    });

    // Micro-Savings Goal: Buy a new smartphone (₹15,000)
    await prisma.savingsGoal.create({
        data: {
            userId: user.id,
            title: 'New Smartphone',
            targetAmount: BigInt(15000_00),
            currentAmount: BigInt(0),
            dailyDeductionLimit: BigInt(100_00), // Max save ₹100/day
            isCompleted: false
        }
    });

    // 3. The 4-Month Time Machine Loop (Nov 1, 2025 -> Feb 28, 2026)
    const startDate = new Date('2025-11-01T08:00:00Z');
    const endDate = new Date('2026-02-28T18:00:00Z');

    let currentDate = new Date(startDate);
    let totalDays = 0;

    console.log('⏳ Generating 120 Days of Real-Time Earnings Cascades...');

    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay(); // 0 is Sunday

        // Worker usually works 5-6 days a week
        const isWorkingDay = Math.random() < 0.85;

        if (isWorkingDay) {
            // Simulate 1 Earning (Swiggy/Zomato)
            // Base earning ₹600 - ₹1200 per day
            const baseEarn = Math.floor(600 + Math.random() * 600);
            const isWeekendSurge = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.5 : 1.0;
            const finalEarnParams = {
                platform: Math.random() > 0.5 ? 'swiggy' : 'zomato',
                date: new Date(currentDate),
                grossAmount: Math.floor(baseEarn * isWeekendSurge * 100), // to paise
                source: 'sms_auto'
            };

            // Cascade it through the engine!
            await FinanceService.recordEarning(user.id, finalEarnParams);
        }

        // Simulate occasional expenses (Fuel, Food)
        if (Math.random() < 0.4) {
            const expenseAmount = Math.floor(100 + Math.random() * 300); // ₹100-400
            await FinanceService.recordExpense(user.id, {
                category: 'fuel',
                amount: expenseAmount * 100,
                date: new Date(currentDate.getTime() + 1000 * 60 * 60 * 2), // 2 hours later
                deductFromWallet: false
            });
        }

        currentDate.setDate(currentDate.getDate() + 1);
        totalDays++;
    }

    // 4. Print Summary
    const finalUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
            earnings: { orderBy: { date: 'desc' }, take: 1 },
            creditLines: true,
            savingsGoals: true,
            gigScoreHistory: { orderBy: { month: 'asc' } }
        }
    });

    console.log('✅ MVP Seed Complete!');
    console.log(`Simulated ${totalDays} days of activity.`);
    console.log('--------------------------------------------------');
    console.log(`Final Wallet Balance: ₹${Number(finalUser.walletBalance) / 100}`);
    console.log(`Final GigScore: ${finalUser.gigScore}`);
    console.log(`Emergency Loan Debt Remaining: ₹${Number(finalUser.creditLines[0].outstandingAmount) / 100}`);
    console.log(`Savings Goal Progress: ₹${Number(finalUser.savingsGoals[0].currentAmount) / 100} / ₹${Number(finalUser.savingsGoals[0].targetAmount) / 100}`);
    console.log('--------------------------------------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
