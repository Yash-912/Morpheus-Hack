// ============================================================
// Expense Model Helper — Category aggregations, tax deductions
// ============================================================

const prisma = require('../config/database');

const ExpenseHelper = {
  // -----------------------------------------------------------
  // Get monthly expenses grouped by category
  // -----------------------------------------------------------
  async getMonthlyByCategory(userId, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const grouped = await prisma.expense.groupBy({
      by: ['category'],
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
    });

    const total = grouped.reduce((sum, g) => sum + Number(g._sum.amount || 0), 0);

    return {
      month,
      year,
      total,
      categories: grouped.map((g) => ({
        category: g.category,
        total: Number(g._sum.amount || 0),
        count: g._count,
        percentage: total > 0 ? Number(((Number(g._sum.amount || 0) / total) * 100).toFixed(1)) : 0,
      })),
    };
  },

  // -----------------------------------------------------------
  // Get total tax-deductible expenses for a financial year
  // (April 1 to March 31)
  // -----------------------------------------------------------
  async getTotalDeductible(userId, financialYear) {
    // financialYear format: "2024-25" → April 2024 to March 2025
    const [startYearStr] = financialYear.split('-');
    const startYear = parseInt(startYearStr, 10);
    const fyStart = new Date(startYear, 3, 1); // April 1
    const fyEnd = new Date(startYear + 1, 2, 31); // March 31

    const result = await prisma.expense.aggregate({
      where: {
        userId,
        isTaxDeductible: true,
        date: { gte: fyStart, lte: fyEnd },
      },
      _sum: { amount: true },
      _count: true,
    });

    // Category breakdown of deductible expenses
    const byCategory = await prisma.expense.groupBy({
      by: ['taxCategory'],
      where: {
        userId,
        isTaxDeductible: true,
        date: { gte: fyStart, lte: fyEnd },
      },
      _sum: { amount: true },
      _count: true,
    });

    return {
      financialYear,
      totalDeductible: Number(result._sum.amount || 0),
      count: result._count,
      byCategory: byCategory.map((g) => ({
        taxCategory: g.taxCategory,
        total: Number(g._sum.amount || 0),
        count: g._count,
      })),
    };
  },

  // -----------------------------------------------------------
  // Get paginated expenses with filters
  // -----------------------------------------------------------
  async getExpenses(userId, { page = 1, limit = 20, category, startDate, endDate } = {}) {
    const where = { userId };
    if (category) where.category = category;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return {
      data: expenses.map(ExpenseHelper.serialize),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  // -----------------------------------------------------------
  // Create expense from parsed SMS
  // -----------------------------------------------------------
  async createFromSms(userId, parsedSms) {
    return prisma.expense.create({
      data: {
        userId,
        category: parsedSms.category,
        amount: BigInt(parsedSms.amount),
        merchant: parsedSms.merchant,
        date: new Date(parsedSms.date),
        source: 'sms_auto',
        smsRaw: parsedSms.rawText, // should be encrypted by caller
        isTaxDeductible: parsedSms.isTaxDeductible || false,
        taxCategory: parsedSms.taxCategory,
      },
    });
  },

  // -----------------------------------------------------------
  // Serialize for API response (BigInt → Number)
  // -----------------------------------------------------------
  serialize(expense) {
    if (!expense) return null;
    return {
      ...expense,
      amount: Number(expense.amount),
    };
  },
};

module.exports = ExpenseHelper;
