// ============================================================
// Expenses Controller — CRUD, summary, SMS batch, receipt OCR
// ============================================================

const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');
const MlService = require('../services/ml.service');
const OcrService = require('../services/ocr.service');
const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, EXPENSE_CATEGORIES } = require('../config/constants');

const expensesController = {
  /**
   * GET /api/expenses
   * Paginated list with category/date filters.
   */
  async list(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
      const skip = (page - 1) * limit;

      const where = { userId: req.user.id };
      if (req.query.category) where.category = req.query.category;
      if (req.query.startDate || req.query.endDate) {
        where.date = {};
        if (req.query.startDate) where.date.gte = new Date(req.query.startDate);
        if (req.query.endDate) where.date.lte = new Date(req.query.endDate);
      }

      const [expenses, total] = await Promise.all([
        prisma.expense.findMany({ where, orderBy: { date: 'desc' }, skip, take: limit }),
        prisma.expense.count({ where }),
      ]);

      const data = expenses.map((e) => ({
        ...e,
        amount: Number(e.amount),
      }));

      res.json({
        success: true,
        data,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/expenses/summary
   * Monthly category breakdown.
   */
  async summary(req, res, next) {
    try {
      const now = new Date();
      const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
      const year = parseInt(req.query.year, 10) || now.getFullYear();

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const expenses = await prisma.expense.findMany({
        where: {
          userId: req.user.id,
          date: { gte: startDate, lte: endDate },
        },
      });

      // Group by category
      const byCategory = {};
      let total = 0;
      let taxDeductibleTotal = 0;

      expenses.forEach((e) => {
        const amt = Number(e.amount);
        total += amt;

        if (!byCategory[e.category]) {
          const meta = EXPENSE_CATEGORIES[e.category] || { label: e.category, taxDeductible: false };
          byCategory[e.category] = {
            category: e.category,
            label: meta.label,
            amount: 0,
            count: 0,
            taxDeductible: meta.taxDeductible,
          };
        }
        byCategory[e.category].amount += amt;
        byCategory[e.category].count += 1;

        if (e.taxDeductible) taxDeductibleTotal += amt;
      });

      res.json({
        success: true,
        data: {
          month,
          year,
          total,
          taxDeductibleTotal,
          categories: Object.values(byCategory).sort((a, b) => b.amount - a.amount),
          expenseCount: expenses.length,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/expenses
   * Add manual expense.
   */
  async create(req, res, next) {
    try {
      const { category, amount, description, date, merchant } = req.body;

      const catMeta = EXPENSE_CATEGORIES[category];
      const taxDeductible = catMeta ? catMeta.taxDeductible : false;

      const expense = await prisma.expense.create({
        data: {
          userId: req.user.id,
          category,
          amount: BigInt(amount),
          description: description || '',
          merchant: merchant || null,
          date: date ? new Date(date) : new Date(),
          source: 'manual',
          taxDeductible,
        },
      });

      res.status(201).json({
        success: true,
        data: { ...expense, amount: Number(expense.amount) },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/expenses/sms-batch
   * Array of SMS texts → ML classifier → expense records.
   */
  async smsBatch(req, res, next) {
    try {
      const { messages } = req.body;

      const classified = await MlService.classifySmsMessages(messages);

      if (!classified || !Array.isArray(classified)) {
        return res.json({
          success: true,
          data: { created: 0, skipped: messages.length, expenses: [] },
        });
      }

      // Filter out non-expense classifications
      const expenseItems = classified.filter(
        (c) => c.category && c.category !== 'not_expense' && c.amount > 0
      );

      const created = [];
      for (const item of expenseItems) {
        const catMeta = EXPENSE_CATEGORIES[item.category];
        const expense = await prisma.expense.create({
          data: {
            userId: req.user.id,
            category: item.category,
            amount: BigInt(item.amount),
            description: item.merchant ? `Payment to ${item.merchant}` : 'Auto-detected from SMS',
            merchant: item.merchant || null,
            date: item.date ? new Date(item.date) : new Date(),
            source: 'sms',
            taxDeductible: catMeta?.taxDeductible || false,
          },
        });
        created.push({ ...expense, amount: Number(expense.amount) });
      }

      logger.info('SMS expense batch processed', {
        userId: req.user.id,
        total: messages.length,
        created: created.length,
      });

      res.status(201).json({
        success: true,
        data: {
          created: created.length,
          skipped: messages.length - created.length,
          expenses: created,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/expenses/receipt
   * Receipt image OCR.
   */
  async receipt(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'Receipt image is required' },
        });
      }

      // Use generic OCR — not platform-specific
      const Tesseract = require('tesseract.js');
      const { data: { text } } = await Tesseract.recognize(req.file.buffer, 'eng');

      // Extract amount from receipt text
      const amountMatch = text.match(/(?:total|amount|grand\s*total|net)\s*[:\-]?\s*₹?\s*(?:Rs\.?\s*)?([\d,]+(?:\.\d{1,2})?)/i);
      const amount = amountMatch
        ? Math.round(parseFloat(amountMatch[1].replace(/,/g, '')) * 100)
        : 0;

      // Extract merchant
      const lines = text.split('\n').filter((l) => l.trim());
      const merchant = lines[0]?.trim().substring(0, 100) || null;

      if (amount === 0) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'OCR_FAILED',
            message: 'Could not extract amount from receipt. Please add manually.',
          },
          data: { rawText: text.substring(0, 500) },
        });
      }

      const expense = await prisma.expense.create({
        data: {
          userId: req.user.id,
          category: 'other',
          amount: BigInt(amount),
          description: 'Scanned from receipt',
          merchant,
          date: new Date(),
          source: 'receipt_scan',
          taxDeductible: false,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          ...expense,
          amount: Number(expense.amount),
          extractedMerchant: merchant,
          ocrConfidence: 'medium',
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/expenses/:id
   */
  async remove(req, res, next) {
    try {
      const expense = await prisma.expense.findFirst({
        where: { id: req.params.id, userId: req.user.id },
      });

      if (!expense) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Expense not found' },
        });
      }

      await prisma.expense.delete({ where: { id: req.params.id } });

      res.json({ success: true, message: 'Expense deleted' });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = expensesController;
