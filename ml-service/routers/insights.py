"""
Financial insights router — LLM-powered personalised advice.

GET /insights/{user_id}  → aggregated data → OpenRouter LLM → structured insights
GET /insights/health     → connectivity check
"""

import json
import logging
import os
from collections import defaultdict
from datetime import datetime

from dotenv import load_dotenv
load_dotenv()  # load ml-service/.env

from fastapi import APIRouter, HTTPException

from schemas.insights_schema import InsightItem, InsightsResponse
from utils.db import get_earnings_last_90, get_expenses_last_90

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/insights", tags=["insights"])

# ── LLM config ──────────────────────────────────────────────────
INSIGHTS_MODEL_API_KEY = os.getenv("INSIGHTS_MODEL_API_KEY", "")
INSIGHTS_MODEL_NAME = os.getenv(
    "INSIGHTS_MODEL_NAME",
    "meta-llama/llama-3.2-3b-instruct:free",
)
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# ── Day-of-week labels ──────────────────────────────────────────
DOW_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

# ── Seed insights (returned when data is empty or LLM fails) ───
SEED_INSIGHTS: list[dict] = [
    {
        "type": "earnings_pattern",
        "title": "Friday and Saturday are your best earning days",
        "body": "Zomato delivery partners in Mumbai typically earn 30-40% more on weekends due to higher order volumes. Prioritise being online from 7PM to 11PM on these days.",
        "action": "Set a goal to complete 25+ orders on Fridays to hit the Rs.250 incentive tier.",
    },
    {
        "type": "tax",
        "title": "Your fuel and toll expenses are tax deductible",
        "body": "As a gig worker under Section 44AD, fuel, toll, and vehicle maintenance expenses can be claimed as business deductions, reducing your taxable income significantly.",
        "action": "Save all fuel receipts and FASTag statements. GigPay auto-tracks these from your SMS.",
    },
    {
        "type": "savings",
        "title": "Start a Rs.50 daily savings habit",
        "body": "Setting aside just Rs.50 per working day adds up to Rs.1,500 per month and Rs.18,000 per year — enough to cover a major vehicle repair without going into debt.",
        "action": "Enable round-up savings in GigPay to automatically save spare change after each payout.",
    },
    {
        "type": "spending",
        "title": "Fuel is typically the biggest controllable expense",
        "body": "Most Mumbai delivery partners spend 25-35% of earnings on fuel. Switching to a CNG vehicle or electric bike can cut this by up to 60%, adding Rs.3,000+ to monthly savings.",
        "action": "Check BEST and government EV subsidy schemes available for gig workers in Maharashtra.",
    },
    {
        "type": "advice",
        "title": "Build a 30-day emergency fund first",
        "body": "Before any investment, aim to save one month of average earnings (around Rs.30,000) as an emergency fund. This protects you during illness, vehicle breakdown, or platform downtime.",
        "action": "Open a separate zero-balance savings account and transfer Rs.1,000 after every 10 working days.",
    },
]


# ═══════════════════════════════════════════════════════════════
#  Helper — aggregate raw rows into the summary JSON
# ═══════════════════════════════════════════════════════════════
def _aggregate(
    earnings: list[dict],
    expenses: list[dict],
) -> dict:
    """
    Turn raw DB rows into the pre-aggregated JSON structure
    described in the spec.  All monetary values → rupees.
    """

    # ── Earnings aggregation ────────────────────────────────────
    total_earnings_paise = 0
    monthly_earnings: dict[str, dict] = defaultdict(
        lambda: {"total_paise": 0, "days_worked": 0}
    )
    dow_earnings: dict[int, list[float]] = defaultdict(list)
    total_trips = 0
    total_hours = 0.0
    days_worked = 0
    platform = "Zomato"  # default

    for row in earnings:
        d = row["date"]
        if isinstance(d, str):
            d = datetime.fromisoformat(d)
        net = int(row.get("net_amount") or 0)
        total_earnings_paise += net
        trips = int(row.get("trips_count") or 0)
        hours = float(row.get("hours_worked") or 0)
        total_trips += trips
        total_hours += hours
        days_worked += 1
        if row.get("platform"):
            platform = row["platform"]

        month_label = d.strftime("%B %Y")  # e.g. "November 2023"
        monthly_earnings[month_label]["total_paise"] += net
        monthly_earnings[month_label]["days_worked"] += 1

        dow_earnings[d.weekday()].append(net / 100)

    total_earnings_rupees = round(total_earnings_paise / 100, 2)

    # Monthly breakdown
    monthly_breakdown = []
    for month, data in monthly_earnings.items():
        total_r = round(data["total_paise"] / 100, 2)
        days = data["days_worked"] or 1
        monthly_breakdown.append({
            "month": month,
            "total_rupees": total_r,
            "avg_daily_rupees": round(total_r / days, 2),
            "days_worked": days,
        })

    # Best / worst day of week
    dow_avg = {
        dow: (sum(vals) / len(vals)) if vals else 0
        for dow, vals in dow_earnings.items()
    }
    best_dow = DOW_NAMES[max(dow_avg, key=dow_avg.get)] if dow_avg else "Saturday"
    worst_dow = DOW_NAMES[min(dow_avg, key=dow_avg.get)] if dow_avg else "Monday"

    avg_trips = round(total_trips / max(days_worked, 1), 1)
    avg_hours = round(total_hours / max(days_worked, 1), 1)

    # ── Expenses aggregation ────────────────────────────────────
    total_expenses_paise = 0
    by_category: dict[str, int] = defaultdict(int)
    tax_deductible_paise = 0

    for row in expenses:
        amt = int(row.get("amount") or 0)
        total_expenses_paise += amt
        cat = str(row.get("category") or "other").lower()
        by_category[cat] += amt
        if row.get("is_tax_deductible"):
            tax_deductible_paise += amt

    total_expenses_rupees = round(total_expenses_paise / 100, 2)
    by_category_rupees = {k: round(v / 100, 2) for k, v in by_category.items()}
    tax_deductible_rupees = round(tax_deductible_paise / 100, 2)

    expense_ratio = (
        round((total_expenses_rupees / total_earnings_rupees) * 100, 1)
        if total_earnings_rupees > 0
        else 0
    )

    net_savings = round(total_earnings_rupees - total_expenses_rupees, 2)
    savings_rate = round(100 - expense_ratio, 1)

    return {
        "worker_summary": {
            "platform": platform,
            "city": "Mumbai",
            "period": "last 90 days",
        },
        "earnings": {
            "total_rupees": total_earnings_rupees,
            "monthly_breakdown": monthly_breakdown,
            "best_day_of_week": best_dow,
            "worst_day_of_week": worst_dow,
            "avg_trips_per_day": avg_trips,
            "avg_hours_per_day": avg_hours,
        },
        "expenses": {
            "total_rupees": total_expenses_rupees,
            "by_category": by_category_rupees,
            "tax_deductible_total_rupees": tax_deductible_rupees,
            "expense_to_earnings_ratio_percent": expense_ratio,
        },
        "net_savings_rupees": net_savings,
        "savings_rate_percent": savings_rate,
    }


# ═══════════════════════════════════════════════════════════════
#  Helper — build prompts
# ═══════════════════════════════════════════════════════════════
SYSTEM_PROMPT = """You are GigPay's financial advisor for Indian gig workers.
You speak simply and practically. You give specific, data-driven
advice based only on the numbers provided. You never give generic
advice. Every insight must reference actual figures from the data.
Keep response concise — maximum 5 insights, each 2-3 sentences.
Format your response as a JSON array of insight objects exactly like this:
[
  {
    "type": "spending",
    "title": "Fuel is your biggest expense",
    "body": "You spent Rs.120 on fuel this quarter, which is 38% of your total expenses. Consider carpooling with other delivery partners on slow days to reduce this.",
    "action": "Track your fuel receipts — they are 100% tax deductible."
  }
]
Types must be one of: spending, savings, tax, earnings_pattern, advice
Return only valid JSON. No extra text before or after the array."""


def _build_user_prompt(agg: dict) -> str:
    e = agg["earnings"]
    x = agg["expenses"]
    w = agg["worker_summary"]

    monthly_lines = "\n".join(
        f"  - {m['month']}: Rs.{m['total_rupees']} ({m['days_worked']} days, avg Rs.{m['avg_daily_rupees']}/day)"
        for m in e["monthly_breakdown"]
    )

    cat_lines = "\n".join(
        f"  - {cat}: Rs.{amt}" for cat, amt in x["by_category"].items()
    )

    avg_daily = round(e["total_rupees"] / max(sum(m["days_worked"] for m in e["monthly_breakdown"]), 1), 2)

    return f"""Here is the financial data for a {w['platform']} delivery partner in {w['city']}
for the last 90 days:

Earnings:
- Total earned: Rs.{e['total_rupees']}
- Monthly breakdown:
{monthly_lines}
- Best earning day: {e['best_day_of_week']}
- Worst earning day: {e['worst_day_of_week']}
- Average daily earnings: Rs.{avg_daily}
- Average trips per day: {e['avg_trips_per_day']}

Expenses:
- Total spent: Rs.{x['total_rupees']}
- Breakdown by category:
{cat_lines}
- Tax deductible amount: Rs.{x['tax_deductible_total_rupees']}
- Expenses as % of earnings: {x['expense_to_earnings_ratio_percent']}%

Savings:
- Net savings: Rs.{agg['net_savings_rupees']}
- Savings rate: {agg['savings_rate_percent']}%

Provide 5 personalised insights and actionable advice based on this
data. Focus on spending patterns, savings opportunities, tax deductions,
and earnings optimisation. Keep advice specific to a Mumbai gig
worker's real situation."""


# ═══════════════════════════════════════════════════════════════
#  Helper — call OpenRouter LLM
# ═══════════════════════════════════════════════════════════════
def _call_llm(user_prompt: str) -> list[dict] | None:
    """Call OpenRouter API via openai SDK. Returns parsed JSON list or None."""
    try:
        from openai import OpenAI

        client = OpenAI(
            api_key=INSIGHTS_MODEL_API_KEY,
            base_url=OPENROUTER_BASE_URL,
        )

        response = client.chat.completions.create(
            model=INSIGHTS_MODEL_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=2048,
            timeout=10,
        )

        raw = response.choices[0].message.content.strip()
        logger.info("LLM raw response length: %d chars", len(raw))

        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1]
            if raw.endswith("```"):
                raw = raw[: raw.rfind("```")]
            raw = raw.strip()

        parsed = json.loads(raw)
        if not isinstance(parsed, list):
            logger.warning("LLM response is not a list, falling back to seed")
            return None

        return parsed

    except json.JSONDecodeError as exc:
        logger.error("LLM response is not valid JSON: %s", exc)
        return None
    except Exception as exc:
        logger.error("LLM call failed: %s", exc)
        return None


# ═══════════════════════════════════════════════════════════════
#  Endpoints
# ═══════════════════════════════════════════════════════════════
@router.get("/health", name="insights_health")
async def insights_health():
    """Quick check: can we reach the LLM API?"""
    connected = False
    try:
        from openai import OpenAI

        client = OpenAI(
            api_key=INSIGHTS_MODEL_API_KEY,
            base_url=OPENROUTER_BASE_URL,
        )
        resp = client.chat.completions.create(
            model=INSIGHTS_MODEL_NAME,
            messages=[{"role": "user", "content": "ping"}],
            max_tokens=5,
            timeout=5,
        )
        connected = bool(resp.choices)
    except Exception as exc:
        logger.warning("Insights health check failed: %s", exc)

    return {"status": "ok", "groq_connected": connected}


@router.get("/{user_id}")
async def get_insights(user_id: str):
    """
    Fetch earnings + expenses → aggregate → LLM → structured insights.
    Falls back to seed insights on any failure.
    """

    # 1. Fetch data from PostgreSQL
    earnings = get_earnings_last_90(user_id)
    expenses = get_expenses_last_90(user_id)

    # 2. If no data at all → return seed insights immediately
    if not earnings and not expenses:
        logger.info("No data for user %s — returning seed insights", user_id)
        return InsightsResponse(
            user_id=user_id,
            insights=[InsightItem(**s) for s in SEED_INSIGHTS],
            is_seeded=True,
        )

    # 3. Aggregate
    try:
        aggregated = _aggregate(earnings, expenses)
    except Exception as exc:
        logger.error("Aggregation failed: %s — returning seed", exc)
        return InsightsResponse(
            user_id=user_id,
            insights=[InsightItem(**s) for s in SEED_INSIGHTS],
            is_seeded=True,
        )

    # 4. Build prompt and call LLM
    user_prompt = _build_user_prompt(aggregated)
    llm_result = _call_llm(user_prompt)

    # 5. Parse and validate
    if llm_result is None:
        logger.info("LLM failed — returning seed insights for user %s", user_id)
        return InsightsResponse(
            user_id=user_id,
            insights=[InsightItem(**s) for s in SEED_INSIGHTS],
            is_seeded=True,
        )

    try:
        validated = [InsightItem(**item) for item in llm_result]
    except Exception as exc:
        logger.error("LLM response validation failed: %s — returning seed", exc)
        return InsightsResponse(
            user_id=user_id,
            insights=[InsightItem(**s) for s in SEED_INSIGHTS],
            is_seeded=True,
        )

    logger.info("Generated %d live insights for user %s", len(validated), user_id)
    return InsightsResponse(
        user_id=user_id,
        insights=validated,
        is_seeded=False,
    )

