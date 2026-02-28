# Centralized Database Architecture Plan (Finalized)

This plan details how we will consolidate the features around a centralized database (`schema.prisma`) and ensure that all updates are properly propagated—meaning changes in one table cascade appropriately to others, and reliably reflect on the frontend—**without breaking any existing features or code**.

## 1. Current Database Schema Overview (The "Final" Schema)

The existing `schema.prisma` is robust and structured. Key models include:

- **Users & Identity**: `User`, `PlatformAccount`, `BankAccount`, `WorkerLocation`.
- **Financials (Incomes & Expenses)**: `Earning`, `Payout`, `Expense`, `TaxRecord`, `ForecastData`.
- **Financial Services**: `Loan`, `InsurancePolicy`, `Saving`, `CreditLine`, `SavingsGoal`, `DigitalGoldHolding`.
- **Community & Intelligence**: `CommunityJob`, `AlgoInsight`, `GigScoreHistory`.
- **SMS Parsing Pipeline**: `raw_sms`, `transactions`, `sync_sessions`.

---

## 2. End-to-End System Flow

To clarify the overall data journey, here is an example of core system interactions:

1. **SMS Received**
   ↓
2. **SMS Parser** identifies income/expense
   ↓
3. **Transaction Created** based on parsed data
   ↓
4. **Earning/Expense Recorded** in the centralized database via Service Layer
   ↓
5. **Wallet Updated** (balance recalibrated)
   ↓
6. **GigScore Recalculated** based on new financial data
   ↓
7. **Frontend Dashboard Updated** seamlessly

---

## 3. Proposed Architecture Changes (Non-Breaking)

> [!CAUTION]
> **Zero Breaking Changes Policy**: We are strictly adding to the existing architecture. No endpoints will be deleted, no existing frontend queries will be removed. The goal is enhancement via a centralized conduit, not restructuring.

### 3.1 Data Ingestion & Seeding (Real-World Synthetic Data for Gig Score)

Before implementing the reactivity, we will ensure the database is populated with realistic synthetic data to provide a solid foundation for Financial Services and the **Gig Score**.

- **Realistic Timeline Strategy**: Synthesized data will be restricted to a **3-to-4-month window (e.g., Nov/Dec 2025 to Feb 2026)** to simulate realistic gig worker behavior.
- **Data Focus**: We will seed `Loan`, `InsurancePolicy`, `Saving`, `CreditLine`, `SavingsGoal`, `GigScoreHistory`, and `ForecastData` focusing on *what* data is seeded to support the demo, rather than overcomplicating the generation logic.
- **Geospatial Clusters (DBSCAN)**: We will integrate `gpsPointSeedog.js` into the seeding pipeline to generate and store simulated hot-zone clusters (combining Mumbai and Pune). This links directly into the DBSCAN analytics pipeline for identifying earning hotspots.

### 3.2 Backend: Service-Layer Cascades & Transactions

Instead of hiding business logic inside Prisma Middleware or `$extends`, we will use explicit **Service Layer** functions wrapped in **Prisma Transactions**. This provides predictability, makes debugging easier, and ensures financial consistency.

- **Explicit Core Cascading Rules**:
  1. **New Earning**: → updates `walletBalance` → updates `walletLifetimeEarned` → triggers GigScore recalculation.
  2. **Expense Recorded**: → updates monthly spending analytics.
  3. **Loan Repayment**: → updates loan balance → improves GigScore.
  4. **SavingTransaction**: → updates `Saving.currentAmount`.

- **Database Transactions (`$transaction`)**:
  All financial operations will be wrapped in transactions. Example:
  ```javascript
  await prisma.$transaction([
    prisma.earning.create(...),
    prisma.user.update(...), // Update wallet
    prisma.gigScoreHistory.create(...) // If GigScore changes
  ]);
  ```

- **GigScore Calculation Trigger**:
  The core intelligence of the system (GigScore) will be recalculated upon:
  - Detection of a new earning
  - Successful loan repayment
  - Shifts in the 30-day trailing earnings window

- **Lightweight Event Emitter (Optional)**:
  We will introduce a simple Node `EventEmitter` to decoupled parts of the system (e.g., `emit('earning_created')`) to allow optional listeners to handle analytics without blocking the main database transaction.

### 3.3 Frontend & Real-Time Redundancy

Real-time capabilities will be an enhancement, not a strict dependency, to prevent demo failures due to socket drops.

- **Optional Socket Broadcasting**:
  Socket.io events (e.g., `db:user:updated`) will be emitted *after* the service function and database transaction successfully complete, completely outside the database layer.
- **Graceful Fallbacks**:
  If the websocket server crashes or sockets fail, the application will fallback to normal REST API polling and Tanstack Query `refetch()` cycles. The UI will never break if a socket is lost.

---

## 4. Verification & Testing Scenarios

Rather than solely focusing on unit tests, we will prove the hackathon demo works through end-to-end scenario testing.

### Automated Testing
- Write backend Service Layer tests to verify Prisma transactions properly update related tables (e.g., wallet balances map perfectly to earnings created).

### Scenario-Based Verifications (End-to-End)
1. **Scenario 1: Income Parsing to Score Pipeline**
   - *Action*: Send a mock Swiggy payment SMS.
   - *Expectation*: SMS parsed → Earning created → `user.walletBalance` increases → `GigScore` recalculated → Dashboard auto-updates.
2. **Scenario 2: Debt Recovery Flow**
   - *Action*: Trigger a loan repayment via payout deduction.
   - *Expectation*: Repayment transaction created → Loan balance decreases → `GigScore` improves → UI reflects new loan balance.
3. **Scenario 3: Socket Disconnect Resilience**
   - *Action*: Manually terminate the Socket.io connection and add an Expense.
   - *Expectation*: Expense saves successfully, database transactions commit safely, and frontend dashboard updates upon REST refetch.
