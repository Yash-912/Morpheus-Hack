# GigPay — Financial OS for India's Gig Workers

> **Instant Earnings. Smart Tools. Financial Freedom.**

GigPay is a Progressive Web App (PWA) that gives India's 15M+ gig workers instant access to their earnings, AI-powered intelligence, and financial tools — all through a mobile-first experience or WhatsApp.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  React PWA (Vite) ←→ Service Worker (Workbox)               │
│  IndexedDB (offline)    FCM Push Notifications               │
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

---

## 🚀 Core Modules (12)

| # | Module | Description |
|---|---|---|
| 1 | **Instant Payouts** | Same-day earnings cashout via Razorpay UPI |
| 2 | **Hot Zone AI** | Real-time ML heatmap of highest-demand zones |
| 3 | **Earnings Predictor** | LSTM model predicts next-day earnings |
| 4 | **WhatsApp Bot** | Full app via WhatsApp — balance, cashout, loans |
| 5 | **Aadhaar Onboarding** | eKYC via UIDAI OTP + selfie liveness check |
| 6 | **Tax Filing Assistant** | ITR pre-fill, deductions, ClearTax integration |
| 7 | **Expense Tracker** | Auto-detect expenses from Android SMS |
| 8 | **Algo Insights** | Decode platform algorithm patterns |
| 9 | **Community Marketplace** | P2P hyperlocal gig platform (5% vs 30% fee) |
| 10 | **Emergency Loans** | ₹500–₹5,000 micro-credit in 30 seconds |
| 11 | **Micro Insurance** | Daily/weekly insurance at ₹5–₹25 |
| 12 | **Savings Vault** | Round-up & goal-based savings with 4–6% returns |

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3, Zustand, TanStack Query, Socket.io-client, Workbox PWA |
| **Backend** | Node.js 20, Express 4, Prisma ORM 5, Socket.io 4, Bull (queues), ioredis |
| **ML Service** | Python 3.11, FastAPI 0.110, TensorFlow/Keras 2.15, scikit-learn 1.4, HuggingFace Transformers |
| **Database** | PostgreSQL 16, Redis 7.x |
| **Infrastructure** | Docker Compose, Nginx, AWS (S3, Rekognition, CloudFront) |
| **Third-Party** | Razorpay, UIDAI, Meta WhatsApp, Twilio, Firebase FCM, ClearTax, Google Maps |

---

## 📁 Project Structure

```
gigpay/
├── README.md
├── .gitignore
├── .env.example
├── docker-compose.yml          # Dev orchestration
├── docker-compose.prod.yml     # Production orchestration
├── nginx/
│   └── nginx.conf              # Reverse proxy config
├── backend/                    # Node.js/Express API (port 5000)
│   ├── config/                 # DB, Redis, Firebase, Razorpay, AWS, constants
│   ├── models/                 # 12 Prisma models + schema.prisma
│   ├── routes/                 # REST API routes
│   ├── controllers/            # Route handlers
│   ├── middleware/              # Auth, KYC, rate limiting, uploads, validation
│   ├── services/               # Business logic + third-party integrations
│   ├── jobs/                   # Bull queues, workers, schedulers
│   └── utils/                  # Crypto, logger, geo, formatters, validators, GigScore
├── ml-service/                 # Python FastAPI ML (port 8000)
│   ├── routers/                # Prediction, zones, SMS classify, insights
│   ├── models/                 # LSTM, DBSCAN, mBERT, insight analyzer
│   ├── schemas/                # Pydantic schemas
│   ├── data/                   # Training data + saved models
│   ├── utils/                  # DB, Redis cache, weather, events
│   └── train/                  # Training scripts
├── whatsapp-bot/               # WhatsApp bot (port 5001)
│   ├── handlers/               # Intent-based message handlers
│   ├── nlp/                    # Intent classifier, entity extractor
│   ├── services/               # API client, session, response builder
│   └── utils/                  # Language detection, templates
└── frontend/                   # React PWA (port 3000)
    ├── public/                 # PWA manifest, icons, offline.html
    └── src/
        ├── pages/              # Onboarding, Home, Wallet, Insights, Community, Profile
        ├── components/         # Reusable UI components
        ├── store/              # Zustand stores
        ├── hooks/              # Custom React hooks
        └── services/           # Axios API layer
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 20 LTS
- Python 3.11
- Docker & Docker Compose
- PostgreSQL (local or managed — Supabase/Neon/RDS)

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
cd backend && npm install && npm run dev

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

## 🌍 Target Geography

**Phase 1 Cities:** Bangalore, Delhi, Mumbai, Hyderabad, Chennai

**Target Users:** Delivery partners (Zomato/Swiggy/Dunzo), rideshare drivers (Ola/Uber), freelancers

---

## 📄 License

Proprietary — All Rights Reserved.
