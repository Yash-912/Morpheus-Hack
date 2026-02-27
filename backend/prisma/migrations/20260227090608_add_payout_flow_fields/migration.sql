-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('zomato', 'swiggy', 'ola', 'uber', 'dunzo', 'other');

-- CreateEnum
CREATE TYPE "EarningSource" AS ENUM ('api', 'screenshot_ocr', 'manual', 'sms_auto');

-- CreateEnum
CREATE TYPE "PayoutType" AS ENUM ('instant', 'same_day', 'scheduled');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'reversed');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('pending_approval', 'active', 'repaid', 'defaulted', 'rejected');

-- CreateEnum
CREATE TYPE "RepaymentMethod" AS ENUM ('auto_deduct', 'manual');

-- CreateEnum
CREATE TYPE "InsuranceType" AS ENUM ('daily_accident', 'weekly_health', 'device', 'vehicle_breakdown');

-- CreateEnum
CREATE TYPE "InsurancePolicyStatus" AS ENUM ('active', 'expired', 'claimed');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "InsurancePartner" AS ENUM ('acko', 'insurancedekho');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('fuel', 'toll', 'maintenance', 'food', 'mobile_recharge', 'parking', 'other');

-- CreateEnum
CREATE TYPE "ExpenseSource" AS ENUM ('sms_auto', 'manual', 'receipt_ocr');

-- CreateEnum
CREATE TYPE "TaxRegime" AS ENUM ('old', 'new');

-- CreateEnum
CREATE TYPE "TaxationScheme" AS ENUM ('presumptive_44ad', 'presumptive_44ada', 'regular');

-- CreateEnum
CREATE TYPE "ItrForm" AS ENUM ('ITR_3', 'ITR_4');

-- CreateEnum
CREATE TYPE "FilingStatus" AS ENUM ('draft', 'submitted', 'filed', 'verified');

-- CreateEnum
CREATE TYPE "CommunityJobType" AS ENUM ('local_delivery', 'ride', 'home_service', 'freelance');

-- CreateEnum
CREATE TYPE "CommunityJobStatus" AS ENUM ('open', 'assigned', 'in_progress', 'completed', 'cancelled', 'disputed');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'escrowed', 'released', 'refunded');

-- CreateEnum
CREATE TYPE "SavingType" AS ENUM ('round_up', 'goal_based', 'manual');

-- CreateEnum
CREATE TYPE "SavingStatus" AS ENUM ('active', 'paused', 'completed', 'withdrawn');

-- CreateEnum
CREATE TYPE "SavingPartner" AS ENUM ('groww', 'zerodha');

-- CreateEnum
CREATE TYPE "SavingTransactionType" AS ENUM ('deposit', 'withdrawal', 'interest');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('payout', 'loan', 'insurance', 'hot_zone', 'tax', 'algo_insight', 'community', 'system');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('push', 'whatsapp', 'in_app');

-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('acceptance_rate', 'surge_pattern', 'batch_logic', 'rating_recovery', 'idle_time');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('login', 'aadhaar_verify', 'withdrawal_verify');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('free', 'gigpro');

-- CreateEnum
CREATE TYPE "LanguagePref" AS ENUM ('en', 'hi', 'kn', 'ta', 'te');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "aadhaar_last4" TEXT,
    "pan" TEXT,
    "kyc_status" "KycStatus" NOT NULL DEFAULT 'pending',
    "kyc_method" TEXT,
    "face_embedding" BYTEA,
    "city" TEXT,
    "home_lat" DOUBLE PRECISION,
    "home_lng" DOUBLE PRECISION,
    "wallet_balance" BIGINT NOT NULL DEFAULT 0,
    "wallet_locked_balance" BIGINT NOT NULL DEFAULT 0,
    "wallet_lifetime_earned" BIGINT NOT NULL DEFAULT 0,
    "wallet_lifetime_withdrawn" BIGINT NOT NULL DEFAULT 0,
    "gig_score" INTEGER NOT NULL DEFAULT 0,
    "subscription_tier" "SubscriptionTier" NOT NULL DEFAULT 'free',
    "fcm_token" TEXT,
    "whatsapp_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "language_pref" "LanguagePref" NOT NULL DEFAULT 'en',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_seen" TIMESTAMP(3),
    "webauthn_credential_id" TEXT,
    "webauthn_public_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platform_user_id" TEXT NOT NULL,
    "access_token" TEXT,
    "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "platform_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "upi_id" TEXT,
    "account_number" TEXT,
    "ifsc" TEXT,
    "bank_name" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "earnings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "date" DATE NOT NULL,
    "gross_amount" BIGINT NOT NULL,
    "platform_deductions" BIGINT NOT NULL DEFAULT 0,
    "net_amount" BIGINT NOT NULL,
    "hours_worked" DOUBLE PRECISION,
    "trips_count" INTEGER,
    "avg_per_trip" BIGINT,
    "zone" TEXT,
    "source" "EarningSource" NOT NULL DEFAULT 'manual',
    "status" TEXT NOT NULL DEFAULT 'pending_settlement',
    "raw_screenshot_url" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "fee" INTEGER NOT NULL,
    "netAmount" INTEGER NOT NULL,
    "loanDeduction" INTEGER NOT NULL DEFAULT 0,
    "stripeTransferId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'instant',
    "status" TEXT NOT NULL DEFAULT 'processing',
    "upi_id" TEXT,
    "razorpay_payout_id" TEXT,
    "razorpay_fund_account_id" TEXT,
    "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "settlement_expected_at" TIMESTAMP(3),
    "settled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_earnings" (
    "id" TEXT NOT NULL,
    "payout_id" TEXT NOT NULL,
    "earning_id" TEXT NOT NULL,

    CONSTRAINT "payout_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "interest_rate" DOUBLE PRECISION NOT NULL,
    "total_repayable" BIGINT NOT NULL,
    "amount_repaid" BIGINT NOT NULL DEFAULT 0,
    "status" "LoanStatus" NOT NULL DEFAULT 'pending_approval',
    "disbursed_at" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "repayment_method" "RepaymentMethod" NOT NULL DEFAULT 'auto_deduct',
    "auto_deduct_percent" DOUBLE PRECISION,
    "nbfc_reference_id" TEXT,
    "credit_score_at_application" INTEGER,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_repayments" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payout_id" TEXT,

    CONSTRAINT "loan_repayments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_policies" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "InsuranceType" NOT NULL,
    "status" "InsurancePolicyStatus" NOT NULL DEFAULT 'active',
    "premium_paid" BIGINT NOT NULL,
    "cover_amount" BIGINT NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3) NOT NULL,
    "partner" "InsurancePartner" NOT NULL,
    "partner_policy_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_claims" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ClaimStatus" NOT NULL DEFAULT 'pending',
    "amount_claimed" BIGINT NOT NULL,
    "amount_approved" BIGINT,
    "documents" TEXT[],
    "notes" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" BIGINT NOT NULL,
    "merchant" TEXT,
    "date" DATE NOT NULL,
    "source" "ExpenseSource" NOT NULL DEFAULT 'manual',
    "sms_raw" TEXT,
    "receipt_url" TEXT,
    "is_tax_deductible" BOOLEAN NOT NULL DEFAULT false,
    "tax_category" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "financial_year" TEXT NOT NULL,
    "gross_income" BIGINT NOT NULL DEFAULT 0,
    "total_expenses" BIGINT NOT NULL DEFAULT 0,
    "taxable_income" BIGINT NOT NULL DEFAULT 0,
    "tax_regime" "TaxRegime" NOT NULL DEFAULT 'new',
    "taxation_scheme" "TaxationScheme" NOT NULL DEFAULT 'presumptive_44ad',
    "deduction_section_80c" BIGINT NOT NULL DEFAULT 0,
    "deduction_standard_deduction" BIGINT NOT NULL DEFAULT 0,
    "deduction_fuel_expense" BIGINT NOT NULL DEFAULT 0,
    "deduction_vehicle_depreciation" BIGINT NOT NULL DEFAULT 0,
    "deduction_mobile_expense" BIGINT NOT NULL DEFAULT 0,
    "deduction_other_business" BIGINT NOT NULL DEFAULT 0,
    "deduction_total" BIGINT NOT NULL DEFAULT 0,
    "tax_payable" BIGINT NOT NULL DEFAULT 0,
    "tax_paid" BIGINT NOT NULL DEFAULT 0,
    "refund_due" BIGINT NOT NULL DEFAULT 0,
    "itr_form" "ItrForm",
    "cleartax_return_id" TEXT,
    "filing_status" "FilingStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_jobs" (
    "id" TEXT NOT NULL,
    "posted_by" TEXT NOT NULL,
    "type" "CommunityJobType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "pickup_address" TEXT,
    "pickup_lat" DOUBLE PRECISION,
    "pickup_lng" DOUBLE PRECISION,
    "dropoff_address" TEXT,
    "dropoff_lat" DOUBLE PRECISION,
    "dropoff_lng" DOUBLE PRECISION,
    "offered_price" BIGINT NOT NULL,
    "status" "CommunityJobStatus" NOT NULL DEFAULT 'open',
    "assigned_to" TEXT,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "escrow_amount" BIGINT,
    "platform_fee" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "customer_rating_score" INTEGER,
    "customer_rating_comment" TEXT,
    "worker_rating_score" INTEGER,
    "worker_rating_comment" TEXT,
    "city" TEXT,
    "geo_lat" DOUBLE PRECISION,
    "geo_lng" DOUBLE PRECISION,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "SavingType" NOT NULL,
    "goal_name" TEXT,
    "goal_amount" BIGINT,
    "current_amount" BIGINT NOT NULL DEFAULT 0,
    "interest_earned" BIGINT NOT NULL DEFAULT 0,
    "partner" "SavingPartner",
    "partner_folio_id" TEXT,
    "status" "SavingStatus" NOT NULL DEFAULT 'active',
    "auto_save_percent" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "savings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saving_transactions" (
    "id" TEXT NOT NULL,
    "saving_id" TEXT NOT NULL,
    "type" "SavingTransactionType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,

    CONSTRAINT "saving_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "channels" "NotificationChannel"[],
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "algo_insights" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "city" TEXT NOT NULL,
    "insight_type" "InsightType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "supporting_data" JSONB,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "reported_by_count" INTEGER NOT NULL DEFAULT 0,
    "confidence_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "algo_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_sessions" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecast_data" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "worked" INTEGER NOT NULL DEFAULT 1,
    "rainfall_mm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "temp_celsius" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "average_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "incentives_earned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "net_earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "efficiency_ratio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forecast_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rollout" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_locations" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mumbai_gps_points" (
    "id" SERIAL NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "avg_earnings" DOUBLE PRECISION NOT NULL,
    "avg_incentives" DOUBLE PRECISION NOT NULL,
    "total_orders" DOUBLE PRECISION NOT NULL,
    "active_workers" INTEGER NOT NULL,
    "area_hint" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mumbai_gps_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_sms" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sms_timestamp" TIMESTAMP(3) NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discard_reason" TEXT,
    "is_relevant" BOOLEAN NOT NULL DEFAULT true,
    "processed_at" TIMESTAMP(3),
    "sync_batch_id" TEXT NOT NULL,

    CONSTRAINT "raw_sms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "total_scanned" INTEGER NOT NULL DEFAULT 0,
    "new_stored" INTEGER NOT NULL DEFAULT 0,
    "duplicates_skipped" INTEGER NOT NULL DEFAULT 0,
    "irrelevant_discarded" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "sync_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "raw_sms_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "direction" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "merchant" TEXT,
    "sender" TEXT NOT NULL,
    "sms_timestamp" TIMESTAMP(3) NOT NULL,
    "parsed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" DOUBLE PRECISION NOT NULL,
    "raw_body" TEXT NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_city_idx" ON "users"("city");

-- CreateIndex
CREATE INDEX "platform_accounts_platform_idx" ON "platform_accounts"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "platform_accounts_user_id_platform_key" ON "platform_accounts"("user_id", "platform");

-- CreateIndex
CREATE INDEX "bank_accounts_user_id_idx" ON "bank_accounts"("user_id");

-- CreateIndex
CREATE INDEX "earnings_user_id_date_idx" ON "earnings"("user_id", "date" DESC);

-- CreateIndex
CREATE INDEX "earnings_user_id_platform_date_idx" ON "earnings"("user_id", "platform", "date" DESC);

-- CreateIndex
CREATE INDEX "payouts_user_id_created_at_idx" ON "payouts"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payout_earnings_payout_id_earning_id_key" ON "payout_earnings"("payout_id", "earning_id");

-- CreateIndex
CREATE INDEX "loans_user_id_idx" ON "loans"("user_id");

-- CreateIndex
CREATE INDEX "loans_status_idx" ON "loans"("status");

-- CreateIndex
CREATE INDEX "loan_repayments_loan_id_idx" ON "loan_repayments"("loan_id");

-- CreateIndex
CREATE INDEX "insurance_policies_user_id_idx" ON "insurance_policies"("user_id");

-- CreateIndex
CREATE INDEX "insurance_policies_status_valid_to_idx" ON "insurance_policies"("status", "valid_to");

-- CreateIndex
CREATE INDEX "insurance_claims_policy_id_idx" ON "insurance_claims"("policy_id");

-- CreateIndex
CREATE INDEX "expenses_user_id_date_idx" ON "expenses"("user_id", "date" DESC);

-- CreateIndex
CREATE INDEX "expenses_user_id_category_idx" ON "expenses"("user_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "tax_records_user_id_financial_year_key" ON "tax_records"("user_id", "financial_year");

-- CreateIndex
CREATE INDEX "community_jobs_status_city_idx" ON "community_jobs"("status", "city");

-- CreateIndex
CREATE INDEX "community_jobs_posted_by_idx" ON "community_jobs"("posted_by");

-- CreateIndex
CREATE INDEX "community_jobs_assigned_to_idx" ON "community_jobs"("assigned_to");

-- CreateIndex
CREATE INDEX "savings_user_id_idx" ON "savings"("user_id");

-- CreateIndex
CREATE INDEX "saving_transactions_saving_id_idx" ON "saving_transactions"("saving_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at" DESC);

-- CreateIndex
CREATE INDEX "algo_insights_platform_city_idx" ON "algo_insights"("platform", "city");

-- CreateIndex
CREATE INDEX "algo_insights_insight_type_idx" ON "algo_insights"("insight_type");

-- CreateIndex
CREATE INDEX "otp_sessions_phone_idx" ON "otp_sessions"("phone");

-- CreateIndex
CREATE INDEX "otp_sessions_expires_at_idx" ON "otp_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "forecast_data_user_id_idx" ON "forecast_data"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "forecast_data_user_id_date_key" ON "forecast_data"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_name_key" ON "feature_flags"("name");

-- CreateIndex
CREATE INDEX "worker_locations_user_id_timestamp_idx" ON "worker_locations"("user_id", "timestamp");

-- CreateIndex
CREATE INDEX "raw_sms_processed_at_idx" ON "raw_sms"("processed_at");

-- CreateIndex
CREATE INDEX "raw_sms_user_id_sms_timestamp_idx" ON "raw_sms"("user_id", "sms_timestamp" DESC);

-- CreateIndex
CREATE INDEX "raw_sms_user_id_synced_at_idx" ON "raw_sms"("user_id", "synced_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "raw_sms_user_id_sender_sms_timestamp_key" ON "raw_sms"("user_id", "sender", "sms_timestamp");

-- CreateIndex
CREATE INDEX "sync_sessions_user_id_started_at_idx" ON "sync_sessions"("user_id", "started_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_raw_sms_id_key" ON "transactions"("raw_sms_id");

-- CreateIndex
CREATE INDEX "transactions_direction_idx" ON "transactions"("direction");

-- CreateIndex
CREATE INDEX "transactions_user_id_category_idx" ON "transactions"("user_id", "category");

-- CreateIndex
CREATE INDEX "transactions_user_id_sms_timestamp_idx" ON "transactions"("user_id", "sms_timestamp" DESC);

-- AddForeignKey
ALTER TABLE "platform_accounts" ADD CONSTRAINT "platform_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_earnings" ADD CONSTRAINT "payout_earnings_earning_id_fkey" FOREIGN KEY ("earning_id") REFERENCES "earnings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_earnings" ADD CONSTRAINT "payout_earnings_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "payouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_repayments" ADD CONSTRAINT "loan_repayments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_repayments" ADD CONSTRAINT "loan_repayments_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "insurance_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_records" ADD CONSTRAINT "tax_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_jobs" ADD CONSTRAINT "community_jobs_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_jobs" ADD CONSTRAINT "community_jobs_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings" ADD CONSTRAINT "savings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saving_transactions" ADD CONSTRAINT "saving_transactions_saving_id_fkey" FOREIGN KEY ("saving_id") REFERENCES "savings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forecast_data" ADD CONSTRAINT "forecast_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_locations" ADD CONSTRAINT "worker_locations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_sms" ADD CONSTRAINT "raw_sms_sync_batch_id_fkey" FOREIGN KEY ("sync_batch_id") REFERENCES "sync_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_sms" ADD CONSTRAINT "raw_sms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_sessions" ADD CONSTRAINT "sync_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_raw_sms_id_fkey" FOREIGN KEY ("raw_sms_id") REFERENCES "raw_sms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
