# GigPay — Financial OS for India's Gig Workers

> **Instant Earnings. Smart Tools. Financial Freedom.**

GigPay is a Progressive Web App (PWA) that gives India's 15M+ gig workers instant access to their earnings, AI-powered financial intelligence, and a full financial hub — all through a mobile-first experience, voice commands, or WhatsApp.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  React PWA (Vite) ←→ Service Worker (Workbox)               │
│  Capacitor (Android APK)   FCM Push Notifications           │
│  i18n (English + Hindi)    Voice Assistant (Sarvam AI)      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS / WSS
┌────────────────────────▼────────────────────────────────────┐
│                  NGINX REVERSE PROXY                         │
│  SSL Termination │ Rate Limiting │ Static Serving            │
└──────┬─────────────────────────────────────┬────────────────┘
       │                                     │
┌──────▼──────────┐               ┌──────────▼──────────────┐
│  MAIN BACKEND   │               │  WHATSAPP BOT SERVICE    │
│  Node.js/Express│               │  Node.js/Express         │
│  Port 5000      │               │  Port 5001               │
│  Socket.io      │               │  Twilio/Meta Webhook     │
│  GigScore Engine│               │  NLP Intent Classifier   │
└──────┬──────────┘               └──────────┬───────────────┘
       │                                     │
       └──────────────┬──────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 SHARED INFRASTRUCTURE                        │
│  PostgreSQL (Neon)    Redis           AWS S3                 │
│  Prisma ORM           (Cache/Session) (File Storage)        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────┐
│  ML SERVICE                          │
│  Python FastAPI — Port 8000          │
│  scikit-learn + OpenAI/OpenRouter    │
│  Earnings Prediction + Zone DBSCAN  │
│  SMS Classification + Algo Insights  │
└──────────────────────────────────────┘
```

---

## 🚀 Core Features

| # | Feature | Description |
|---|---|---|
| 1 | **Instant Payouts** | Same-day earnings cashout via Razorpay UPI with smart cashout rules |
| 2 | **GigScore** | Proprietary creditworthiness score for gig workers — powers loan eligibility, interest rates, and financial recommendations |
| 3 | **Credit Hub (Emergency Fund)** | GigScore-based micro-lending (₹500–₹5,000) with eligibility meter, instant disbursal, and loan tracking |
| 4 | **Gullak (Micro-Savings)** | Daily round-up savings, goal-based micro-deposits, streak rewards — designed for irregular income patterns |
| 5 | **TDS Refund Dashboard** | Automated TDS tracking, Form 26AS parsing, refund claim filing, and tax deduction insights |
| 6 | **Voice Assistant** | Hands-free AI copilot powered by **Sarvam AI** — supports Hindi & English voice commands for balance checks, cashouts, and financial queries |
| 7 | **SMS Transaction Intelligence** | Auto-parses bank/UPI SMS messages to detect income & expenses, categorize transactions, and build spending insights |
| 8 | **Hot Zone AI** | Real-time ML heatmap of highest-demand delivery zones using DBSCAN clustering |
| 9 | **Earnings Predictor** | ML model predicts next-day earnings based on historical patterns |
| 10 | **Algo Insights** | Decode platform algorithm patterns (Zomato/Swiggy/Uber) to optimize work strategy |
| 11 | **Expense & Earnings Analytics** | Visual charts comparing income vs spending over time with category breakdown |
| 12 | **WhatsApp Bot** | Full app experience via WhatsApp — balance, cashout, loans, tax, zones via NLP-powered intent classification |
| 13 | **AI Financial Copilot** | Personalized financial nudges, tips, and recommendations based on spending patterns |
| 14 | **Multi-Language (i18n)** | English + Hindi interface with LanguageContext-based switching |

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3, Zustand, TanStack Query, Framer Motion, Socket.io-client, Recharts, Lucide Icons, react-hot-toast, Workbox PWA |
| **Mobile** | Capacitor 8 (Android APK build) |
| **Backend** | Node.js 20, Express 4, Prisma ORM 5, Socket.io 4, node-cron, Winston logger |
| **ML Service** | Python 3.11+, FastAPI, scikit-learn, Pandas, NumPy, OpenAI SDK (via OpenRouter), SQLAlchemy |
| **Database** | PostgreSQL (Neon Serverless), Redis |
| **AI / Voice** | Sarvam AI (Indian language voice), OpenRouter LLM (AI Copilot) |
| **Infrastructure** | Docker Compose, Nginx, AWS (S3, Rekognition) |
| **Third-Party** | Razorpay, Twilio, Meta WhatsApp API, Firebase (Auth + FCM), Google Maps, Stripe |
| **Internationalization** | i18next, react-i18next (EN + HI locales) |
| **Validation** | Zod, react-hook-form, express-validator |

---

## 📁 Project Structure

```
gigpay/
├── README.md
├── .env.example
├── docker-compose.yml              # Dev orchestration
├── docker-compose.prod.yml         # Production orchestration
├── nginx/
│   └── nginx.conf                  # Reverse proxy config
│
├── backend/                        # Node.js/Express API (port 5000)
│   ├── config/                     # DB, Redis, Firebase, Razorpay, AWS, constants
│   ├── controllers/                # Route handlers (21 controllers)
│   │   ├── auth.controller.js      # Phone OTP login, JWT tokens
│   │   ├── gigscore.controller.js  # GigScore calculation & dashboard
│   │   ├── credit.controller.js    # Emergency fund / micro-lending
│   │   ├── microsavings.controller.js  # Gullak savings
│   │   ├── tds.controller.js       # TDS refund tracking
│   │   ├── sms.controller.js       # SMS transaction parsing
│   │   ├── ai.controller.js        # AI copilot / voice assistant
│   │   ├── tax.controller.js       # Tax filing & deductions
│   │   ├── earnings.controller.js  # Earnings tracking
│   │   ├── expenses.controller.js  # Expense categorization
│   │   └── ...                     # payouts, loans, forecast, community, etc.
│   ├── routes/                     # REST API routes (23 route files)
│   ├── services/                   # Business logic (24 services)
│   │   ├── sarvam.service.js       # Sarvam AI voice integration
│   │   ├── copilot.service.js      # AI financial copilot
│   │   ├── smsParser.service.js    # Bank SMS parsing engine
│   │   ├── smsProcessor.service.js # SMS transaction processor
│   │   ├── loan.service.js         # Micro-lending logic
│   │   ├── tax.service.js          # Tax computation engine
│   │   └── ...                     # razorpay, fraud, finance, etc.
│   ├── middleware/                  # Auth, KYC, rate limiting, validation
│   ├── models/                     # Prisma models
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema
│   │   ├── seed.js                 # Base seed data
│   │   ├── seed_mvp.js             # MVP demo seed
│   │   ├── seed_financial_history.js  # Financial data seed
│   │   └── migrations/             # Database migrations
│   ├── jobs/                       # Scheduled tasks & workers
│   ├── scripts/                    # Utility scripts
│   └── utils/                      # Crypto, logger, geo, formatters, GigScore
│
├── ml-service/                     # Python FastAPI ML (port 8000)
│   ├── main.py                     # FastAPI app entry
│   ├── routers/
│   │   ├── predict.py              # Earnings prediction
│   │   ├── zones.py                # DBSCAN zone clustering
│   │   ├── sms_classify.py         # SMS transaction classification
│   │   └── insights.py             # Algo pattern insights + AI analysis
│   ├── models/                     # ML model files
│   ├── schemas/                    # Pydantic request/response schemas
│   ├── data/                       # Training data + saved models
│   ├── utils/                      # DB connector, cache helpers
│   └── zone_clustering.py          # DBSCAN clustering engine
│
├── whatsapp-bot/                   # WhatsApp Bot Service (port 5001)
│   ├── server.js                   # Bot entry point
│   ├── handlers/                   # Intent-based handlers
│   │   ├── message.handler.js      # Main message router
│   │   ├── balance.handler.js      # Balance queries
│   │   ├── cashout.handler.js      # WhatsApp cashout flow
│   │   ├── loan.handler.js         # Loan application via chat
│   │   ├── tax.handler.js          # Tax queries
│   │   ├── forecast.handler.js     # Earnings forecast
│   │   └── zone.handler.js         # Zone recommendations
│   ├── nlp/                        # NLP engine
│   │   └── intent_classifier.js    # Intent + entity extraction
│   ├── services/                   # API client, session, response builder
│   └── utils/                      # Language detection, message templates
│
└── frontend/                       # React PWA (port 3000)
    ├── public/                     # PWA manifest, icons, offline.html
    ├── android/                    # Capacitor Android project (APK)
    └── src/
        ├── App.jsx                 # Routes & app shell
        ├── pages/
        │   ├── Home.jsx            # Dashboard with earnings, quick actions
        │   ├── GigScoreDashboard.jsx   # GigScore breakdown & history
        │   ├── CreditHub.jsx       # Emergency fund application
        │   ├── MicroSavingsHub.jsx  # Gullak micro-savings
        │   ├── TaxDashboard.jsx    # TDS refund dashboard
        │   ├── SmsTransactions.jsx  # SMS-parsed transactions
        │   ├── ExpenseEarningsChart.jsx  # Analytics charts
        │   ├── Wallet.jsx          # Financial hub gateway
        │   ├── Loans.jsx           # Loan management
        │   ├── Savings.jsx         # Savings options
        │   ├── Cashout.jsx         # Instant payout flow
        │   ├── Zones.jsx           # Hot zone map
        │   ├── Insights.jsx        # Earnings insights
        │   ├── Profile.jsx         # User profile & settings
        │   └── Onboarding/         # Landing, PhoneEntry, AadhaarKYC,
        │                           # SelfieCapture, PlatformLink, BankSetup
        ├── components/
        │   ├── voice/              # VoiceAssistant.jsx (Sarvam AI)
        │   ├── financial/          # EligibilityMeter, LoanCard, SavingsGoal, TaxSummary
        │   ├── home/               # Dashboard widgets
        │   ├── layout/             # AppLayout, BottomNav, Header
        │   ├── map/                # Zone heatmap components
        │   ├── shared/             # ProtectedRoute, reusable UI
        │   ├── ui/                 # Design system primitives
        │   └── ...                 # cashout, community, earnings, expenses, etc.
        ├── hooks/                  # 24 custom hooks
        │   ├── useVoiceChat.js     # Voice assistant hook
        │   ├── useGigScore.js      # GigScore data
        │   ├── useSmsSync.js       # SMS sync & parsing
        │   ├── useMicroSavings.js  # Gullak operations
        │   ├── useCredit.js        # Credit Hub / loans
        │   └── ...                 # auth, earnings, expenses, GPS, etc.
        ├── services/               # 20 API service modules
        ├── context/                # LanguageContext, GPSContext
        ├── locales/                # en.json, hi.json (i18n strings)
        ├── store/                  # Zustand state stores
        └── utils/                  # Helpers & formatters
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 20 LTS
- Python 3.11+
- Docker & Docker Compose (optional, for infra)
- PostgreSQL (Neon recommended) or local instance

### Development Setup

```bash
# 1. Clone
git clone https://github.com/yourteam/gigpay.git
cd gigpay

# 2. Environment files
cp .env.example backend/.env
cp .env.example ml-service/.env
cp .env.example whatsapp-bot/.env
cp .env.example frontend/.env
# Edit each .env with your actual keys

# 3. Start infrastructure (PostgreSQL + Redis)
docker-compose up -d postgres redis

# 4. Backend
cd backend && npm install
npx prisma generate
npx prisma db push
node prisma/seed_mvp.js          # Seed demo data
npm run dev

# 5. ML Service
cd ../ml-service && pip install -r requirements.txt && python main.py

# 6. WhatsApp Bot
cd ../whatsapp-bot && npm install && npm run dev

# 7. Frontend
cd ../frontend && npm install && npm run dev

# OR — Run everything via Docker
docker-compose up --build
```

### Service Ports

| Service | Port | URL |
|---|---|---|
| Frontend PWA | 3000 | http://localhost:3000 |
| Backend API | 5000 | http://localhost:5000/api |
| ML Service | 8000 | http://localhost:8000 |
| WhatsApp Bot | 5001 | http://localhost:5001 |
| PostgreSQL | 5432 | postgresql://localhost:5432/gigpay |
| Redis | 6379 | redis://localhost:6379 |

---

## 🔑 Key API Endpoints

| Category | Endpoints |
|---|---|
| **Auth** | `POST /api/auth/send-otp`, `POST /api/auth/verify-otp` |
| **GigScore** | `GET /api/gigscore`, `GET /api/gigscore/breakdown` |
| **Credit Hub** | `POST /api/credit/apply`, `GET /api/credit/eligibility` |
| **Micro-Savings** | `POST /api/microsavings/deposit`, `GET /api/microsavings/goals` |
| **TDS** | `GET /api/tds/summary`, `POST /api/tds/claim-refund` |
| **SMS** | `POST /api/sms/parse`, `GET /api/sms/transactions` |
| **Earnings** | `GET /api/earnings`, `GET /api/forecast` |
| **Payouts** | `POST /api/payouts/initiate`, `GET /api/payouts/history` |
| **Zones** | `GET /api/zones/hot`, `GET /api/zones/recommendations` |
| **AI / Voice** | `POST /api/ai/chat`, `POST /api/ai/voice` |
| **Tax** | `GET /api/tax/summary`, `POST /api/tax/deductions` |

---

## 📱 Onboarding Flow

```
Landing → Phone + OTP → Aadhaar eKYC → Selfie Capture → Platform Linking → Bank Setup → Home
```

Each step is a dedicated page with progress tracking. Users can complete KYC at any point after initial login.

---

## 🌍 Target Geography

**Phase 1 Cities:** Bangalore, Delhi, Mumbai, Hyderabad, Chennai

**Target Users:** Delivery partners (Zomato/Swiggy/Dunzo), rideshare drivers (Ola/Uber), freelancers

---

## 📄 License

Proprietary — All Rights Reserved.
