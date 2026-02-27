const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    try {
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log('No user found to seed!');
            return;
        }

        console.log(`Seeding data for User: ${user.phone}`);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                walletBalance: 500000,
                walletLifetimeEarned: 1250000,
                gigScore: 850,
            }
        });

        console.log('Updated user wallet balance to ₹5,000 and lifetime to ₹12,500');

        await prisma.earning.deleteMany({ where: { userId: user.id } });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        // Earning requires: userId, platform, date, grossAmount, netAmount
        await prisma.earning.createMany({
            data: [
                {
                    userId: user.id,
                    platform: 'uber',
                    grossAmount: 120000,
                    netAmount: 115000,
                    platformDeductions: 5000,
                    date: today,
                },
                {
                    userId: user.id,
                    platform: 'zomato',
                    grossAmount: 80000,
                    netAmount: 80000,
                    platformDeductions: 0,
                    date: yesterday,
                },
                {
                    userId: user.id,
                    platform: 'swiggy',
                    grossAmount: 250000,
                    netAmount: 240000,
                    platformDeductions: 10000,
                    date: lastWeek,
                }
            ]
        });

        console.log('Seeded 3 past earnings records.');
        console.log('Done! You can now test the cashout flow.');

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
