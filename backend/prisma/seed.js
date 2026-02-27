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
      where: { name: flag.key },
      update: { enabled: flag.enabled },
      create: {
        name: flag.key,
        enabled: flag.enabled,
      },
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
        languagePref: 'en',
        walletBalance: BigInt(50000_00),      // ₹50,000
        walletLifetimeEarned: BigInt(250000_00),     // ₹2,50,000
        walletLifetimeWithdrawn: BigInt(200000_00),  // ₹2,00,000
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
        platformUserId: 'ZOM-TEST-001',
        isActive: true,
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
        platformUserId: 'SWG-TEST-002',
        isActive: true,
      },
    });

    console.log('  ✅ Platform accounts added');

    // Add bank account
    // Since there's no unique composed key in schema for upside down, we just create
    await prisma.bankAccount.deleteMany({ where: { userId: testUser.id } });
    await prisma.bankAccount.create({
      data: {
        userId: testUser.id,
        accountNumber: '1234567890',
        ifsc: 'SBIN0001234',
        bankName: 'State Bank of India',
        isPrimary: true,
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

      const amountVal = BigInt(Math.floor(800_00 + Math.random() * 400_00));
      earnings.push({
        userId: testUser.id,
        platform: i % 2 === 0 ? 'zomato' : 'swiggy',
        date,
        grossAmount: amountVal,
        netAmount: amountVal,
        tripsCount: Math.floor(10 + Math.random() * 8),
        hoursWorked: 8 + Math.random() * 4,
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
        channels: ['in_app'],
      },
    });

    console.log('  ✅ Welcome notification added');

    // Generate 500 mock GPS points for Mumbai (Hot Zone ML feature)
    const mumbaiPoints = [];
    const baseLat = 19.0760;
    const baseLng = 72.8777;
    for (let i = 0; i < 500; i++) {
      mumbaiPoints.push({
        lat: baseLat + (Math.random() - 0.5) * 0.1, // ~5km radius
        lng: baseLng + (Math.random() - 0.5) * 0.1,
        avgEarnings: 150 + Math.random() * 200,   // ₹150-350 per hr
        avgIncentives: 20 + Math.random() * 50,
        totalOrders: Math.floor(5 + Math.random() * 25),
        activeWorkers: Math.floor(2 + Math.random() * 15),
        createdAt: new Date(Date.now() - Math.random() * 86400000), // last 24h
        areaHint: 'Andheri East',
      });
    }

    await prisma.mumbaiGpsPoint.deleteMany({}); // clear old ones
    await prisma.mumbaiGpsPoint.createMany({ data: mumbaiPoints });
    console.log(`  ✅ 500 mock Mumbai GPS points added for Hot Zone ML`);

    // Seed forecast_data from sample CSV (for earnings graph + ML predictions + AI insights)
    const fs = require('fs');
    const csvPath = require('path').resolve(__dirname, '../../ml-service/sample_earnings_60days.csv');
    if (fs.existsSync(csvPath)) {
      const csvText = fs.readFileSync(csvPath, 'utf-8');
      const csvLines = csvText.trim().split('\n');
      const header = csvLines[0].split(',').map(h => h.trim());
      const colIdx = {};
      header.forEach((h, i) => { colIdx[h] = i; });

      // Seed for ALL users in the system
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      for (const u of allUsers) {
        // Clear old forecast data for this user
        await prisma.forecastData.deleteMany({ where: { userId: u.id } });

        const forecastRows = [];
        for (let i = 1; i < csvLines.length; i++) {
          const vals = csvLines[i].split(',').map(v => v.trim());
          if (vals.length < header.length) continue;

          const netEarnings = parseFloat(vals[colIdx['net_earnings']]) || 0;
          const incentivesEarned = parseFloat(vals[colIdx['incentives_earned']]) || 0;

          forecastRows.push({
            userId: u.id,
            date: new Date(vals[colIdx['date']]),
            worked: parseInt(vals[colIdx['worked']]) || 0,
            rainfallMm: parseFloat(vals[colIdx['rainfall_mm']]) || 0,
            tempCelsius: parseFloat(vals[colIdx['temp_celsius']]) || 0,
            averageRating: parseFloat(vals[colIdx['average_rating']]) || 0,
            incentivesEarned,
            netEarnings,
            efficiencyRatio: parseFloat(vals[colIdx['efficiency_ratio']]) || 0,
            totalEarnings: netEarnings + incentivesEarned,
          });
        }

        await prisma.forecastData.createMany({ data: forecastRows });
        console.log(`  ✅ ${forecastRows.length} forecast_data rows seeded for user ${u.id}`);
      }
    } else {
      console.log('  ⚠️  sample_earnings_60days.csv not found — skipping forecast seed');
    }

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
