Phase 1: The Database Standardization (The "Paise" Rules)
Instead of switching to Float (which we discovered would break 30+ core backend files), we will upgrade your 3 Hackathon Tables (CreditLine, SavingsGoal, DigitalGoldHolding) from Float into BigInt.

Why: This means every single number inside the PostgreSQL database related to money will only ever be saved as an integer representing paise (₹1 = 100 paise). This permanently eradicates decimals from the database backend, preventing the computer from making floating-point math mistakes.

Phase 2: Resolving the "Outrageous Math" Bug
I will update frontend/src/pages/Cashout.jsx and 

backend/controllers/payouts.controller.js
.

Why: When a user types 113.98 to withdraw, Cashout.jsx will multiply it by 100 (11398) before it even hits the network. The backend will stop using parseInt (which improperly stripped your numbers) and instead expect exactly 11398. It deducts 11398 from your BigInt Wallet Balance safely.

Phase 3: The Centralized "Brain" (finance.service.js)
Right now, if a user earns money, the code scattered across different controllers tries to manually update the Wallet. I will build one Centralized Service named finance.service.js with functions like recordEarning().

Why: If the SMS parser detects a ₹500 Swiggy payment, it will ping finance.service.js. In one split-second, atomic database transaction (prisma.$transaction), it will:

Save the Earning.
Deduct ₹10 for the user's Micro-Savings Goal (Gullak).
Deduct ₹50 to auto-repay an Emergency Loan (if active).
Update the user's Wallet Balance.
Command the GigScoreService to recalculate their trust score.
Phase 4: The 4-Month "Time Machine" Seeder
To make the Hackathon demo mind-blowing, I will write backend/prisma/seed_mvp.js.

Why: A demo is boring with 1 day of data. This script will loop from November 1, 2025, to February 28, 2026 dynamically. Every "day" of the loop, it will generate realistic earnings and expenses, and feed them through the finance.service.js brain. Over the 120-day loop, the user's Wallet Balance, GigScore histories, and Savings Goals will dynamically populate exactly as if a real human used the app for 4 months.

How You Will Test This (The End-to-End Verification)
Once I have finished writing all the code, you will take the following steps to prove the system is unbreakable:

Test the Initial 4-Month Load: You will log in as the seeded user. You should immediately see complex graphs on the GigScore page and Insights page charting 4 months of financial growth, and exactly matching your total Wallet Balance.

Test The Mathematics (The Withdrawal Bug): You will go to the Withdrawal screen and type a complex decimal, like ₹1,234.56. You will withdraw it, and verify that exactly ₹1,234.56 leaves the Wallet Balance without turning into ₹123,456.

Test the Centralized Ripple Effect (The Core Feature):

Note down the user's current Wallet Balance and GigScore.
Pretend to be a Swiggy payload by hitting the "Simulate SMS Import" button on the Insights screen (which automatically triggers an Income).
Check the UI: You should see the Earning instantly appear, the Wallet Balance correctly jump up, the Micro-Savings goal perfectly incremented, and the GigScore algorithm actively recalibrate the score based on that income!