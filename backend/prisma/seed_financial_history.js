// ============================================================
// seed_financial_history.js — Seeds credit + loan history for demo
// Run: node prisma/seed_financial_history.js
// ============================================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TEST_PHONE = '+919999900000';

async function main() {
    console.log('🔧 Fixing user tier, KYC, and seeding financial history...\n');

    // Find our test user
    const user = await prisma.user.findUnique({ where: { phone: TEST_PHONE } });
    if (!user) {
        console.error('❌ Test user not found! Run seed_mvp.js first.');
        process.exit(1);
    }

    const userId = user.id;

    // ── Step 1: Fix user onboardingTier + kycStatus ──────────────
    await prisma.user.update({
        where: { id: userId },
        data: {
            onboardingTier: 3,
            kycStatus: 'verified',
        }
    });
    console.log('✅ User onboardingTier → 3, kycStatus → verified');

    // ── Step 2: Clean existing CreditLine records ────────────────
    await prisma.creditLine.deleteMany({ where: { userId } });
    console.log('🧹 Cleaned existing CreditLine records');

    // ── Step 3: Seed 2 REPAID CreditLines (Emergency Fund history) ──
    const creditLine1 = await prisma.creditLine.create({
        data: {
            userId,
            type: 'EMERGENCY',
            principalAmount: 500,
            outstandingAmount: 0,
            dailyRepaymentRate: 20,
            reason: 'fuel',
            status: 'REPAID',
            createdAt: new Date('2026-01-15T10:00:00Z'),
        }
    });
    console.log('✅ Seeded CreditLine #1 (₹500, REPAID, fuel, Jan 15)');

    const creditLine2 = await prisma.creditLine.create({
        data: {
            userId,
            type: 'EMERGENCY',
            principalAmount: 1000,
            outstandingAmount: 0,
            dailyRepaymentRate: 20,
            reason: 'medical',
            status: 'REPAID',
            createdAt: new Date('2026-02-05T10:00:00Z'),
        }
    });
    console.log('✅ Seeded CreditLine #2 (₹1000, REPAID, medical, Feb 5)');

    // ── Step 4: Clean existing Loan records ──────────────────────
    // Clean repayments first (FK constraint)
    const existingLoans = await prisma.loan.findMany({ where: { userId } });
    for (const loan of existingLoans) {
        await prisma.loanRepayment.deleteMany({ where: { loanId: loan.id } });
    }
    await prisma.loan.deleteMany({ where: { userId } });
    console.log('🧹 Cleaned existing Loan records');

    // ── Step 5: Seed 4 Loan records (various types, all repaid) ──
    // Loan 1: Small cash advance (repaid)
    const loan1 = await prisma.loan.create({
        data: {
            userId,
            amount: BigInt(100000),           // ₹1,000
            interestRate: 0,
            totalRepayable: BigInt(100000),
            amountRepaid: BigInt(100000),
            autoDeductPercent: 20,
            status: 'repaid',
            disbursedAt: new Date('2026-01-15T10:00:00Z'),
            dueDate: new Date('2026-01-22T00:00:00Z'),
            createdAt: new Date('2026-01-15T10:00:00Z'),
        }
    });
    // Add repayment records for loan 1
    await prisma.loanRepayment.createMany({
        data: [
            { loanId: loan1.id, amount: BigInt(50000), date: new Date('2026-01-18T10:00:00Z') },
            { loanId: loan1.id, amount: BigInt(50000), date: new Date('2026-01-21T10:00:00Z') },
        ]
    });
    console.log('✅ Seeded Loan #1 (Cash Advance ₹1,000, REPAID, Jan)');

    // Loan 2: Medium advance (repaid)
    const loan2 = await prisma.loan.create({
        data: {
            userId,
            amount: BigInt(250000),           // ₹2,500
            interestRate: 0,
            totalRepayable: BigInt(250000),
            amountRepaid: BigInt(250000),
            autoDeductPercent: 15,
            status: 'repaid',
            disbursedAt: new Date('2026-02-01T10:00:00Z'),
            dueDate: new Date('2026-02-14T00:00:00Z'),
            createdAt: new Date('2026-02-01T10:00:00Z'),
        }
    });
    await prisma.loanRepayment.createMany({
        data: [
            { loanId: loan2.id, amount: BigInt(100000), date: new Date('2026-02-05T10:00:00Z') },
            { loanId: loan2.id, amount: BigInt(100000), date: new Date('2026-02-09T10:00:00Z') },
            { loanId: loan2.id, amount: BigInt(50000), date: new Date('2026-02-12T10:00:00Z') },
        ]
    });
    console.log('✅ Seeded Loan #2 (Cash Advance ₹2,500, REPAID, Feb)');

    // Loan 3: Bike repair NBFC micro-loan (repaid)
    const loan3 = await prisma.loan.create({
        data: {
            userId,
            amount: BigInt(500000),           // ₹5,000
            interestRate: 2.5,
            totalRepayable: BigInt(512500),    // ₹5,125 (2.5% interest)
            amountRepaid: BigInt(512500),
            autoDeductPercent: 10,
            status: 'repaid',
            disbursedAt: new Date('2025-12-30T10:00:00Z'),
            dueDate: new Date('2026-01-30T00:00:00Z'),
            createdAt: new Date('2025-12-30T10:00:00Z'),
        }
    });
    await prisma.loanRepayment.createMany({
        data: [
            { loanId: loan3.id, amount: BigInt(200000), date: new Date('2026-01-10T10:00:00Z') },
            { loanId: loan3.id, amount: BigInt(200000), date: new Date('2026-01-20T10:00:00Z') },
            { loanId: loan3.id, amount: BigInt(112500), date: new Date('2026-01-28T10:00:00Z') },
        ]
    });
    console.log('✅ Seeded Loan #3 (NBFC Micro-Loan ₹5,000, REPAID, Dec-Jan)');

    // Loan 4: Latest advance — all repaid so user can demo applying
    const loan4 = await prisma.loan.create({
        data: {
            userId,
            amount: BigInt(150000),           // ₹1,500
            interestRate: 0,
            totalRepayable: BigInt(150000),
            amountRepaid: BigInt(150000),
            autoDeductPercent: 20,
            status: 'repaid',
            disbursedAt: new Date('2026-02-18T10:00:00Z'),
            dueDate: new Date('2026-02-25T00:00:00Z'),
            createdAt: new Date('2026-02-18T10:00:00Z'),
        }
    });
    await prisma.loanRepayment.createMany({
        data: [
            { loanId: loan4.id, amount: BigInt(75000), date: new Date('2026-02-21T10:00:00Z') },
            { loanId: loan4.id, amount: BigInt(75000), date: new Date('2026-02-24T10:00:00Z') },
        ]
    });
    console.log('✅ Seeded Loan #4 (Cash Advance ₹1,500, REPAID, Feb)');

    console.log('\n🎉 Financial history seeding complete!');
    console.log('   - 2 Emergency Funds (REPAID)');
    console.log('   - 4 Loans (all REPAID, 10 total repayments)');
    console.log('   - No active loans → user can apply for new ones during demo');
    console.log('   - onboardingTier = 3, kycStatus = verified');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
