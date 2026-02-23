// ============================================================
// Tax Controller — summary, deductions, calculate, file, filing status
// ============================================================

const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');
const TaxService = require('../services/tax.service');
const ClearTaxService = require('../services/cleartax.service');
const { EXPENSE_CATEGORIES, getFY } = require('../config/constants');

const taxController = {
  /**
   * GET /api/tax/summary/:fy
   * Full tax summary for financial year.
   */
  async summary(req, res, next) {
    try {
      const { fy } = req.params;
      const { startDate, endDate } = parseFY(fy);

      // Total earnings in FY
      const earningsAgg = await prisma.earning.aggregate({
        where: { userId: req.user.id, date: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      });

      // Tax-deductible expenses
      const expenses = await prisma.expense.findMany({
        where: { userId: req.user.id, date: { gte: startDate, lte: endDate } },
      });

      let totalExpenses = 0;
      let deductibleExpenses = 0;
      expenses.forEach((e) => {
        const amt = Number(e.amount);
        totalExpenses += amt;
        if (e.taxDeductible) deductibleExpenses += amt;
      });

      const totalEarnings = Number(earningsAgg._sum.amount || 0);
      const taxableIncome = Math.max(0, totalEarnings - deductibleExpenses);

      // Compute estimated tax
      const taxEstimate = TaxService.computeNewRegimeTax(taxableIncome);

      res.json({
        success: true,
        data: {
          fy,
          totalEarnings,
          totalExpenses,
          deductibleExpenses,
          taxableIncome,
          estimatedTax: taxEstimate.totalTax,
          taxBreakdown: taxEstimate,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/tax/deductions/:fy
   * Itemized deductions.
   */
  async deductions(req, res, next) {
    try {
      const { fy } = req.params;
      const { startDate, endDate } = parseFY(fy);

      const expenses = await prisma.expense.findMany({
        where: {
          userId: req.user.id,
          date: { gte: startDate, lte: endDate },
          taxDeductible: true,
        },
        orderBy: { date: 'asc' },
      });

      // Group by category
      const byCategory = {};
      let total = 0;

      expenses.forEach((e) => {
        const amt = Number(e.amount);
        total += amt;
        if (!byCategory[e.category]) {
          const meta = EXPENSE_CATEGORIES[e.category] || { label: e.category };
          byCategory[e.category] = { category: e.category, label: meta.label, amount: 0, count: 0, items: [] };
        }
        byCategory[e.category].amount += amt;
        byCategory[e.category].count += 1;
        byCategory[e.category].items.push({
          id: e.id,
          amount: amt,
          description: e.description,
          date: e.date,
          merchant: e.merchant,
        });
      });

      res.json({
        success: true,
        data: {
          fy,
          totalDeductions: total,
          categories: Object.values(byCategory).sort((a, b) => b.amount - a.amount),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/tax/calculate
   * Compute liability with optional extra deductions.
   */
  async calculate(req, res, next) {
    try {
      const { fy, extraDeductions = [] } = req.body;
      const { startDate, endDate } = parseFY(fy);

      const earningsAgg = await prisma.earning.aggregate({
        where: { userId: req.user.id, date: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      });

      const expenseAgg = await prisma.expense.aggregate({
        where: {
          userId: req.user.id,
          date: { gte: startDate, lte: endDate },
          taxDeductible: true,
        },
        _sum: { amount: true },
      });

      const totalEarnings = Number(earningsAgg._sum.amount || 0);
      const autoDeductions = Number(expenseAgg._sum.amount || 0);
      const extraTotal = extraDeductions.reduce((s, d) => s + (d.amount || 0), 0);
      const totalDeductions = autoDeductions + extraTotal;
      const taxableIncome = Math.max(0, totalEarnings - totalDeductions);

      const oldRegime = TaxService.computeOldRegimeTax(taxableIncome);
      const newRegime = TaxService.computeNewRegimeTax(taxableIncome);

      res.json({
        success: true,
        data: {
          fy,
          totalEarnings,
          autoDeductions,
          extraDeductions,
          totalDeductions,
          taxableIncome,
          oldRegime,
          newRegime,
          recommended: newRegime.totalTax <= oldRegime.totalTax ? 'new' : 'old',
          savings: Math.abs(oldRegime.totalTax - newRegime.totalTax),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/tax/file
   * Submit via ClearTax.
   */
  async file(req, res, next) {
    try {
      const { fy } = req.body;

      const user = await prisma.user.findUnique({ where: { id: req.user.id } });

      if (!user.panNumber) {
        return res.status(400).json({
          success: false,
          error: { code: 'PAN_REQUIRED', message: 'PAN number is required for filing. Please complete KYC.' },
        });
      }

      const result = await ClearTaxService.initiateFilingSession({
        userId: req.user.id,
        panNumber: user.panNumber,
        fy,
      });

      // Record filing attempt
      await prisma.taxFiling.create({
        data: {
          userId: req.user.id,
          financialYear: fy,
          status: 'initiated',
          provider: 'cleartax',
          externalId: result.sessionId || null,
        },
      });

      logger.info('Tax filing initiated', { userId: req.user.id, fy });

      res.json({
        success: true,
        data: {
          sessionId: result.sessionId,
          redirectUrl: result.redirectUrl,
          status: 'initiated',
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/tax/filing-status/:fy
   */
  async filingStatus(req, res, next) {
    try {
      const { fy } = req.params;

      const filing = await prisma.taxFiling.findFirst({
        where: { userId: req.user.id, financialYear: fy },
        orderBy: { createdAt: 'desc' },
      });

      if (!filing) {
        return res.json({
          success: true,
          data: { fy, status: 'not_filed', filing: null },
        });
      }

      // If external session exists, check latest status
      let latestStatus = filing.status;
      if (filing.externalId && filing.status !== 'completed' && filing.status !== 'failed') {
        try {
          const remote = await ClearTaxService.getFilingStatus(filing.externalId);
          if (remote && remote.status !== filing.status) {
            await prisma.taxFiling.update({
              where: { id: filing.id },
              data: { status: remote.status },
            });
            latestStatus = remote.status;
          }
        } catch (err) {
          logger.warn('ClearTax status check failed', { error: err.message });
        }
      }

      res.json({
        success: true,
        data: {
          fy,
          status: latestStatus,
          filing: { ...filing, id: undefined },
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

// ---- Helper: parse FY string to date range ----
function parseFY(fyStr) {
  const [startYear] = fyStr.split('-').map(Number);
  return {
    startDate: new Date(startYear, 3, 1),       // April 1
    endDate: new Date(startYear + 1, 2, 31, 23, 59, 59), // March 31
  };
}

module.exports = taxController;
