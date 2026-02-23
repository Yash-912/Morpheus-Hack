// ============================================================
// Prisma Seed Script — bootstrap feature flags & dev test data
// Run with: npx prisma db seed
// ============================================================

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ----------------------------------------------------------
  // 1. Feature Flags (app-wide toggles)
  // ----------------------------------------------------------
  const featureFlags = [
    { key: 'instant_payouts', enabled: true, description: 'Enable instant payout requests' },
    { key: 'emergency_loans', enabled: true, description: 'Enable emergency micro-loans' },
    { key: 'micro_insurance', enabled: true, description: 'Enable insurance product offerings' },
    { key: 'savings_vault', enabled: true, description: 'Enable savings goals & round-ups' },
    { key: 'community_jobs', enabled: true, description: 'Enable peer-to-peer job marketplace' },
    { key: 'algo_insights', enabled: true, description: 'Enable crowd-sourced algorithm tips' },
    { key: 'whatsapp_bot', enabled: true, description: 'Enable WhatsApp interface' },
    { key: 'hot_zone_ai', enabled: false, description: 'ML-powered demand heat-map (Phase 4+)' },
    { key: 'earnings_predictor', enabled: false, description: 'ML-powered earnings forecast (Phase 4+)' },
    { key: 'aadhaar_kyc', enabled: false, description: 'Aadhaar-based KYC verification (Phase 3+)' },
    { key: 'tax_assistant', enabled: true, description: 'Tax computation & filing assistant' },
    { key: 'expense_sms_parsing', enabled: true, description: 'SMS-based expense auto-detection' },
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: { description: flag.description },
      create: flag,
    });
  }

  console.log(`  ✅ ${featureFlags.length} feature flags upserted`);

  // ----------------------------------------------------------
  // 2. Development Test Data (only in non-production)
  // ----------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    // Create a test user
    const testUser = await prisma.user.upsert({
      where: { phone: '+919999900000' },
      update: {},
      create: {
        phone: '+919999900000',
        name: 'Test Worker',
        city: 'Mumbai',
        preferredLanguage: 'en',
        walletBalance: BigInt(50000_00),      // ₹50,000
        totalEarnings: BigInt(250000_00),     // ₹2,50,000
        totalWithdrawals: BigInt(200000_00),  // ₹2,00,000
        kycStatus: 'verified',
      },
    });

    console.log(`  ✅ Test user created: ${testUser.phone}`);

    // Add platform accounts
    await prisma.platformAccount.upsert({
      where: {
        userId_platform: { userId: testUser.id, platform: 'zomato' },
      },
      update: {},
      create: {
        userId: testUser.id,
        platform: 'zomato',
        accountId: 'ZOM-TEST-001',
        connected: true,
      },
    });

    await prisma.platformAccount.upsert({
      where: {
        userId_platform: { userId: testUser.id, platform: 'swiggy' },
      },
      update: {},
      create: {
        userId: testUser.id,
        platform: 'swiggy',
        accountId: 'SWG-TEST-002',
        connected: true,
      },
    });

    console.log('  ✅ Platform accounts added');

    // Add bank account
    await prisma.bankAccount.upsert({
      where: {
        userId_accountNumber: {
          userId: testUser.id,
          accountNumber: '1234567890',
        },
      },
      update: {},
      create: {
        userId: testUser.id,
        accountNumber: '1234567890',
        ifscCode: 'SBIN0001234',
        bankName: 'State Bank of India',
        holderName: 'Test Worker',
        primary: true,
        verified: true,
      },
    });

    console.log('  ✅ Bank account added');

    // Add sample earnings
    const today = new Date();
    const earnings = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      earnings.push({
        userId: testUser.id,
        platform: i % 2 === 0 ? 'zomato' : 'swiggy',
        date,
        amount: BigInt(Math.floor(800_00 + Math.random() * 400_00)), // ₹800-₹1200
        trips: Math.floor(10 + Math.random() * 8),
        onlineHours: 8 + Math.random() * 4,
        source: 'manual',
      });
    }

    // Use createMany and skip duplicates
    await prisma.earning.createMany({
      data: earnings,
      skipDuplicates: true,
    });

    console.log(`  ✅ ${earnings.length} sample earnings added`);

    // Add a savings goal
    await prisma.saving.create({
      data: {
        userId: testUser.id,
        type: 'goal_based',
        goalName: 'New Phone',
        goalAmount: BigInt(25000_00), // ₹25,000
        currentAmount: BigInt(8500_00), // ₹8,500 saved
        status: 'active',
      },
    });

    console.log('  ✅ Sample savings goal added');

    // Add a welcome notification
    await prisma.notification.create({
      data: {
        userId: testUser.id,
        type: 'system',
        title: 'Welcome to GigPay!',
        body: 'Start by connecting your platform accounts to track earnings.',
        channel: 'in_app',
      },
    });

    console.log('  ✅ Welcome notification added');
  }

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
