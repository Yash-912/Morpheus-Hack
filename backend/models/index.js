// ============================================================
// Model Barrel Export — single import point for all helpers
// Usage: const { User, Earning, Payout } = require('./models');
// ============================================================

const User = require('./User');
const Earning = require('./Earning');
const Payout = require('./Payout');
const Loan = require('./Loan');
const InsurancePolicy = require('./InsurancePolicy');
const Expense = require('./Expense');
const TaxRecord = require('./TaxRecord');
const CommunityJob = require('./CommunityJob');
const Saving = require('./Saving');
const Notification = require('./Notification');
const AlgoInsight = require('./AlgoInsight');
const OtpSession = require('./OtpSession');

module.exports = {
  User,
  Earning,
  Payout,
  Loan,
  InsurancePolicy,
  Expense,
  TaxRecord,
  CommunityJob,
  Saving,
  Notification,
  AlgoInsight,
  OtpSession,
};
