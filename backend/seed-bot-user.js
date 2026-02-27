// Seed user data for WhatsApp bot testing
require('dotenv').config();

const { prisma } = require('./config/database');

async function seedBotUser() {
    const phone = '+918425930564';

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
        console.log('User already exists with phone:', phone);
        console.log('User ID:', existing.id);
        await prisma.$disconnect();
        return;
    }

    // Create user with realistic gig worker data
    const user = await prisma.user.create({
        data: {
            phone,
            name: 'Morpheus Dev',
            email: 'morpheus@gigpay.in',
            city: 'Mumbai',
            languagePref: 'en',
            gigScore: 750,
            walletBalance: 1250000,            // ₹12,500 in paise
            walletLockedBalance: 0,
            walletLifetimeEarned: 8500000,     // ₹85,000 lifetime
            walletLifetimeWithdrawn: 7250000,  // ₹72,500 withdrawn
            isActive: true,
            kycStatus: 'verified',
            subscriptionTier: 'gigpro',
            whatsappOptIn: true,
            homeLat: 19.0760,
            homeLng: 72.8777,
            bankAccounts: {
                create: {
                    bankName: 'HDFC Bank',
                    accountNumber: 'XXXX5678',
                    ifsc: 'HDFC0001234',
                    isPrimary: true,
                    upiId: '8425930564@hdfc',
                    verified: true,
                },
            },
            platformAccounts: {
                create: [
                    {
                        platform: 'zomato',
                        platformUserId: 'ZMT_842593',
                        isActive: true,
                    },
                    {
                        platform: 'swiggy',
                        platformUserId: 'SWG_842593',
                        isActive: true,
                    },
                    {
                        platform: 'uber',
                        platformUserId: 'UBR_842593',
                        isActive: true,
                    },
                ],
            },
        },
    });

    console.log('✅ User created successfully!');
    console.log('   Phone:', user.phone);
    console.log('   Name:', user.name);
    console.log('   City:', user.city);
    console.log('   Wallet: ₹' + (Number(user.walletBalance) / 100).toFixed(2));
    console.log('   ID:', user.id);

    await prisma.$disconnect();
}

seedBotUser().catch((e) => {
    console.error('❌ Seed failed:', e.message);
    process.exit(1);
});
