# GIGPAY — MASTER PROJECT BLUEPRINT
> **Zero-Context Build Document** — Every detail needed to build this project from scratch is in this file. No prior context required.

---

## TABLE OF CONTENTS
1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Solution & Features](#3-solution--features)
4. [Tech Stack — Complete](#4-tech-stack--complete)
5. [System Architecture](#5-system-architecture)
6. [Database Schema](#6-database-schema)
7. [Complete File Tree](#7-complete-file-tree)
8. [File-by-File Specification](#8-file-by-file-specification)
   - [8.1 Root / Config Files](#81-root--config-files)
   - [8.2 Backend — Server & Config](#82-backend--server--config)
   - [8.3 Backend — Models](#83-backend--models)
   - [8.4 Backend — Routes & Controllers](#84-backend--routes--controllers)
   - [8.5 Backend — Middleware](#85-backend--middleware)
   - [8.6 Backend — Services](#86-backend--services)
   - [8.7 Backend — Utils](#87-backend--utils)
   - [8.8 Backend — Jobs / Queue Workers](#88-backend--jobs--queue-workers)
   - [8.9 ML Service (Python FastAPI)](#89-ml-service-python-fastapi)
   - [8.10 WhatsApp Bot Service](#810-whatsapp-bot-service)
   - [8.11 Frontend — PWA Shell](#811-frontend--pwa-shell)
   - [8.12 Frontend — Pages](#812-frontend--pages)
   - [8.13 Frontend — Components](#813-frontend--components)
   - [8.14 Frontend — State & Hooks](#814-frontend--state--hooks)
   - [8.15 Frontend — Services / API Layer](#815-frontend--services--api-layer)
   - [8.16 Frontend — PWA Assets](#816-frontend--pwa-assets)
9. [API Endpoints Reference](#9-api-endpoints-reference)
10. [Environment Variables](#10-environment-variables)
11. [Third-Party Integrations](#11-third-party-integrations)
12. [Business Logic Rules](#12-business-logic-rules)
13. [ML Models Specification](#13-ml-models-specification)
14. [Security Implementation](#14-security-implementation)
15. [Deployment Architecture](#15-deployment-architecture)
16. [Build & Run Instructions](#16-build--run-instructions)
17. [Hackathon Demo Script](#17-hackathon-demo-script)

---

## 1. PROJECT OVERVIEW

| Field | Value |
|---|---|
| **Product Name** | GigPay |
| **Tagline** | Instant Earnings. Smart Tools. Financial Freedom. |
| **Type** | Progressive Web App (PWA) |
| **Target Users** | Gig workers — delivery partners (Zomato/Swiggy/Dunzo), rideshare drivers (Ola/Uber), freelancers |
| **Geography** | India — Phase 1: Bangalore, Delhi, Mumbai, Hyderabad, Chennai |
| **Core Problem** | Gig workers earn money daily but receive it weekly/bi-weekly, have zero financial safety nets, pay excess taxes, and are blind to platform algorithms |
| **Core Solution** | Instant same-day payouts + AI earnings intelligence + WhatsApp bot + tax automation + community marketplace |
| **Stack** | MERN (MongoDB, Express, React, Node.js) + Python FastAPI for ML |
| **Platform** | PWA — installable, offline-capable, no app store required |

---

## 2. PROBLEM STATEMENT

### 2.1 Payment Delays
Platforms like Zomato, Swiggy, Ola, Uber settle earnings weekly or bi-weekly. A driver earning ₹800/day cannot access that money for 5–7 days, forcing them to take informal loans at 3–5% daily interest just to buy fuel the next day.

### 2.2 Zero Financial Safety Nets
Gig workers are classified as "independent contractors" — no PF, no ESIC, no gratuity, no health insurance. One accident wipes out months of savings.

### 2.3 Tax Complexity
Most gig workers don't know they qualify for Presumptive Taxation (Section 44AD/44ADA) and are eligible for deductions on fuel, vehicle depreciation, mobile data. They either skip filing (risk ₹5,000–₹10,000 penalties) or overpay significantly.

### 2.4 Algorithm Opacity
Platforms use hidden algorithms for order assignment, surge pricing, and partner ratings. Workers who crack the algorithm earn 40–60% more. This knowledge gap creates income inequality within the same platform.

### 2.5 No Expense Visibility
Fuel, tolls, maintenance — all deductible business expenses — go untracked. Workers don't know their actual net income after costs.

### 2.6 Platform Middleman Dependency
Zomato/Uber charge 25–35% commission. There's no way for a local delivery person to offer services directly to a nearby customer without these platforms.

---

## 3. SOLUTION & FEATURES

GigPay has **12 core modules**:

| # | Module | What It Does |
|---|---|---|
| 1 | **Instant Payouts** | Same-day earnings cashout; GigPay fronts money, settles with platform on official settlement day |
| 2 | **Hot Zone AI** | Real-time ML heatmap showing highest-demand delivery/ride zones in the city |
| 3 | **Earnings Predictor** | LSTM model predicts next-day earnings using history, weather, events, day of week |
| 4 | **WhatsApp Bot** | Full app functionality via WhatsApp — balance, cashout, loans, hot zones, alerts |
| 5 | **Aadhaar Onboarding** | eKYC via UIDAI OTP + selfie liveness check; biometric re-verify on every withdrawal |
| 6 | **Tax Filing Assistant** | ITR pre-fill, deduction maximizer, presumptive tax calculator, ClearTax integration |
| 7 | **Expense Tracker** | Reads Android SMS to auto-detect and categorize fuel, toll, maintenance spends |
| 8 | **Algo Insights** | Decodes platform algorithm patterns — acceptance rate thresholds, surge patterns, batch logic |
| 9 | **Community Marketplace** | Hyperlocal P2P gig platform; workers offer services directly to consumers, 5% fee vs 30% |
| 10 | **Emergency Loans** | ₹500–₹5,000 micro-credit in 30 seconds, repaid via future earnings auto-deduction |
| 11 | **Micro Insurance** | Daily/weekly accident, health, device, vehicle insurance at ₹5–₹25; one-tap activation |
| 12 | **Savings Vault** | Round-up savings, goal-based savings, 4–6% returns via liquid fund integration |

---

## 4. TECH STACK — COMPLETE

### 4.1 Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.x | UI framework |
| Vite | 5.x | Build tool / dev server |
| React Router DOM | 6.x | Client-side routing |
| Zustand | 4.x | Global state management |
| TanStack Query (React Query) | 5.x | Server state, caching, async data |
| Tailwind CSS | 3.x | Utility-first styling |
| shadcn/ui | latest | Pre-built accessible UI components |
| Lucide React | latest | Icon library |
| Axios | 1.x | HTTP client |
| Socket.io-client | 4.x | Real-time WebSocket communication |
| Google Maps JS API | weekly | Maps, heatmap, geolocation |
| @vis.gl/react-google-maps | latest | React wrapper for Google Maps |
| Recharts | 2.x | Earnings charts and graphs |
| React Hook Form | 7.x | Form state management |
| Zod | 3.x | Frontend schema validation |
| Workbox | 7.x | Service Worker, PWA caching strategies |
| vite-plugin-pwa | latest | PWA manifest and SW generation |
| Firebase JS SDK | 10.x | Push notifications (FCM) |
| dayjs | latest | Date/time formatting |
| react-hot-toast | latest | Toast notifications |
| framer-motion | 11.x | Animations |
| i18next + react-i18next | latest | Internationalisation (EN + HI) |

### 4.2 Backend (Node.js)
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| Express | 4.x | HTTP server framework |
| Mongoose | 8.x | MongoDB ODM |
| Socket.io | 4.x | Real-time WebSocket server |
| Bull | 4.x | Redis-backed job queues |
| ioredis | 5.x | Redis client |
| jsonwebtoken | 9.x | JWT access + refresh tokens |
| bcryptjs | 2.x | Password hashing |
| express-rate-limit | 7.x | API rate limiting |
| express-validator | 7.x | Request body validation |
| multer | 1.x | File upload handling (receipts, screenshots) |
| sharp | 0.x | Image processing (compress uploads) |
| tesseract.js | 5.x | OCR for earnings screenshots |
| node-cron | 3.x | Scheduled jobs (settlement reconciliation) |
| axios | 1.x | HTTP calls to third-party APIs |
| dotenv | 16.x | Environment variable management |
| morgan | 1.x | HTTP request logging |
| helmet | 7.x | Security HTTP headers |
| cors | 2.x | CORS policy |
| compression | 1.x | Gzip response compression |
| winston | 3.x | Structured logging |
| uuid | 9.x | Unique ID generation |

### 4.3 Database
| Technology | Version | Purpose |
|---|---|---|
| MongoDB Atlas | 7.x | Primary database (cloud hosted) |
| Redis | 7.x | Cache, session store, job queues, rate limiting |

### 4.4 ML Service (Python)
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11 | Runtime |
| FastAPI | 0.110 | ML API server |
| Uvicorn | 0.29 | ASGI server |
| TensorFlow / Keras | 2.15 | LSTM earnings prediction model |
| scikit-learn | 1.4 | DBSCAN hot zone clustering, preprocessing |
| pandas | 2.x | Data manipulation |
| numpy | 1.x | Numerical operations |
| joblib | 1.x | Model serialization |
| python-dotenv | 1.x | Environment variables |
| httpx | 0.27 | Async HTTP calls (weather API etc.) |
| pymongo | 4.x | Direct MongoDB access for ML training data |
| transformers (HuggingFace) | 4.x | SMS NLP classifier (mBERT fine-tuned) |
| torch | 2.x | PyTorch backend for transformers |
| pydantic | 2.x | Request/response validation |
| redis-py | 5.x | Cache predictions in Redis |

### 4.5 WhatsApp Bot Service (Node.js — separate microservice)
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| Express | 4.x | Webhook receiver |
| @twilio/conversations | latest | Twilio WhatsApp API |
| dialogflow | latest (fallback) | Intent classification (NLP) |
| axios | 1.x | Call main backend APIs |
| ioredis | 5.x | Session/conversation state |

### 4.6 Third-Party APIs
| Service | Purpose | SDK / Integration |
|---|---|---|
| **Razorpay** | UPI payouts, payment processing | `razorpay` npm package |
| **UIDAI eKYC API** | Aadhaar OTP verification | REST API (UIDAI Sandbox) |
| **Digilocker API** | PAN, DL document verification | OAuth 2.0 REST API |
| **AWS Rekognition** | Face liveness check, selfie match | `@aws-sdk/client-rekognition` |
| **Meta WhatsApp Business API** | WhatsApp messaging | REST API + Webhooks |
| **Twilio** | WhatsApp fallback, SMS OTP | `twilio` npm package |
| **Firebase FCM** | Push notifications | Firebase Admin SDK |
| **OpenWeatherMap API** | Weather for earnings predictions | REST API |
| **Google Maps Platform** | Maps, heatmap, geocoding, places | JS SDK + Maps API |
| **ClearTax API** | ITR pre-fill and tax filing | REST API |
| **Acko / InsuranceDekho API** | Micro insurance policy issuance | REST API (partner) |
| **NBFC Partner API** | Emergency loan disbursement | REST API (partner) |
| **Groww / Zerodha Coin API** | Liquid fund savings returns | REST API (partner) |

### 4.7 DevOps & Infrastructure
| Technology | Purpose |
|---|---|
| Docker + Docker Compose | Containerization — all services run as containers |
| AWS EC2 (or Railway/Render for hackathon) | Backend + ML service hosting |
| AWS S3 | File storage (receipts, profile photos, KYC docs) |
| AWS CloudFront | CDN for static PWA assets |
| MongoDB Atlas | Cloud database (M10 cluster) |
| Redis Cloud (or ElastiCache) | Managed Redis |
| GitHub Actions | CI/CD pipeline |
| Nginx | Reverse proxy, SSL termination |
| Certbot / Let's Encrypt | SSL certificates |

---

## 5. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  React PWA (Vite)  ←→  Service Worker (Workbox)                │
│  IndexedDB (offline cache)   FCM Push Notifications             │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS / WSS
┌──────────────────────────▼──────────────────────────────────────┐
│                      NGINX REVERSE PROXY                         │
│  SSL Termination | Rate Limiting | Static File Serving           │
└──────┬──────────────────────────────────────────┬───────────────┘
       │                                          │
┌──────▼──────────┐                    ┌──────────▼──────────────┐
│  MAIN BACKEND   │                    │  WHATSAPP BOT SERVICE    │
│  Node.js/Express│                    │  Node.js/Express         │
│  Port 5000      │                    │  Port 5001               │
│  Socket.io      │                    │  Twilio/Meta Webhook     │
└──────┬──────────┘                    └──────────┬───────────────┘
       │                                          │
       │    ┌──────────────────────────────────────┘
       │    │
┌──────▼────▼─────────────────────────────────────────────────────┐
│                     SHARED INFRASTRUCTURE                        │
│  MongoDB Atlas          Redis          AWS S3                    │
│  (Primary DB)    (Cache/Queue/Session)  (File Storage)          │
└──────────────────────────────────────────────────────────────────┘
       │
┌──────▼──────────┐
│  ML SERVICE     │
│  Python FastAPI │
│  Port 8000      │
│  LSTM + DBSCAN  │
│  + NLP SMS      │
└─────────────────┘
```

### Data Flow — Instant Payout
```
Worker taps "Cash Out"
  → Frontend: WebAuthn biometric prompt
  → POST /api/payouts/initiate {amount, deviceSignature}
  → Backend: verify JWT → validate balance → fraud check
  → Backend: Bull job enqueued "PAYOUT_INITIATE"
  → Worker: calls Razorpay Payout API → UPI transfer
  → Backend: MongoDB transaction written, status = PENDING
  → Socket.io event "payout:status" pushed to client
  → WhatsApp notification sent via Twilio
  → Platform settlement job scheduled (T+settlement_days)
```

### Data Flow — Hot Zone Detection
```
[Every 5 min — Cron Job]
  → Collect GPS coordinates from consenting workers (Redis stream)
  → POST /ml/zones/compute {city, coordinates[], timestamp}
  → ML Service: DBSCAN clustering on coordinates
  → Combine with restaurant density, event data
  → Return GeoJSON polygons with demand scores
  → Store in Redis (TTL: 5 min)
  → Socket.io broadcast to all workers in that city: "zones:update"
  → Frontend heatmap layer re-renders
```

---

## 6. DATABASE SCHEMA

### 6.1 Collection: `users`
```javascript
{
  _id: ObjectId,
  phone: String,          // Primary identifier, unique, indexed
  name: String,
  email: String,          // optional
  aadhaar_last4: String,  // Only last 4 digits stored
  pan: String,            // encrypted
  kyc_status: Enum["pending", "verified", "rejected"],
  kyc_method: Enum["aadhaar", "pan", "manual"],
  face_embedding: Buffer, // AWS Rekognition face vector (for biometric match)
  city: String,           // Bangalore, Delhi, etc.
  home_lat: Number,
  home_lng: Number,
  platform_accounts: [{
    platform: Enum["zomato", "swiggy", "ola", "uber", "dunzo", "freelance"],
    platform_user_id: String,
    access_token: String, // encrypted
    linked_at: Date,
    is_active: Boolean
  }],
  bank_accounts: [{
    upi_id: String,
    account_number: String, // encrypted
    ifsc: String,
    bank_name: String,
    is_primary: Boolean,
    verified: Boolean
  }],
  wallet: {
    balance: Number,        // Current withdrawable balance in INR paise
    locked_balance: Number, // Balance locked in active loans/processing
    lifetime_earned: Number,
    lifetime_withdrawn: Number
  },
  gig_score: Number,       // 0–850 internal credit score
  subscription_tier: Enum["free", "gigpro"],
  subscription_expires_at: Date,
  fcm_token: String,       // Firebase push token
  whatsapp_opt_in: Boolean,
  language_pref: Enum["en", "hi", "kn", "ta", "te"],
  is_active: Boolean,
  last_seen: Date,
  created_at: Date,
  updated_at: Date
}
```

### 6.2 Collection: `earnings`
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,       // ref: users, indexed
  platform: Enum["zomato", "swiggy", "ola", "uber", "dunzo", "other"],
  date: Date,              // Date of earning, indexed
  gross_amount: Number,    // In INR paise
  platform_deductions: Number,
  net_amount: Number,
  hours_worked: Number,
  trips_count: Number,
  avg_per_trip: Number,
  zone: String,            // Primary zone worked in
  source: Enum["api", "screenshot_ocr", "manual"],
  raw_screenshot_url: String, // S3 URL if OCR source
  verified: Boolean,
  created_at: Date
}
// Indexes: { user_id: 1, date: -1 }, { user_id: 1, platform: 1 }
// Time-series optimized: timeseries: { timeField: "date", metaField: "user_id" }
```

### 6.3 Collection: `payouts`
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,       // ref: users, indexed
  amount: Number,          // Amount paid out in INR paise
  fee: Number,             // GigPay fee charged
  net_amount: Number,      // amount - fee
  type: Enum["instant", "same_day", "scheduled"],
  status: Enum["pending", "processing", "completed", "failed", "reversed"],
  upi_id: String,
  razorpay_payout_id: String,
  razorpay_fund_account_id: String,
  earnings_ids: [ObjectId], // Which earnings records this covers
  initiated_at: Date,
  completed_at: Date,
  failure_reason: String,
  settlement_expected_at: Date, // When platform will pay us back
  settled_at: Date,
  created_at: Date
}
```

### 6.4 Collection: `loans`
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  amount: Number,          // Principal in INR paise
  interest_rate: Number,   // Monthly % (e.g., 2.0)
  total_repayable: Number,
  amount_repaid: Number,
  status: Enum["pending_approval", "active", "repaid", "defaulted", "rejected"],
  disbursed_at: Date,
  due_date: Date,
  repayment_method: Enum["auto_deduct", "manual"],
  auto_deduct_percent: Number, // % of each payout auto-deducted
  nbfc_reference_id: String,
  credit_score_at_application: Number,
  rejection_reason: String,
  repayment_history: [{
    amount: Number,
    date: Date,
    payout_id: ObjectId
  }],
  created_at: Date
}
```

### 6.5 Collection: `insurance_policies`
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  type: Enum["daily_accident", "weekly_health", "device", "vehicle_breakdown"],
  status: Enum["active", "expired", "claimed"],
  premium_paid: Number,
  cover_amount: Number,
  valid_from: Date,
  valid_to: Date,
  partner: String,         // "acko" | "insurancedekho"
  partner_policy_id: String,
  claim: {
    submitted_at: Date,
    status: Enum["pending", "approved", "rejected", "paid"],
    amount_claimed: Number,
    amount_approved: Number,
    documents: [String],   // S3 URLs
    notes: String
  },
  created_at: Date
}
```

### 6.6 Collection: `expenses`
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  category: Enum["fuel", "toll", "maintenance", "food", "mobile_recharge", "parking", "other"],
  amount: Number,
  merchant: String,
  date: Date,
  source: Enum["sms_auto", "manual", "receipt_ocr"],
  sms_raw: String,         // Original SMS if source = sms_auto (stored encrypted)
  receipt_url: String,     // S3 URL if manual upload
  is_tax_deductible: Boolean,
  tax_category: String,    // Section 37 etc.
  notes: String,
  created_at: Date
}
// Index: { user_id: 1, date: -1 }, { user_id: 1, category: 1 }
```

### 6.7 Collection: `tax_records`
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  financial_year: String,  // "2024-25"
  gross_income: Number,
  total_expenses: Number,
  taxable_income: Number,
  tax_regime: Enum["old", "new"],
  taxation_scheme: Enum["presumptive_44ad", "presumptive_44ada", "regular"],
  deductions: {
    section_80c: Number,
    standard_deduction: Number,
    fuel_expense: Number,
    vehicle_depreciation: Number,
    mobile_expense: Number,
    other_business: Number,
    total: Number
  },
  tax_payable: Number,
  tax_paid: Number,        // Advance tax + TDS
  refund_due: Number,
  itr_form: String,        // "ITR-3" | "ITR-4"
  cleartax_return_id: String,
  filing_status: Enum["draft", "submitted", "filed", "verified"],
  filed_at: Date,
  created_at: Date,
  updated_at: Date
}
```

### 6.8 Collection: `community_jobs`
```javascript
{
  _id: ObjectId,
  posted_by: ObjectId,     // ref: users
  type: Enum["local_delivery", "ride", "home_service", "freelance"],
  title: String,
  description: String,
  pickup_location: {
    address: String,
    lat: Number,
    lng: Number
  },
  dropoff_location: {
    address: String,
    lat: Number,
    lng: Number
  },
  offered_price: Number,
  status: Enum["open", "assigned", "in_progress", "completed", "cancelled", "disputed"],
  assigned_to: ObjectId,   // ref: users
  accepted_at: Date,
  completed_at: Date,
  payment_status: Enum["pending", "escrowed", "released", "refunded"],
  escrow_amount: Number,
  platform_fee: Number,    // 5% of offered_price
  ratings: {
    by_customer: { score: Number, comment: String },
    by_worker: { score: Number, comment: String }
  },
  city: String,            // indexed for geo queries
  geo_location: {          // GeoJSON for $near queries
    type: "Point",
    coordinates: [Number, Number]  // [lng, lat]
  },
  expires_at: Date,
  created_at: Date
}
// Index: { geo_location: "2dsphere" }, { status: 1, city: 1 }, { posted_by: 1 }
```

### 6.9 Collection: `savings`
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  type: Enum["round_up", "goal_based", "manual"],
  goal_name: String,
  goal_amount: Number,
  current_amount: Number,
  interest_earned: Number,
  partner: String,         // "groww" | "zerodha"
  partner_folio_id: String,
  status: Enum["active", "paused", "completed", "withdrawn"],
  auto_save_percent: Number, // % of each payout auto-saved
  transactions: [{
    type: Enum["deposit", "withdrawal", "interest"],
    amount: Number,
    date: Date,
    source: String
  }],
  created_at: Date
}
```

### 6.10 Collection: `notifications`
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  type: Enum["payout", "loan", "insurance", "hot_zone", "tax", "algo_insight", "community", "system"],
  title: String,
  body: String,
  data: Object,            // Arbitrary payload (deeplink etc.)
  channels: [Enum["push", "whatsapp", "in_app"]],
  sent_at: Date,
  read_at: Date,
  created_at: Date
}
```

### 6.11 Collection: `algo_insights`
```javascript
{
  _id: ObjectId,
  platform: Enum["zomato", "swiggy", "ola", "uber"],
  city: String,
  insight_type: Enum["acceptance_rate", "surge_pattern", "batch_logic", "rating_recovery", "idle_time"],
  title: String,
  body: String,
  supporting_data: Object,  // Stats backing the insight
  upvotes: Number,
  reported_by_count: Number, // Users who reported experiencing this
  confidence_score: Number,  // 0-1
  is_verified: Boolean,
  valid_from: Date,
  valid_until: Date,
  created_at: Date
}
```

### 6.12 Collection: `otp_sessions`
```javascript
{
  _id: ObjectId,
  phone: String,
  otp_hash: String,        // bcrypt hash of OTP
  purpose: Enum["login", "aadhaar_verify", "withdrawal_verify"],
  attempts: Number,
  expires_at: Date,        // TTL index: expires_at
  created_at: Date
}
// TTL index: { expires_at: 1 }, expireAfterSeconds: 0
```

---

## 7. COMPLETE FILE TREE

```
gigpay/
├── README.md
├── docker-compose.yml
├── docker-compose.prod.yml
├── .gitignore
├── .env.example
│
├── backend/                          # Node.js Express API
│   ├── package.json
│   ├── package-lock.json
│   ├── Dockerfile
│   ├── .env
│   ├── server.js                     # Entry point
│   ├── app.js                        # Express app setup
│   ├── config/
│   │   ├── database.js               # MongoDB connection
│   │   ├── redis.js                  # Redis connection
│   │   ├── firebase.js               # Firebase Admin SDK init
│   │   ├── razorpay.js               # Razorpay SDK init
│   │   ├── aws.js                    # AWS SDK init (S3, Rekognition)
│   │   └── constants.js              # App-wide constants
│   ├── models/
│   │   ├── User.js
│   │   ├── Earning.js
│   │   ├── Payout.js
│   │   ├── Loan.js
│   │   ├── InsurancePolicy.js
│   │   ├── Expense.js
│   │   ├── TaxRecord.js
│   │   ├── CommunityJob.js
│   │   ├── Saving.js
│   │   ├── Notification.js
│   │   ├── AlgoInsight.js
│   │   └── OtpSession.js
│   ├── routes/
│   │   ├── index.js                  # Route aggregator
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── earnings.routes.js
│   │   ├── payouts.routes.js
│   │   ├── loans.routes.js
│   │   ├── insurance.routes.js
│   │   ├── expenses.routes.js
│   │   ├── tax.routes.js
│   │   ├── community.routes.js
│   │   ├── savings.routes.js
│   │   ├── insights.routes.js
│   │   ├── notifications.routes.js
│   │   └── webhooks.routes.js        # Razorpay, WhatsApp webhooks
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── earnings.controller.js
│   │   ├── payouts.controller.js
│   │   ├── loans.controller.js
│   │   ├── insurance.controller.js
│   │   ├── expenses.controller.js
│   │   ├── tax.controller.js
│   │   ├── community.controller.js
│   │   ├── savings.controller.js
│   │   ├── insights.controller.js
│   │   ├── notifications.controller.js
│   │   └── webhooks.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js        # JWT verification
│   │   ├── biometric.middleware.js   # WebAuthn assertion verify
│   │   ├── kyc.middleware.js         # Require verified KYC
│   │   ├── rateLimiter.middleware.js # Per-route rate limits
│   │   ├── upload.middleware.js      # Multer config
│   │   ├── validate.middleware.js    # express-validator runner
│   │   └── errorHandler.middleware.js
│   ├── services/
│   │   ├── aadhaar.service.js        # UIDAI eKYC API calls
│   │   ├── biometric.service.js      # AWS Rekognition face match
│   │   ├── razorpay.service.js       # Payout disbursement logic
│   │   ├── platform.service.js       # Platform API / OCR scraping
│   │   ├── ml.service.js             # Calls to Python ML service
│   │   ├── notification.service.js   # FCM + WhatsApp notifications
│   │   ├── whatsapp.service.js       # WhatsApp message send
│   │   ├── sms.service.js            # SMS OTP via Twilio
│   │   ├── ocr.service.js            # Tesseract earnings screenshot OCR
│   │   ├── tax.service.js            # Tax calculation logic
│   │   ├── cleartax.service.js       # ClearTax API integration
│   │   ├── insurance.service.js      # Acko / InsuranceDekho API
│   │   ├── loan.service.js           # Credit scoring + NBFC API
│   │   ├── savings.service.js        # Groww/Zerodha API
│   │   ├── storage.service.js        # AWS S3 upload/download
│   │   ├── fraud.service.js          # Fraud detection logic
│   │   └── community.service.js      # Community marketplace logic
│   ├── jobs/
│   │   ├── queues.js                 # Bull queue definitions
│   │   ├── workers/
│   │   │   ├── payout.worker.js      # Process payout jobs
│   │   │   ├── settlement.worker.js  # Platform settlement reconciliation
│   │   │   ├── notification.worker.js # Send push/WA notifications
│   │   │   ├── sms.worker.js         # Process incoming SMS (expense detection)
│   │   │   ├── zone.worker.js        # Hot zone computation trigger
│   │   │   └── loan.worker.js        # Loan auto-repayment from payouts
│   │   └── schedulers/
│   │       ├── settlement.scheduler.js   # Daily settlement check
│   │       ├── zone.scheduler.js         # Every 5 min zone refresh
│   │       ├── loan.scheduler.js         # Daily loan health check
│   │       └── notification.scheduler.js # Daily digest, tax reminders
│   └── utils/
│       ├── crypto.utils.js           # Encrypt/decrypt sensitive fields
│       ├── logger.utils.js           # Winston logger instance
│       ├── geoUtils.js               # Haversine distance, zone match
│       ├── formatters.utils.js       # Currency, date formatters
│       ├── validators.utils.js       # Custom validation functions
│       └── gigScore.utils.js         # GigScore calculation algorithm
│
├── ml-service/                       # Python FastAPI ML service
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env
│   ├── main.py                       # FastAPI app entry point
│   ├── routers/
│   │   ├── predict.py                # Earnings prediction endpoints
│   │   ├── zones.py                  # Hot zone endpoints
│   │   ├── sms_classify.py           # SMS NLP classification
│   │   └── insights.py               # Algo insights analysis
│   ├── models/
│   │   ├── earnings_lstm.py          # LSTM model class
│   │   ├── zone_clustering.py        # DBSCAN clustering model
│   │   ├── sms_classifier.py         # mBERT SMS classifier
│   │   └── insight_analyzer.py       # Pattern detection model
│   ├── schemas/
│   │   ├── predict_schema.py         # Pydantic schemas for prediction
│   │   ├── zone_schema.py            # Schemas for zone data
│   │   └── sms_schema.py             # SMS classification schemas
│   ├── data/
│   │   ├── training/                 # Training datasets (gitignored)
│   │   └── saved_models/             # Serialized .keras / .joblib files
│   ├── utils/
│   │   ├── db.py                     # PyMongo connection
│   │   ├── redis_cache.py            # Redis caching helpers
│   │   ├── weather.py                # OpenWeatherMap API client
│   │   └── events.py                 # Public events API client
│   └── train/
│       ├── train_lstm.py             # Script to train/retrain LSTM
│       ├── train_sms_classifier.py   # SMS NLP training script
│       └── evaluate.py               # Model evaluation metrics
│
├── whatsapp-bot/                     # WhatsApp bot microservice
│   ├── package.json
│   ├── Dockerfile
│   ├── .env
│   ├── server.js                     # Webhook receiver entry
│   ├── handlers/
│   │   ├── message.handler.js        # Route incoming messages to intents
│   │   ├── balance.handler.js        # Handle balance queries
│   │   ├── cashout.handler.js        # Handle cashout requests
│   │   ├── forecast.handler.js       # Handle earnings forecast requests
│   │   ├── zone.handler.js           # Handle hot zone requests
│   │   ├── loan.handler.js           # Handle loan requests
│   │   ├── insurance.handler.js      # Handle insurance activation
│   │   ├── tax.handler.js            # Handle tax summary requests
│   │   ├── expense.handler.js        # Handle expense summary requests
│   │   └── community.handler.js      # Handle community job requests
│   ├── nlp/
│   │   ├── intent_classifier.js      # Classify message intent
│   │   ├── entity_extractor.js       # Extract amounts, dates from messages
│   │   └── intents.json              # Intent definitions + training phrases
│   ├── services/
│   │   ├── gigpay_api.service.js     # Calls to main backend
│   │   ├── session.service.js        # Redis conversation session
│   │   └── response_builder.js       # Build WhatsApp response templates
│   └── utils/
│       ├── language_detect.js        # Detect EN/HI/mixed
│       └── templates.js              # Message template strings (EN + HI)
│
├── frontend/                         # React PWA
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── public/
│   │   ├── manifest.json             # PWA manifest
│   │   ├── favicon.ico
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── offline.html              # Offline fallback page
│   └── src/
│       ├── main.jsx                  # React entry point
│       ├── App.jsx                   # Router setup + global providers
│       ├── sw.js                     # Service Worker (Workbox strategies)
│       ├── pages/
│       │   ├── Onboarding/
│       │   │   ├── Landing.jsx       # App intro / splash
│       │   │   ├── PhoneEntry.jsx    # Phone number + OTP
│       │   │   ├── AadhaarKYC.jsx    # Aadhaar eKYC flow
│       │   │   ├── SelfieCapture.jsx # Liveness check
│       │   │   ├── PlatformLink.jsx  # Connect Zomato/Ola etc.
│       │   │   └── BankSetup.jsx     # UPI/bank account
│       │   ├── Home.jsx              # Dashboard / home screen
│       │   ├── Zones.jsx             # Hot zone heatmap full screen
│       │   ├── Wallet/
│       │   │   ├── Wallet.jsx        # Wallet overview
│       │   │   ├── Cashout.jsx       # Cashout flow
│       │   │   ├── Transactions.jsx  # Transaction history
│       │   │   ├── Savings.jsx       # Savings vault
│       │   │   ├── Insurance.jsx     # Insurance management
│       │   │   └── Loans.jsx         # Loan management
│       │   ├── Insights/
│       │   │   ├── Insights.jsx      # Insights hub
│       │   │   ├── AlgoInsights.jsx  # Platform algorithm tips
│       │   │   ├── Expenses.jsx      # Expense tracker
│       │   │   └── Tax.jsx           # Tax filing assistant
│       │   ├── Community/
│       │   │   ├── Community.jsx     # Community marketplace hub
│       │   │   ├── PostJob.jsx       # Post a job
│       │   │   ├── JobDetail.jsx     # Single job view
│       │   │   ├── MyJobs.jsx        # Jobs I posted / accepted
│       │   │   └── WorkerProfile.jsx # Worker public profile
│       │   ├── Profile/
│       │   │   ├── Profile.jsx       # Profile settings
│       │   │   ├── LinkedAccounts.jsx # Platform + bank accounts
│       │   │   └── Support.jsx       # Help & support
│       │   └── NotFound.jsx
│       ├── components/
│       │   ├── layout/
│       │   │   ├── BottomNav.jsx     # 5-tab bottom navigation
│       │   │   ├── TopBar.jsx        # Page header with back/actions
│       │   │   └── PageWrapper.jsx   # Standard page layout wrapper
│       │   ├── home/
│       │   │   ├── EarningsCard.jsx  # Today's earnings summary card
│       │   │   ├── BalanceCard.jsx   # Wallet balance card
│       │   │   ├── ForecastBanner.jsx # Tomorrow's earnings prediction
│       │   │   ├── HotZonePreview.jsx # Mini zone map widget
│       │   │   ├── QuickActions.jsx  # Cash out, loan, insurance CTAs
│       │   │   └── RecentTransactions.jsx
│       │   ├── map/
│       │   │   ├── HeatMap.jsx       # Google Maps heatmap component
│       │   │   ├── ZoneCard.jsx      # Individual zone info card
│       │   │   └── LocationPin.jsx   # Custom map marker
│       │   ├── earnings/
│       │   │   ├── EarningsChart.jsx # Recharts weekly/monthly chart
│       │   │   ├── PlatformBreakdown.jsx # By platform pie chart
│       │   │   └── EarningEntry.jsx  # Manual earnings entry form
│       │   ├── cashout/
│       │   │   ├── AmountSlider.jsx  # Cashout amount selector
│       │   │   ├── FeePreview.jsx    # Fee breakdown display
│       │   │   ├── BiometricPrompt.jsx # WebAuthn trigger + fallback
│       │   │   └── PayoutStatus.jsx  # Live payout status tracker
│       │   ├── tax/
│       │   │   ├── TaxSummary.jsx    # Annual tax summary card
│       │   │   ├── DeductionList.jsx # Itemized deductions
│       │   │   └── TaxCalculator.jsx # Interactive tax calculator
│       │   ├── expenses/
│       │   │   ├── ExpenseCard.jsx   # Single expense item
│       │   │   ├── ExpenseChart.jsx  # Category breakdown chart
│       │   │   └── SMSPermission.jsx # SMS read permission request
│       │   ├── community/
│       │   │   ├── JobCard.jsx       # Community job listing card
│       │   │   ├── JobMap.jsx        # Jobs on map
│       │   │   └── RatingStars.jsx   # Rating component
│       │   ├── insurance/
│       │   │   ├── InsuranceCard.jsx # Insurance plan card
│       │   │   └── ClaimForm.jsx     # Insurance claim submission
│       │   ├── loans/
│       │   │   ├── LoanEligibility.jsx # GigScore display
│       │   │   └── LoanCard.jsx      # Active loan status
│       │   ├── savings/
│       │   │   ├── SavingsGoal.jsx   # Goal progress card
│       │   │   └── RoundUpToggle.jsx # Round-up savings toggle
│       │   └── shared/
│       │       ├── OtpInput.jsx      # 6-digit OTP input
│       │       ├── LoadingSpinner.jsx
│       │       ├── ErrorBoundary.jsx
│       │       ├── OfflineBanner.jsx
│       │       ├── CurrencyDisplay.jsx # Format INR amounts
│       │       ├── ConfirmModal.jsx
│       │       ├── EmptyState.jsx
│       │       └── Avatar.jsx
│       ├── hooks/
│       │   ├── useAuth.js            # Auth state + login/logout
│       │   ├── useEarnings.js        # Earnings data queries
│       │   ├── usePayouts.js         # Payout operations
│       │   ├── useWallet.js          # Wallet balance
│       │   ├── useZones.js           # Hot zone data + socket updates
│       │   ├── useForecast.js        # ML earnings forecast
│       │   ├── useExpenses.js        # Expense data
│       │   ├── useTax.js             # Tax calculations
│       │   ├── useLoan.js            # Loan data
│       │   ├── useInsurance.js       # Insurance policies
│       │   ├── useSavings.js         # Savings data
│       │   ├── useCommunity.js       # Community job data
│       │   ├── useSocket.js          # Socket.io connection
│       │   ├── useNotifications.js   # FCM push + in-app notifications
│       │   ├── useBiometric.js       # WebAuthn API wrapper
│       │   ├── useSmsReader.js       # Android SMS read (PWA)
│       │   ├── useGeolocation.js     # GPS location hook
│       │   ├── useOffline.js         # Online/offline status
│       │   └── useInstallPrompt.js   # PWA install prompt handler
│       ├── store/
│       │   ├── auth.store.js         # Zustand auth slice
│       │   ├── ui.store.js           # UI state (loading, modals)
│       │   └── realtime.store.js     # Socket event state
│       ├── services/
│       │   ├── api.service.js        # Axios instance + interceptors
│       │   ├── auth.api.js           # Auth API calls
│       │   ├── earnings.api.js
│       │   ├── payouts.api.js
│       │   ├── loans.api.js
│       │   ├── insurance.api.js
│       │   ├── expenses.api.js
│       │   ├── tax.api.js
│       │   ├── community.api.js
│       │   ├── savings.api.js
│       │   ├── insights.api.js
│       │   ├── notifications.api.js
│       │   └── ml.api.js             # Calls to ML prediction endpoints
│       ├── utils/
│       │   ├── formatCurrency.js
│       │   ├── formatDate.js
│       │   ├── smsParser.js          # Client-side SMS pattern matching
│       │   └── webauthn.js           # WebAuthn helpers
│       ├── constants/
│       │   ├── routes.js             # Route path constants
│       │   ├── platforms.js          # Platform metadata
│       │   └── taxRules.js           # Tax rule constants
│       └── locales/
│           ├── en.json               # English translations
│           └── hi.json               # Hindi translations
│
└── nginx/
    ├── nginx.conf                    # Main Nginx config
    └── ssl/                          # SSL cert placeholder
```

---
## 8. FILE-BY-FILE SPECIFICATION

### 8.1 Root / Config Files

---
#### `docker-compose.yml`
**Purpose:** Orchestrates all services for local development.
**Services defined:**
- `backend` — Node.js API on port 5000, mounts `./backend`, depends on mongo + redis
- `ml-service` — Python FastAPI on port 8000
- `whatsapp-bot` — Node.js bot service on port 5001
- `frontend` — Vite dev server on port 3000
- `mongo` — MongoDB 7.0 on port 27017, volume `mongo_data`
- `redis` — Redis 7 Alpine on port 6379

**Key environment variable passthrough:** All services get `.env` via `env_file`.

---
#### `.env.example`
**Purpose:** Template showing all required environment variables (no real values). Developers copy this to `.env`.
**Contains:** All variables from Section 10 of this document.

---
#### `.gitignore`
**Purpose:** Excludes `node_modules/`, `.env`, `dist/`, `*.log`, `data/training/`, `data/saved_models/`, `uploads/`.

---

### 8.2 Backend — Server & Config

---
#### `backend/server.js`
**Purpose:** Entry point. Creates HTTP server from Express app, attaches Socket.io, starts Bull workers, starts cron schedulers, listens on PORT.
**What it does:**
1. Imports `app.js`
2. Creates `http.Server` from app
3. Attaches Socket.io to the HTTP server
4. Imports and starts all Bull queue workers
5. Imports and starts all cron schedulers
6. Calls `connectDatabase()` and `connectRedis()`
7. Starts listening: `server.listen(PORT)`
8. Handles `unhandledRejection` and `uncaughtException` with graceful shutdown

---
#### `backend/app.js`
**Purpose:** Express app configuration. All middleware and routes registered here.
**What it does:**
1. Creates Express app
2. Applies security middleware: `helmet()`, `cors({ origin: FRONTEND_URL, credentials: true })`
3. Applies `compression()`, `morgan('combined')`
4. Applies `express.json({ limit: '10mb' })`, `express.urlencoded({ extended: true })`
5. Serves static files from `uploads/` folder
6. Mounts all routes from `routes/index.js` under `/api`
7. Adds `404` handler for unknown routes
8. Adds global error handler (imports from `middleware/errorHandler.middleware.js`)
9. Exports the app

---
#### `backend/config/database.js`
**Purpose:** MongoDB connection using Mongoose.
**What it does:**
- `connectDatabase()` async function: calls `mongoose.connect(MONGODB_URI)` with connection options
- Sets up connection event listeners (connected, error, disconnected)
- Exports `connectDatabase`

---
#### `backend/config/redis.js`
**Purpose:** Redis client setup using ioredis.
**What it does:**
- Creates two Redis clients: `redisClient` (general) and `redisPubSub` (pub/sub for socket events)
- `connectRedis()` function that connects both clients
- Exports both clients and `connectRedis`

---
#### `backend/config/firebase.js`
**Purpose:** Firebase Admin SDK initialization for FCM.
**What it does:**
- Initializes `admin.initializeApp()` with service account credentials from `FIREBASE_SERVICE_ACCOUNT` env var
- Exports `admin.messaging()` as `fcmMessaging`

---
#### `backend/config/razorpay.js`
**Purpose:** Razorpay SDK initialization.
**What it does:**
- Creates `new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })`
- Exports the instance as `razorpayClient`

---
#### `backend/config/aws.js`
**Purpose:** AWS SDK clients for S3 and Rekognition.
**What it does:**
- Creates `S3Client` with region and credentials from env
- Creates `RekognitionClient` with region and credentials from env
- Exports both clients

---
#### `backend/config/constants.js`
**Purpose:** App-wide constants that don't change per environment.
**Contains:**
- `PAYOUT_FEE_PERCENT = 0.012` (1.2%)
- `PAYOUT_FEE_FLAT = 500` (₹5 in paise)
- `INSTANT_PAYOUT_FEE_PERCENT = 0.015`
- `MAX_LOAN_AMOUNT = 500000` (₹5,000 in paise)
- `LOAN_INTEREST_RATE_MONTHLY = 0.02` (2%)
- `COMMUNITY_PLATFORM_FEE = 0.05` (5%)
- `GIG_PRO_PRICE = 9900` (₹99 in paise)
- `SETTLEMENT_BUFFER_PERCENT = 0.10` (10% held back)
- `GIGSCORE_MIN_FOR_LOAN = 400`
- `DAILY_CASHOUT_LIMIT = 5000000` (₹50,000 in paise)
- Enum maps for platforms, categories, etc.

---

### 8.3 Backend — Models

All models are Mongoose schemas. Each exports a compiled Mongoose model.

---
#### `backend/models/User.js`
**Purpose:** User account schema.
**Schema:** As defined in Section 6.1.
**Virtuals:** `fullKycVerified` — returns true if `kyc_status === 'verified'`
**Pre-save hooks:** Hash new passwords if present; update `updated_at`.
**Methods:** `generateAuthTokens()` — returns `{ accessToken, refreshToken }` signed with RSA keys.
**Indexes:** `{ phone: 1 }` unique, `{ city: 1 }`, `{ 'platform_accounts.platform': 1 }`

---
#### `backend/models/Earning.js`
**Purpose:** Daily earnings records per user per platform.
**Schema:** As defined in Section 6.2.
**Statics:** `getDailySummary(userId, date)` — aggregates all platforms for a date. `getMonthlyStats(userId, month, year)` — returns total, avg, platform breakdown.
**Indexes:** Compound `{ user_id: 1, date: -1 }`, `{ user_id: 1, platform: 1, date: -1 }`

---
#### `backend/models/Payout.js`
**Purpose:** Payout transaction records.
**Schema:** As defined in Section 6.3.
**Statics:** `getPendingSettlements()` — finds all payouts where `settlement_expected_at < now` and `settled_at` is null.

---
#### `backend/models/Loan.js`
**Purpose:** Emergency loan records.
**Schema:** As defined in Section 6.4.
**Virtuals:** `outstanding_balance` — `total_repayable - amount_repaid`.
**Statics:** `getActiveLoans(userId)`, `getTotalOutstanding(userId)`

---
#### `backend/models/InsurancePolicy.js`
**Purpose:** Insurance policy records.
**Schema:** As defined in Section 6.5.

---
#### `backend/models/Expense.js`
**Purpose:** Expense tracking records.
**Schema:** As defined in Section 6.6.
**Statics:** `getMonthlyByCategory(userId, month, year)` — aggregation returning totals per category. `getTotalDeductible(userId, financialYear)` — sum of all tax-deductible expenses.

---
#### `backend/models/TaxRecord.js`
**Purpose:** Annual tax record per user.
**Schema:** As defined in Section 6.7.

---
#### `backend/models/CommunityJob.js`
**Purpose:** Community marketplace job postings.
**Schema:** As defined in Section 6.8.
**Indexes:** `{ geo_location: "2dsphere" }`, `{ status: 1, city: 1 }`, `{ posted_by: 1 }`

---
#### `backend/models/Saving.js`
**Purpose:** Savings vault records.
**Schema:** As defined in Section 6.9.

---
#### `backend/models/Notification.js`
**Purpose:** Notification history.
**Schema:** As defined in Section 6.10.
**Statics:** `getUnread(userId)` — finds all where `read_at` is null.

---
#### `backend/models/AlgoInsight.js`
**Purpose:** Platform algorithm insights.
**Schema:** As defined in Section 6.11.

---
#### `backend/models/OtpSession.js`
**Purpose:** OTP verification sessions with TTL expiry.
**Schema:** As defined in Section 6.12.
**TTL Index:** `{ expires_at: 1 }` with `expireAfterSeconds: 0`

---

### 8.4 Backend — Routes & Controllers

Each route file maps HTTP routes to controller functions. Each controller handles request parsing, calls service layer, and returns JSON response.

---
#### `backend/routes/auth.routes.js` + `controllers/auth.controller.js`
**Routes:**
- `POST /api/auth/send-otp` — Send OTP to phone number via Twilio SMS. Body: `{ phone }`. Creates `OtpSession` record.
- `POST /api/auth/verify-otp` — Verify OTP, create user if new, return JWT tokens. Body: `{ phone, otp }`. Returns `{ accessToken, refreshToken, user, isNewUser }`.
- `POST /api/auth/refresh` — Refresh access token using refresh token. Body: `{ refreshToken }`.
- `POST /api/auth/logout` — Invalidate refresh token. Requires auth.
- `POST /api/auth/kyc/aadhaar/init` — Initiate Aadhaar eKYC, send UIDAI OTP. Body: `{ aadhaar_number }`. Requires auth.
- `POST /api/auth/kyc/aadhaar/verify` — Verify UIDAI OTP, store KYC data. Body: `{ aadhaar_number, otp }`. Requires auth.
- `POST /api/auth/kyc/selfie` — Upload selfie for liveness check + face enrollment. Multipart form with image file. Requires auth.
- `POST /api/auth/biometric/register` — Register WebAuthn credential. Body: WebAuthn registration response. Requires auth.
- `POST /api/auth/biometric/authenticate` — Verify WebAuthn assertion for withdrawal. Body: WebAuthn auth response. Requires auth.

**Controller logic:**
- `sendOtp`: Rate limit 3 OTPs per phone per 10 min (Redis). Generate 6-digit OTP, hash with bcrypt, store in `OtpSession`. Call `sms.service.js` to send.
- `verifyOtp`: Find `OtpSession`, compare OTP hash, increment attempts (max 5), delete session on success. Upsert user, generate tokens.
- `refreshToken`: Verify refresh token from Redis whitelist, issue new access token.
- `aadhaarInit`: Call `aadhaar.service.js` to request UIDAI OTP for given UID.
- `aadhaarVerify`: Call `aadhaar.service.js` to verify OTP. On success, extract name/DOB/address, store `kyc_status: 'verified'`, store last 4 of Aadhaar.
- `uploadSelfie`: Upload to S3, call `biometric.service.js` to compare selfie against Aadhaar photo retrieved from UIDAI. On match, set `face_embedding` on user.
- `registerBiometric`: Store WebAuthn credential (public key + credential ID) on user document.
- `authenticateBiometric`: Retrieve user's stored credential, verify WebAuthn assertion, return short-lived withdrawal token.

---
#### `backend/routes/earnings.routes.js` + `controllers/earnings.controller.js`
**Routes:**
- `GET /api/earnings/today` — Today's earnings across all platforms. Requires auth.
- `GET /api/earnings/summary` — Query params: `period` (week/month/year), `platform`. Returns aggregated stats.
- `GET /api/earnings/history` — Paginated earnings history. Query: `page`, `limit`, `from`, `to`, `platform`.
- `POST /api/earnings/manual` — Manually add earnings entry. Body: `{ platform, date, gross_amount, hours_worked, trips_count }`.
- `POST /api/earnings/upload-screenshot` — Upload earnings screenshot for OCR. Multipart. Calls `ocr.service.js`.
- `GET /api/earnings/forecast` — Get ML earnings forecast for tomorrow. Calls `ml.service.js`.

---
#### `backend/routes/payouts.routes.js` + `controllers/payouts.controller.js`
**Routes:**
- `GET /api/payouts/balance` — Current wallet balance + today's pending earnings.
- `GET /api/payouts/fee-preview` — Calculate fee for a given amount. Query: `amount`, `type` (instant/same_day).
- `POST /api/payouts/initiate` — Initiate payout. Body: `{ amount, upi_id, type, withdrawal_token }`. Requires auth + biometric middleware.
- `GET /api/payouts/status/:payoutId` — Get status of a specific payout.
- `GET /api/payouts/history` — Paginated payout history.

**Controller logic for `initiatePayout`:**
1. Verify withdrawal_token (short-lived token from biometric auth)
2. Check user's withdrawable balance >= amount
3. Check daily limit not exceeded
4. Check no active fraud flags
5. Check active loan auto-deduct: if loan exists, deduct loan portion first
6. Check active savings auto-save: deduct savings portion
7. Enqueue `PAYOUT_INITIATE` Bull job with payout details
8. Create `Payout` record with status `pending`
9. Return `{ payout_id, estimated_completion_time }`

---
#### `backend/routes/loans.routes.js` + `controllers/loans.controller.js`
**Routes:**
- `GET /api/loans/eligibility` — Check loan eligibility + max amount + GigScore. Requires KYC.
- `POST /api/loans/apply` — Apply for loan. Body: `{ amount, repayment_percent }`. Requires KYC.
- `GET /api/loans/active` — Get active loan(s).
- `GET /api/loans/history` — Loan history.
- `POST /api/loans/:loanId/repay` — Manual repayment. Body: `{ amount }`.

**Eligibility logic (`loan.service.js`):**
1. Check `gig_score >= GIGSCORE_MIN_FOR_LOAN`
2. Check no existing defaulted loans
3. Check no existing active loan > 50% repaid
4. Calculate max loan = min(₹5,000, 5 × avg_daily_earnings_last_30_days)
5. Return `{ eligible: bool, max_amount, gig_score, reason? }`

---
#### `backend/routes/insurance.routes.js` + `controllers/insurance.controller.js`
**Routes:**
- `GET /api/insurance/plans` — Available insurance plans with pricing.
- `GET /api/insurance/active` — User's active policies.
- `POST /api/insurance/activate` — Activate a plan. Body: `{ type, duration }`. Requires KYC.
- `POST /api/insurance/claim` — Submit a claim. Multipart: `{ policy_id, description, documents[] }`.
- `GET /api/insurance/claims` — Claim history.

---
#### `backend/routes/expenses.routes.js` + `controllers/expenses.controller.js`
**Routes:**
- `GET /api/expenses` — Paginated expenses. Query: `category`, `from`, `to`.
- `GET /api/expenses/summary` — Monthly category breakdown.
- `POST /api/expenses` — Add manual expense. Body: `{ category, amount, merchant, date, notes }`.
- `POST /api/expenses/sms-batch` — Submit batch of SMS texts for expense extraction. Body: `{ messages: [{ body, date }] }`. Calls ML service SMS classifier.
- `POST /api/expenses/receipt` — Upload receipt image for OCR. Multipart.
- `DELETE /api/expenses/:id` — Delete expense.

---
#### `backend/routes/tax.routes.js` + `controllers/tax.controller.js`
**Routes:**
- `GET /api/tax/summary/:fy` — Tax summary for financial year (e.g. "2024-25").
- `GET /api/tax/deductions/:fy` — Itemized deductions for FY.
- `POST /api/tax/calculate` — Calculate tax liability. Body: `{ financial_year, additional_deductions? }`.
- `POST /api/tax/file` — Initiate filing via ClearTax. Requires KYC.
- `GET /api/tax/filing-status/:fy` — Check filing status.

**`tax.service.js` logic:**
1. Aggregate earnings for FY from `Earning` collection
2. Aggregate deductible expenses from `Expense` collection
3. Apply Section 44AD/44ADA presumptive scheme rules
4. Apply standard deduction, 80C, 87A rebate
5. Compare old vs new regime, suggest lower
6. Return structured breakdown

---
#### `backend/routes/community.routes.js` + `controllers/community.controller.js`
**Routes:**
- `GET /api/community/jobs` — Nearby open jobs. Query: `lat`, `lng`, `radius` (km), `type`.
- `POST /api/community/jobs` — Post a new job. Body: `{ type, title, description, pickup_location, dropoff_location?, offered_price }`. Requires KYC.
- `GET /api/community/jobs/:id` — Get job details.
- `POST /api/community/jobs/:id/accept` — Accept a job. Requires KYC.
- `POST /api/community/jobs/:id/complete` — Mark job complete (worker action).
- `POST /api/community/jobs/:id/confirm` — Confirm completion + release payment (customer action).
- `POST /api/community/jobs/:id/rate` — Submit rating. Body: `{ score, comment }`.
- `GET /api/community/my-jobs` — Jobs posted or accepted by current user.

**Location query:** Uses MongoDB `$near` with `2dsphere` index on `geo_location` field.

**Payment escrow flow:**
1. Customer posts job with `offered_price`
2. On job creation: charge customer's GigPay wallet, create `Payout` record in escrow
3. On worker acceptance: job status → `assigned`
4. On customer confirmation: release escrow to worker minus 5% platform fee
5. On dispute: flag for manual review

---
#### `backend/routes/savings.routes.js` + `controllers/savings.controller.js`
**Routes:**
- `GET /api/savings` — All savings goals.
- `POST /api/savings/create` — Create savings goal. Body: `{ type, goal_name?, goal_amount, auto_save_percent? }`.
- `POST /api/savings/:id/deposit` — Manual deposit.
- `POST /api/savings/:id/withdraw` — Withdraw from savings.
- `PATCH /api/savings/:id/toggle` — Pause/resume auto-save.

---
#### `backend/routes/insights.routes.js` + `controllers/insights.controller.js`
**Routes:**
- `GET /api/insights/algo` — Get algo insights. Query: `platform`, `city`, `type`.
- `POST /api/insights/algo/:id/upvote` — Upvote an insight.
- `POST /api/insights/algo/report` — Report a new pattern. Body: `{ platform, insight_type, description }`.
- `GET /api/insights/performance` — Worker's own performance analytics vs city average.

---
#### `backend/routes/notifications.routes.js` + `controllers/notifications.controller.js`
**Routes:**
- `GET /api/notifications` — Paginated notification history.
- `GET /api/notifications/unread-count` — Count of unread notifications.
- `POST /api/notifications/mark-read` — Mark notifications as read. Body: `{ ids?: [], all?: bool }`.
- `POST /api/notifications/fcm-token` — Register/update FCM token. Body: `{ token }`.

---
#### `backend/routes/webhooks.routes.js` + `controllers/webhooks.controller.js`
**Routes (no auth middleware — verified by signature):**
- `POST /api/webhooks/razorpay` — Razorpay payout webhook. Verifies `X-Razorpay-Signature`. Updates payout status, triggers settlement logic.
- `POST /api/webhooks/whatsapp` — WhatsApp message webhook (if using Meta Business API directly on main backend).

---

### 8.5 Backend — Middleware

---
#### `backend/middleware/auth.middleware.js`
**Purpose:** Verify JWT access token on protected routes.
**Logic:**
1. Extract Bearer token from `Authorization` header
2. Verify with `jsonwebtoken.verify()` using RSA public key
3. Load user from MongoDB by `user_id` in token payload
4. Check user `is_active === true`
5. Attach `req.user = user` and call `next()`
6. On failure: return `401 Unauthorized`

---
#### `backend/middleware/biometric.middleware.js`
**Purpose:** Verify that a valid withdrawal_token is present for payout routes.
**Logic:**
1. Extract `withdrawal_token` from request body
2. Verify token in Redis with key `withdrawal_token:{userId}:{token}`
3. Token TTL = 5 minutes, single-use (delete after verification)
4. On failure: return `403 Biometric verification required`

---
#### `backend/middleware/kyc.middleware.js`
**Purpose:** Require KYC verified status for sensitive operations (loans, insurance, community jobs).
**Logic:** Check `req.user.kyc_status === 'verified'`. On failure: `403 KYC_REQUIRED`.

---
#### `backend/middleware/rateLimiter.middleware.js`
**Purpose:** Per-route rate limiting using Redis.
**Exported limiters:**
- `otpLimiter` — 3 OTP requests per phone per 10 minutes
- `payoutLimiter` — 10 payout requests per user per hour
- `generalLimiter` — 100 requests per IP per 15 minutes
- `authLimiter` — 20 auth attempts per IP per 15 minutes

---
#### `backend/middleware/upload.middleware.js`
**Purpose:** Multer configuration for file uploads.
**Config:** Memory storage (files go to buffer, then S3). File size limit 5MB. Allowed types: jpeg, png, pdf.

---
#### `backend/middleware/validate.middleware.js`
**Purpose:** Runs `express-validator` validation results and returns 400 with error details if validation fails.

---
#### `backend/middleware/errorHandler.middleware.js`
**Purpose:** Global error handler. Catches all errors thrown in controllers.
**Logic:**
1. Log error with Winston
2. If error is `ValidationError` (Mongoose) → 400
3. If error has `statusCode` → use it
4. Default → 500
5. Return `{ success: false, error: { code, message, details? } }`
6. Never expose stack traces in production

---

### 8.6 Backend — Services

---
#### `backend/services/aadhaar.service.js`
**Purpose:** UIDAI eKYC API integration.
**Functions:**
- `requestOtp(aadhaarNumber)` — POST to UIDAI `/otp` endpoint. Returns `{ txnId }`.
- `verifyOtp(aadhaarNumber, otp, txnId)` — POST to UIDAI `/kyc` endpoint. Returns `{ name, dob, address, photo_base64, verified: bool }`.
- Uses UIDAI Sandbox for development; production requires AUA/KUA license.

---
#### `backend/services/biometric.service.js`
**Purpose:** AWS Rekognition face operations.
**Functions:**
- `enrollFace(userId, imageBuffer)` — Calls Rekognition `IndexFaces` with collection `gigpay-faces`, stores `FaceId` on user.
- `verifyFace(userId, imageBuffer)` — Calls Rekognition `SearchFacesByImage` against user's enrolled face. Returns `{ match: bool, confidence }`.
- `livenessCheck(imageBuffer)` — Calls Rekognition `DetectFaces` + custom checks for eye open, single face detected.
- Collection created per environment: `gigpay-faces-dev`, `gigpay-faces-prod`.

---
#### `backend/services/razorpay.service.js`
**Purpose:** Handle all Razorpay payout operations.
**Functions:**
- `createFundAccount(userId, bankDetails)` — Create Razorpay fund account (bank or UPI). Returns `fund_account_id`.
- `initiatePayout(payoutData)` — Call Razorpay `POST /payouts` API. Returns `razorpay_payout_id`.
- `getPayoutStatus(razorpayPayoutId)` — Get live status from Razorpay.
- `verifyWebhookSignature(body, signature)` — HMAC SHA256 verification.
- All monetary amounts in paise (INR × 100).

---
#### `backend/services/platform.service.js`
**Purpose:** Retrieve earnings from gig platforms.
**Functions:**
- `getZomatoEarnings(accessToken, date)` — Calls Zomato Partner API. Returns earnings data.
- `getSwiggyEarnings(accessToken, date)` — Same for Swiggy.
- `getOlaEarnings(accessToken, date)` — Ola Driver API.
- `getUberEarnings(accessToken, date)` — Uber Driver API.
- `syncAllPlatforms(userId)` — Iterates user's linked accounts, calls respective platform functions, upserts `Earning` records.
- Fallback: if API unavailable, flag `needs_screenshot: true` in response.

---
#### `backend/services/ml.service.js`
**Purpose:** HTTP client to call Python ML microservice.
**Functions:**
- `getEarningsForecast(userId, targetDate)` — POST to `ML_SERVICE_URL/predict/earnings`. Returns `{ min, max, expected, confidence, factors }`.
- `getHotZones(city, timestamp)` — GET `ML_SERVICE_URL/zones/{city}`. Returns GeoJSON FeatureCollection.
- `classifySmsMessages(messages)` — POST `ML_SERVICE_URL/sms/classify`. Returns array of classified expenses.
- `getAlgoInsights(platform, city)` — GET `ML_SERVICE_URL/insights/{platform}/{city}`.
- Uses Axios with 10s timeout. Falls back to cached Redis data on failure.

---
#### `backend/services/notification.service.js`
**Purpose:** Orchestrate sending notifications across channels.
**Functions:**
- `sendPush(userId, { title, body, data })` — Retrieves `fcm_token` from user, calls `fcmMessaging.send()`.
- `sendWhatsApp(userId, message)` — Calls `whatsapp.service.js`.
- `sendNotification(userId, notification, channels)` — Sends across specified channels, creates `Notification` DB record.
- `sendPayoutConfirmation(userId, payoutData)` — Pre-built payout success message.
- `sendHotZoneAlert(userId, zones)` — Pre-built hot zone alert.

---
#### `backend/services/ocr.service.js`
**Purpose:** Extract earnings from uploaded platform screenshots using Tesseract.js.
**Functions:**
- `extractEarnings(imageBuffer, platform)` — Runs Tesseract OCR, applies platform-specific regex patterns to extract total earnings, trip count, date. Returns structured earnings data or `null` if unreadable.
- Platform patterns maintained for Zomato, Swiggy, Ola, Uber earnings screens.

---
#### `backend/services/tax.service.js`
**Purpose:** All tax calculation logic.
**Functions:**
- `calculateTaxLiability(userId, financialYear)` — Full tax calculation. Returns complete `TaxRecord` data.
- `getDeductionSuggestions(userId, fy)` — Returns list of potentially missed deductions.
- `compareRegimes(income, deductions)` — Returns `{ old_regime_tax, new_regime_tax, recommended }`.
- `getAdvanceTaxDueDates(fy)` — Returns array of due dates with estimated amounts.
- `isPresumedTaxationBetter(grossIncome, actualExpenses)` — Returns boolean.

---
#### `backend/services/fraud.service.js`
**Purpose:** Detect fraudulent payout requests.
**Functions:**
- `checkPayoutFraud(userId, amount, location)` — Runs rules:
  1. Amount > 3× daily average (flag)
  2. Device location > 50km from usual work zone (flag)
  3. 3+ payouts in 1 hour (block)
  4. New device first withdrawal > ₹1,000 (require extra verification)
  5. Returns `{ flagged: bool, blocked: bool, reason? }`

---
#### `backend/utils/gigScore.utils.js`
**Purpose:** Calculate GigScore (internal credit score 0–850).
**Algorithm:**
- Earnings consistency (30%): coefficient of variation of last 30 days earnings
- Platform tenure (20%): months since first earning record
- Repayment history (25%): on-time loan repayments / total repayments
- Platform ratings (15%): average customer rating across platforms
- App engagement (10%): login frequency, feature usage
- Score normalized to 0–850 range
- Recalculated nightly via scheduler

---

### 8.7 Backend — Utils

---
#### `backend/utils/crypto.utils.js`
**Purpose:** Encrypt/decrypt sensitive fields (PAN, bank account numbers, Aadhaar raw data).
**Functions:**
- `encrypt(text)` — AES-256-GCM using `ENCRYPTION_KEY` env var. Returns `{ iv, tag, ciphertext }` as base64 string.
- `decrypt(encryptedString)` — Reverses the above.

---
#### `backend/utils/logger.utils.js`
**Purpose:** Winston logger configured for structured JSON logging.
**Config:** Console transport in dev, file transport (`error.log`, `combined.log`) in prod. Log level from `LOG_LEVEL` env var.

---
#### `backend/utils/geoUtils.js`
**Purpose:** Geospatial utilities.
**Functions:**
- `haversineDistance(lat1, lng1, lat2, lng2)` — Distance in km between two coordinates.
- `isWithinZone(lat, lng, zonePolygon)` — Point-in-polygon check.
- `getCity(lat, lng)` — Reverse geocode to city name using Google Maps Geocoding API.

---

### 8.8 Backend — Jobs / Queue Workers

---
#### `backend/jobs/queues.js`
**Purpose:** Define all Bull queues.
**Queues defined:**
- `payoutQueue` — Payout disbursement jobs
- `settlementQueue` — Platform settlement reconciliation
- `notificationQueue` — Push + WhatsApp notification dispatch
- `smsProcessingQueue` — SMS expense extraction batch jobs
- `zoneComputeQueue` — Hot zone ML trigger jobs
- `loanRepaymentQueue` — Auto-deduct loan repayments
All queues use Redis connection from `config/redis.js`.

---
#### `backend/jobs/workers/payout.worker.js`
**Purpose:** Process `PAYOUT_INITIATE` jobs from `payoutQueue`.
**Logic:**
1. Get job data: `{ payoutId, userId, amount, upiId, razorpayFundAccountId }`
2. Create or retrieve Razorpay fund account
3. Call `razorpay.service.js` `initiatePayout()`
4. Update `Payout` record with `razorpay_payout_id`, status → `processing`
5. Emit Socket.io event `payout:processing` to user's socket room
6. On Razorpay webhook (completed): update status → `completed`, update wallet balance
7. On failure: update status → `failed`, emit `payout:failed`, trigger retry (max 3)

---
#### `backend/jobs/workers/settlement.worker.js`
**Purpose:** Reconcile GigPay advances with platform settlements.
**Logic:**
1. Query all `Payout` records where `settlement_expected_at < now` and `settled_at = null`
2. For each: check if platform has transferred funds (via platform API or manual flag)
3. On settlement confirmed: mark `settled_at = now`, update revolving credit balance
4. Log any discrepancies for manual review

---
#### `backend/jobs/workers/loan.worker.js`
**Purpose:** Auto-deduct loan repayment from payouts.
**Logic:**
1. Triggered after each successful payout
2. Check if user has active loan
3. Calculate deduction: `payout_amount × auto_deduct_percent`
4. Deduct from payout net amount
5. Update `Loan.amount_repaid`, add to `repayment_history`
6. If fully repaid: update status → `repaid`, send congratulations notification

---
#### `backend/jobs/schedulers/zone.scheduler.js`
**Purpose:** Trigger hot zone recomputation every 5 minutes.
**Logic:** `node-cron` schedule `*/5 * * * *`. For each active city, enqueue `zoneComputeQueue` job. Zone results cached in Redis with 6-minute TTL.

---

### 8.9 ML Service (Python FastAPI)

---
#### `ml-service/main.py`
**Purpose:** FastAPI application entry point.
**What it does:**
- Creates FastAPI app with title "GigPay ML Service"
- Includes routers: predict, zones, sms_classify, insights
- Startup event: loads all saved models into memory
- Health check endpoint: `GET /health`
- CORS middleware to only allow requests from backend service IP

---
#### `ml-service/routers/predict.py`
**Purpose:** Earnings prediction endpoints.
**Endpoints:**
- `POST /predict/earnings` — Body: `{ user_id, target_date, recent_earnings[], city, platform }`. Returns `{ expected_min, expected_max, expected_mean, confidence, factors: { weather, day_of_week, events, historical_avg } }`.
- `POST /predict/earnings/batch` — Batch predictions for multiple users (used by schedulers).

**Logic:**
1. Load user's last 90 days earnings from MongoDB
2. Fetch tomorrow's weather from OpenWeatherMap
3. Fetch local events from events API
4. Preprocess features into LSTM input tensor
5. Run `earnings_lstm.predict()`
6. Return prediction with confidence interval

---
#### `ml-service/routers/zones.py`
**Purpose:** Hot zone computation endpoints.
**Endpoints:**
- `POST /zones/compute` — Body: `{ city, worker_locations: [{lat, lng, timestamp}], restaurant_density_grid }`. Returns GeoJSON FeatureCollection with zone polygons and demand scores.
- `GET /zones/{city}` — Returns cached zones for city from Redis.

**Logic:**
1. Apply DBSCAN clustering to worker GPS coordinates
2. Weight clusters by restaurant density and historical order frequency
3. Generate convex hull polygons per cluster
4. Score each zone 0–100 based on cluster density × restaurant weight
5. Cache result in Redis key `zones:{city}:{hour}` with 6 min TTL

---
#### `ml-service/routers/sms_classify.py`
**Purpose:** Classify SMS messages as expense records.
**Endpoints:**
- `POST /sms/classify` — Body: `{ messages: [{ body: str, timestamp: str }] }`. Returns `[{ category, amount, merchant, date, is_tax_deductible, confidence }]`.

**Logic:**
1. Filter messages by keyword patterns (fuel, toll, petrol, HP, BPCL, FASTag, etc.)
2. Run filtered messages through fine-tuned mBERT classifier
3. Extract amount using regex patterns (₹, Rs., INR)
4. Extract merchant name using NER
5. Return structured expense records for confirmed matches

---
#### `ml-service/models/earnings_lstm.py`
**Purpose:** LSTM model class for earnings prediction.
**Architecture:**
- Input: sequence of 30 days × 8 features (amount, day_of_week, month, is_holiday, rainfall_mm, temp_c, local_event_score, platform_demand_index)
- LSTM layer: 128 units, return_sequences=True
- LSTM layer: 64 units
- Dense layer: 32 units, ReLU
- Output: Dense(2) — predicts [min_earnings, max_earnings]
- Loss: Huber loss (robust to outliers)
- Optimizer: Adam lr=0.001

**Methods:**
- `load()` — Load from `data/saved_models/earnings_lstm.keras`
- `predict(features_array)` — Returns `(min_val, max_val)` in paise

---
#### `ml-service/models/zone_clustering.py`
**Purpose:** DBSCAN-based hot zone detection.
**Parameters:** `eps=0.5` (km), `min_samples=5` workers
**Methods:**
- `compute_zones(coordinates, weights)` — Returns cluster labels
- `generate_polygons(labeled_coordinates)` — Convex hull per cluster
- `score_zones(polygons, restaurant_density)` — Returns demand scores

---
#### `ml-service/models/sms_classifier.py`
**Purpose:** Fine-tuned mBERT model for SMS expense classification.
**Model:** `bert-base-multilingual-cased` fine-tuned on labeled Indian financial SMS dataset.
**Classes:** fuel, toll, maintenance, food, mobile_recharge, not_expense
**Methods:**
- `load()` — Load tokenizer and model weights
- `classify(text)` — Returns `(class_label, confidence)`

---
#### `ml-service/train/train_lstm.py`
**Purpose:** Training script for the LSTM model.
**What it does:**
1. Query earnings data from MongoDB for all users (last 2 years)
2. Fetch historical weather data for each city
3. Build feature matrices
4. Train/test split (80/20)
5. Train model with early stopping (patience=10)
6. Save to `data/saved_models/earnings_lstm.keras`
7. Log MAPE and MAE metrics

---

### 8.10 WhatsApp Bot Service

---
#### `whatsapp-bot/server.js`
**Purpose:** Express webhook receiver for incoming WhatsApp messages.
**What it does:**
1. `GET /webhook` — Webhook verification handshake (Meta API requirement). Returns challenge token.
2. `POST /webhook` — Receives incoming message events from Meta/Twilio
3. Parses message: extracts sender phone, message body, timestamp
4. Calls `message.handler.js` with parsed message
5. Sends response back via WhatsApp API

---
#### `whatsapp-bot/handlers/message.handler.js`
**Purpose:** Central router for all incoming WhatsApp messages.
**Logic:**
1. Look up user by phone number in main backend (`GET /api/users/by-phone/{phone}`)
2. If not found: send registration prompt
3. Load conversation session from Redis (`session.service.js`)
4. If mid-flow (e.g., cashout confirmation pending): route to active flow handler
5. Otherwise: run `intent_classifier.js` on message text
6. Route to appropriate handler based on intent
7. Update session state in Redis

---
#### `whatsapp-bot/nlp/intent_classifier.js`
**Purpose:** Classify user message into intents.
**Method:** Rule-based with regex + keyword matching (sufficient for supported commands). Falls back to Dialogflow CX for unrecognized messages.
**Supported intents and trigger phrases:**
- `CHECK_BALANCE`: balance, bakiya, kitna hai, wallet
- `CASHOUT`: cashout, nikalo, cash out, withdraw, {number}
- `CHECK_EARNINGS_TODAY`: aaj, today, earnings, kamaya, kitna kamaya
- `GET_FORECAST`: kal, tomorrow, forecast, predict, aage
- `GET_HOT_ZONES`: zone, hot zone, kahaan, where to go, demand
- `APPLY_LOAN`: loan, udhaar, paise chahiye, emergency
- `ACTIVATE_INSURANCE`: insurance, cover, bima, protect
- `TAX_HELP`: tax, ITR, file, deduction, return
- `EXPENSE_SUMMARY`: expenses, kharcha, spend, fuel
- `COMMUNITY_JOBS`: jobs, kaam, gig, local, near me
- `HELP`: help, menu, commands

---
#### `whatsapp-bot/handlers/cashout.handler.js`
**Purpose:** Multi-step cashout flow via WhatsApp.
**Flow:**
1. User: "cashout 500"
2. Bot: Fetches balance. "Your balance is ₹1,240. You want to cash out ₹500? Fee: ₹6. You'll receive ₹494. Reply YES to confirm or NO to cancel."
3. User: "YES"
4. Bot: Sends a verification link (deep link to PWA biometric screen). "Please verify your identity here: [link]. Valid for 5 minutes."
5. On biometric verification success (PWA calls back to bot service): Bot calls backend `POST /api/payouts/initiate`
6. Bot: "✅ ₹494 is on its way to your UPI! Expected in 60 seconds."

---
#### `whatsapp-bot/services/session.service.js`
**Purpose:** Manage multi-turn conversation state in Redis.
**Redis key:** `wa_session:{phone}` — JSON blob with `{ intent, step, data, expires_at }`
**TTL:** 10 minutes of inactivity clears session.

---

### 8.11 Frontend — PWA Shell

---
#### `frontend/vite.config.js`
**Purpose:** Vite configuration with PWA plugin.
**Config:**
- `vite-plugin-pwa` with `registerType: 'autoUpdate'`
- Workbox strategies: NetworkFirst for `/api/*`, CacheFirst for static assets
- Manifest pointing to `public/manifest.json`
- Build output: `dist/`
- Path aliases: `@` → `src/`
- Proxy: `/api` → `http://localhost:5000` in dev

---
#### `frontend/public/manifest.json`
**Purpose:** PWA Web App Manifest.
**Contains:**
```json
{
  "name": "GigPay",
  "short_name": "GigPay",
  "description": "Instant earnings. Smart tools. Financial freedom.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0d9488",
  "orientation": "portrait",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

---
#### `frontend/src/main.jsx`
**Purpose:** React app entry point.
**What it does:**
1. Imports `App.jsx`
2. Wraps in `QueryClientProvider` (React Query)
3. Wraps in `BrowserRouter`
4. Registers Service Worker
5. Initializes i18next
6. `ReactDOM.createRoot(document.getElementById('root')).render(<App />)`

---
#### `frontend/src/App.jsx`
**Purpose:** Root component with routing configuration.
**What it does:**
1. Reads auth state from Zustand `auth.store.js`
2. `<Routes>` definition:
   - `/onboarding/*` → Onboarding pages (public, redirect if already authed)
   - `/` → `<Home>` (protected)
   - `/zones` → `<Zones>` (protected)
   - `/wallet/*` → Wallet pages (protected)
   - `/insights/*` → Insights pages (protected)
   - `/community/*` → Community pages (protected)
   - `/profile/*` → Profile pages (protected)
   - `*` → `<NotFound>`
3. `<BottomNav>` shown on all protected routes
4. `<OfflineBanner>` shown when offline
5. `<Toaster>` from react-hot-toast

---
#### `frontend/src/sw.js`
**Purpose:** Service Worker with Workbox strategies.
**Caching rules:**
- Precache: all static assets from Vite build manifest
- `/api/*` — NetworkFirst, 10s timeout, fallback to cache
- Google Maps scripts — CacheFirst, 30-day max age
- Images — CacheFirst, 60-day max age
- Offline fallback: serve `offline.html` when network fails and no cache available
**Background sync:** Queue failed POST requests (cashout, expense add) for retry when back online

---

### 8.12 Frontend — Pages

---
#### `frontend/src/pages/Onboarding/PhoneEntry.jsx`
**Purpose:** First step — phone number entry and OTP verification.
**UI:** Phone number input with country code (+91), "Send OTP" button. OTP input screen (6 digits) after send. Resend timer (30s).
**Logic:**
1. Call `auth.api.js` `sendOtp(phone)` on submit
2. Show OTP input screen
3. Call `verifyOtp(phone, otp)` → on success store tokens in Zustand + localStorage
4. If `isNewUser`: redirect to `/onboarding/aadhaar`
5. If returning user: redirect to `/`

---
#### `frontend/src/pages/Onboarding/AadhaarKYC.jsx`
**Purpose:** Aadhaar eKYC step.
**UI:** Aadhaar number input (masked), "Send OTP to linked mobile" button. OTP verification input.
**Logic:**
1. Call `auth.api.js` `initAadhaarKyc(aadhaarNumber)` → UIDAI OTP sent to Aadhaar-linked mobile
2. Input OTP → call `verifyAadhaarOtp(aadhaarNumber, otp)`
3. On success: show confirmed name/city from UIDAI, proceed to selfie step

---
#### `frontend/src/pages/Onboarding/SelfieCapture.jsx`
**Purpose:** Selfie liveness capture for face enrollment.
**UI:** Camera viewfinder (WebRTC `getUserMedia`). Circular face guide overlay. "Capture" button. Preview + "Use this photo" / "Retake".
**Logic:**
1. Access camera with `getUserMedia({ video: { facingMode: 'user' } })`
2. Capture frame as canvas → convert to Blob
3. POST to `/api/auth/kyc/selfie` as multipart form
4. On success: proceed to platform link step

---
#### `frontend/src/pages/Home.jsx`
**Purpose:** Main dashboard. The most important screen.
**UI sections (top to bottom):**
1. Top bar: "Good morning, Ravi ☀️" + notification bell
2. `<BalanceCard>` — wallet balance with "Cash Out" CTA
3. `<EarningsCard>` — today's earnings by platform with progress vs average
4. `<ForecastBanner>` — tomorrow's predicted earnings with confidence
5. `<HotZonePreview>` — mini map showing nearest hot zone
6. `<QuickActions>` — Emergency Loan, Insurance, Tax, Savings
7. `<RecentTransactions>` — last 5 payouts/transactions

**Data loading:** React Query parallel queries for balance, today's earnings, forecast, zones. Shows skeleton loaders while loading.

---
#### `frontend/src/pages/Zones.jsx`
**Purpose:** Full-screen hot zone map.
**UI:**
- Full-screen Google Maps with heatmap layer
- Floating card at bottom listing top 3 zones with:
  - Zone name (reverse geocoded)
  - Demand score (0–100)
  - Estimated wait time for orders
  - Distance from user's current location
- Time filter tabs: "Right Now", "In 1 Hour", "This Evening"
- Toggle: List view / Map view

**Real-time updates:** Socket.io `zones:update` event triggers heatmap re-render.
**Location:** Uses `useGeolocation` hook to get current position.

---
#### `frontend/src/pages/Wallet/Cashout.jsx`
**Purpose:** Cashout flow — most critical user journey.
**Steps:**
1. **Amount selection**: `<AmountSlider>` from ₹0 to max_withdrawable. `<FeePreview>` shows fee and net amount live.
2. **Confirm**: Summary screen showing amount, fee, UPI destination, estimated time.
3. **Biometric**: `<BiometricPrompt>` triggers WebAuthn fingerprint or face verification.
4. **Processing**: `<PayoutStatus>` with real-time Socket.io updates (pending → processing → completed).
5. **Success**: Confetti animation, WhatsApp confirmation message sent.

---
#### `frontend/src/pages/Insights/Tax.jsx`
**Purpose:** Tax filing assistant.
**UI sections:**
1. Annual summary card: Gross income, total deductions, taxable income, tax payable
2. Deduction breakdown: Itemized list with amounts and sections
3. Regime comparison: Old vs New regime in a comparison table
4. Missed deductions: Alert cards for potential additional deductions
5. Advance tax: Due dates and amounts
6. "File via ClearTax" CTA button

---
#### `frontend/src/pages/Insights/Expenses.jsx`
**Purpose:** Expense tracker.
**UI sections:**
1. Month picker + total expenses card
2. Category breakdown donut chart (Recharts)
3. `<SMSPermission>` banner (if SMS permission not granted)
4. Expense list grouped by date
5. "Add Expense" FAB → form modal
6. Tax deductible filter toggle

**SMS auto-detection:** On mount, if SMS permission granted, reads new SMS since last sync, sends batch to `/api/expenses/sms-batch`.

---
#### `frontend/src/pages/Community/Community.jsx`
**Purpose:** Community marketplace hub.
**UI tabs:**
1. **Nearby Jobs**: `<JobMap>` + list of open jobs within radius. Filter by type.
2. **My Jobs**: Jobs I posted + jobs I accepted with status tracking.
3. **Post Job**: Quick-access to `<PostJob>` flow.

---
#### `frontend/src/pages/Wallet/Loans.jsx`
**Purpose:** Emergency loan management.
**UI:**
- If no active loan: Eligibility card with GigScore, max amount, "Apply" CTA
- Loan application form: Amount slider, repayment % selector, term preview
- If active loan: Repayment progress bar, next auto-deduction date, outstanding balance, "Pay Extra" option

---

### 8.13 Frontend — Components

---
#### `frontend/src/components/map/HeatMap.jsx`
**Purpose:** Google Maps heatmap layer wrapper.
**Props:** `zones` (GeoJSON FeatureCollection), `userLocation` `{lat, lng}`, `onZoneClick`
**What it does:**
1. Initializes Google Maps with `@vis.gl/react-google-maps`
2. Adds `HeatmapLayer` using zone coordinate arrays weighted by demand score
3. Adds current location marker (pulsing blue dot)
4. Handles map click → calls `onZoneClick` with zone data

---
#### `frontend/src/components/cashout/BiometricPrompt.jsx`
**Purpose:** Trigger WebAuthn authentication for withdrawal.
**Props:** `onSuccess(withdrawalToken)`, `onFailure(error)`
**Logic:**
1. Check `navigator.credentials` available
2. GET `/api/auth/biometric/challenge` to get WebAuthn challenge
3. Call `navigator.credentials.get({ publicKey: challenge })`
4. On success: POST assertion to `/api/auth/biometric/authenticate`
5. Backend returns `withdrawal_token` → call `onSuccess(token)`
6. Fallback: if WebAuthn unavailable → show face capture modal instead

---
#### `frontend/src/components/shared/OfflineBanner.jsx`
**Purpose:** Show offline indicator when network unavailable.
**Uses:** `useOffline()` hook. Shows a yellow banner with "You're offline — some features unavailable" when `navigator.onLine === false`.

---
#### `frontend/src/components/home/ForecastBanner.jsx`
**Purpose:** Tomorrow's earnings prediction card.
**Props:** `forecast: { min, max, expected, confidence, factors }`
**UI:** Teal gradient card. "Tomorrow's Forecast". "₹850 – ₹1,200" range display. Confidence bar. Factor chips: ☀️ Clear weather, 📅 Friday, 🏏 IPL match nearby.

---

### 8.14 Frontend — State & Hooks

---
#### `frontend/src/store/auth.store.js`
**Purpose:** Zustand store for authentication state.
**State:** `{ user, accessToken, refreshToken, isAuthenticated, isLoading }`
**Actions:**
- `login(tokens, user)` — Set state + persist to localStorage
- `logout()` — Clear state + localStorage, redirect to `/onboarding`
- `updateUser(updates)` — Partial user update
- `refreshTokens()` — Call refresh endpoint, update tokens

---
#### `frontend/src/hooks/useAuth.js`
**Purpose:** Facade over auth store + React Query for auth operations.
**Returns:** `{ user, isAuthenticated, login, logout, sendOtp, verifyOtp, isLoading }`

---
#### `frontend/src/hooks/useSocket.js`
**Purpose:** Manage Socket.io connection.
**Logic:**
1. On mount: connect to `VITE_API_URL` with `auth: { token: accessToken }`
2. Join room `user:{userId}` on connect
3. Join room `city:{city}` for zone updates
4. Expose `socket` instance + `connected` bool
5. Auto-reconnect on disconnect
6. Disconnect on logout

---
#### `frontend/src/hooks/useBiometric.js`
**Purpose:** WebAuthn API wrapper for biometric operations.
**Returns:** `{ isSupported, register, authenticate, isLoading, error }`
- `register()` — Calls WebAuthn registration flow
- `authenticate()` — Calls WebAuthn assertion flow, returns withdrawal token

---
#### `frontend/src/hooks/useSmsReader.js`
**Purpose:** Android SMS reading via PWA (requires user permission).
**Note:** Uses `navigator.permissions` API + Android Intent Bridge where available.
**Logic:**
1. Check if `SMSReceiver` API available (Chrome Android)
2. Request permission
3. Read messages since last sync timestamp
4. Return `{ messages, permissionStatus, requestPermission }`

---
#### `frontend/src/hooks/useZones.js`
**Purpose:** Hot zone data with real-time Socket.io updates.
**Logic:**
1. Initial fetch: `ml.api.js` `getZones(city)`
2. Socket listener: `zones:update` event replaces zone data
3. Returns `{ zones, lastUpdated, isLoading }`

---

### 8.15 Frontend — Services / API Layer

---
#### `frontend/src/services/api.service.js`
**Purpose:** Configured Axios instance used by all API modules.
**Config:**
- `baseURL: VITE_API_URL`
- Request interceptor: Attach `Authorization: Bearer {accessToken}` from Zustand store
- Response interceptor:
  - On 401: attempt token refresh, retry original request
  - On refresh failure: logout user
  - On network error: check if offline, return cached response if available

---
#### `frontend/src/services/payouts.api.js`
**Purpose:** All payout API calls.
**Functions:**
- `getBalance()` — GET `/api/payouts/balance`
- `getFeePreview(amount, type)` — GET `/api/payouts/fee-preview?amount=&type=`
- `initiatePayout(amount, upiId, type, withdrawalToken)` — POST `/api/payouts/initiate`
- `getPayoutHistory(page, limit)` — GET `/api/payouts/history`
- `getPayoutStatus(payoutId)` — GET `/api/payouts/status/:payoutId`

---
#### `frontend/src/utils/smsParser.js`
**Purpose:** Client-side SMS pattern matching (backup/pre-filter before ML classification).
**Functions:**
- `isFuelSms(text)` — Regex check for petrol pump keywords
- `isTollSms(text)` — FASTag, NHAI patterns
- `extractAmount(text)` — Returns INR amount from SMS text
- `extractMerchant(text)` — Returns merchant/entity name

---
#### `frontend/src/locales/en.json` and `hi.json`
**Purpose:** Translation files for English and Hindi.
**Structure:** Flat key-value JSON with all UI strings. Keys use dot notation: `home.balance_card.title`, `cashout.confirm_button`, etc. Hindi values use Devanagari script.

---

### 8.16 Frontend — PWA Assets

---
#### `frontend/public/offline.html`
**Purpose:** Fallback page shown when user is offline and no cached version exists.
**Content:** Minimal HTML/CSS (no external deps). GigPay logo, "You're offline" message, list of features available offline (balance, recent transactions). No JS required.

---
## 9. API ENDPOINTS REFERENCE

### Authentication (`/api/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/send-otp` | None | Send OTP to phone |
| POST | `/auth/verify-otp` | None | Verify OTP, get tokens |
| POST | `/auth/refresh` | None | Refresh access token |
| POST | `/auth/logout` | ✅ | Invalidate tokens |
| POST | `/auth/kyc/aadhaar/init` | ✅ | Start Aadhaar KYC |
| POST | `/auth/kyc/aadhaar/verify` | ✅ | Complete Aadhaar KYC |
| POST | `/auth/kyc/selfie` | ✅ | Upload selfie for face enrollment |
| POST | `/auth/biometric/register` | ✅ | Register WebAuthn credential |
| POST | `/auth/biometric/challenge` | ✅ | Get WebAuthn challenge |
| POST | `/auth/biometric/authenticate` | ✅ | Verify WebAuthn, get withdrawal token |

### Earnings (`/api/earnings`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/earnings/today` | ✅ | Today's earnings summary |
| GET | `/earnings/summary` | ✅ | Aggregated stats (week/month/year) |
| GET | `/earnings/history` | ✅ | Paginated history |
| POST | `/earnings/manual` | ✅ | Add manual entry |
| POST | `/earnings/upload-screenshot` | ✅ | OCR screenshot upload |
| GET | `/earnings/forecast` | ✅ | ML tomorrow forecast |

### Payouts (`/api/payouts`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/payouts/balance` | ✅ | Current balance |
| GET | `/payouts/fee-preview` | ✅ | Fee calculation |
| POST | `/payouts/initiate` | ✅+Biometric | Start payout |
| GET | `/payouts/status/:id` | ✅ | Payout status |
| GET | `/payouts/history` | ✅ | Payout history |

### Loans (`/api/loans`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/loans/eligibility` | ✅+KYC | Check eligibility + GigScore |
| POST | `/loans/apply` | ✅+KYC | Apply for loan |
| GET | `/loans/active` | ✅ | Active loans |
| GET | `/loans/history` | ✅ | Loan history |
| POST | `/loans/:id/repay` | ✅ | Manual repayment |

### Insurance (`/api/insurance`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/insurance/plans` | ✅ | Available plans |
| GET | `/insurance/active` | ✅ | Active policies |
| POST | `/insurance/activate` | ✅+KYC | Activate plan |
| POST | `/insurance/claim` | ✅ | Submit claim |
| GET | `/insurance/claims` | ✅ | Claim history |

### Expenses (`/api/expenses`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/expenses` | ✅ | List expenses |
| GET | `/expenses/summary` | ✅ | Category breakdown |
| POST | `/expenses` | ✅ | Add manual expense |
| POST | `/expenses/sms-batch` | ✅ | Process SMS batch |
| POST | `/expenses/receipt` | ✅ | Upload receipt |
| DELETE | `/expenses/:id` | ✅ | Delete expense |

### Tax (`/api/tax`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/tax/summary/:fy` | ✅ | Tax summary for FY |
| GET | `/tax/deductions/:fy` | ✅ | Deduction breakdown |
| POST | `/tax/calculate` | ✅ | Calculate liability |
| POST | `/tax/file` | ✅+KYC | File via ClearTax |
| GET | `/tax/filing-status/:fy` | ✅ | Filing status |

### Community (`/api/community`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/community/jobs` | ✅ | Nearby jobs |
| POST | `/community/jobs` | ✅+KYC | Post a job |
| GET | `/community/jobs/:id` | ✅ | Job details |
| POST | `/community/jobs/:id/accept` | ✅+KYC | Accept job |
| POST | `/community/jobs/:id/complete` | ✅ | Mark complete |
| POST | `/community/jobs/:id/confirm` | ✅ | Release payment |
| POST | `/community/jobs/:id/rate` | ✅ | Submit rating |
| GET | `/community/my-jobs` | ✅ | My jobs |

### Savings (`/api/savings`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/savings` | ✅ | All goals |
| POST | `/savings/create` | ✅ | Create goal |
| POST | `/savings/:id/deposit` | ✅ | Manual deposit |
| POST | `/savings/:id/withdraw` | ✅ | Withdraw |
| PATCH | `/savings/:id/toggle` | ✅ | Pause/resume |

### Insights (`/api/insights`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/insights/algo` | ✅ | Algo insights |
| POST | `/insights/algo/:id/upvote` | ✅ | Upvote insight |
| POST | `/insights/algo/report` | ✅ | Report new pattern |
| GET | `/insights/performance` | ✅ | Personal analytics |

### ML Service Endpoints (Internal — `http://ml-service:8000`)
| Method | Path | Description |
|---|---|---|
| POST | `/predict/earnings` | Earnings prediction |
| GET | `/zones/{city}` | Get cached hot zones |
| POST | `/zones/compute` | Compute new zones |
| POST | `/sms/classify` | Classify SMS messages |
| GET | `/insights/{platform}/{city}` | Algo insights |
| GET | `/health` | Health check |

---

## 10. ENVIRONMENT VARIABLES

### Backend (`backend/.env`)
```bash
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gigpay
REDIS_URL=redis://localhost:6379

# JWT (Use RS256 — generate with: openssl genrsa -out private.pem 2048)
JWT_ACCESS_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
JWT_ACCESS_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
JWT_REFRESH_SECRET=your_refresh_secret_min_64_chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d

# Encryption (32 bytes for AES-256)
ENCRYPTION_KEY=your_32_byte_hex_encryption_key

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
RAZORPAY_ACCOUNT_NUMBER=your_razorpay_account  # For payout source account

# UIDAI / Aadhaar (Sandbox)
UIDAI_API_URL=https://developer.uidai.gov.in
UIDAI_AUA_CODE=your_aua_code
UIDAI_LICENSE_KEY=your_license_key
UIDAI_ASA_LICENSE_KEY=your_asa_license_key

# AWS
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=gigpay-uploads
REKOGNITION_COLLECTION_ID=gigpay-faces-dev

# Firebase (FCM)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}  # JSON stringified

# Twilio (SMS + WhatsApp fallback)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+14155238886
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Meta WhatsApp Business API
META_WHATSAPP_TOKEN=your_meta_access_token
META_PHONE_NUMBER_ID=your_phone_number_id
META_WEBHOOK_VERIFY_TOKEN=your_custom_verify_token

# Google
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX

# ML Service
ML_SERVICE_URL=http://ml-service:8000

# Third-party APIs
OPENWEATHERMAP_API_KEY=your_openweathermap_key
CLEARTAX_API_KEY=your_cleartax_key
CLEARTAX_API_URL=https://api.cleartax.in
ACKO_API_KEY=your_acko_key
NBFC_PARTNER_API_URL=https://api.nbfcpartner.com
NBFC_PARTNER_API_KEY=your_nbfc_key
GROWW_API_KEY=your_groww_key

# Logging
LOG_LEVEL=debug
```

### ML Service (`ml-service/.env`)
```bash
PORT=8000
MONGODB_URI=mongodb+srv://...  # Same as backend
REDIS_URL=redis://localhost:6379
OPENWEATHERMAP_API_KEY=your_key
ML_MODELS_PATH=./data/saved_models
LOG_LEVEL=info
```

### WhatsApp Bot (`whatsapp-bot/.env`)
```bash
PORT=5001
GIGPAY_API_URL=http://backend:5000
GIGPAY_BOT_SECRET=internal_service_secret  # For auth between bot and backend
REDIS_URL=redis://localhost:6379
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
META_WHATSAPP_TOKEN=...
META_PHONE_NUMBER_ID=...
META_WEBHOOK_VERIFY_TOKEN=...
```

### Frontend (`frontend/.env`)
```bash
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXX
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=gigpay-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gigpay-app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

---

## 11. THIRD-PARTY INTEGRATIONS

### 11.1 Razorpay Payouts
**Flow:**
1. Create `Contact` (one per user): `POST /v1/contacts`
2. Create `Fund Account` (bank/UPI) linked to contact: `POST /v1/fund_accounts`
3. Create `Payout` from GigPay's current account to fund account: `POST /v1/payouts`
4. Receive payout status via webhook: `POST /api/webhooks/razorpay`
5. Webhook events handled: `payout.processed`, `payout.reversed`, `payout.failed`
**Important:** GigPay maintains a float/revolving credit facility with Razorpay to fund instant payouts before platform settlement.

### 11.2 UIDAI eKYC (Sandbox)
**Documentation:** https://developer.uidai.gov.in
**Flow:**
1. `POST /otp?uid={aadhaar}&tid={txn_id}&ac={aua_code}&lk={license_key}` — Triggers OTP to Aadhaar-linked mobile
2. `POST /kyc` with OTP + XML request signed with AUA private key — Returns KYC data (name, DOB, address, photo)
**Sandbox:** Use UIDAI Developer Portal. Real production requires AUA/KUA registration with UIDAI.

### 11.3 Meta WhatsApp Business API
**Webhook verification:** GET request with `hub.challenge` token — return challenge string.
**Send message:** `POST https://graph.facebook.com/v18.0/{phone_number_id}/messages`
```json
{
  "messaging_product": "whatsapp",
  "to": "91XXXXXXXXXX",
  "type": "text",
  "text": { "body": "Your message here" }
}
```
**Template messages:** Required for first-contact outbound messages. Register templates in Meta Business Manager.

### 11.4 Firebase FCM Push Notifications
**Send with Admin SDK:**
```javascript
admin.messaging().send({
  token: user.fcm_token,
  notification: { title, body },
  data: { type, deeplink },
  android: { priority: 'high' }
})
```
**Client registration:** PWA registers service worker, calls `getToken(messaging, { vapidKey })`, sends token to `/api/notifications/fcm-token`.

### 11.5 AWS Rekognition Face Verification
**Collection setup:** `CreateCollection({ CollectionId: 'gigpay-faces-prod' })` — done once at setup.
**Enrollment:** `IndexFaces({ CollectionId, Image: { Bytes: imageBuffer }, ExternalImageId: userId })`
**Verification:** `SearchFacesByImage({ CollectionId, Image: { Bytes: selfieBuffer }, FaceMatchThreshold: 90 })` — returns match with confidence %.

### 11.6 Google Maps Platform APIs Used
- **Maps JavaScript API** — Map display in PWA
- **Visualization API** — HeatmapLayer for hot zones
- **Geocoding API** — Reverse geocode coordinates to city/area names
- **Places API** — Restaurant density data for zone scoring
- **Distance Matrix API** — ETA calculations for community jobs
**Important:** Restrict API key to specific HTTP referrers (your domain) to prevent abuse.

---

## 12. BUSINESS LOGIC RULES

### 12.1 Payout Fee Rules
```
IF payout_type == "instant" (< 60 seconds):
  fee = max(500, amount * 0.015)  # ₹5 minimum OR 1.5%
ELSE IF payout_type == "same_day":
  fee = max(500, amount * 0.012)  # ₹5 minimum OR 1.2%
IF user.subscription_tier == "gigpro":
  fee = 0  # Free for GigPro subscribers
IF user has loan active:
  loan_deduction = payout.amount * loan.auto_deduct_percent
  net_payout = amount - fee - loan_deduction
```

### 12.2 Loan Eligibility Rules
```
REQUIRED: user.gig_score >= 400
REQUIRED: user.kyc_status == "verified"
REQUIRED: no active loan where amount_repaid < total_repayable * 0.5
REQUIRED: no defaulted loans in history
max_loan_amount = min(500000, 5 * avg_daily_earnings_last_30_days)
  where avg_daily_earnings = sum(Earnings.net_amount where date > 30 days ago) / 30
```

### 12.3 GigScore Calculation (0–850)
```
earnings_consistency_score (0–255, 30%):
  cv = std_dev(earnings_last_30d) / mean(earnings_last_30d)
  score = max(0, 255 - cv * 255)

platform_tenure_score (0–170, 20%):
  months = (now - first_earning_date).months
  score = min(170, months * 14.2)

repayment_score (0–213, 25%):
  if no_loans: score = 150  # neutral
  else: score = (on_time_repayments / total_repayments) * 213

platform_rating_score (0–128, 15%):
  avg_rating = mean(platform_accounts.rating)  # 1-5 scale
  score = (avg_rating / 5) * 128

app_engagement_score (0–85, 10%):
  days_active_last_30 = count(distinct dates with activity, last 30 days)
  score = (days_active_last_30 / 30) * 85

TOTAL = sum of all above, capped at 850
```

### 12.4 Community Job Payment Escrow
```
ON job_post:
  charge customer wallet: amount = offered_price
  create Payout record: status = escrowed

ON job_confirm (customer releases):
  platform_fee = offered_price * 0.05
  worker_amount = offered_price - platform_fee
  transfer worker_amount to worker wallet
  update Payout status = completed
  update job status = completed

ON dispute (72hr no confirmation):
  flag for manual review
  hold escrow until resolved
  notify both parties
```

### 12.5 Tax Calculation Logic
```
Financial Year: April 1 to March 31
gross_income = sum(Earnings.net_amount for FY)

Presumptive Tax (Section 44AD):
  IF total receipts <= 2 crore:
    presumptive_income = gross_income * 0.08  # 8% for cash
    OR gross_income * 0.06  # 6% for digital receipts
  taxable_income_presumptive = presumptive_income - 80C_deductions - standard_deduction

Regular Tax:
  taxable_income_regular = gross_income - all_business_expenses - 80C_deductions - standard_deduction

CHOOSE: whichever gives lower tax liability

Tax Slabs (New Regime FY 2024-25):
  0 – 3L: 0%
  3L – 7L: 5%
  7L – 10L: 10%
  10L – 12L: 15%
  12L – 15L: 20%
  > 15L: 30%
  Section 87A rebate: full rebate if total income <= 7L (zero tax)
```

### 12.6 Hot Zone Scoring
```
zone_score = (worker_density_score * 0.4) + (restaurant_density_score * 0.35) + (historical_order_rate * 0.25)

worker_density_score = (workers_in_zone / avg_workers_per_zone) * 100, capped at 100
restaurant_density_score = (restaurants_in_zone / avg_restaurants_per_zone) * 100, capped at 100
historical_order_rate = (avg_orders_per_hour_last_4_weeks_same_hour) / max_hourly_orders * 100

Zones with score < 30: not shown
Zones with score >= 70: shown as "HIGH DEMAND" (red)
Zones with score 50-69: "MODERATE" (orange)
Zones with score 30-49: "PICKING UP" (yellow)
```

---

## 13. ML MODELS SPECIFICATION

### 13.1 Earnings LSTM Model

**Problem:** Predict next day's earnings range for a given worker.

**Input Features (per day, last 30 days):**
| Feature | Type | Description |
|---|---|---|
| `net_earnings` | Float | Normalized daily earnings in paise |
| `hours_worked` | Float | Hours worked (0–16) |
| `day_of_week` | Int (0–6) | Monday = 0 |
| `is_holiday` | Binary | Public holiday flag |
| `is_weekend` | Binary | Sat/Sun flag |
| `rainfall_mm` | Float | Daily rainfall (higher rain = more deliveries) |
| `temp_celsius` | Float | Max temperature |
| `local_event_score` | Float | 0–1, based on major events in city |

**Architecture:**
```
Input: (batch_size, 30, 8)
→ LSTM(128, return_sequences=True)
→ Dropout(0.2)
→ LSTM(64, return_sequences=False)
→ Dropout(0.2)
→ Dense(32, activation='relu')
→ Dense(2, activation='linear')  # [min_earnings, max_earnings]
```

**Training:**
- Dataset: Synthetic + real earnings data from 500+ workers over 1 year
- Train/Val split: 80/20
- Loss: Huber (delta=1.0)
- Optimizer: Adam(lr=0.001, decay=0.0001)
- Early stopping: patience=15, monitor=val_loss
- Target MAPE: < 15%

**Prediction output:**
```python
{
  "expected_min": 82000,   # in paise
  "expected_max": 115000,  # in paise
  "expected_mean": 98500,
  "confidence": 0.78,      # 0-1
  "factors": {
    "weather_impact": "positive",  # rain expected → more orders
    "day_type": "friday",
    "event": "IPL match - positive",
    "historical_average": 92000
  }
}
```

### 13.2 SMS Expense Classifier

**Problem:** Classify an SMS message as an expense and extract structured data.

**Model:** `bert-base-multilingual-cased` fine-tuned on Indian financial SMS dataset.

**Training Data (minimum viable):**
- 5,000 labeled SMS samples
- Classes: fuel, toll, maintenance, food, mobile_recharge, not_expense
- Includes English, Hindi, and mixed-language SMS

**Fine-tuning config:**
```python
model = BertForSequenceClassification.from_pretrained(
    'bert-base-multilingual-cased',
    num_labels=6
)
# Training: 3 epochs, lr=2e-5, batch_size=32
# Target accuracy: >90% on held-out test set
```

**Post-classification extraction pipeline:**
```
Input SMS → BERT classifier → (if not_expense: skip) → 
Amount regex: r'(?:₹|Rs\.?|INR)\s*(\d+(?:,\d+)*(?:\.\d{2})?)' →
Merchant NER → Date extraction → Output expense record
```

### 13.3 DBSCAN Hot Zone Clustering

**Input:** Array of GPS coordinates `[(lat, lng)]` from active workers in past 30 minutes

**Parameters:**
- `eps = 0.5` km (points within 500m are considered neighbors)
- `min_samples = 5` (minimum 5 workers to form a zone)
- `metric = 'haversine'` (geodesic distance)

**Post-processing:**
1. Generate convex hull polygon for each cluster using `scipy.spatial.ConvexHull`
2. Expand polygon by 200m buffer for display
3. Convert to GeoJSON Polygon feature
4. Score using zone scoring formula (Section 12.6)
5. Return top 10 zones by score

---

## 14. SECURITY IMPLEMENTATION

### 14.1 Authentication Flow
```
Login:
  phone → OTP (bcrypt hashed in DB, TTL 10min) → verify → 
  JWT access token (RS256, 15min) + refresh token (opaque, Redis, 30d)

Refresh:
  refresh token → Redis lookup → verify not blacklisted → new access token

Logout:
  delete refresh token from Redis → client clears localStorage
```

### 14.2 Sensitive Data Protection
| Data | Storage Method |
|---|---|
| Aadhaar number | Only last 4 digits stored; full number used only transiently for API calls |
| PAN number | AES-256-GCM encrypted in MongoDB |
| Bank account number | AES-256-GCM encrypted |
| Face embedding | Stored in AWS Rekognition collection (not in our DB) |
| OTPs | bcrypt hashed with salt rounds = 10 |
| Refresh tokens | SHA-256 hashed in Redis |
| SMS raw text | AES-256 encrypted; only extracted data stored long-term |

### 14.3 API Security Headers (Helmet.js config)
```javascript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "maps.googleapis.com"],
      connectSrc: ["'self'", "api.razorpay.com", "fcm.googleapis.com"],
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true }
})
```

### 14.4 Withdrawal Security Layers
```
Layer 1: Valid JWT access token (15 min expiry)
Layer 2: WebAuthn biometric assertion (fingerprint/face)
Layer 3: Single-use withdrawal token (5 min TTL in Redis)
Layer 4: Fraud detection check (amount, location, device)
Layer 5: Daily withdrawal limit check (₹50,000/day)
Layer 6: Razorpay fund account verification
```

### 14.5 Rate Limits
| Endpoint | Limit |
|---|---|
| POST `/auth/send-otp` | 3 per phone per 10 min |
| POST `/auth/verify-otp` | 5 attempts per session |
| POST `/payouts/initiate` | 10 per user per hour |
| POST `/loans/apply` | 3 per user per day |
| General API | 100 per IP per 15 min |
| Auth endpoints | 20 per IP per 15 min |

---

## 15. DEPLOYMENT ARCHITECTURE

### 15.1 Docker Compose (Production)
```yaml
# docker-compose.prod.yml structure:
services:
  nginx:          # Reverse proxy, SSL, static files
  backend:        # Node.js — 2 replicas
  ml-service:     # Python FastAPI — 1 replica (scale as needed)
  whatsapp-bot:   # Node.js — 1 replica
  # Note: MongoDB and Redis use managed cloud services in prod
```

### 15.2 Nginx Configuration (`nginx/nginx.conf`)
```nginx
# Key config points:
server {
  listen 443 ssl;
  server_name api.gigpay.in;
  
  # SSL
  ssl_certificate /etc/letsencrypt/live/gigpay.in/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/gigpay.in/privkey.pem;
  
  # PWA static files
  location / {
    root /var/www/gigpay-pwa;
    try_files $uri $uri/ /index.html;  # SPA routing
  }
  
  # API proxy
  location /api {
    proxy_pass http://backend:5000;
    proxy_set_header X-Real-IP $remote_addr;
  }
  
  # WebSocket (Socket.io)
  location /socket.io {
    proxy_pass http://backend:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
  
  # WhatsApp bot webhooks
  location /whatsapp {
    proxy_pass http://whatsapp-bot:5001;
  }
}
```

### 15.3 AWS Infrastructure
```
Production Setup:
  EC2 t3.medium (2 vCPU, 4GB RAM) — Backend + WhatsApp Bot
  EC2 t3.medium — ML Service
  MongoDB Atlas M10 (2 vCPU, 2GB RAM, 10GB storage)
  Redis Cloud 100MB plan
  S3 bucket: gigpay-uploads-prod (private)
  CloudFront distribution → S3 for PWA static files
  Route 53: gigpay.in → CloudFront (PWA), api.gigpay.in → EC2 Elastic IP

Estimated Monthly Cost (Phase 1):
  EC2 x2: ~$60
  MongoDB Atlas M10: ~$60
  Redis Cloud: ~$15
  S3 + CloudFront: ~$10
  Total: ~$145/month
```

---

## 16. BUILD & RUN INSTRUCTIONS

### 16.1 Prerequisites
- Node.js 20 LTS
- Python 3.11
- Docker + Docker Compose
- MongoDB Atlas account (or local MongoDB)
- Redis (local via Docker or Redis Cloud)

### 16.2 Local Development Setup

```bash
# 1. Clone repo
git clone https://github.com/yourteam/gigpay.git
cd gigpay

# 2. Copy env files
cp .env.example backend/.env
cp .env.example ml-service/.env
cp .env.example whatsapp-bot/.env
cp .env.example frontend/.env
# Fill in actual values in each .env file

# 3. Start dependencies (MongoDB + Redis)
docker-compose up -d mongo redis

# 4. Install and start backend
cd backend
npm install
npm run dev        # Uses nodemon, port 5000

# 5. Install and start ML service
cd ../ml-service
pip install -r requirements.txt
python main.py     # Uvicorn on port 8000

# 6. Install and start WhatsApp bot
cd ../whatsapp-bot
npm install
npm run dev        # Nodemon on port 5001

# 7. Install and start frontend
cd ../frontend
npm install
npm run dev        # Vite on port 3000

# 8. (Optional) Run all via Docker Compose
cd ..
docker-compose up --build
```

### 16.3 ML Model Training (First-Time Setup)
```bash
cd ml-service

# Train earnings LSTM (requires historical earnings data in MongoDB)
python train/train_lstm.py

# Train SMS classifier (requires labeled SMS dataset in data/training/)
python train/train_sms_classifier.py

# Evaluate models
python train/evaluate.py
```

### 16.4 Hackathon Demo Setup (Quick Start — Mock Mode)

For hackathon without real API keys, all external services can run in mock mode:

```bash
# backend/.env additions for mock mode:
MOCK_UIDAI=true          # Skip real Aadhaar verification
MOCK_RAZORPAY=true       # Simulate payouts (always succeed)
MOCK_REKOGNITION=true    # Skip real face verification
MOCK_INSURANCE=true      # Simulate policy creation
MOCK_NBFC=true           # Simulate loan disbursement
MOCK_WHATSAPP=true       # Log WhatsApp messages to console

# Mock mode behavior:
# - Aadhaar OTP: any 6-digit number works
# - Payout: always succeeds after 3-second delay
# - Face verification: always returns match: true
# - WhatsApp: messages printed to console, not actually sent
```

### 16.5 Production Deployment
```bash
# Build frontend PWA
cd frontend
npm run build
# Upload dist/ to S3 bucket / CloudFront

# Build and push Docker images
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml push

# On production server:
docker-compose -f docker-compose.prod.yml up -d

# SSL setup
certbot --nginx -d gigpay.in -d api.gigpay.in
```

### 16.6 `package.json` Scripts

**backend/package.json:**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest --coverage",
    "lint": "eslint src/"
  }
}
```

**frontend/package.json:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src/"
  }
}
```

---

## 17. HACKATHON DEMO SCRIPT

### What to Build in 72 Hours (MVP Scope)

**Must Have (Core Demo):**
- [x] PWA shell with bottom navigation
- [x] Onboarding: Phone OTP → mock Aadhaar → mock selfie
- [x] Home dashboard with mock earnings data
- [x] Cashout flow: amount selection → mock biometric → "payout initiated" state
- [x] Hot zone map: Google Maps with hardcoded demo heatmap data
- [x] Earnings chart (Recharts) with mock 30-day data
- [x] Earnings forecast banner (hardcoded or pre-computed LSTM result)
- [x] WhatsApp bot demo (Twilio sandbox, 5 commands: balance, cashout, zone, forecast, loan)
- [x] Tax calculator (rule-based, no ClearTax API)
- [x] Expense tracker UI (hardcoded SMS samples pre-parsed)
- [x] Community jobs map (hardcoded 5 jobs)
- [x] Loan eligibility screen with GigScore display

**Nice to Have (if time permits):**
- [ ] Real Socket.io payout status updates
- [ ] Real SMS NLP classification on device
- [ ] Algo insights feed

### Demo Flow for Judges (8 minutes)

```
0:00 – 0:45  PROBLEM
  Show photo of delivery worker. Say:
  "15 million gig workers in India earn every day but get paid every 7 days.
   They take loans at 3% daily interest just to buy fuel tomorrow.
   GigPay fixes this."

0:45 – 2:00  ONBOARDING
  Live demo on phone (or Figma mirror):
  - Enter phone → OTP
  - Enter Aadhaar → "Verified: Ravi Kumar, Bangalore"
  - Take selfie → "Face enrolled"
  - Connect Zomato account → "₹1,240 earned today, ready to cash out"

2:00 – 3:15  HOT ZONE MAP
  Show the heatmap screen:
  "Right now, 3 hot zones in Bangalore. Koramangala — 87/100 demand.
   GigPay predicted this from 240 worker GPS points + 340 restaurants in the area.
   Workers who use this earn 34% more per hour."

3:15 – 4:00  CASHOUT
  Tap "Cash Out Now" → Select ₹800 → Fee preview (₹9.60)
  Fingerprint prompt → "Processing..."
  "₹790 on its way to your UPI. Received in 60 seconds."
  WhatsApp message received live on second phone: "GigPay: ₹790 credited ✅"

4:00 – 4:45  WHATSAPP BOT
  Use judge's phone: Ask them to WhatsApp the bot number
  They type "balance" → Bot replies with balance
  They type "hot zone" → Bot replies with top 3 zones + Google Maps links
  "No app needed. Works on any ₹5,000 phone."

4:45 – 5:30  TAX CALCULATOR
  Show: Gross ₹4.2L → Deductions: Fuel ₹38K, Vehicle depreciation ₹22K, Mobile ₹8K
  "Taxable income: ₹3.52L. Tax payable: ₹0 (under ₹7L threshold with 87A rebate).
   GigPay saved this driver ₹12,000 in taxes they were about to overpay."

5:30 – 6:15  ALGO INSIGHTS
  Show insights feed:
  "On Zomato: Workers with >85% acceptance rate get batch orders — 2.3× more earnings/hour.
   On Ola: Going offline for 5 min and back on resets your order queue priority."

6:15 – 7:00  COMMUNITY MARKETPLACE
  Show map with 5 local jobs:
  "A customer in Indiranagar needs a parcel delivered to Koramangala. ₹120 direct.
   No Zomato. No 30% commission. Just worker ↔ customer, 5% GigPay fee."

7:00 – 7:30  UNIT ECONOMICS
  "10,000 DAU × ₹700 avg cashout × 1.2% fee = ₹84,000/day revenue.
   ₹25 lakh/month at target. Loan book: additional 2%/month.
   Insurance + savings: 10-15% commissions."

7:30 – 8:00  CLOSE
  "GigPay is not a payments app. It's a financial OS for people who power India's delivery economy.
   They deserve instant pay. They deserve to know their taxes. They deserve to understand the algorithm.
   We're building that."
```

### Key Numbers to Memorize
- **15 million+** gig workers in India
- **₹800/day** average delivery worker earnings
- **5–7 days** typical settlement delay
- **3–5% daily** interest on informal loans
- **25–35%** platform commission on Zomato/Uber
- **40–60%** more earnings for workers who understand the algorithm
- **₹0** tax for income under ₹7L with proper deductions (Section 87A)
- **5%** GigPay community marketplace fee vs 25–35% on major platforms
- **60 seconds** GigPay payout time
- **₹5/day** micro insurance premium

---

## APPENDIX: FEATURE FLAG SYSTEM

Use MongoDB collection `feature_flags` to enable/disable features per environment:

```javascript
// feature_flags collection
{ flag: "instant_payout", enabled: true, rollout_percent: 100 }
{ flag: "community_marketplace", enabled: true, rollout_percent: 50 }  // 50% beta
{ flag: "whatsapp_bot", enabled: true, rollout_percent: 100 }
{ flag: "tax_filing", enabled: false, rollout_percent: 0 }  // Coming soon
{ flag: "savings_vault", enabled: true, rollout_percent: 100 }
```

Backend middleware reads flags from Redis cache (refreshed every 5 min from MongoDB).
Frontend receives active flags on login in the user profile response.

---

## APPENDIX: ERROR CODE REFERENCE

| Code | HTTP | Meaning |
|---|---|---|
| `AUTH_001` | 401 | Invalid or expired access token |
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
| `COMM_003` | 400 | Insufficient wallet for job escrow |
| `ML_001` | 503 | ML service unavailable (cached response returned) |
| `GEN_001` | 500 | Internal server error |
| `GEN_002` | 404 | Resource not found |
| `GEN_003` | 422 | Validation failed |

---

*End of GigPay Master Blueprint — Version 1.0 — February 2026*
*Total: ~1,200 lines of specification covering every file, every API, every business rule.*
*Hand this document to Claude with the message: "Build GigPay based on this document" and development can begin immediately.*