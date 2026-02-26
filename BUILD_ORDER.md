# GigPay — Complete Remaining Build Order & Progress Tracker

> **Scope**: Everything remaining across the entire project.
> **Exclusions**: Phase 6 (ML Service) → teammate. Phase 18 (Deployment) → deferred but listed at end.
> **Last Updated**: 2026-02-25

---

## Legend
- `[ ]` — Not started
- `[~]` — In progress
- `[x]` — Done

---

## ✅ Already Complete (No Work Needed)

| Phase | Description |
|---|---|
| Phase 0 | Project Scaffolding & Config (Docker, Nginx, package.json, .env.example) |
| Phase 2 | Backend Core (server.js, app.js, all 6 configs, all 7 middleware, all 6 utils) |
| Phase 3 | Backend Services Layer (all 17 service files) |
| Phase 4 | Backend Routes & Controllers (all 14 routes, all 13 controllers) |
| Phase 5 | Backend Jobs, Workers & Schedulers (queues, 6 workers, 4 schedulers) |
| Phase 7 | WhatsApp Bot (server, 10 handlers, 3 nlp, 3 services, 2 utils) |
| Phase 9 | Frontend State Management & Hooks (3 stores, 19+ hooks) |
| Phase 12 | Frontend Onboarding Pages (all 6 pages) |

---

## 🔴 STEP 1 — Backend: Database Model Layer Refactor
> **Phase 1 gap.** Prisma schema exists, but individual model JS files with business logic methods (statics, virtuals, computed fields) are missing. Controllers currently do raw Prisma queries — these centralize that logic.
> ⚠️ Only needed if you want clean architecture. Backend WORKS without it.

- [x] `backend/models/Earning.js` — Statics: `getDailySummary(userId, date)`, `getMonthlyStats(userId, month, year)` 
- [x] `backend/models/Payout.js` — Static: `getPendingSettlements()`
- [x] `backend/models/Loan.js` — Virtual: `outstanding_balance`. Statics: `getActiveLoans(userId)`, `getTotalOutstanding(userId)`
- [x] `backend/models/InsurancePolicy.js` — Model wrapper for insurance queries
- [x] `backend/models/Expense.js` — Statics: `getMonthlyByCategory(userId, month, year)`, `getTotalDeductible(userId, financialYear)`
- [x] `backend/models/TaxRecord.js` — Model wrapper for tax queries
- [x] `backend/models/CommunityJob.js` — Geospatial query helpers (PostGIS ST_DWithin wrappers)
- [x] `backend/models/Saving.js` — Model wrapper for savings queries
- [x] `backend/models/Notification.js` — Static: `getUnread(userId)`
- [x] `backend/models/AlgoInsight.js` — Confidence/upvote query helpers
- [x] `backend/models/OtpSession.js` — pg_cron cleanup hook, attempt tracking

---

## 🔴 STEP 2 — Frontend: Foundation (Utilities, Constants, PWA Assets)
> ⚡ Build these first. Every other frontend file depends on them.

### Utilities
- [x] `frontend/src/utils/formatCurrency.js` — Paise → ₹X,XXX.XX formatter
- [x] `frontend/src/utils/formatDate.js` — dayjs IST formatters, relative time (e.g., "2 hrs ago")
- [x] `frontend/src/utils/smsParser.js` — Client-side SMS pre-filter (`isFuelSms`, `extractAmount`, `extractMerchant`)
- [x] `frontend/src/utils/webauthn.js` — WebAuthn helpers for credential creation/assertion formatting

### Constants
- [x] `frontend/src/constants/routes.js` — Route path constants (`ROUTES.HOME`, `ROUTES.CASHOUT`, `ROUTES.ZONES`, etc.)
- [x] `frontend/src/constants/platforms.js` — Platform metadata (Zomato/Swiggy/Ola/Uber/Dunzo — names, colors, icons, API base URLs)
- [x] `frontend/src/constants/taxRules.js` — Tax slabs, Section 44AD/44ADA rules, deduction limits, advance tax due dates

### PWA Assets
- [ ] `frontend/public/favicon.ico` — GigPay brand icon
- [ ] `frontend/public/icon-192.png` — PWA icon 192×192
- [ ] `frontend/public/icon-512.png` — PWA icon 512×512 (maskable)
- [ ] `frontend/src/sw.js` — Service Worker (Workbox: NetworkFirst for `/api/*`, CacheFirst for static, background sync, offline fallback to `offline.html`)

---

## 🔴 STEP 3 — Frontend: Missing API Service Files
> ⚡ Backend endpoints all exist — just need the frontend HTTP clients.

- [x] `frontend/src/services/loans.api.js` — `getEligibility()`, `apply(amount, repaymentPercent)`, `getActive()`, `getHistory()`, `repay(loanId, amount)`
- [x] `frontend/src/services/insurance.api.js` — `getPlans()`, `getActive()`, `activate(type, duration)`, `submitClaim(policyId, formData)`, `getClaims()`
- [x] `frontend/src/services/expenses.api.js` — `getExpenses(filters)`, `getSummary()`, `addExpense(data)`, `submitSmsBatch(messages)`, `uploadReceipt(formData)`, `deleteExpense(id)`
- [x] `frontend/src/services/tax.api.js` — `getSummary(fy)`, `getDeductions(fy)`, `calculate(data)`, `file(fy)`, `getFilingStatus(fy)`
- [x] `frontend/src/services/savings.api.js` — `getGoals()`, `createGoal(data)`, `deposit(id, amount)`, `withdraw(id, amount)`, `toggleAutoSave(id)`
- [x] `frontend/src/services/notifications.api.js` — `getNotifications(page)`, `getUnreadCount()`, `markRead(ids)`, `registerFcmToken(token)`
- [x] `frontend/src/services/ml.api.js` — `getZones(city)`, `getForecast(params)` — calls ML endpoints via backend proxy

---

## 🔴 STEP 4 — Frontend: Shared Component Library
> ⚡ Build once, used across 40+ places. Don't skip these.

- [x] `frontend/src/components/shared/LoadingSpinner.jsx` — Teal spinner with optional message text
- [x] `frontend/src/components/shared/ErrorBoundary.jsx` — React error boundary, fallback UI with retry button
- [x] `frontend/src/components/shared/CurrencyDisplay.jsx` — Takes paise value, renders `₹X,XXX` with color coding (positive/negative)
- [x] `frontend/src/components/shared/ConfirmModal.jsx` — Generic confirm/cancel dialog with CSS entrance animation
- [x] `frontend/src/components/shared/EmptyState.jsx` — Illustration + title + description + optional CTA button for empty lists
- [x] `frontend/src/components/shared/Avatar.jsx` — Circular image with fallback initials, configurable size

---

## 🟠 STEP 5 — Frontend: Home Dashboard Components
> First screen users see — critical for demo impression.

- [x] `frontend/src/components/home/BalanceCard.jsx` — Large wallet balance, "Cash Out Now" button, locked balance, lifetime stats (earned/withdrawn)
- [x] `frontend/src/components/home/EarningsCard.jsx` — Today's total across platforms, per-platform breakdown with logos, progress vs 7-day average, trend arrow
- [x] `frontend/src/components/home/ForecastBanner.jsx` — ₹850–₹1,200 range display, confidence bar, factor chips (☀️ weather, 📅 day, 🏏 event)
- [x] `frontend/src/components/home/QuickActions.jsx` — 2×2 action grid: Emergency Loan, Insurance, Tax, Savings (each with icon + label)
- [x] `frontend/src/components/home/RecentTransactions.jsx` — Last 5 payouts with type, amount, status badge, timestamp. "View All" link
- [x] `frontend/src/components/home/HotZonePreview.jsx` — Small Google Maps widget, nearest hot zone, demand score. "View Full Map" → `/zones`

### Map Components (shared by Home preview + Zones page)
- [x] `frontend/src/components/map/HeatMap.jsx` — CSS heatmap placeholder (swap for Google Maps when API key available), zone dots, user location
- [x] `frontend/src/components/map/ZoneCard.jsx` — Zone name, demand score, estimated wait time, distance from user
- [x] `frontend/src/components/map/LocationPin.jsx` — Custom map marker SVG component

### Earnings Components (shared by Home + Insights)
- [x] `frontend/src/components/earnings/EarningsChart.jsx` — Pure CSS bar chart for weekly/monthly earnings trends (no Recharts dependency)
- [x] `frontend/src/components/earnings/PlatformBreakdown.jsx` — CSS conic-gradient donut chart showing earnings split by platform
- [x] `frontend/src/components/earnings/EarningEntry.jsx` — Manual earnings entry form (platform tiles, amount, hours worked, trips count)

---

## 🟠 STEP 6 — Frontend: Cashout Flow Components
> Most critical user journey — instant payout with biometric verification.

- [x] `frontend/src/components/cashout/AmountSlider.jsx` — Slider from ₹0 to max withdrawable, quick-select buttons (₹100/₹500/₹1000/Max), live amount display
- [x] `frontend/src/components/cashout/FeePreview.jsx` — Live fee breakdown: Amount → Fee (1.2% or 1.5%) → Net amount. GigPro discount badge if applicable
- [x] `frontend/src/components/cashout/BiometricPrompt.jsx` — WebAuthn trigger (`navigator.credentials.get()`), state machine, retry flow
- [x] `frontend/src/components/cashout/PayoutStatus.jsx` — Step-by-step progress (pending → processing → completed with confetti)

---

## 🟠 STEP 7 — Frontend: Missing Wallet & Financial Pages

### Missing Pages
- [x] `frontend/src/pages/Wallet/Transactions.jsx` — Paginated transaction history, filter by type (payout/loan/savings), date range, status
- [x] `frontend/src/pages/Wallet/Insurance.jsx` — Available plans, active policies with expiry countdown, Activate buttons, claim history

### Loan Components
- [x] `frontend/src/components/financial/EligibilityMeter.jsx` — GigScore SVG gauge (0–1000), max eligible amount, eligibility status (moved to `financial/`)
- [x] `frontend/src/components/financial/LoanCard.jsx` — Outstanding balance, repayment progress bar, status badge, interest rate

### Insurance Components
- [x] `frontend/src/components/financial/InsuranceCard.jsx` — Type-specific card, coverage, premium, expiry warning
- [x] `frontend/src/components/insurance/ClaimForm.jsx` — Policy selector, incident description, document upload (camera/gallery), submit

### Savings Components
- [x] `frontend/src/components/financial/SavingsGoal.jsx` — Goal progress card: goal name, target, current amount, gradient progress bar, interest earned, auto-save badge
- [x] `frontend/src/components/savings/RoundUpToggle.jsx` — Toggle switch for round-up savings with explanation text

---

## 🟡 STEP 8 — Frontend: Insights, Tax & Expense Pages

### Missing Pages
- [x] `frontend/src/pages/Insights/AlgoInsights.jsx` — Feed of platform algorithm tips, filter by platform, upvote, confidence %, "Report Pattern" CTA
- [x] `frontend/src/pages/Insights/Tax.jsx` — Annual summary, deduction breakdown, regime comparison (old vs new), missed deduction alerts, ClearTax file CTA

### Tax Components
- [x] `frontend/src/components/financial/TaxSummary.jsx` — Annual summary with 44AD, regime comparison, savings recommendation (moved to `financial/`)
- [x] `frontend/src/components/tax/DeductionList.jsx` — Itemized deductions (fuel, vehicle depreciation, mobile, 80C, custom)
- [x] `frontend/src/components/tax/TaxCalculator.jsx` — Interactive: input income + expenses → both regime taxes → recommendation

### Expense Components
- [x] `frontend/src/components/expenses/ExpenseCard.jsx` — Category icon, merchant name, amount, date, source badge (SMS/manual/OCR), tax deductible indicator
- [x] `frontend/src/components/expenses/ExpenseChart.jsx` — CSS conic-gradient donut chart: category breakdown with amounts and percentages
- [x] `frontend/src/components/expenses/SMSPermission.jsx` — Permission request banner, "Allow SMS Access" button, privacy reassurance text

---

## 🟡 STEP 9 — Frontend: Community Marketplace Pages

### Missing Pages
- [x] `frontend/src/pages/Community/MyJobs.jsx` — Two sections: "Jobs I Posted" + "Jobs I Accepted", status filters, tracking
- [x] `frontend/src/pages/Community/WorkerProfile.jsx` — Worker name, avatar, GigScore, avg rating, completed jobs count, reviews, active listings

### Community Components
- [x] `frontend/src/components/community/JobCard.jsx` — Type badge, title, offered price, distance, description, time posted
- [x] `frontend/src/components/community/JobMap.jsx` — CSS placeholder map with job markers, user location, type legend
- [x] `frontend/src/components/community/RatingStars.jsx` — Interactive 1–5 star rating with hover, comment input, submit handler

---

## 🟡 STEP 10 — Frontend: Profile & Support Pages

- [x] `frontend/src/pages/Profile/LinkedAccounts.jsx` — Platform accounts (status, Disconnect/Connect buttons) + bank accounts (primary indicator, Add Account, verify status)
- [x] `frontend/src/pages/Profile/Support.jsx` — FAQ accordion, WhatsApp support link, email contact, report issue form, app version
- [x] `frontend/src/pages/NotFound.jsx` — 404 page with illustration and "Go Home" button

---

## 🔵 STEP 11 — Phase 6: ML Service Gaps *(Teammate's Responsibility)*
> Listed here for tracking. Do NOT pick this up unless teammate is blocked.

- [ ] `ml-service/routers/zones.py` — `/zones/compute` POST + `/zones/{city}` GET
- [ ] `ml-service/routers/insights.py` — `/insights/{platform}/{city}` GET
- [ ] `ml-service/models/zone_clustering.py` — DBSCAN clustering, convex hull polygons, zone scoring
- [ ] `ml-service/models/insight_analyzer.py` — Pattern detection from aggregated earnings data
- [ ] `ml-service/schemas/predict_schema.py` — Pydantic: EarningsPredictionRequest/Response, BatchPredictionRequest
- [ ] `ml-service/schemas/zone_schema.py` — Pydantic: ZoneComputeRequest, WorkerLocation, ZoneResponse (GeoJSON)
- [ ] `ml-service/utils/db.py` — SQLAlchemy connection to PostgreSQL for training data
- [ ] `ml-service/utils/redis_cache.py` — Redis helpers: get/set with TTL, cache zone results, cache predictions
- [ ] `ml-service/utils/weather.py` — OpenWeatherMap API client: `get_forecast(city, date)` → `{rainfall_mm, temp_c, conditions}`
- [ ] `ml-service/utils/events.py` — Public events API: local events (IPL, festivals) → `event_score` 0–1
- [ ] `ml-service/train/train_lstm.py` — 2-year earnings data → LSTM training → saves to `data/saved_models/`
- [ ] `ml-service/train/train_sms_classifier.py` — Labeled SMS dataset → mBERT fine-tune → save weights
- [ ] `ml-service/train/evaluate.py` — Load both models → evaluation metrics → reports

---

## 🟣 STEP 12 — Phase 18: DevOps & Deployment *(Deferred)*
> Do after everything else is working locally.

- [ ] **GitHub Actions CI/CD** — `.github/workflows/deploy.yml`: lint → test → build Docker → push to registry → deploy to EC2 via SSH
- [ ] **SSL Setup** — Certbot + Let's Encrypt for `gigpay.in` and `api.gigpay.in`
- [ ] **AWS Infrastructure** — EC2 t3.medium ×2, RDS db.t3.micro (or Supabase), Redis Cloud 100MB, S3 bucket, CloudFront CDN, Route 53 DNS
- [ ] **Mock Mode Verification** — Confirm `MOCK_UIDAI`, `MOCK_RAZORPAY`, `MOCK_REKOGNITION`, `MOCK_INSURANCE`, `MOCK_NBFC`, `MOCK_WHATSAPP` all work end-to-end for demo
- [ ] **Production `.env` setup** — All 40+ backend vars, 6 ML vars, 10 WhatsApp bot vars, 8 frontend vars

---

## 📊 Progress Summary

| Step | Area | Description | Status | Est. Time |
|---|---|---|---|---|
| Step 1 | Backend | DB Model Layer Refactor (11 files) | `[x]` ✅ Done | ~3h |
| Step 2 | Frontend | Foundation (utils, constants) | `[x]` ✅ Done | ~2h |
| Step 3 | Frontend | Missing API Services (7 files) | `[x]` ✅ Done | ~1h |
| Step 4 | Frontend | Shared Component Library (6 files) | `[x]` ✅ Done | ~2h |
| Step 5 | Frontend | Home Dashboard + Map + Earnings (15 files) | `[x]` ✅ Done | ~4h |
| Step 6 | Frontend | Cashout Flow Components (4 files) | `[x]` ✅ Done | ~3h |
| Step 7 | Frontend | Wallet & Financial (9 files) | `[x]` ✅ Done | ~4h |
| Step 8 | Frontend | Insights, Tax & Expense (7 files) | `[x]` ✅ Done | ~4h |
| Step 9 | Frontend | Community Marketplace (6 files) | `[x]` ✅ Done | ~3h |
| Step 10 | Frontend | Profile & Support (3 files) | `[x]` ✅ Done | ~2h |
| Step 11 | ML | ML Service Gaps (teammate) | `[ ]` Teammate | ~8h |
| Step 12 | DevOps | Deployment & CI/CD | `[ ]` Deferred | ~4h |
| | | **TOTAL (our scope)** | | **~28h** |

---

## 📝 Notes
- **Backend (Phases 0–5, 7)** → ✅ Already complete
- **Step 1 (Model refactor)** → Optional if controllers work fine with raw Prisma
- **Step 11 (ML)** → Teammate's responsibility — don't pick up unless they're blocked
- **Step 12 (Deployment)** → Do last, after everything works locally
- Update checkboxes as items are completed: `[ ]` → `[x]`, or `[~]` for in-progress
