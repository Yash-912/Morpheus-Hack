const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixWallets() {
    const users = await prisma.user.findMany({
        select: { id: true, phone: true, walletBalance: true },
    });

    for (const u of users) {
        const agg = await prisma.earning.aggregate({
            where: { userId: u.id },
            _sum: { netAmount: true },
        });
        const total = Number(agg._sum.netAmount || 0);

        await prisma.user.update({
            where: { id: u.id },
            data: {
                walletBalance: BigInt(total),
                walletLifetimeEarned: BigInt(total),
            },
        });

        console.log(`${u.phone}: walletBalance updated to ₹${total}`);
    }

    console.log('\n✅ All wallet balances synced with earnings!');
}

fixWallets()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
