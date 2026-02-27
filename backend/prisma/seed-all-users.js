const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedForAllUsers() {
    console.log('🌱 Seeding earnings for ALL existing users...');

    const users = await prisma.user.findMany({ select: { id: true, phone: true } });

    if (users.length === 0) {
        console.log('No users found. Log in first, then re-run this script.');
        return;
    }

    for (const user of users) {
        console.log(`\nSeeding data for user: ${user.id} (${user.phone})`);

        // Check if earnings already exist
        const existingCount = await prisma.earning.count({ where: { userId: user.id } });
        if (existingCount > 0) {
            console.log(`  ⏭️ Skipping — already has ${existingCount} earnings`);
            continue;
        }

        const today = new Date();
        const earnings = [];

        // Create 30 days of earnings
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const isSwiggy = Math.random() > 0.5;
            const grossVal = Math.floor(Math.random() * 2000) + 500; // ₹500–₹2500

            earnings.push({
                userId: user.id,
                platform: isSwiggy ? 'swiggy' : 'zomato',
                date,
                grossAmount: grossVal,
                platformDeductions: Math.floor(grossVal * 0.05),
                netAmount: Math.floor(grossVal * 0.95),
                hoursWorked: Math.floor(Math.random() * 6) + 4,
                tripsCount: Math.floor(Math.random() * 15) + 5,
                source: 'api',
                verified: true,
            });
        }

        await prisma.earning.createMany({ data: earnings });
        console.log(`  ✅ Created ${earnings.length} earnings`);

        // Update wallet balance
        const totalNet = earnings.reduce((s, e) => s + e.netAmount, 0);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                walletBalance: BigInt(totalNet),
                walletLifetimeEarned: BigInt(totalNet),
                gigScore: 780,
            },
        });
        console.log(`  ✅ Updated wallet balance: ₹${totalNet}`);
    }

    console.log('\n✅ All done!');
}

seedForAllUsers()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
