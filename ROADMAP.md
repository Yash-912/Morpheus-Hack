# GIGPAY — COMPLETE PROJECT ROADMAP

> Every file, every module, every dependency — mapped out in build order.

---

## TABLE OF CONTENTS

1. [Project Summary](#1-project-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Phase 0 — Project Scaffolding & Config](#phase-0--project-scaffolding--config)
4. [Phase 1 — Database Layer (Prisma Models & Migrations)](#phase-1--database-layer-prisma-models--migrations)
5. [Phase 2 — Backend Core (Server, Config, Middleware, Utils)](#phase-2--backend-core-server-config-middleware-utils)
6. [Phase 3 — Backend Services Layer](#phase-3--backend-services-layer)
7. [Phase 4 — Backend Routes & Controllers](#phase-4--backend-routes--controllers)
8. [Phase 5 — Backend Jobs, Workers & Schedulers](#phase-5--backend-jobs-workers--schedulers)
9. [Phase 6 — ML Service (Python FastAPI)](#phase-6--ml-service-python-fastapi)
10. [Phase 7 — WhatsApp Bot Microservice](#phase-7--whatsapp-bot-microservice)
11. [Phase 8 — Frontend PWA Shell & Infrastructure](#phase-8--frontend-pwa-shell--infrastructure)
12. [Phase 9 — Frontend State Management & Hooks](#phase-9--frontend-state-management--hooks)
13. [Phase 10 — Frontend API Service Layer](#phase-10--frontend-api-service-layer)
14. [Phase 11 — Frontend Shared Components](#phase-11--frontend-shared-components)
15. [Phase 12 — Frontend Pages: Onboarding](#phase-12--frontend-pages-onboarding)
16. [Phase 13 — Frontend Pages: Home Dashboard](#phase-13--frontend-pages-home-dashboard)
17. [Phase 14 — Frontend Pages: Wallet & Cashout](#phase-14--frontend-pages-wallet--cashout)
18. [Phase 15 — Frontend Pages: Insights, Tax, Expenses](#phase-15--frontend-pages-insights-tax-expenses)
19. [Phase 16 — Frontend Pages: Community Marketplace](#phase-16--frontend-pages-community-marketplace)
20. [Phase 17 — Frontend Pages: Profile & Support](#phase-17--frontend-pages-profile--support)
21. [Phase 18 — DevOps & Deployment](#phase-18--devops--deployment)
22. [Complete File Inventory (All 160+ Files)](#complete-file-inventory)
23. [API Endpoints Master List (70+ Endpoints)](#api-endpoints-master-list)
24. [Database Tables Summary (12 Tables)](#database-tables-summary)
25. [Business Logic Rules Reference](#business-logic-rules-reference)
26. [Third-Party Integration Checklist](#third-party-integration-checklist)
27. [Environment Variables Checklist](#environment-variables-checklist)

---

## 1. PROJECT SUMMARY

| Attribute | Detail |
|---|---|
| **Product** | GigPay — Financial OS for India's gig workers |
| **Type** | Progressive Web App (PWA) |
| **Stack** | PERN (PostgreSQL, Express, React, Node.js) + Python FastAPI for ML |
| **Services** | 4 services — Backend API, ML Service, WhatsApp Bot, Frontend PWA |
| **Database** | PostgreSQL (primary) + Redis (cache/queues/sessions) |
| **Target Users** | Delivery partners (Zomato/Swiggy/Dunzo), rideshare drivers (Ola/Uber), freelancers |
| **Geography** | India Phase 1 — Bangalore, Delhi, Mumbai, Hyderabad, Chennai |
| **Core Modules** | 12 (Instant Payouts, Hot Zone AI, Earnings Predictor, WhatsApp Bot, Aadhaar KYC, Tax Assistant, Expense Tracker, Algo Insights, Community Marketplace, Emergency Loans, Micro Insurance, Savings Vault) |
| **Total Files** | ~160+ source files across all services |
| **Total API Endpoints** | 70+ REST endpoints + 6 ML endpoints + WebSocket events |

---

## 2. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  React PWA (Vite) ←→ Service Worker (Workbox)               │
│  IndexedDB (offline)    FCM Push Notifications               │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS / WSS
┌────────────────────────▼────────────────────────────────────┐
│                  NGINX REVERSE PROXY                         │
│  SSL Termination | Rate Limiting | Static Serving            │
└──────┬─────────────────────────────────────┬────────────────┘
       │                                     │
┌──────▼──────────┐               ┌──────────▼──────────────┐
│  MAIN BACKEND   │               │  WHATSAPP BOT SERVICE    │
│  Node.js/Express│               │  Node.js/Express         │
│  Port 5000      │               │  Port 5001               │
│  Socket.io      │               │  Twilio/Meta Webhook     │
└──────┬──────────┘               └──────────┬───────────────┘
       │                                     │
       └──────────────┬──────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 SHARED INFRASTRUCTURE                        │
│  PostgreSQL           Redis           AWS S3                 │
│  (Primary DB)   (Cache/Queue/Session) (File Storage)         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────┐
│  ML SERVICE                      │
│  Python FastAPI — Port 8000      │
│  LSTM + DBSCAN + mBERT NLP      │
└──────────────────────────────────┘
```

**Data Flows:**
- **Instant Payout**: User → WebAuthn biometric → POST /api/payouts/initiate → fraud check → Bull queue → Razorpay UPI → Socket.io status → WhatsApp confirmation
- **Hot Zone**: Cron (5 min) → GPS from Redis → ML DBSCAN clustering → GeoJSON → Redis cache → Socket.io broadcast → Frontend heatmap
- **SMS Expense**: Android SMS → batch POST → ML mBERT classifier → structured expense records → PostgreSQL

---

## PHASE 0 — PROJECT SCAFFOLDING & CONFIG

> Foundation: Repository structure, Docker, environment configuration, dependency setup.

### Files to Build

| # | File | Purpose | Details |
|---|---|---|---|
| 1 | `README.md` | Project documentation | Overview, setup instructions, architecture diagram, contributing guidelines |
| 2 | `.gitignore` | Git exclusions | Excludes `node_modules/`, `.env`, `dist/`, `*.log`, `data/training/`, `data/saved_models/`, `uploads/` |
| 3 | `.env.example` | Environment variable template | All 40+ env vars with placeholder values (see Section 27) |
| 4 | `docker-compose.yml` | Dev orchestration | 6 services: `backend` (port 5000), `ml-service` (port 8000), `whatsapp-bot` (port 5001), `frontend` (port 3000), `postgres` (port 5432), `redis` (port 6379). Mounts source volumes, passes env files |
| 5 | `docker-compose.prod.yml` | Production orchestration | 4 services: `nginx`, `backend` (2 replicas), `ml-service`, `whatsapp-bot`. Uses managed PostgreSQL (Supabase/Neon/RDS) + Redis Cloud |
| 6 | `nginx/nginx.conf` | Reverse proxy config | SSL termination (Let's Encrypt), routes: `/` → PWA static, `/api` → backend:5000, `/socket.io` → backend:5000 (WebSocket upgrade), `/whatsapp` → whatsapp-bot:5001 |
| 7 | `nginx/ssl/` | SSL cert placeholder | Directory for Let's Encrypt certs (generated by Certbot) |
| 8 | `backend/package.json` | Backend dependencies | 23 packages: express, @prisma/client, socket.io, bull, ioredis, jsonwebtoken, bcryptjs, express-rate-limit, express-validator, multer, sharp, tesseract.js, node-cron, axios, dotenv, morgan, helmet, cors, compression, winston, uuid, razorpay. Dev: prisma CLI |
| 9 | `backend/Dockerfile` | Backend container | Node 20 Alpine, copy package*.json, npm ci, copy source, expose 5000, CMD node server.js |
| 10 | `ml-service/requirements.txt` | Python dependencies | 16 packages: fastapi, uvicorn, tensorflow, scikit-learn, pandas, numpy, joblib, python-dotenv, httpx, psycopg2-binary, sqlalchemy, transformers, torch, pydantic, redis, aiohttp |
| 11 | `ml-service/Dockerfile` | ML container | Python 3.11 slim, copy requirements, pip install, copy source, expose 8000, CMD uvicorn main:app |
| 12 | `whatsapp-bot/package.json` | Bot dependencies | 6 packages: express, @twilio/conversations, dialogflow, axios, ioredis, dotenv |
| 13 | `whatsapp-bot/Dockerfile` | Bot container | Node 20 Alpine, copy package*.json, npm ci, copy source, expose 5001, CMD node server.js |
| 14 | `frontend/package.json` | Frontend dependencies | 22 packages: react, react-dom, react-router-dom, zustand, @tanstack/react-query, tailwindcss, axios, socket.io-client, @vis.gl/react-google-maps, recharts, react-hook-form, zod, vite-plugin-pwa, firebase, dayjs, react-hot-toast, framer-motion, i18next, react-i18next, lucide-react |
| 15 | `frontend/vite.config.js` | Vite build config | PWA plugin with `registerType: 'autoUpdate'`, Workbox strategies (NetworkFirst for /api, CacheFirst for static), path alias `@` → `src/`, dev proxy `/api` → `http://localhost:5000` |
| 16 | `frontend/tailwind.config.js` | Tailwind config | Custom theme colors (teal primary `#0d9488`, slate dark `#0f172a`), content paths for `src/**/*.{js,jsx}` |
| 17 | `frontend/postcss.config.js` | PostCSS config | Tailwind + autoprefixer plugins |
| 18 | `frontend/index.html` | HTML entry | Root `<div id="root">`, meta viewport, PWA meta tags, Google Maps script tag |

**Deliverable**: All services can `docker-compose up` and start (empty endpoints).

---

## PHASE 1 — DATABASE LAYER (PRISMA MODELS & MIGRATIONS)

> 12 PostgreSQL tables with Prisma ORM models, indexes, relations, computed fields, and lifecycle hooks.

### Files to Build

| # | File | Purpose | Key Fields | Indexes | Methods/Computed |
|---|---|---|---|---|---|
| 1 | `backend/prisma/schema.prisma` + `backend/models/User.js` | User accounts | `phone` (unique), `name`, `email`, `aadhaar_last4`, `pan` (encrypted), `kyc_status` (enum: pending/verified/rejected), `kyc_method`, `face_embedding` (Buffer), `city`, `home_lat/lng`, `platform_accounts[]` (platform, platform_user_id, access_token encrypted, linked_at, is_active), `bank_accounts[]` (upi_id, account_number encrypted, ifsc, bank_name, is_primary, verified), `wallet` {balance, locked_balance, lifetime_earned, lifetime_withdrawn}, `gig_score` (0–850), `subscription_tier` (free/gigpro), `fcm_token`, `whatsapp_opt_in`, `language_pref` (en/hi/kn/ta/te), `is_active`, `last_seen` | `{phone: 1}` unique, `{city: 1}`, `{'platform_accounts.platform': 1}` | Virtual: `fullKycVerified`. Pre-save hook: hash passwords, update `updated_at`. Method: `generateAuthTokens()` → `{accessToken, refreshToken}` signed RS256 |
| 2 | `backend/models/Earning.js` | Daily earnings per platform | `user_id`, `platform` (enum: zomato/swiggy/ola/uber/dunzo/other), `date`, `gross_amount` (paise), `platform_deductions`, `net_amount`, `hours_worked`, `trips_count`, `avg_per_trip`, `zone`, `source` (api/screenshot_ocr/manual), `raw_screenshot_url`, `verified` | `{user_id: 1, date: -1}`, `{user_id: 1, platform: 1, date: -1}`. Time-series optimized on `date` | Statics: `getDailySummary(userId, date)`, `getMonthlyStats(userId, month, year)` |
| 3 | `backend/models/Payout.js` | Payout transactions | `user_id`, `amount` (paise), `fee`, `net_amount`, `type` (instant/same_day/scheduled), `status` (pending/processing/completed/failed/reversed), `upi_id`, `razorpay_payout_id`, `razorpay_fund_account_id`, `earnings_ids[]`, `initiated_at`, `completed_at`, `failure_reason`, `settlement_expected_at`, `settled_at` | `{user_id: 1, created_at: -1}`, `{status: 1}` | Static: `getPendingSettlements()` |
| 4 | `backend/models/Loan.js` | Emergency loans | `user_id`, `amount` (paise), `interest_rate` (monthly %), `total_repayable`, `amount_repaid`, `status` (pending_approval/active/repaid/defaulted/rejected), `disbursed_at`, `due_date`, `repayment_method` (auto_deduct/manual), `auto_deduct_percent`, `nbfc_reference_id`, `credit_score_at_application`, `rejection_reason`, `repayment_history[]` {amount, date, payout_id} | `{user_id: 1}`, `{status: 1}` | Virtual: `outstanding_balance`. Statics: `getActiveLoans(userId)`, `getTotalOutstanding(userId)` |
| 5 | `backend/models/InsurancePolicy.js` | Insurance policies | `user_id`, `type` (daily_accident/weekly_health/device/vehicle_breakdown), `status` (active/expired/claimed), `premium_paid`, `cover_amount`, `valid_from`, `valid_to`, `partner` (acko/insurancedekho), `partner_policy_id`, `claim` {submitted_at, status, amount_claimed, amount_approved, documents[], notes} | `{user_id: 1}`, `{status: 1, valid_to: 1}` | — |
| 6 | `backend/models/Expense.js` | Expense tracking | `user_id`, `category` (fuel/toll/maintenance/food/mobile_recharge/parking/other), `amount`, `merchant`, `date`, `source` (sms_auto/manual/receipt_ocr), `sms_raw` (encrypted), `receipt_url`, `is_tax_deductible`, `tax_category`, `notes` | `{user_id: 1, date: -1}`, `{user_id: 1, category: 1}` | Statics: `getMonthlyByCategory(userId, month, year)`, `getTotalDeductible(userId, financialYear)` |
| 7 | `backend/models/TaxRecord.js` | Annual tax records | `user_id`, `financial_year` (e.g., "2024-25"), `gross_income`, `total_expenses`, `taxable_income`, `tax_regime` (old/new), `taxation_scheme` (presumptive_44ad/44ada/regular), `deductions` {section_80c, standard_deduction, fuel_expense, vehicle_depreciation, mobile_expense, other_business, total}, `tax_payable`, `tax_paid`, `refund_due`, `itr_form` (ITR-3/ITR-4), `cleartax_return_id`, `filing_status` (draft/submitted/filed/verified) | `{user_id: 1, financial_year: 1}` unique | — |
| 8 | `backend/models/CommunityJob.js` | Marketplace jobs | `posted_by`, `type` (local_delivery/ride/home_service/freelance), `title`, `description`, `pickup_location` {address, lat, lng}, `dropoff_location` {address, lat, lng}, `offered_price`, `status` (open/assigned/in_progress/completed/cancelled/disputed), `assigned_to`, `payment_status` (pending/escrowed/released/refunded), `escrow_amount`, `platform_fee` (5%), `ratings` {by_customer: {score, comment}, by_worker: {score, comment}}, `city`, `geo_location` (GeoJSON Point), `expires_at` | `{geo_location: "GiST (PostGIS)"}`, `{status: 1, city: 1}`, `{posted_by: 1}` | — |
| 9 | `backend/models/Saving.js` | Savings vault | `user_id`, `type` (round_up/goal_based/manual), `goal_name`, `goal_amount`, `current_amount`, `interest_earned`, `partner` (groww/zerodha), `partner_folio_id`, `status` (active/paused/completed/withdrawn), `auto_save_percent`, `transactions[]` {type: deposit/withdrawal/interest, amount, date, source} | `{user_id: 1}` | — |
| 10 | `backend/models/Notification.js` | Notification history | `user_id`, `type` (payout/loan/insurance/hot_zone/tax/algo_insight/community/system), `title`, `body`, `data` (Object), `channels[]` (push/whatsapp/in_app), `sent_at`, `read_at` | `{user_id: 1, read_at: 1}`, `{created_at: -1}` | Static: `getUnread(userId)` |
| 11 | `backend/models/AlgoInsight.js` | Algorithm insights | `platform` (zomato/swiggy/ola/uber), `city`, `insight_type` (acceptance_rate/surge_pattern/batch_logic/rating_recovery/idle_time), `title`, `body`, `supporting_data` (Object), `upvotes`, `reported_by_count`, `confidence_score` (0–1), `is_verified`, `valid_from`, `valid_until` | `{platform: 1, city: 1}`, `{insight_type: 1}` | — |
| 12 | `backend/models/OtpSession.js` | OTP verification | `phone`, `otp_hash` (bcrypt), `purpose` (login/aadhaar_verify/withdrawal_verify), `attempts`, `expires_at` | Index: `{expires_at: 1}` with pg_cron cleanup job | — |

**Deliverable**: All 12 Prisma models defined with migrations, indexes, and relations. Database can be seeded.

---

## PHASE 2 — BACKEND CORE (SERVER, CONFIG, MIDDLEWARE, UTILS)

> Server entry points, configuration modules, all middleware, and utility functions.

### 2A — Config Files (6 files)

| # | File | Purpose | What It Does |
|---|---|---|---|
| 1 | `backend/config/database.js` | PostgreSQL connection via Prisma | Exports `connectDatabase()` — initializes Prisma Client with connection pooling. Event listeners for connected/error/disconnected. Runs `prisma migrate deploy` in production |
| 2 | `backend/config/redis.js` | Redis client setup | Creates two ioredis clients: `redisClient` (general cache/queue) and `redisPubSub` (pub/sub for Socket.io events). Exports both + `connectRedis()` |
| 3 | `backend/config/firebase.js` | Firebase Admin SDK | Initializes `admin.initializeApp()` with `FIREBASE_SERVICE_ACCOUNT` JSON. Exports `fcmMessaging` = `admin.messaging()` |
| 4 | `backend/config/razorpay.js` | Razorpay SDK | Creates `new Razorpay({key_id, key_secret})`. Exports `razorpayClient` |
| 5 | `backend/config/aws.js` | AWS SDK clients | Creates `S3Client` and `RekognitionClient` with region `ap-south-1` + credentials from env. Exports both |
| 6 | `backend/config/constants.js` | App-wide constants | `PAYOUT_FEE_PERCENT = 0.012` (1.2%), `INSTANT_PAYOUT_FEE_PERCENT = 0.015` (1.5%), `PAYOUT_FEE_FLAT = 500` (₹5 paise), `MAX_LOAN_AMOUNT = 500000` (₹5,000 paise), `LOAN_INTEREST_RATE_MONTHLY = 0.02` (2%), `COMMUNITY_PLATFORM_FEE = 0.05` (5%), `GIG_PRO_PRICE = 9900` (₹99 paise), `SETTLEMENT_BUFFER_PERCENT = 0.10`, `GIGSCORE_MIN_FOR_LOAN = 400`, `DAILY_CASHOUT_LIMIT = 5000000` (₹50,000 paise), enum maps for platforms/categories |

### 2B — Server Entry Points (2 files)

| # | File | Purpose | What It Does |
|---|---|---|---|
| 7 | `backend/app.js` | Express app setup | Creates Express app → applies middleware chain: `helmet()`, `cors({origin: FRONTEND_URL, credentials: true})`, `compression()`, `morgan('combined')`, `express.json({limit: '10mb'})`, `express.urlencoded()` → mounts routes from `routes/index.js` under `/api` → 404 handler → global error handler from `errorHandler.middleware.js` → exports app |
| 8 | `backend/server.js` | HTTP server entry | Imports `app.js` → creates `http.Server` → attaches Socket.io to HTTP server → imports & starts all Bull queue workers → imports & starts all cron schedulers → calls `connectDatabase()` + `connectRedis()` → `server.listen(PORT)` → handles `unhandledRejection` + `uncaughtException` with graceful shutdown |

### 2C — Middleware (7 files)

| # | File | Purpose | Logic |
|---|---|---|---|
| 9 | `backend/middleware/auth.middleware.js` | JWT verification | Extract Bearer token from `Authorization` header → `jsonwebtoken.verify()` with RSA public key → load user from PostgreSQL via Prisma → check `is_active === true` → attach `req.user` → `next()`. Failure: `401 Unauthorized` |
| 10 | `backend/middleware/biometric.middleware.js` | Withdrawal token check | Extract `withdrawal_token` from body → verify in Redis key `withdrawal_token:{userId}:{token}` → token TTL 5 min, single-use (delete after verify). Failure: `403 Biometric verification required` |
| 11 | `backend/middleware/kyc.middleware.js` | KYC gate | Check `req.user.kyc_status === 'verified'`. Failure: `403 KYC_REQUIRED` |
| 12 | `backend/middleware/rateLimiter.middleware.js` | Rate limiting via Redis | Exports: `otpLimiter` (3/phone/10min), `payoutLimiter` (10/user/hr), `generalLimiter` (100/IP/15min), `authLimiter` (20/IP/15min) |
| 13 | `backend/middleware/upload.middleware.js` | File upload | Multer config: memory storage (buffer → S3), 5MB limit, allowed types: jpeg/png/pdf |
| 14 | `backend/middleware/validate.middleware.js` | Validation runner | Runs `express-validator` validation chain → returns 400 with error details if validation fails |
| 15 | `backend/middleware/errorHandler.middleware.js` | Global error handler | Log with Winston → Prisma `PrismaClientValidationError` → 400, Prisma `PrismaClientKnownRequestError` → map to appropriate HTTP status, custom `statusCode` → use it, default → 500. Returns `{success: false, error: {code, message, details?}}`. Never exposes stack in production |

### 2D — Utilities (6 files)

| # | File | Purpose | Functions |
|---|---|---|---|
| 16 | `backend/utils/crypto.utils.js` | Sensitive field encryption | `encrypt(text)` — AES-256-GCM with `ENCRYPTION_KEY` env → returns `{iv, tag, ciphertext}` as base64. `decrypt(encryptedString)` — reverses |
| 17 | `backend/utils/logger.utils.js` | Structured logging | Winston config: console transport (dev), file transport `error.log` + `combined.log` (prod). Log level from `LOG_LEVEL` env |
| 18 | `backend/utils/geoUtils.js` | Geospatial math | `haversineDistance(lat1, lng1, lat2, lng2)` → km. `isWithinZone(lat, lng, zonePolygon)` → bool. `getCity(lat, lng)` → city name via Google Maps Geocoding |
| 19 | `backend/utils/formatters.utils.js` | Display formatting | Currency formatter (paise → ₹x,xxx.xx), date formatters (IST timezone), percentage formatter |
| 20 | `backend/utils/validators.utils.js` | Custom validators | Phone number regex (Indian +91 10-digit), Aadhaar format, PAN format, UPI ID format, amount range validation |
| 21 | `backend/utils/gigScore.utils.js` | GigScore algorithm | Calculates 0–850 score. Factors: earnings consistency (30%, CV of last 30d), platform tenure (20%, months since first earning), repayment history (25%, on-time %), platform ratings (15%, avg rating), app engagement (10%, active days/30). Recalculated nightly |

**Deliverable**: Backend server boots, connects to PostgreSQL + Redis, all middleware functional, utilities tested.

---

## PHASE 3 — BACKEND SERVICES LAYER

> 17 service modules handling all business logic, third-party API calls, and data processing.

| # | File | Purpose | Functions | External APIs |
|---|---|---|---|---|
| 1 | `backend/services/aadhaar.service.js` | UIDAI eKYC | `requestOtp(aadhaarNumber)` → POST UIDAI `/otp` → `{txnId}`. `verifyOtp(aadhaarNumber, otp, txnId)` → POST UIDAI `/kyc` → `{name, dob, address, photo_base64, verified}` | UIDAI Sandbox API |
| 2 | `backend/services/biometric.service.js` | Face verification | `enrollFace(userId, imageBuffer)` → Rekognition `IndexFaces` → stores FaceId. `verifyFace(userId, imageBuffer)` → Rekognition `SearchFacesByImage` → `{match, confidence}`. `livenessCheck(imageBuffer)` → Rekognition `DetectFaces` + eye-open/single-face checks | AWS Rekognition |
| 3 | `backend/services/razorpay.service.js` | Payout operations | `createFundAccount(userId, bankDetails)` → Razorpay fund account → `fund_account_id`. `initiatePayout(payoutData)` → Razorpay `POST /payouts` → `razorpay_payout_id`. `getPayoutStatus(id)` → live status. `verifyWebhookSignature(body, sig)` → HMAC SHA256 verify. All amounts in paise | Razorpay API |
| 4 | `backend/services/platform.service.js` | Platform earnings sync | `getZomatoEarnings(token, date)`, `getSwiggyEarnings(token, date)`, `getOlaEarnings(token, date)`, `getUberEarnings(token, date)` → earnings data per platform. `syncAllPlatforms(userId)` → iterates linked accounts, upserts `Earning` records. Fallback: flags `needs_screenshot: true` | Zomato/Swiggy/Ola/Uber Partner APIs |
| 5 | `backend/services/ml.service.js` | ML microservice client | `getEarningsForecast(userId, date)` → POST ML `/predict/earnings` → `{min, max, expected, confidence, factors}`. `getHotZones(city, timestamp)` → GET ML `/zones/{city}` → GeoJSON. `classifySmsMessages(messages)` → POST ML `/sms/classify`. `getAlgoInsights(platform, city)` → GET ML `/insights`. Axios 10s timeout, Redis fallback | Internal ML Service |
| 6 | `backend/services/notification.service.js` | Multi-channel notifications | `sendPush(userId, {title, body, data})` → FCM via `fcmMessaging.send()`. `sendWhatsApp(userId, message)` → delegates to whatsapp.service. `sendNotification(userId, notification, channels)` → dispatches to channels + creates `Notification` DB record. `sendPayoutConfirmation(userId, data)` → pre-built message. `sendHotZoneAlert(userId, zones)` → pre-built message | Firebase FCM |
| 7 | `backend/services/whatsapp.service.js` | WhatsApp message sending | `sendMessage(phone, message)` → Meta WhatsApp Business API POST. `sendTemplate(phone, templateName, params)` → template message for first-contact. Fallback to Twilio if Meta API fails | Meta WhatsApp Business API, Twilio |
| 8 | `backend/services/sms.service.js` | SMS OTP sending | `sendOtp(phone, otp)` → Twilio `client.messages.create()` with OTP text. `verifyOtp(phone, otp)` → verify against stored hash. Rate limited: 3/phone/10min | Twilio SMS |
| 9 | `backend/services/ocr.service.js` | Earnings screenshot OCR | `extractEarnings(imageBuffer, platform)` → Tesseract.js OCR → platform-specific regex patterns for Zomato/Swiggy/Ola/Uber earnings screens → extracts total earnings, trip count, date → returns structured data or `null` | Tesseract.js (local) |
| 10 | `backend/services/tax.service.js` | Tax calculation engine | `calculateTaxLiability(userId, fy)` → aggregates earnings + expenses for FY, applies Section 44AD/44ADA, standard deduction, 80C, 87A rebate → returns full `TaxRecord`. `getDeductionSuggestions(userId, fy)` → missed deductions list. `compareRegimes(income, deductions)` → `{old_regime_tax, new_regime_tax, recommended}`. `getAdvanceTaxDueDates(fy)` → dates + estimated amounts. `isPresumedTaxationBetter(gross, expenses)` → bool | — |
| 11 | `backend/services/cleartax.service.js` | Tax filing integration | `prefillITR(userId, fy)` → ClearTax API pre-fill. `submitReturn(userId, fy)` → ClearTax filing submission. `getFilingStatus(returnId)` → status check | ClearTax API |
| 12 | `backend/services/insurance.service.js` | Insurance operations | `getAvailablePlans(userProfile)` → list plans with pricing. `activatePolicy(userId, type, duration)` → Acko/InsuranceDekho API → policy creation. `submitClaim(policyId, claimData)` → claim submission. `getClaimStatus(claimId)` → status check | Acko / InsuranceDekho API |
| 13 | `backend/services/loan.service.js` | Loan operations | `checkEligibility(userId)` → checks gig_score >= 400, no defaults, no active loan > 50% repaid → calculates max = min(₹5000, 5 × avg_daily_30d). `applyLoan(userId, amount, repaymentPercent)` → NBFC API disbursement. `processRepayment(loanId, amount, payoutId)` → update repayment. `checkDefault(loanId)` → default detection | NBFC Partner API |
| 14 | `backend/services/savings.service.js` | Savings vault | `createGoal(userId, data)` → Groww/Zerodha fund allocation. `processDeposit(savingId, amount)` → fund deposit. `processWithdrawal(savingId, amount)` → fund redemption. `processRoundUp(userId, payoutAmount)` → round-up calculation + auto-deposit | Groww / Zerodha Coin API |
| 15 | `backend/services/storage.service.js` | AWS S3 file storage | `uploadFile(buffer, key, contentType)` → S3 PutObject → returns URL. `getSignedUrl(key, expiry)` → pre-signed download URL. `deleteFile(key)` → S3 DeleteObject. Bucket: `gigpay-uploads` | AWS S3 |
| 16 | `backend/services/fraud.service.js` | Fraud detection | `checkPayoutFraud(userId, amount, location)` → runs 4 rules: (1) amount > 3× daily avg → flag, (2) location > 50km from usual zone → flag, (3) 3+ payouts in 1hr → block, (4) new device + first withdrawal > ₹1000 → extra verify. Returns `{flagged, blocked, reason}` | — |
| 17 | `backend/services/community.service.js` | Marketplace logic | `findNearbyJobs(lat, lng, radius, type)` → PostGIS `ST_DWithin` geospatial query. `createJob(userId, jobData)` → escrow customer wallet. `acceptJob(jobId, workerId)` → status → assigned. `confirmCompletion(jobId, customerId)` → release escrow minus 5% fee. `handleDispute(jobId)` → flag for review, hold escrow | — |

**Deliverable**: All 17 services with proper error handling, mock mode support, and logging.

---

## PHASE 4 — BACKEND ROUTES & CONTROLLERS

> 14 route files mapping HTTP endpoints to controllers. Controllers parse requests, call services, return JSON.

### 4A — Route Aggregator

| # | File | Purpose |
|---|---|---|
| 1 | `backend/routes/index.js` | Mounts all route files under `/api`: auth, user, earnings, payouts, loans, insurance, expenses, tax, community, savings, insights, notifications, webhooks |

### 4B — Auth (10 endpoints)

| # | Files | Endpoints |
|---|---|---|
| 2-3 | `backend/routes/auth.routes.js` + `backend/controllers/auth.controller.js` | **POST `/api/auth/send-otp`** — Send OTP to phone. Rate limited 3/10min. Generates 6-digit OTP, bcrypt hashes, stores in OtpSession, sends via Twilio. **POST `/api/auth/verify-otp`** — Verify OTP hash, max 5 attempts, delete session on success, upsert user, return `{accessToken, refreshToken, user, isNewUser}`. **POST `/api/auth/refresh`** — Verify refresh token from Redis whitelist, issue new access token. **POST `/api/auth/logout`** — Delete refresh token from Redis (requires auth). **POST `/api/auth/kyc/aadhaar/init`** — Request UIDAI OTP for Aadhaar (requires auth). **POST `/api/auth/kyc/aadhaar/verify`** — Verify UIDAI OTP, extract name/DOB/address, store kyc_status: verified (requires auth). **POST `/api/auth/kyc/selfie`** — Upload selfie multipart, S3 upload, Rekognition face match against Aadhaar photo, enroll face_embedding (requires auth). **POST `/api/auth/biometric/register`** — Store WebAuthn credential public key + credential ID (requires auth). **POST `/api/auth/biometric/challenge`** — Get WebAuthn challenge (requires auth). **POST `/api/auth/biometric/authenticate`** — Verify WebAuthn assertion, return 5-min withdrawal token stored in Redis (requires auth). |

### 4C — User (2 endpoints)

| # | Files | Endpoints |
|---|---|---|
| 4-5 | `backend/routes/user.routes.js` + `backend/controllers/user.controller.js` | **GET `/api/users/profile`** — Get current user profile (requires auth). **PATCH `/api/users/profile`** — Update profile fields (requires auth). |

### 4D — Earnings (6 endpoints)

| # | Files | Endpoints |
|---|---|---|
| 6-7 | `backend/routes/earnings.routes.js` + `backend/controllers/earnings.controller.js` | **GET `/api/earnings/today`** — Today's total across platforms (auth). **GET `/api/earnings/summary`** — Aggregate stats by period/platform (auth). **GET `/api/earnings/history`** — Paginated history with filters (auth). **POST `/api/earnings/manual`** — Add manual entry (auth). **POST `/api/earnings/upload-screenshot`** — OCR screenshot multipart → Tesseract → structured data (auth). **GET `/api/earnings/forecast`** — ML prediction for tomorrow via ml.service (auth). |

### 4E — Payouts (5 endpoints)

| # | Files | Endpoints |
|---|---|---|
| 8-9 | `backend/routes/payouts.routes.js` + `backend/controllers/payouts.controller.js` | **GET `/api/payouts/balance`** — Wallet balance + pending earnings (auth). **GET `/api/payouts/fee-preview`** — Calculate fee for amount/type (auth). **POST `/api/payouts/initiate`** — Initiate payout: verify withdrawal_token → check balance ≥ amount → check daily limit → fraud check → loan auto-deduct → savings auto-save → enqueue Bull PAYOUT_INITIATE job → create Payout record → return `{payout_id, estimated_time}` (auth + biometric). **GET `/api/payouts/status/:payoutId`** — Single payout status (auth). **GET `/api/payouts/history`** — Paginated history (auth). |

### 4F — Loans (5 endpoints)

| # | Files | Endpoints |
|---|---|---|
| 10-11 | `backend/routes/loans.routes.js` + `backend/controllers/loans.controller.js` | **GET `/api/loans/eligibility`** — GigScore, max amount, eligible bool (auth + KYC). **POST `/api/loans/apply`** — Apply: amount + repayment_percent (auth + KYC). **GET `/api/loans/active`** — Active loan(s) (auth). **GET `/api/loans/history`** — Loan history (auth). **POST `/api/loans/:loanId/repay`** — Manual repayment (auth). |

### 4G — Insurance (5 endpoints)

| # | Files | Endpoints |
|---|---|---|
| 12-13 | `backend/routes/insurance.routes.js` + `backend/controllers/insurance.controller.js` | **GET `/api/insurance/plans`** — Available plans + pricing (auth). **GET `/api/insurance/active`** — Active policies (auth). **POST `/api/insurance/activate`** — Activate plan: type + duration (auth + KYC). **POST `/api/insurance/claim`** — Submit claim multipart (auth). **GET `/api/insurance/claims`** — Claim history (auth). |

### 4H — Expenses (6 endpoints)

| # | Files | Endpoints |
|---|---|---|
| 14-15 | `backend/routes/expenses.routes.js` + `backend/controllers/expenses.controller.js` | **GET `/api/expenses`** — Paginated + category/date filters (auth). **GET `/api/expenses/summary`** — Monthly category breakdown (auth). **POST `/api/expenses`** — Add manual expense (auth). **POST `/api/expenses/sms-batch`** — Array of SMS texts → ML classifier → expense records (auth). **POST `/api/expenses/receipt`** — Receipt image OCR multipart (auth). **DELETE `/api/expenses/:id`** — Delete expense (auth). |

### 4I — Tax (5 endpoints)

| # | Files | Endpoints |
|---|---|---|
| 16-17 | `backend/routes/tax.routes.js` + `backend/controllers/tax.controller.js` | **GET `/api/tax/summary/:fy`** — Full tax summary for financial year (auth). **GET `/api/tax/deductions/:fy`** — Itemized deductions (auth). **POST `/api/tax/calculate`** — Compute liability with optional extra deductions (auth). **POST `/api/tax/file`** — Submit via ClearTax (auth + KYC). **GET `/api/tax/filing-status/:fy`** — Filing status (auth). |

### 4J — Community (8 endpoints)

| # | Files | Endpoints |
|---|---|---|
| 18-19 | `backend/routes/community.routes.js` + `backend/controllers/community.controller.js` | **GET `/api/community/jobs`** — Nearby jobs via PostGIS geospatial query: lat, lng, radius, type filter (auth). **POST `/api/community/jobs`** — Post job with escrow from wallet (auth + KYC). **GET `/api/community/jobs/:id`** — Job detail (auth). **POST `/api/community/jobs/:id/accept`** — Accept, status → assigned (auth + KYC). **POST `/api/community/jobs/:id/complete`** — Worker marks complete (auth). **POST `/api/community/jobs/:id/confirm`** — Customer confirms → release escrow minus 5% (auth). **POST `/api/community/jobs/:id/rate`** — Submit rating (auth). **GET `/api/community/my-jobs`** — Jobs posted/accepted (auth). |

### 4K — Savings (5 endpoints)

| # | Files | Endpoints |
|---|---|---|
| 20-21 | `backend/routes/savings.routes.js` + `backend/controllers/savings.controller.js` | **GET `/api/savings`** — All goals (auth). **POST `/api/savings/create`** — Create goal (auth). **POST `/api/savings/:id/deposit`** — Manual deposit (auth). **POST `/api/savings/:id/withdraw`** — Withdraw (auth). **PATCH `/api/savings/:id/toggle`** — Pause/resume auto-save (auth). |

### 4L — Insights (4 endpoints)

| # | Files | Endpoints |
|---|---|---|
| 22-23 | `backend/routes/insights.routes.js` + `backend/controllers/insights.controller.js` | **GET `/api/insights/algo`** — Algo insights filtered by platform/city/type (auth). **POST `/api/insights/algo/:id/upvote`** — Upvote (auth). **POST `/api/insights/algo/report`** — Report new pattern (auth). **GET `/api/insights/performance`** — Personal analytics vs city average (auth). |

### 4M — Notifications (4 endpoints)

| # | Files | Endpoints |
|---|---|---|
| 24-25 | `backend/routes/notifications.routes.js` + `backend/controllers/notifications.controller.js` | **GET `/api/notifications`** — Paginated history (auth). **GET `/api/notifications/unread-count`** — Unread count (auth). **POST `/api/notifications/mark-read`** — Mark ids/all as read (auth). **POST `/api/notifications/fcm-token`** — Register/update FCM token (auth). |

### 4N — Webhooks (2 endpoints, no auth — signature verified)

| # | Files | Endpoints |
|---|---|---|
| 26-27 | `backend/routes/webhooks.routes.js` + `backend/controllers/webhooks.controller.js` | **POST `/api/webhooks/razorpay`** — Razorpay payout webhook: verifies `X-Razorpay-Signature` HMAC, handles events `payout.processed`/`payout.reversed`/`payout.failed`, updates Payout status, triggers settlement logic. **POST `/api/webhooks/whatsapp`** — WhatsApp message webhook (Meta Business API on main backend). |

**Deliverable**: All 70+ API endpoints working with proper validation, auth, and error responses.

---

## PHASE 5 — BACKEND JOBS, WORKERS & SCHEDULERS

> Bull queue definitions, 6 workers for async processing, 4 cron schedulers.

### 5A — Queue Definitions

| # | File | Purpose | Queues |
|---|---|---|---|
| 1 | `backend/jobs/queues.js` | Bull queue setup | `payoutQueue` — payout disbursement. `settlementQueue` — platform settlement. `notificationQueue` — push/WA dispatch. `smsProcessingQueue` — SMS expense extraction. `zoneComputeQueue` — hot zone ML trigger. `loanRepaymentQueue` — auto-deduct repayments. All use Redis from `config/redis.js` |

### 5B — Workers (6 files)

| # | File | Purpose | Logic |
|---|---|---|---|
| 2 | `backend/jobs/workers/payout.worker.js` | Process payouts | Gets job data `{payoutId, userId, amount, upiId, fundAccountId}` → creates/retrieves Razorpay fund account → calls razorpay.service `initiatePayout()` → updates Payout status → `processing` → Socket.io emit `payout:processing` → on Razorpay webhook completion: status → `completed`, update wallet. On failure: status → `failed`, retry max 3 |
| 3 | `backend/jobs/workers/settlement.worker.js` | Reconcile settlements | Queries Payouts where `settlement_expected_at < now` AND `settled_at = null` → for each: check platform API if funds transferred → mark `settled_at = now`, update revolving credit → log discrepancies for manual review |
| 4 | `backend/jobs/workers/notification.worker.js` | Send notifications | Processes notification jobs → sends via specified channels (FCM push, WhatsApp, in-app) → creates Notification DB record → handles delivery failures with retry |
| 5 | `backend/jobs/workers/sms.worker.js` | SMS expense detection | Processes batches of SMS texts → calls ML service `/sms/classify` → creates `Expense` records for confirmed matches → notifies user of auto-detected expenses |
| 6 | `backend/jobs/workers/zone.worker.js` | Hot zone computation | Collects GPS coordinates from Redis stream → calls ML service `/zones/compute` → stores result in Redis with 6min TTL → Socket.io broadcast `zones:update` to city room |
| 7 | `backend/jobs/workers/loan.worker.js` | Loan auto-repayment | Triggered after each successful payout → checks active loan → calculates deduction `payout_amount × auto_deduct_percent` → updates Loan `amount_repaid` + `repayment_history`. If fully repaid: status → `repaid`, congratulations notification |

### 5C — Schedulers (4 files)

| # | File | Purpose | Schedule |
|---|---|---|---|
| 8 | `backend/jobs/schedulers/settlement.scheduler.js` | Daily settlement check | `0 6 * * *` (6 AM daily) — enqueue settlement reconciliation jobs for all pending settlements |
| 9 | `backend/jobs/schedulers/zone.scheduler.js` | Hot zone refresh | `*/5 * * * *` (every 5 minutes) — for each active city, enqueue `zoneComputeQueue` job |
| 10 | `backend/jobs/schedulers/loan.scheduler.js` | Loan health check | `0 0 * * *` (midnight daily) — check for overdue loans, update default status, send reminders |
| 11 | `backend/jobs/schedulers/notification.scheduler.js` | Daily digest + reminders | `0 8 * * *` (8 AM daily) — daily earnings digest, tax deadline reminders, insurance expiry alerts |

**Deliverable**: All background jobs processing asynchronously, schedulers running on cron.

---

## PHASE 6 — ML SERVICE (PYTHON FASTAPI)

> Complete Python microservice with 4 ML models, 4 route modules, training scripts, and utilities.

### 6A — Core

| # | File | Purpose | Details |
|---|---|---|---|
| 1 | `ml-service/main.py` | FastAPI entry point | Creates app with title "GigPay ML Service". Includes routers: predict, zones, sms_classify, insights. Startup event loads all saved models into memory. Health check `GET /health`. CORS middleware restricted to backend service IP |
| 2 | `ml-service/.env` | Environment vars | `PORT=8000`, `DATABASE_URL`, `REDIS_URL`, `OPENWEATHERMAP_API_KEY`, `ML_MODELS_PATH=./data/saved_models`, `LOG_LEVEL=info` |

### 6B — Routers (4 files)

| # | File | Purpose | Endpoints |
|---|---|---|---|
| 3 | `ml-service/routers/predict.py` | Earnings prediction | **POST `/predict/earnings`** — Body: `{user_id, target_date, recent_earnings[], city, platform}` → loads 90-day history from PostgreSQL → fetches tomorrow's weather (OpenWeatherMap) → fetches local events → preprocesses into LSTM input tensor → runs `earnings_lstm.predict()` → returns `{expected_min, expected_max, expected_mean, confidence, factors: {weather, day_of_week, events, historical_avg}}`. **POST `/predict/earnings/batch`** — Batch predictions for schedulers |
| 4 | `ml-service/routers/zones.py` | Hot zone computation | **POST `/zones/compute`** — Body: `{city, worker_locations[{lat,lng,timestamp}], restaurant_density_grid}` → DBSCAN clustering → weight by restaurant density + historical orders → convex hull polygons → score 0–100 → return GeoJSON FeatureCollection. **GET `/zones/{city}`** — Returns cached zones from Redis key `zones:{city}:{hour}` |
| 5 | `ml-service/routers/sms_classify.py` | SMS expense classification | **POST `/sms/classify`** — Body: `{messages[{body, timestamp}]}` → keyword filter → mBERT classifier → amount regex `₹|Rs|INR` → merchant NER → returns `[{category, amount, merchant, date, is_tax_deductible, confidence}]` |
| 6 | `ml-service/routers/insights.py` | Algo insights analysis | **GET `/insights/{platform}/{city}`** — Pattern detection from aggregated earnings data |

### 6C — ML Models (4 files)

| # | File | Purpose | Details |
|---|---|---|---|
| 7 | `ml-service/models/earnings_lstm.py` | LSTM model class | **Architecture**: Input (batch, 30, 8) → LSTM(128, return_sequences=True) → Dropout(0.2) → LSTM(64) → Dropout(0.2) → Dense(32, ReLU) → Dense(2, linear) [min, max earnings]. **8 input features per day**: net_earnings (normalized), hours_worked, day_of_week (0–6), is_holiday, is_weekend, rainfall_mm, temp_celsius, local_event_score. Loss: Huber(delta=1.0). Optimizer: Adam(lr=0.001). Methods: `load()` from `.keras`, `predict(features)` → `(min, max)` in paise |
| 8 | `ml-service/models/zone_clustering.py` | DBSCAN clustering | **Params**: eps=0.5km, min_samples=5, metric=haversine. Methods: `compute_zones(coords, weights)` → cluster labels. `generate_polygons(labeled_coords)` → convex hull per cluster via scipy. `score_zones(polygons, restaurant_density)` → demand scores using formula: `zone_score = worker_density(0.4) + restaurant_density(0.35) + historical_order_rate(0.25)` |
| 9 | `ml-service/models/sms_classifier.py` | mBERT SMS classifier | **Model**: `bert-base-multilingual-cased` fine-tuned on 5,000+ labeled Indian financial SMS. **Classes**: fuel, toll, maintenance, food, mobile_recharge, not_expense. Fine-tuned 3 epochs, lr=2e-5, batch_size=32. Target accuracy >90%. Methods: `load()`, `classify(text)` → `(class_label, confidence)` |
| 10 | `ml-service/models/insight_analyzer.py` | Pattern detection | Analyzes aggregated earnings data to detect algorithm patterns — acceptance rate thresholds, surge patterns, batch logic, rating recovery, idle time optimization |

### 6D — Schemas (3 files)

| # | File | Purpose |
|---|---|---|
| 11 | `ml-service/schemas/predict_schema.py` | Pydantic schemas: `EarningsPredictionRequest`, `EarningsPredictionResponse`, `BatchPredictionRequest` |
| 12 | `ml-service/schemas/zone_schema.py` | Pydantic schemas: `ZoneComputeRequest`, `WorkerLocation`, `ZoneResponse` (GeoJSON) |
| 13 | `ml-service/schemas/sms_schema.py` | Pydantic schemas: `SmsClassifyRequest`, `SmsMessage`, `ClassifiedExpense` |

### 6E — Utilities (4 files)

| # | File | Purpose |
|---|---|---|
| 14 | `ml-service/utils/db.py` | SQLAlchemy connection to PostgreSQL for reading training data |
| 15 | `ml-service/utils/redis_cache.py` | Redis caching helpers: get/set with TTL, cache zone results, cache predictions |
| 16 | `ml-service/utils/weather.py` | OpenWeatherMap API client: `get_forecast(city, date)` → `{rainfall_mm, temp_c, conditions}` |
| 17 | `ml-service/utils/events.py` | Public events API client: fetches local events (IPL, festivals) → `event_score` 0–1 |

### 6F — Training Scripts (3 files)

| # | File | Purpose |
|---|---|---|
| 18 | `ml-service/train/train_lstm.py` | Queries 2-year earnings data from PostgreSQL → fetches historical weather → builds feature matrices → 80/20 split → trains with early stopping (patience=15) → saves to `data/saved_models/earnings_lstm.keras` → logs MAPE + MAE |
| 19 | `ml-service/train/train_sms_classifier.py` | Loads labeled SMS dataset from `data/training/` → fine-tunes mBERT → saves model weights → logs accuracy |
| 20 | `ml-service/train/evaluate.py` | Loads both models → runs evaluation metrics → generates reports |

### 6G — Data Directories

| # | Path | Purpose |
|---|---|---|
| 21 | `ml-service/data/training/` | Training datasets (gitignored) |
| 22 | `ml-service/data/saved_models/` | Serialized `.keras` / `.joblib` model files (gitignored) |

**Deliverable**: ML service running on port 8000, all 6 endpoints responding, models loaded.

---

## PHASE 7 — WHATSAPP BOT MICROSERVICE

> Separate Node.js service for WhatsApp webhook + NLP intent routing + multi-turn conversations.

### 7A — Core

| # | File | Purpose | Details |
|---|---|---|---|
| 1 | `whatsapp-bot/server.js` | Express webhook entry | **GET `/webhook`** — Meta API verification handshake (returns challenge token). **POST `/webhook`** — Receives incoming messages → parses sender phone + body + timestamp → routes to `message.handler.js` → sends response via WhatsApp API |
| 2 | `whatsapp-bot/.env` | Environment vars | `PORT=5001`, `GIGPAY_API_URL=http://backend:5000`, `GIGPAY_BOT_SECRET`, `REDIS_URL`, Twilio + Meta credentials |

### 7B — Handlers (10 files)

| # | File | Purpose | Details |
|---|---|---|---|
| 3 | `whatsapp-bot/handlers/message.handler.js` | Central message router | Looks up user by phone via backend API → loads Redis session → if mid-flow: route to active handler → else: run intent classifier → route to handler → update session |
| 4 | `whatsapp-bot/handlers/balance.handler.js` | Balance queries | Calls backend `GET /api/payouts/balance` → formats response: "Your balance is ₹X. Today's earnings: ₹Y. Ready to cash out? Reply CASHOUT {amount}" |
| 5 | `whatsapp-bot/handlers/cashout.handler.js` | Multi-step cashout | **Step 1**: Parse amount → fetch balance → show fee preview → ask YES/NO. **Step 2**: On YES → send biometric verification deep link to PWA (valid 5 min). **Step 3**: On biometric success (callback) → call backend `POST /api/payouts/initiate` → confirm "₹X on its way to your UPI!" |
| 6 | `whatsapp-bot/handlers/forecast.handler.js` | Earnings forecast | Calls backend `GET /api/earnings/forecast` → formats: "Tomorrow's forecast: ₹850–₹1,200. Weather: Clear ☀️. It's Friday — historically your best day!" |
| 7 | `whatsapp-bot/handlers/zone.handler.js` | Hot zone info | Calls ML service via backend → formats top 3 zones with names, demand scores, Google Maps links |
| 8 | `whatsapp-bot/handlers/loan.handler.js` | Loan requests | Checks eligibility → shows GigScore + max amount → on confirmation: calls backend `POST /api/loans/apply` |
| 9 | `whatsapp-bot/handlers/insurance.handler.js` | Insurance activation | Lists available plans → on selection: calls backend `POST /api/insurance/activate` |
| 10 | `whatsapp-bot/handlers/tax.handler.js` | Tax summary | Calls backend `GET /api/tax/summary/:fy` → formats deduction breakdown + tax payable |
| 11 | `whatsapp-bot/handlers/expense.handler.js` | Expense summary | Calls backend `GET /api/expenses/summary` → formats monthly category breakdown |
| 12 | `whatsapp-bot/handlers/community.handler.js` | Community jobs | Calls backend `GET /api/community/jobs` with user's location → lists nearby jobs |

### 7C — NLP (3 files)

| # | File | Purpose | Details |
|---|---|---|---|
| 13 | `whatsapp-bot/nlp/intent_classifier.js` | Intent classification | Rule-based regex + keyword matching. **11 intents**: CHECK_BALANCE (balance, bakiya, kitna hai), CASHOUT (cashout, nikalo, withdraw), CHECK_EARNINGS_TODAY (aaj, today, kamaya), GET_FORECAST (kal, tomorrow, predict), GET_HOT_ZONES (zone, kahaan, where to go), APPLY_LOAN (loan, udhaar, paise chahiye), ACTIVATE_INSURANCE (insurance, bima, protect), TAX_HELP (tax, ITR, deduction), EXPENSE_SUMMARY (expenses, kharcha), COMMUNITY_JOBS (jobs, kaam, near me), HELP (help, menu). Falls back to Dialogflow CX for unrecognized |
| 14 | `whatsapp-bot/nlp/entity_extractor.js` | Entity extraction | Extracts amounts (₹/Rs/INR + numbers), dates, platform names from user messages |
| 15 | `whatsapp-bot/nlp/intents.json` | Intent definitions | JSON with intent names, trigger phrases (EN + HI), required entities, sample responses |

### 7D — Services (3 files)

| # | File | Purpose |
|---|---|---|
| 16 | `whatsapp-bot/services/gigpay_api.service.js` | HTTP client to main backend API with `GIGPAY_BOT_SECRET` auth header |
| 17 | `whatsapp-bot/services/session.service.js` | Redis conversation state: key `wa_session:{phone}` → JSON `{intent, step, data, expires_at}`. TTL 10 min inactivity |
| 18 | `whatsapp-bot/services/response_builder.js` | Build WhatsApp response templates with emoji, formatting, and deep links |

### 7E — Utils (2 files)

| # | File | Purpose |
|---|---|---|
| 19 | `whatsapp-bot/utils/language_detect.js` | Detect EN/HI/mixed language in message text |
| 20 | `whatsapp-bot/utils/templates.js` | Message template strings in English + Hindi (Devanagari) |

**Deliverable**: Bot responds to WhatsApp messages across 11 intents, handles multi-turn cashout flow.

---

## PHASE 8 — FRONTEND PWA SHELL & INFRASTRUCTURE

> Vite config, PWA manifest, service worker, HTML entry, React entry, App routing, i18n setup.

| # | File | Purpose | Details |
|---|---|---|---|
| 1 | `frontend/vite.config.js` | Build config | PWA plugin (`registerType: 'autoUpdate'`), Workbox (NetworkFirst for `/api/*`, CacheFirst for static), path alias `@` → `src/`, dev proxy `/api` → localhost:5000 |
| 2 | `frontend/tailwind.config.js` | Styling config | Theme: teal primary `#0d9488`, slate dark `#0f172a`. Content: `src/**/*.{js,jsx}` |
| 3 | `frontend/postcss.config.js` | PostCSS | tailwindcss + autoprefixer |
| 4 | `frontend/index.html` | HTML shell | Root `<div id="root">`, viewport meta, PWA meta tags, theme-color, Google Maps script |
| 5 | `frontend/public/manifest.json` | PWA manifest | `name: "GigPay"`, `short_name: "GigPay"`, `display: "standalone"`, `background_color: "#0f172a"`, `theme_color: "#0d9488"`, `orientation: "portrait"`, icons 192×192 + 512×512 (maskable) |
| 6 | `frontend/public/favicon.ico` | Favicon | GigPay brand icon |
| 7 | `frontend/public/icon-192.png` | PWA icon small | 192×192 PNG |
| 8 | `frontend/public/icon-512.png` | PWA icon large | 512×512 PNG, maskable |
| 9 | `frontend/public/offline.html` | Offline fallback | Minimal HTML/CSS (no external deps): GigPay logo, "You're offline" message, lists features available offline (balance, recent transactions). No JS required |
| 10 | `frontend/src/main.jsx` | React entry | Imports App → wraps in `QueryClientProvider` (React Query) → wraps in `BrowserRouter` → registers Service Worker → initializes i18next → `ReactDOM.createRoot(root).render(<App />)` |
| 11 | `frontend/src/App.jsx` | Root component | Reads auth from Zustand → Routes: `/onboarding/*` (public), `/` Home, `/zones`, `/wallet/*`, `/insights/*`, `/community/*`, `/profile/*` (all protected). `<BottomNav>` on protected routes. `<OfflineBanner>` when offline. `<Toaster>` |
| 12 | `frontend/src/sw.js` | Service Worker | Workbox strategies: precache static assets, NetworkFirst for `/api/*` (10s timeout), CacheFirst for Google Maps (30d), CacheFirst for images (60d). Background sync: queue failed POST requests for retry. Offline fallback: `offline.html` |
| 13 | `frontend/src/locales/en.json` | English translations | Flat key-value JSON, dot notation keys: `home.balance_card.title`, `cashout.confirm_button`, etc. |
| 14 | `frontend/src/locales/hi.json` | Hindi translations | Same keys, Devanagari values |

**Deliverable**: PWA installable, offline-capable, routes configured, i18n working.

---

## PHASE 9 — FRONTEND STATE MANAGEMENT & HOOKS

> Zustand stores + 19 custom hooks for auth, data fetching, real-time, device APIs.

### 9A — Zustand Stores (3 files)

| # | File | Purpose | State / Actions |
|---|---|---|---|
| 1 | `frontend/src/store/auth.store.js` | Auth state | **State**: `{user, accessToken, refreshToken, isAuthenticated, isLoading}`. **Actions**: `login(tokens, user)` → persist to localStorage, `logout()` → clear all + redirect `/onboarding`, `updateUser(updates)` → partial update, `refreshTokens()` → call refresh endpoint |
| 2 | `frontend/src/store/ui.store.js` | UI state | Loading indicators, modal open/close state, active tab tracking |
| 3 | `frontend/src/store/realtime.store.js` | Socket event state | Stores latest zone update, payout status changes, notification counts from Socket.io events |

### 9B — Custom Hooks (19 files)

| # | File | Purpose | Returns |
|---|---|---|---|
| 4 | `frontend/src/hooks/useAuth.js` | Auth facade | `{user, isAuthenticated, login, logout, sendOtp, verifyOtp, isLoading}` — wraps auth store + React Query |
| 5 | `frontend/src/hooks/useEarnings.js` | Earnings queries | React Query hooks for today's earnings, summary (period/platform), paginated history |
| 6 | `frontend/src/hooks/usePayouts.js` | Payout operations | `{initiatePayout, getBalance, feePreview, payoutHistory, payoutStatus}` — mutations + queries |
| 7 | `frontend/src/hooks/useWallet.js` | Wallet balance | `{balance, lockedBalance, lifetimeEarned, lifetimeWithdrawn, isLoading}` — polls every 30s |
| 8 | `frontend/src/hooks/useZones.js` | Hot zone data + real-time | Initial fetch via `ml.api.js getZones(city)` + Socket.io `zones:update` listener → `{zones, lastUpdated, isLoading}` |
| 9 | `frontend/src/hooks/useForecast.js` | ML earnings forecast | `{forecast: {min, max, expected, confidence, factors}, isLoading}` |
| 10 | `frontend/src/hooks/useExpenses.js` | Expense data | Paginated expenses, category summary, add/delete mutations |
| 11 | `frontend/src/hooks/useTax.js` | Tax calculations | `{summary, deductions, calculate, compareRegimes, isLoading}` |
| 12 | `frontend/src/hooks/useLoan.js` | Loan data | `{eligibility, activeLoan, apply, repay, history, isLoading}` |
| 13 | `frontend/src/hooks/useInsurance.js` | Insurance policies | `{plans, activePolicies, activate, submitClaim, claims, isLoading}` |
| 14 | `frontend/src/hooks/useSavings.js` | Savings data | `{goals, createGoal, deposit, withdraw, toggleAutoSave, isLoading}` |
| 15 | `frontend/src/hooks/useCommunity.js` | Community jobs | `{nearbyJobs, myJobs, postJob, acceptJob, completeJob, rateJob, isLoading}` |
| 16 | `frontend/src/hooks/useSocket.js` | Socket.io connection | Connects with auth token → joins `user:{userId}` + `city:{city}` rooms → exposes `{socket, connected}` → auto-reconnect → disconnect on logout |
| 17 | `frontend/src/hooks/useNotifications.js` | FCM + in-app | `{notifications, unreadCount, markRead, registerToken}` — FCM service worker registration + in-app list |
| 18 | `frontend/src/hooks/useBiometric.js` | WebAuthn wrapper | `{isSupported, register, authenticate, isLoading, error}` — `register()` → WebAuthn registration, `authenticate()` → WebAuthn assertion → returns withdrawal token |
| 19 | `frontend/src/hooks/useSmsReader.js` | Android SMS reading | Uses `SMSReceiver` API (Chrome Android) → `{messages, permissionStatus, requestPermission}` |
| 20 | `frontend/src/hooks/useGeolocation.js` | GPS location | `{lat, lng, accuracy, error, isLoading}` — `navigator.geolocation.watchPosition` |
| 21 | `frontend/src/hooks/useOffline.js` | Online/offline status | `{isOffline}` — listens to `navigator.onLine` + `online`/`offline` events |
| 22 | `frontend/src/hooks/useInstallPrompt.js` | PWA install prompt | Captures `beforeinstallprompt` event → `{canInstall, promptInstall}` |

**Deliverable**: All state management and data hooks functional, real-time updates working.

---

## PHASE 10 — FRONTEND API SERVICE LAYER

> Axios instance + 13 API modules for all backend communication.

| # | File | Purpose | Functions |
|---|---|---|---|
| 1 | `frontend/src/services/api.service.js` | Configured Axios | `baseURL: VITE_API_URL`. Request interceptor: attach `Authorization: Bearer {token}`. Response interceptor: on 401 → attempt refresh → retry, on refresh fail → logout, on network error → check offline → return cached |
| 2 | `frontend/src/services/auth.api.js` | Auth calls | `sendOtp(phone)`, `verifyOtp(phone, otp)`, `refreshToken(token)`, `logout()`, `initAadhaarKyc(aadhaar)`, `verifyAadhaarOtp(aadhaar, otp)`, `uploadSelfie(imageBlob)`, `registerBiometric(credential)`, `getBiometricChallenge()`, `authenticateBiometric(assertion)` |
| 3 | `frontend/src/services/earnings.api.js` | Earnings calls | `getToday()`, `getSummary(period, platform)`, `getHistory(page, limit, filters)`, `addManual(data)`, `uploadScreenshot(formData)`, `getForecast()` |
| 4 | `frontend/src/services/payouts.api.js` | Payout calls | `getBalance()`, `getFeePreview(amount, type)`, `initiatePayout(amount, upiId, type, withdrawalToken)`, `getPayoutHistory(page, limit)`, `getPayoutStatus(payoutId)` |
| 5 | `frontend/src/services/loans.api.js` | Loan calls | `getEligibility()`, `apply(amount, repaymentPercent)`, `getActive()`, `getHistory()`, `repay(loanId, amount)` |
| 6 | `frontend/src/services/insurance.api.js` | Insurance calls | `getPlans()`, `getActive()`, `activate(type, duration)`, `submitClaim(policyId, formData)`, `getClaims()` |
| 7 | `frontend/src/services/expenses.api.js` | Expense calls | `getExpenses(filters)`, `getSummary()`, `addExpense(data)`, `submitSmsBatch(messages)`, `uploadReceipt(formData)`, `deleteExpense(id)` |
| 8 | `frontend/src/services/tax.api.js` | Tax calls | `getSummary(fy)`, `getDeductions(fy)`, `calculate(data)`, `file(fy)`, `getFilingStatus(fy)` |
| 9 | `frontend/src/services/community.api.js` | Community calls | `getJobs(lat, lng, radius, type)`, `postJob(data)`, `getJob(id)`, `acceptJob(id)`, `completeJob(id)`, `confirmJob(id)`, `rateJob(id, data)`, `getMyJobs()` |
| 10 | `frontend/src/services/savings.api.js` | Savings calls | `getGoals()`, `createGoal(data)`, `deposit(id, amount)`, `withdraw(id, amount)`, `toggleAutoSave(id)` |
| 11 | `frontend/src/services/insights.api.js` | Insights calls | `getAlgoInsights(filters)`, `upvote(id)`, `reportPattern(data)`, `getPerformance()` |
| 12 | `frontend/src/services/notifications.api.js` | Notification calls | `getNotifications(page)`, `getUnreadCount()`, `markRead(ids)`, `registerFcmToken(token)` |
| 13 | `frontend/src/services/ml.api.js` | ML direct calls | `getZones(city)`, `getForecast(params)` — calls ML endpoints via backend proxy |

### Frontend Utilities (4 files)

| # | File | Purpose |
|---|---|---|
| 14 | `frontend/src/utils/formatCurrency.js` | Converts paise to `₹X,XXX.XX` display format |
| 15 | `frontend/src/utils/formatDate.js` | dayjs formatters for IST timezone, relative time display |
| 16 | `frontend/src/utils/smsParser.js` | Client-side SMS pre-filter: `isFuelSms(text)`, `isTollSms(text)`, `extractAmount(text)`, `extractMerchant(text)` — regex-based backup for ML |
| 17 | `frontend/src/utils/webauthn.js` | WebAuthn helpers for credential creation/assertion formatting |

### Frontend Constants (3 files)

| # | File | Purpose |
|---|---|---|
| 18 | `frontend/src/constants/routes.js` | Route path constants: `ROUTES.HOME`, `ROUTES.CASHOUT`, `ROUTES.ZONES`, etc. |
| 19 | `frontend/src/constants/platforms.js` | Platform metadata: names, colors, icons, API base URLs for Zomato/Swiggy/Ola/Uber/Dunzo |
| 20 | `frontend/src/constants/taxRules.js` | Tax slab constants, Section 44AD/44ADA rules, deduction limits, due dates |

**Deliverable**: All API calls abstracted, interceptors handling auth refresh and offline fallback.

---

## PHASE 11 — FRONTEND SHARED COMPONENTS

> Reusable UI components used across multiple pages.

### 11A — Layout Components (3 files)

| # | File | Purpose | Details |
|---|---|---|---|
| 1 | `frontend/src/components/layout/BottomNav.jsx` | 5-tab navigation | Tabs: Home, Zones, Wallet, Insights, Profile. Active tab highlighting. Badge for unread notifications. Fixed bottom position. framer-motion tab switch animation |
| 2 | `frontend/src/components/layout/TopBar.jsx` | Page header | Back button (when not root), page title, action buttons (notification bell, settings). Notification count badge |
| 3 | `frontend/src/components/layout/PageWrapper.jsx` | Page layout wrapper | Padding, safe area insets, scroll container, pull-to-refresh support |

### 11B — Shared Components (8 files)

| # | File | Purpose | Details |
|---|---|---|---|
| 4 | `frontend/src/components/shared/OtpInput.jsx` | 6-digit OTP | 6 individual digit inputs, auto-focus next on input, paste support, backspace navigation |
| 5 | `frontend/src/components/shared/LoadingSpinner.jsx` | Loading indicator | Teal spinner with optional message text |
| 6 | `frontend/src/components/shared/ErrorBoundary.jsx` | Error boundary | Catches React render errors, shows fallback UI with retry button |
| 7 | `frontend/src/components/shared/OfflineBanner.jsx` | Offline indicator | Yellow banner "You're offline — some features unavailable". Uses `useOffline()` hook |
| 8 | `frontend/src/components/shared/CurrencyDisplay.jsx` | INR formatting | Takes paise value, displays as `₹X,XXX` with optional decimal, color coding for positive/negative |
| 9 | `frontend/src/components/shared/ConfirmModal.jsx` | Confirmation dialog | Title, message, confirm/cancel buttons, customizable action labels, framer-motion entrance |
| 10 | `frontend/src/components/shared/EmptyState.jsx` | Empty state | Illustration + title + description + optional CTA button for lists with no data |
| 11 | `frontend/src/components/shared/Avatar.jsx` | User avatar | Circular image with fallback initials, configurable size |

**Deliverable**: All shared components styled with Tailwind, accessible, responsive.

---

## PHASE 12 — FRONTEND PAGES: ONBOARDING

> 6-step onboarding flow: Landing → Phone OTP → Aadhaar KYC → Selfie → Platform Link → Bank Setup.

| # | File | Purpose | UI & Logic |
|---|---|---|---|
| 1 | `frontend/src/pages/Onboarding/Landing.jsx` | Splash / intro | App logo, tagline "Instant Earnings. Smart Tools. Financial Freedom.", 3 feature highlights with animations, "Get Started" CTA → navigates to PhoneEntry. PWA install prompt if available |
| 2 | `frontend/src/pages/Onboarding/PhoneEntry.jsx` | Phone + OTP | Phone input with +91 prefix → "Send OTP" → call `auth.api.sendOtp(phone)` → OTP screen with `<OtpInput>` (6 digits) → resend timer (30s) → call `verifyOtp(phone, otp)` → store tokens in Zustand + localStorage → if `isNewUser`: redirect `/onboarding/aadhaar`, else redirect `/` |
| 3 | `frontend/src/pages/Onboarding/AadhaarKYC.jsx` | Aadhaar eKYC | Aadhaar number input (masked) → "Send OTP to linked mobile" → call `initAadhaarKyc(aadhaar)` → UIDAI OTP input → call `verifyAadhaarOtp(aadhaar, otp)` → on success: show confirmed name/city from UIDAI → proceed to selfie |
| 4 | `frontend/src/pages/Onboarding/SelfieCapture.jsx` | Liveness capture | Camera viewfinder via `getUserMedia({video: {facingMode: 'user'}})` → circular face guide overlay → "Capture" button → canvas capture → preview with "Use this photo" / "Retake" → POST to `/api/auth/kyc/selfie` as multipart → on success: proceed to platform link |
| 5 | `frontend/src/pages/Onboarding/PlatformLink.jsx` | Connect platforms | Cards for Zomato, Swiggy, Ola, Uber, Dunzo → each has "Connect" button → OAuth flow or credential input → calls backend to store platform_account → shows connected status. "Skip for now" option → proceed to bank setup |
| 6 | `frontend/src/pages/Onboarding/BankSetup.jsx` | Bank/UPI setup | UPI ID input (or bank account number + IFSC) → verification via Razorpay → stores in user's `bank_accounts[]` → "Complete Setup" → redirect to Home dashboard |

**Deliverable**: Full onboarding flow from phone number to dashboard.

---

## PHASE 13 — FRONTEND PAGES: HOME DASHBOARD

> Main dashboard with 6 widget components + NotFound page.

### 13A — Dashboard Page

| # | File | Purpose | Details |
|---|---|---|---|
| 1 | `frontend/src/pages/Home.jsx` | Main dashboard | **UI top-to-bottom**: (1) TopBar: "Good morning, Ravi" + notification bell. (2) `<BalanceCard>` — wallet balance + "Cash Out" CTA. (3) `<EarningsCard>` — today's earnings by platform + progress vs average. (4) `<ForecastBanner>` — tomorrow's predicted earnings + confidence. (5) `<HotZonePreview>` — mini map showing nearest hot zone. (6) `<QuickActions>` — Emergency Loan, Insurance, Tax, Savings CTAs. (7) `<RecentTransactions>` — last 5 payouts. **Data**: React Query parallel queries for balance, today's earnings, forecast, zones. Skeleton loaders while loading |

### 13B — Home Widget Components (6 files)

| # | File | Purpose | Details |
|---|---|---|---|
| 2 | `frontend/src/components/home/EarningsCard.jsx` | Today's earnings | Shows total across platforms, per-platform breakdown with logos, progress bar vs 7-day average, trend arrow up/down |
| 3 | `frontend/src/components/home/BalanceCard.jsx` | Wallet balance | Large balance display, "Cash Out Now" button, locked balance indicator, lifetime stats |
| 4 | `frontend/src/components/home/ForecastBanner.jsx` | Tomorrow's prediction | Props: `forecast: {min, max, expected, confidence, factors}`. Teal gradient card. "₹850 – ₹1,200" range. Confidence bar. Factor chips: ☀️ Clear weather, 📅 Friday, 🏏 IPL match |
| 5 | `frontend/src/components/home/HotZonePreview.jsx` | Mini zone map | Small Google Maps widget showing nearest hot zone with demand score. "View Full Map" link → `/zones` |
| 6 | `frontend/src/components/home/QuickActions.jsx` | Action grid | 4 CTAs in 2×2 grid: Emergency Loan (₹ icon), Insurance (shield icon), Tax Assistant (receipt icon), Savings (piggy bank icon). Each navigates to respective page |
| 7 | `frontend/src/components/home/RecentTransactions.jsx` | Transaction list | Last 5 payouts/transactions with type, amount, status, time. "View All" link → `/wallet/transactions` |

### 13C — Zones Page

| # | File | Purpose | Details |
|---|---|---|---|
| 8 | `frontend/src/pages/Zones.jsx` | Full-screen map | Full-screen Google Maps with heatmap layer. Floating bottom card: top 3 zones with zone name (reverse geocoded), demand score (0–100), estimated wait time, distance from user. Time filter tabs: "Right Now", "In 1 Hour", "This Evening". Toggle: List/Map view. Real-time via Socket.io `zones:update` |

### 13D — Map Components (3 files)

| # | File | Purpose |
|---|---|---|
| 9 | `frontend/src/components/map/HeatMap.jsx` | Google Maps heatmap wrapper. Props: `zones` (GeoJSON), `userLocation`, `onZoneClick`. Uses `@vis.gl/react-google-maps` + `HeatmapLayer` weighted by demand score. Pulsing blue dot for current location |
| 10 | `frontend/src/components/map/ZoneCard.jsx` | Individual zone info card with name, score, wait time, distance |
| 11 | `frontend/src/components/map/LocationPin.jsx` | Custom map marker component |

### 13E — Earnings Components (3 files)

| # | File | Purpose |
|---|---|---|
| 12 | `frontend/src/components/earnings/EarningsChart.jsx` | Recharts line/bar chart for weekly/monthly earnings trends |
| 13 | `frontend/src/components/earnings/PlatformBreakdown.jsx` | Recharts pie chart showing earnings by platform |
| 14 | `frontend/src/components/earnings/EarningEntry.jsx` | Manual earnings entry form with platform selector, amount, hours, trips |

### 13F — Other

| # | File | Purpose |
|---|---|---|
| 15 | `frontend/src/pages/NotFound.jsx` | 404 page with "Go Home" button |

**Deliverable**: Dashboard fully functional with live data, interactive map, charts.

---

## PHASE 14 — FRONTEND PAGES: WALLET & CASHOUT

> Wallet overview, cashout flow (most critical UX), transactions, savings, insurance, loans.

### 14A — Wallet Pages (6 files)

| # | File | Purpose | Details |
|---|---|---|---|
| 1 | `frontend/src/pages/Wallet/Wallet.jsx` | Wallet overview | Balance card, quick actions (Cash Out, Savings, Insurance, Loans), recent transactions. Navigation hub for all wallet features |
| 2 | `frontend/src/pages/Wallet/Cashout.jsx` | Cashout flow (critical!) | **5 steps**: (1) Amount selection — `<AmountSlider>` ₹0 to max, `<FeePreview>` shows live fee/net. (2) Confirm — summary: amount, fee, UPI, estimated time. (3) Biometric — `<BiometricPrompt>` triggers WebAuthn fingerprint/face. (4) Processing — `<PayoutStatus>` with real-time Socket.io (pending → processing → completed). (5) Success — confetti animation, WhatsApp confirmation sent |
| 3 | `frontend/src/pages/Wallet/Transactions.jsx` | Transaction history | Paginated list with filters: type (payout/loan/savings), date range, status. Each entry shows amount, type, status badge, timestamp |
| 4 | `frontend/src/pages/Wallet/Savings.jsx` | Savings vault | Active goals with progress bars, round-up toggle, create new goal form, transaction history per goal, interest earned display |
| 5 | `frontend/src/pages/Wallet/Insurance.jsx` | Insurance management | Available plans with pricing, active policies with expiry countdown, "Activate" one-tap buttons, claim submission form, claim history |
| 6 | `frontend/src/pages/Wallet/Loans.jsx` | Loan management | If no loan: eligibility card (GigScore, max amount, "Apply" CTA). Loan form: amount slider + repayment % + term preview. If active: repayment progress bar, next auto-deduction date, outstanding balance, "Pay Extra" option |

### 14B — Cashout Components (4 files)

| # | File | Purpose | Details |
|---|---|---|---|
| 7 | `frontend/src/components/cashout/AmountSlider.jsx` | Amount selector | Slider from ₹0 to max withdrawable. Quick-select buttons (₹100, ₹500, ₹1000, Max). Shows selected amount in large display |
| 8 | `frontend/src/components/cashout/FeePreview.jsx` | Fee breakdown | Shows: Amount, Fee (1.2% or 1.5%), Net amount, GigPro discount badge if applicable. Updates live as slider moves |
| 9 | `frontend/src/components/cashout/BiometricPrompt.jsx` | WebAuthn trigger | Checks `navigator.credentials` → GET challenge → `navigator.credentials.get()` → POST assertion → receives withdrawal token → calls `onSuccess(token)`. Fallback: face capture modal if WebAuthn unavailable |
| 10 | `frontend/src/components/cashout/PayoutStatus.jsx` | Live payout tracker | Real-time Socket.io `payout:status` listener. Shows: pending (spinner) → processing (bank animation) → completed (✓ with amount). Each step has timestamp |

### 14C — Insurance Components (2 files)

| # | File | Purpose |
|---|---|---|
| 11 | `frontend/src/components/insurance/InsuranceCard.jsx` | Plan card with type, premium, cover amount, validity, "Activate" button |
| 12 | `frontend/src/components/insurance/ClaimForm.jsx` | Claim submission: policy selector, description, document upload (camera/gallery), submit button |

### 14D — Loan Components (2 files)

| # | File | Purpose |
|---|---|---|
| 13 | `frontend/src/components/loans/LoanEligibility.jsx` | GigScore display (0–850 gauge), max loan amount, eligibility status, "Apply" CTA |
| 14 | `frontend/src/components/loans/LoanCard.jsx` | Active loan: outstanding balance, repayment progress bar, next payment date, history |

### 14E — Savings Components (2 files)

| # | File | Purpose |
|---|---|---|
| 15 | `frontend/src/components/savings/SavingsGoal.jsx` | Goal progress card: goal name, target, current, progress bar, interest earned |
| 16 | `frontend/src/components/savings/RoundUpToggle.jsx` | Toggle switch for round-up savings with explanation text |

**Deliverable**: Complete wallet experience including the critical cashout flow with biometric verification.

---

## PHASE 15 — FRONTEND PAGES: INSIGHTS, TAX, EXPENSES

> Analytics hub with algorithm insights, expense tracker (SMS auto-detect), and tax filing assistant.

### 15A — Insight Pages (4 files)

| # | File | Purpose | Details |
|---|---|---|---|
| 1 | `frontend/src/pages/Insights/Insights.jsx` | Insights hub | Tabs/navigation for: Earnings Analytics, Algo Insights, Expense Tracker, Tax Assistant. Summary cards for each section |
| 2 | `frontend/src/pages/Insights/AlgoInsights.jsx` | Algorithm tips | Feed of platform algorithm insights. Filter by platform (Zomato/Swiggy/Ola/Uber). Each card: insight type badge, title, description, supporting stats, confidence %, upvote button, verified badge. "Report New Pattern" CTA |
| 3 | `frontend/src/pages/Insights/Expenses.jsx` | Expense tracker | **Sections**: (1) Month picker + total card. (2) Category donut chart (Recharts). (3) `<SMSPermission>` banner if not granted. (4) Expense list grouped by date. (5) "Add Expense" FAB → form modal. (6) Tax deductible filter toggle. **SMS auto-detect**: On mount, if permission granted, reads new SMS → sends batch to `/api/expenses/sms-batch` |
| 4 | `frontend/src/pages/Insights/Tax.jsx` | Tax assistant | **Sections**: (1) Annual summary card: gross income, total deductions, taxable income, tax payable. (2) Deduction breakdown: itemized list with sections (fuel, vehicle depreciation, mobile, 80C). (3) Regime comparison table: old vs new. (4) Missed deduction alerts. (5) Advance tax due dates + amounts. (6) "File via ClearTax" CTA button |

### 15B — Tax Components (3 files)

| # | File | Purpose |
|---|---|---|
| 5 | `frontend/src/components/tax/TaxSummary.jsx` | Annual summary card with gross, deductions, taxable, payable amounts |
| 6 | `frontend/src/components/tax/DeductionList.jsx` | Itemized deductions list: fuel, vehicle depreciation, mobile data, 80C, custom |
| 7 | `frontend/src/components/tax/TaxCalculator.jsx` | Interactive calculator: input income + expenses → compute tax in both regimes → show recommendation |

### 15C — Expense Components (3 files)

| # | File | Purpose |
|---|---|---|
| 8 | `frontend/src/components/expenses/ExpenseCard.jsx` | Single expense: category icon, merchant, amount, date, source badge (SMS/manual/OCR), tax deductible indicator |
| 9 | `frontend/src/components/expenses/ExpenseChart.jsx` | Recharts donut chart: category breakdown with amounts and percentages |
| 10 | `frontend/src/components/expenses/SMSPermission.jsx` | Permission request banner: explanation text, "Allow SMS Access" button, privacy reassurance |

**Deliverable**: Full insights/analytics experience with auto SMS expense detection and tax optimization.

---

## PHASE 16 — FRONTEND PAGES: COMMUNITY MARKETPLACE

> P2P job marketplace with map view, job posting, acceptance, escrow payments, ratings.

### 16A — Community Pages (5 files)

| # | File | Purpose | Details |
|---|---|---|---|
| 1 | `frontend/src/pages/Community/Community.jsx` | Marketplace hub | **Tabs**: (1) Nearby Jobs — `<JobMap>` + job list filtered by type, sorted by distance. (2) My Jobs — posted + accepted with status tracking. (3) Post Job — quick access to PostJob flow |
| 2 | `frontend/src/pages/Community/PostJob.jsx` | Post a job | Form: type selector (local_delivery/ride/home_service/freelance), title, description, pickup location (map picker or address input), dropoff location (optional), offered price, expiry time. On submit: escrow from wallet → create job |
| 3 | `frontend/src/pages/Community/JobDetail.jsx` | Single job view | Map with pickup/dropoff pins, job details, poster profile, price, status. Worker actions: "Accept" button. Customer actions: "Mark Complete" → "Release Payment". Dispute option. Rating form after completion |
| 4 | `frontend/src/pages/Community/MyJobs.jsx` | My jobs list | Two sections: "Jobs I Posted" + "Jobs I Accepted" with status filters and tracking |
| 5 | `frontend/src/pages/Community/WorkerProfile.jsx` | Public profile | Worker's name, avatar, GigScore, ratings average, completed jobs count, reviews, active listings |

### 16B — Community Components (3 files)

| # | File | Purpose |
|---|---|---|
| 6 | `frontend/src/components/community/JobCard.jsx` | Job listing card: type badge, title, price, distance, pickup/dropoff summary, time posted |
| 7 | `frontend/src/components/community/JobMap.jsx` | Google Maps with job markers, cluster markers for dense areas, user location |
| 8 | `frontend/src/components/community/RatingStars.jsx` | Star rating component: tap to rate 1–5, half-star support, comment input |

**Deliverable**: Working P2P marketplace with location-based job discovery and escrow payments.

---

## PHASE 17 — FRONTEND PAGES: PROFILE & SUPPORT

| # | File | Purpose | Details |
|---|---|---|---|
| 1 | `frontend/src/pages/Profile/Profile.jsx` | Profile settings | User avatar, name, phone, email, city, language preference selector (EN/HI), notification preferences, subscription tier display, GigPro upgrade CTA, "Linked Accounts" link, "Help & Support" link, "Logout" button |
| 2 | `frontend/src/pages/Profile/LinkedAccounts.jsx` | Account management | **Platform accounts**: connected platforms with status, "Disconnect" / "Connect New" buttons. **Bank accounts**: linked UPI/bank with primary indicator, "Add Account" button, verify status |
| 3 | `frontend/src/pages/Profile/Support.jsx` | Help & support | FAQ accordion, contact options (WhatsApp support, email), report issue form, app version info |

**Deliverable**: Complete profile management with account linking and support.

---

## PHASE 18 — DEVOPS & DEPLOYMENT

> Docker, Nginx, CI/CD, SSL, cloud infrastructure setup.

| # | Task | Details |
|---|---|---|
| 1 | **Docker Compose (Dev)** | `docker-compose.yml`: 6 services (backend, ml-service, whatsapp-bot, frontend, postgres, redis) with volume mounts, env files, dependency ordering |
| 2 | **Docker Compose (Prod)** | `docker-compose.prod.yml`: 4 services (nginx, backend ×2 replicas, ml-service, whatsapp-bot). Managed PostgreSQL (Supabase/Neon/RDS) + Redis Cloud external |
| 3 | **Nginx Config** | `nginx/nginx.conf`: SSL termination (Let's Encrypt certs), proxy `/api` → backend:5000, WebSocket upgrade for `/socket.io`, `/whatsapp` → bot:5001, PWA static files with SPA routing, gzip compression, security headers |
| 4 | **GitHub Actions CI/CD** | Lint → test → build Docker images → push to registry → deploy to EC2 via SSH |
| 5 | **SSL Setup** | Certbot with Let's Encrypt for `gigpay.in` and `api.gigpay.in` |
| 6 | **AWS Infrastructure** | EC2 t3.medium ×2 (backend + ML), PostgreSQL (RDS db.t3.micro or Supabase Free/Pro), Redis Cloud 100MB, S3 bucket `gigpay-uploads-prod` (private), CloudFront CDN for PWA, Route 53 DNS |
| 7 | **Mock Mode Config** | `MOCK_UIDAI=true`, `MOCK_RAZORPAY=true`, `MOCK_REKOGNITION=true`, `MOCK_INSURANCE=true`, `MOCK_NBFC=true`, `MOCK_WHATSAPP=true` — all external services simulated for demos |

**Estimated Monthly Cost (Phase 1)**: ~$145/month (EC2 ×2: $60, PostgreSQL RDS: $30, Redis: $15, S3+CDN: $10, buffer: $30)

---

## COMPLETE FILE INVENTORY

> All ~160+ source files organized by service.

### Root (5 files)
```
gigpay/
├── README.md
├── docker-compose.yml
├── docker-compose.prod.yml
├── .gitignore
└── .env.example
```

### Backend (63 files)
```
backend/
├── package.json
├── Dockerfile
├── .env
├── server.js
├── app.js
├── config/
│   ├── database.js
│   ├── redis.js
│   ├── firebase.js
│   ├── razorpay.js
│   ├── aws.js
│   └── constants.js
├── models/                          (12 files)
│   ├── User.js
│   ├── Earning.js
│   ├── Payout.js
│   ├── Loan.js
│   ├── InsurancePolicy.js
│   ├── Expense.js
│   ├── TaxRecord.js
│   ├── CommunityJob.js
│   ├── Saving.js
│   ├── Notification.js
│   ├── AlgoInsight.js
│   └── OtpSession.js
├── routes/                          (14 files)
│   ├── index.js
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── earnings.routes.js
│   ├── payouts.routes.js
│   ├── loans.routes.js
│   ├── insurance.routes.js
│   ├── expenses.routes.js
│   ├── tax.routes.js
│   ├── community.routes.js
│   ├── savings.routes.js
│   ├── insights.routes.js
│   ├── notifications.routes.js
│   └── webhooks.routes.js
├── controllers/                     (13 files)
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── earnings.controller.js
│   ├── payouts.controller.js
│   ├── loans.controller.js
│   ├── insurance.controller.js
│   ├── expenses.controller.js
│   ├── tax.controller.js
│   ├── community.controller.js
│   ├── savings.controller.js
│   ├── insights.controller.js
│   ├── notifications.controller.js
│   └── webhooks.controller.js
├── middleware/                      (7 files)
│   ├── auth.middleware.js
│   ├── biometric.middleware.js
│   ├── kyc.middleware.js
│   ├── rateLimiter.middleware.js
│   ├── upload.middleware.js
│   ├── validate.middleware.js
│   └── errorHandler.middleware.js
├── services/                        (17 files)
│   ├── aadhaar.service.js
│   ├── biometric.service.js
│   ├── razorpay.service.js
│   ├── platform.service.js
│   ├── ml.service.js
│   ├── notification.service.js
│   ├── whatsapp.service.js
│   ├── sms.service.js
│   ├── ocr.service.js
│   ├── tax.service.js
│   ├── cleartax.service.js
│   ├── insurance.service.js
│   ├── loan.service.js
│   ├── savings.service.js
│   ├── storage.service.js
│   ├── fraud.service.js
│   └── community.service.js
├── jobs/
│   ├── queues.js
│   ├── workers/                     (6 files)
│   │   ├── payout.worker.js
│   │   ├── settlement.worker.js
│   │   ├── notification.worker.js
│   │   ├── sms.worker.js
│   │   ├── zone.worker.js
│   │   └── loan.worker.js
│   └── schedulers/                  (4 files)
│       ├── settlement.scheduler.js
│       ├── zone.scheduler.js
│       ├── loan.scheduler.js
│       └── notification.scheduler.js
└── utils/                           (6 files)
    ├── crypto.utils.js
    ├── logger.utils.js
    ├── geoUtils.js
    ├── formatters.utils.js
    ├── validators.utils.js
    └── gigScore.utils.js
```

### ML Service (22 files/dirs)
```
ml-service/
├── requirements.txt
├── Dockerfile
├── .env
├── main.py
├── routers/                         (4 files)
│   ├── predict.py
│   ├── zones.py
│   ├── sms_classify.py
│   └── insights.py
├── models/                          (4 files)
│   ├── earnings_lstm.py
│   ├── zone_clustering.py
│   ├── sms_classifier.py
│   └── insight_analyzer.py
├── schemas/                         (3 files)
│   ├── predict_schema.py
│   ├── zone_schema.py
│   └── sms_schema.py
├── data/
│   ├── training/                    (gitignored)
│   └── saved_models/                (gitignored)
├── utils/                           (4 files)
│   ├── db.py
│   ├── redis_cache.py
│   ├── weather.py
│   └── events.py
└── train/                           (3 files)
    ├── train_lstm.py
    ├── train_sms_classifier.py
    └── evaluate.py
```

### WhatsApp Bot (20 files)
```
whatsapp-bot/
├── package.json
├── Dockerfile
├── .env
├── server.js
├── handlers/                        (10 files)
│   ├── message.handler.js
│   ├── balance.handler.js
│   ├── cashout.handler.js
│   ├── forecast.handler.js
│   ├── zone.handler.js
│   ├── loan.handler.js
│   ├── insurance.handler.js
│   ├── tax.handler.js
│   ├── expense.handler.js
│   └── community.handler.js
├── nlp/                             (3 files)
│   ├── intent_classifier.js
│   ├── entity_extractor.js
│   └── intents.json
├── services/                        (3 files)
│   ├── gigpay_api.service.js
│   ├── session.service.js
│   └── response_builder.js
└── utils/                           (2 files)
    ├── language_detect.js
    └── templates.js
```

### Frontend (78 files)
```
frontend/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── public/                          (5 files)
│   ├── manifest.json
│   ├── favicon.ico
│   ├── icon-192.png
│   ├── icon-512.png
│   └── offline.html
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── sw.js
    ├── pages/                       (22 files)
    │   ├── Onboarding/
    │   │   ├── Landing.jsx
    │   │   ├── PhoneEntry.jsx
    │   │   ├── AadhaarKYC.jsx
    │   │   ├── SelfieCapture.jsx
    │   │   ├── PlatformLink.jsx
    │   │   └── BankSetup.jsx
    │   ├── Home.jsx
    │   ├── Zones.jsx
    │   ├── Wallet/
    │   │   ├── Wallet.jsx
    │   │   ├── Cashout.jsx
    │   │   ├── Transactions.jsx
    │   │   ├── Savings.jsx
    │   │   ├── Insurance.jsx
    │   │   └── Loans.jsx
    │   ├── Insights/
    │   │   ├── Insights.jsx
    │   │   ├── AlgoInsights.jsx
    │   │   ├── Expenses.jsx
    │   │   └── Tax.jsx
    │   ├── Community/
    │   │   ├── Community.jsx
    │   │   ├── PostJob.jsx
    │   │   ├── JobDetail.jsx
    │   │   ├── MyJobs.jsx
    │   │   └── WorkerProfile.jsx
    │   ├── Profile/
    │   │   ├── Profile.jsx
    │   │   ├── LinkedAccounts.jsx
    │   │   └── Support.jsx
    │   └── NotFound.jsx
    ├── components/                  (30 files)
    │   ├── layout/
    │   │   ├── BottomNav.jsx
    │   │   ├── TopBar.jsx
    │   │   └── PageWrapper.jsx
    │   ├── home/
    │   │   ├── EarningsCard.jsx
    │   │   ├── BalanceCard.jsx
    │   │   ├── ForecastBanner.jsx
    │   │   ├── HotZonePreview.jsx
    │   │   ├── QuickActions.jsx
    │   │   └── RecentTransactions.jsx
    │   ├── map/
    │   │   ├── HeatMap.jsx
    │   │   ├── ZoneCard.jsx
    │   │   └── LocationPin.jsx
    │   ├── earnings/
    │   │   ├── EarningsChart.jsx
    │   │   ├── PlatformBreakdown.jsx
    │   │   └── EarningEntry.jsx
    │   ├── cashout/
    │   │   ├── AmountSlider.jsx
    │   │   ├── FeePreview.jsx
    │   │   ├── BiometricPrompt.jsx
    │   │   └── PayoutStatus.jsx
    │   ├── tax/
    │   │   ├── TaxSummary.jsx
    │   │   ├── DeductionList.jsx
    │   │   └── TaxCalculator.jsx
    │   ├── expenses/
    │   │   ├── ExpenseCard.jsx
    │   │   ├── ExpenseChart.jsx
    │   │   └── SMSPermission.jsx
    │   ├── community/
    │   │   ├── JobCard.jsx
    │   │   ├── JobMap.jsx
    │   │   └── RatingStars.jsx
    │   ├── insurance/
    │   │   ├── InsuranceCard.jsx
    │   │   └── ClaimForm.jsx
    │   ├── loans/
    │   │   ├── LoanEligibility.jsx
    │   │   └── LoanCard.jsx
    │   ├── savings/
    │   │   ├── SavingsGoal.jsx
    │   │   └── RoundUpToggle.jsx
    │   └── shared/
    │       ├── OtpInput.jsx
    │       ├── LoadingSpinner.jsx
    │       ├── ErrorBoundary.jsx
    │       ├── OfflineBanner.jsx
    │       ├── CurrencyDisplay.jsx
    │       ├── ConfirmModal.jsx
    │       ├── EmptyState.jsx
    │       └── Avatar.jsx
    ├── hooks/                       (19 files)
    │   ├── useAuth.js
    │   ├── useEarnings.js
    │   ├── usePayouts.js
    │   ├── useWallet.js
    │   ├── useZones.js
    │   ├── useForecast.js
    │   ├── useExpenses.js
    │   ├── useTax.js
    │   ├── useLoan.js
    │   ├── useInsurance.js
    │   ├── useSavings.js
    │   ├── useCommunity.js
    │   ├── useSocket.js
    │   ├── useNotifications.js
    │   ├── useBiometric.js
    │   ├── useSmsReader.js
    │   ├── useGeolocation.js
    │   ├── useOffline.js
    │   └── useInstallPrompt.js
    ├── store/                       (3 files)
    │   ├── auth.store.js
    │   ├── ui.store.js
    │   └── realtime.store.js
    ├── services/                    (13 files)
    │   ├── api.service.js
    │   ├── auth.api.js
    │   ├── earnings.api.js
    │   ├── payouts.api.js
    │   ├── loans.api.js
    │   ├── insurance.api.js
    │   ├── expenses.api.js
    │   ├── tax.api.js
    │   ├── community.api.js
    │   ├── savings.api.js
    │   ├── insights.api.js
    │   ├── notifications.api.js
    │   └── ml.api.js
    ├── utils/                       (4 files)
    │   ├── formatCurrency.js
    │   ├── formatDate.js
    │   ├── smsParser.js
    │   └── webauthn.js
    ├── constants/                   (3 files)
    │   ├── routes.js
    │   ├── platforms.js
    │   └── taxRules.js
    └── locales/                     (2 files)
        ├── en.json
        └── hi.json
```

### Nginx (2 files)
```
nginx/
├── nginx.conf
└── ssl/                             (directory)
```

---

## API ENDPOINTS MASTER LIST

### Authentication — 10 endpoints
| Method | Path | Auth | Middleware |
|---|---|---|---|
| POST | `/api/auth/send-otp` | None | otpLimiter |
| POST | `/api/auth/verify-otp` | None | authLimiter |
| POST | `/api/auth/refresh` | None | — |
| POST | `/api/auth/logout` | JWT | — |
| POST | `/api/auth/kyc/aadhaar/init` | JWT | — |
| POST | `/api/auth/kyc/aadhaar/verify` | JWT | — |
| POST | `/api/auth/kyc/selfie` | JWT | upload |
| POST | `/api/auth/biometric/register` | JWT | — |
| POST | `/api/auth/biometric/challenge` | JWT | — |
| POST | `/api/auth/biometric/authenticate` | JWT | — |

### User — 2 endpoints
| Method | Path | Auth |
|---|---|---|
| GET | `/api/users/profile` | JWT |
| PATCH | `/api/users/profile` | JWT |

### Earnings — 6 endpoints
| Method | Path | Auth |
|---|---|---|
| GET | `/api/earnings/today` | JWT |
| GET | `/api/earnings/summary` | JWT |
| GET | `/api/earnings/history` | JWT |
| POST | `/api/earnings/manual` | JWT |
| POST | `/api/earnings/upload-screenshot` | JWT + upload |
| GET | `/api/earnings/forecast` | JWT |

### Payouts — 5 endpoints
| Method | Path | Auth | Middleware |
|---|---|---|---|
| GET | `/api/payouts/balance` | JWT | — |
| GET | `/api/payouts/fee-preview` | JWT | — |
| POST | `/api/payouts/initiate` | JWT | biometric, payoutLimiter |
| GET | `/api/payouts/status/:id` | JWT | — |
| GET | `/api/payouts/history` | JWT | — |

### Loans — 5 endpoints
| Method | Path | Auth | Middleware |
|---|---|---|---|
| GET | `/api/loans/eligibility` | JWT | KYC |
| POST | `/api/loans/apply` | JWT | KYC |
| GET | `/api/loans/active` | JWT | — |
| GET | `/api/loans/history` | JWT | — |
| POST | `/api/loans/:id/repay` | JWT | — |

### Insurance — 5 endpoints
| Method | Path | Auth | Middleware |
|---|---|---|---|
| GET | `/api/insurance/plans` | JWT | — |
| GET | `/api/insurance/active` | JWT | — |
| POST | `/api/insurance/activate` | JWT | KYC |
| POST | `/api/insurance/claim` | JWT | upload |
| GET | `/api/insurance/claims` | JWT | — |

### Expenses — 6 endpoints
| Method | Path | Auth |
|---|---|---|
| GET | `/api/expenses` | JWT |
| GET | `/api/expenses/summary` | JWT |
| POST | `/api/expenses` | JWT |
| POST | `/api/expenses/sms-batch` | JWT |
| POST | `/api/expenses/receipt` | JWT + upload |
| DELETE | `/api/expenses/:id` | JWT |

### Tax — 5 endpoints
| Method | Path | Auth | Middleware |
|---|---|---|---|
| GET | `/api/tax/summary/:fy` | JWT | — |
| GET | `/api/tax/deductions/:fy` | JWT | — |
| POST | `/api/tax/calculate` | JWT | — |
| POST | `/api/tax/file` | JWT | KYC |
| GET | `/api/tax/filing-status/:fy` | JWT | — |

### Community — 8 endpoints
| Method | Path | Auth | Middleware |
|---|---|---|---|
| GET | `/api/community/jobs` | JWT | — |
| POST | `/api/community/jobs` | JWT | KYC |
| GET | `/api/community/jobs/:id` | JWT | — |
| POST | `/api/community/jobs/:id/accept` | JWT | KYC |
| POST | `/api/community/jobs/:id/complete` | JWT | — |
| POST | `/api/community/jobs/:id/confirm` | JWT | — |
| POST | `/api/community/jobs/:id/rate` | JWT | — |
| GET | `/api/community/my-jobs` | JWT | — |

### Savings — 5 endpoints
| Method | Path | Auth |
|---|---|---|
| GET | `/api/savings` | JWT |
| POST | `/api/savings/create` | JWT |
| POST | `/api/savings/:id/deposit` | JWT |
| POST | `/api/savings/:id/withdraw` | JWT |
| PATCH | `/api/savings/:id/toggle` | JWT |

### Insights — 4 endpoints
| Method | Path | Auth |
|---|---|---|
| GET | `/api/insights/algo` | JWT |
| POST | `/api/insights/algo/:id/upvote` | JWT |
| POST | `/api/insights/algo/report` | JWT |
| GET | `/api/insights/performance` | JWT |

### Notifications — 4 endpoints
| Method | Path | Auth |
|---|---|---|
| GET | `/api/notifications` | JWT |
| GET | `/api/notifications/unread-count` | JWT |
| POST | `/api/notifications/mark-read` | JWT |
| POST | `/api/notifications/fcm-token` | JWT |

### Webhooks — 2 endpoints (no JWT, signature-verified)
| Method | Path | Auth |
|---|---|---|
| POST | `/api/webhooks/razorpay` | Razorpay signature |
| POST | `/api/webhooks/whatsapp` | Meta verify token |

### ML Service (Internal) — 6 endpoints
| Method | Path |
|---|---|
| POST | `/predict/earnings` |
| POST | `/predict/earnings/batch` |
| GET | `/zones/{city}` |
| POST | `/zones/compute` |
| POST | `/sms/classify` |
| GET | `/insights/{platform}/{city}` |
| GET | `/health` |

**Total: 74 REST endpoints + ML endpoints + WebSocket events**

---

## DATABASE TABLES SUMMARY

| # | Table | Rows Represent | Key Indexes |
|---|---|---|---|
| 1 | `users` | User accounts + wallet + KYC | phone (unique), city, platform |
| 2 | `earnings` | Daily earnings per platform | user_id + date, user_id + platform |
| 3 | `payouts` | Payout transactions | user_id, status |
| 4 | `loans` | Emergency loans | user_id, status |
| 5 | `insurance_policies` | Insurance policies + claims | user_id, status + valid_to |
| 6 | `expenses` | Tracked expenses | user_id + date, user_id + category |
| 7 | `tax_records` | Annual tax records | user_id + financial_year (unique) |
| 8 | `community_jobs` | Marketplace job postings | geo_location (GiST PostGIS), status + city, posted_by |
| 9 | `savings` | Savings goals + transactions | user_id |
| 10 | `notifications` | Notification history | user_id + read_at |
| 11 | `algo_insights` | Algorithm pattern insights | platform + city, insight_type |
| 12 | `otp_sessions` | OTP verification (pg_cron cleanup) | expires_at |

---

## BUSINESS LOGIC RULES REFERENCE

### Payout Fees
- **Instant** (< 60s): `max(₹5, amount × 1.5%)`
- **Same-day**: `max(₹5, amount × 1.2%)`
- **GigPro subscribers**: `₹0` (free)
- **Active loan**: auto-deduct `payout × loan.auto_deduct_percent`
- **Daily limit**: ₹50,000

### Loan Eligibility
- GigScore ≥ 400
- KYC verified
- No active loan with < 50% repaid
- No defaulted loans
- Max loan = `min(₹5,000, 5 × avg_daily_earnings_last_30d)`

### GigScore (0–850)
- Earnings consistency: 30% (CV of 30-day earnings, lower CV = higher score)
- Platform tenure: 20% (months since first earning ×14.2, capped at 170)
- Repayment history: 25% (on-time % ×213, neutral 150 if no loans)
- Platform rating: 15% (avg /5 × 128)
- App engagement: 10% (active days/30 × 85)

### Community Marketplace Escrow
- Post job → charge customer wallet → status: escrowed
- Customer confirms → release to worker minus 5% fee
- 72hr no confirmation → flag for review, hold escrow

### Tax Calculation
- Financial Year: April 1 – March 31
- Presumptive Tax (Section 44AD): 8% of cash receipts / 6% of digital
- New Regime slabs: 0–3L: 0%, 3–7L: 5%, 7–10L: 10%, 10–12L: 15%, 12–15L: 20%, >15L: 30%
- Section 87A rebate: zero tax if total income ≤ ₹7L

### Hot Zone Scoring
- `zone_score = worker_density(40%) + restaurant_density(35%) + historical_order_rate(25%)`
- Score < 30: hidden. 30–49: "PICKING UP" (yellow). 50–69: "MODERATE" (orange). ≥ 70: "HIGH DEMAND" (red)

### Withdrawal Security (6 layers)
1. Valid JWT (15 min expiry)
2. WebAuthn biometric (fingerprint/face)
3. Single-use withdrawal token (5 min TTL)
4. Fraud detection check
5. Daily withdrawal limit
6. Razorpay fund account verification

---

## THIRD-PARTY INTEGRATION CHECKLIST

| # | Service | Purpose | Integration Type | Required Credentials |
|---|---|---|---|---|
| 1 | **Razorpay** | UPI payouts | npm `razorpay` | Key ID, Key Secret, Webhook Secret, Account Number |
| 2 | **UIDAI eKYC** | Aadhaar verification | REST API | AUA Code, License Key, ASA License Key |
| 3 | **Digilocker** | PAN/DL verification | OAuth 2.0 REST | Client ID, Client Secret |
| 4 | **AWS Rekognition** | Face liveness/match | `@aws-sdk/client-rekognition` | Access Key, Secret Key, Region |
| 5 | **AWS S3** | File storage | `@aws-sdk/client-s3` | Access Key, Secret Key, Bucket Name |
| 6 | **Meta WhatsApp Business** | WhatsApp messaging | REST API + Webhooks | Access Token, Phone Number ID, Verify Token |
| 7 | **Twilio** | SMS OTP + WhatsApp fallback | npm `twilio` | Account SID, Auth Token, Phone Number |
| 8 | **Firebase FCM** | Push notifications | Firebase Admin SDK | Service Account JSON |
| 9 | **OpenWeatherMap** | Weather data for ML | REST API | API Key |
| 10 | **Google Maps Platform** | Maps, heatmap, geocoding | JS SDK + REST | API Key |
| 11 | **ClearTax** | Tax filing | REST API | API Key |
| 12 | **Acko / InsuranceDekho** | Micro insurance | REST API | API Key (partner) |
| 13 | **NBFC Partner** | Loan disbursement | REST API | API Key + URL (partner) |
| 14 | **Groww / Zerodha Coin** | Savings / liquid funds | REST API | API Key (partner) |

---

## ENVIRONMENT VARIABLES CHECKLIST

### Backend (40+ vars)
```
NODE_ENV, PORT, FRONTEND_URL
DATABASE_URL, REDIS_URL
JWT_ACCESS_PRIVATE_KEY, JWT_ACCESS_PUBLIC_KEY, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRES, JWT_REFRESH_EXPIRES
ENCRYPTION_KEY
RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, RAZORPAY_ACCOUNT_NUMBER
UIDAI_API_URL, UIDAI_AUA_CODE, UIDAI_LICENSE_KEY, UIDAI_ASA_LICENSE_KEY
AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET, REKOGNITION_COLLECTION_ID
FIREBASE_SERVICE_ACCOUNT
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, TWILIO_WHATSAPP_NUMBER
META_WHATSAPP_TOKEN, META_PHONE_NUMBER_ID, META_WEBHOOK_VERIFY_TOKEN
GOOGLE_MAPS_API_KEY
ML_SERVICE_URL
OPENWEATHERMAP_API_KEY, CLEARTAX_API_KEY, CLEARTAX_API_URL
ACKO_API_KEY, NBFC_PARTNER_API_URL, NBFC_PARTNER_API_KEY, GROWW_API_KEY
LOG_LEVEL
MOCK_UIDAI, MOCK_RAZORPAY, MOCK_REKOGNITION, MOCK_INSURANCE, MOCK_NBFC, MOCK_WHATSAPP
```

### ML Service (6 vars)
```
PORT, DATABASE_URL, REDIS_URL, OPENWEATHERMAP_API_KEY, ML_MODELS_PATH, LOG_LEVEL
```

### WhatsApp Bot (10 vars)
```
PORT, GIGPAY_API_URL, GIGPAY_BOT_SECRET, REDIS_URL
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER
META_WHATSAPP_TOKEN, META_PHONE_NUMBER_ID, META_WEBHOOK_VERIFY_TOKEN
```

### Frontend (8 vars)
```
VITE_API_URL, VITE_GOOGLE_MAPS_API_KEY
VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID, VITE_FIREBASE_VAPID_KEY
```

---

## ERROR CODE REFERENCE

| Code | HTTP | Meaning |
|---|---|---|
| `AUTH_001` | 401 | Invalid/expired access token |
| `AUTH_002` | 401 | Invalid refresh token |
| `AUTH_003` | 429 | OTP rate limit exceeded |
| `AUTH_004` | 400 | Invalid OTP |
| `AUTH_005` | 403 | Account suspended |
| `KYC_001` | 403 | KYC not completed |
| `KYC_002` | 400 | Aadhaar verification failed |
| `KYC_003` | 400 | Face verification failed |
| `PAY_001` | 400 | Insufficient balance |
| `PAY_002` | 403 | Biometric verification required |
| `PAY_003` | 429 | Daily withdrawal limit reached |
| `PAY_004` | 400 | Invalid UPI ID |
| `PAY_005` | 503 | Payout gateway unavailable |
| `LOAN_001` | 403 | Not eligible for loan |
| `LOAN_002` | 400 | Active loan exists |
| `LOAN_003` | 400 | Amount exceeds max eligible |
| `COMM_001` | 404 | Job not found |
| `COMM_002` | 409 | Job already accepted |
| `COMM_003` | 400 | Insufficient wallet for escrow |
| `ML_001` | 503 | ML service unavailable |
| `GEN_001` | 500 | Internal server error |
| `GEN_002` | 404 | Resource not found |
| `GEN_003` | 422 | Validation failed |

---

## APPENDIX: FEATURE FLAG SYSTEM

PostgreSQL table `feature_flags` with Redis cache (5-min refresh):

```
instant_payout      → enabled: true,  rollout: 100%
community_marketplace → enabled: true,  rollout: 50% (beta)
whatsapp_bot        → enabled: true,  rollout: 100%
tax_filing          → enabled: false, rollout: 0% (coming soon)
savings_vault       → enabled: true,  rollout: 100%
```

Backend reads from Redis cache. Frontend receives active flags on login in user profile response.

---

*End of GigPay Roadmap — 160+ files across 4 services, 74 API endpoints, 12 database tables, 14 third-party integrations, 18 build phases.*
