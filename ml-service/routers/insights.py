"""
Financial insights router — LLM-powered personalised advice.

GET /insights/{user_id}  → last 7 days earnings + expenses → LLM → structured insights
GET /insights/health     → connectivity check

Falls back to DATA-DRIVEN insights (not generic seeds) when LLM is unavailable.
"""

import json
import logging
import os
from collections import defaultdict
from datetime import datetime, timedelta

from dotenv import load_dotenv
load_dotenv()  # load ml-service/.env

from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from schemas.insights_schema import InsightItem, InsightsResponse
from utils.db import get_engine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/insights", tags=["insights"])

# ── LLM config ──────────────────────────────────────────────────
INSIGHTS_MODEL_API_KEY = os.getenv("INSIGHTS_MODEL_API_KEY", "")
INSIGHTS_MODEL_NAME = os.getenv(
    "INSIGHTS_MODEL_NAME",
    "meta-llama/llama-3.2-3b-instruct:free",
)
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


# ═══════════════════════════════════════════════════════════════
#  Data fetching — last 7 days from actual tables
# ═══════════════════════════════════════════════════════════════
def _fetch_last7_earnings(user_id: str) -> list[dict]:
    """Get last 7 days of earnings from forecast_data table."""
    engine = get_engine()
    cutoff = (datetime.utcnow() - timedelta(days=7)).date()
    try:
        with engine.connect() as conn:
            rows = conn.execute(text("""
                SELECT date, net_earnings, incentives_earned, total_earnings, worked
                FROM forecast_data
                WHERE user_id = :uid AND date >= :cutoff
                ORDER BY date ASC
            """), {"uid": user_id, "cutoff": cutoff}).mappings().all()
            return [dict(r) for r in rows]
    except Exception as exc:
        logger.error("Failed to fetch earnings: %s", exc)
        return []


def _fetch_last7_expenses(user_id: str) -> list[dict]:
    """Get last 7 days of expenses from expenses table."""
    engine = get_engine()
    cutoff = (datetime.utcnow() - timedelta(days=7)).date()
    try:
        with engine.connect() as conn:
            rows = conn.execute(text("""
                SELECT date, amount, category, merchant, is_tax_deductible
                FROM expenses
                WHERE user_id = :uid AND date >= :cutoff
                ORDER BY date ASC
            """), {"uid": user_id, "cutoff": cutoff}).mappings().all()
            return [dict(r) for r in rows]
    except Exception as exc:
        logger.error("Failed to fetch expenses: %s", exc)
        return []


# ═══════════════════════════════════════════════════════════════
#  Data-driven insights — NO LLM needed
# ═══════════════════════════════════════════════════════════════
def _generate_data_insights(earnings: list[dict], expenses: list[dict]) -> list[dict]:
    """
    Generate personalised insights from real data.
    This runs when LLM is unavailable or as primary output.
    Every insight references actual numbers from the user's data.
    """
    insights = []

    # ── Earnings analysis ──────────────────────────────────────
    total_earned_paise = 0
    days_worked = 0
    best_day_earn = 0
    best_day_date = ""
    worst_day_earn = float("inf")
    worst_day_date = ""

    for row in earnings:
        net = float(row.get("net_earnings") or 0)
        inc = float(row.get("incentives_earned") or 0)
        worked = int(row.get("worked") or 0)
        day_total = net + inc
        total_earned_paise += day_total

        if worked:
            days_worked += 1
            d = row.get("date")
            if isinstance(d, datetime):
                d_str = d.strftime("%d %b")
            elif hasattr(d, "strftime"):
                d_str = d.strftime("%d %b")
            else:
                d_str = str(d)[:10]

            if day_total > best_day_earn:
                best_day_earn = day_total
                best_day_date = d_str
            if day_total < worst_day_earn:
                worst_day_earn = day_total
                worst_day_date = d_str

    total_earned_rs = round(total_earned_paise / 100, 0)
    avg_daily_rs = round(total_earned_rs / max(days_worked, 1), 0)
    best_rs = round(best_day_earn / 100, 0)
    worst_rs = round(worst_day_earn / 100, 0) if worst_day_earn < float("inf") else 0

    if days_worked > 0:
        insights.append({
            "type": "earnings_pattern",
            "title": f"You earned ₹{total_earned_rs:,.0f} in the last 7 days",
            "body": f"You worked {days_worked} days with an average of ₹{avg_daily_rs:,.0f}/day. "
                    f"Your best day was {best_day_date} (₹{best_rs:,.0f}) "
                    f"and your slowest day was {worst_day_date} (₹{worst_rs:,.0f}).",
            "action": f"Try to replicate what made {best_day_date} successful — same time slots, same areas.",
        })

    # ── Expenses analysis ──────────────────────────────────────
    total_spent_paise = 0
    by_category: dict[str, float] = defaultdict(float)
    tax_deductible_paise = 0

    for row in expenses:
        amt = float(row.get("amount") or 0)
        total_spent_paise += amt
        cat = str(row.get("category") or "other").lower()
        by_category[cat] += amt
        if row.get("is_tax_deductible"):
            tax_deductible_paise += amt

    total_spent_rs = round(total_spent_paise / 100, 0)

    if by_category:
        # Find top spending category
        top_cat = max(by_category, key=by_category.get)
        top_cat_rs = round(by_category[top_cat] / 100, 0)
        top_pct = round((by_category[top_cat] / total_spent_paise) * 100, 0) if total_spent_paise > 0 else 0

        cat_breakdown = ", ".join(
            f"{cat}: ₹{v/100:,.0f}" for cat, v in sorted(by_category.items(), key=lambda x: -x[1])
        )

        insights.append({
            "type": "spending",
            "title": f"You spent ₹{total_spent_rs:,.0f} — {top_cat} is {top_pct}% of it",
            "body": f"Your spending breakdown: {cat_breakdown}. "
                    f"{top_cat.capitalize()} is your biggest expense at ₹{top_cat_rs:,.0f}.",
            "action": f"Look for ways to cut {top_cat} costs — even a 20% reduction saves ₹{top_cat_rs*0.2:,.0f}/week.",
        })

    # ── Savings insight ────────────────────────────────────────
    net_savings_rs = total_earned_rs - total_spent_rs
    if total_earned_rs > 0:
        savings_pct = round((net_savings_rs / total_earned_rs) * 100, 0)
        expense_pct = round((total_spent_rs / total_earned_rs) * 100, 0)

        if net_savings_rs > 0:
            monthly_proj = round(net_savings_rs * 4, 0)
            insights.append({
                "type": "savings",
                "title": f"You saved ₹{net_savings_rs:,.0f} this week ({savings_pct}% savings rate)",
                "body": f"You earned ₹{total_earned_rs:,.0f} and spent ₹{total_spent_rs:,.0f} ({expense_pct}% expense ratio). "
                        f"At this rate, you'll save ~₹{monthly_proj:,.0f}/month.",
                "action": "Set aside ₹50/day into a separate savings account to build a safety net.",
            })
        else:
            insights.append({
                "type": "savings",
                "title": f"Your expenses (₹{total_spent_rs:,.0f}) exceeded earnings (₹{total_earned_rs:,.0f})",
                "body": f"You're spending {expense_pct}% of your earnings. "
                        f"The biggest drain is {top_cat} at ₹{round(by_category.get(top_cat, 0)/100):,.0f}.",
                "action": "Track every expense this week and identify at least 2 non-essential spends to cut.",
            })

    # ── Tax deduction insight ──────────────────────────────────
    tax_deductible_rs = round(tax_deductible_paise / 100, 0)
    if tax_deductible_rs > 0:
        annual_proj = round(tax_deductible_rs * 52, 0)
        tax_saved = round(annual_proj * 0.05, 0)  # ~5% effective tax rate for gig workers
        insights.append({
            "type": "tax",
            "title": f"₹{tax_deductible_rs:,.0f} of your expenses are tax-deductible",
            "body": f"Fuel, tolls, and vehicle maintenance qualify under Section 44AD. "
                    f"Projected annual deduction: ~₹{annual_proj:,.0f}, potentially saving ~₹{tax_saved:,.0f} in tax.",
            "action": "Keep saving SMS receipts in GigPay — they auto-classify tax-deductible expenses.",
        })

    # If we have no insights at all (no data), add a generic one
    if not insights:
        insights.append({
            "type": "advice",
            "title": "Start tracking your earnings and expenses",
            "body": "Once you have a few days of data, GigPay will give you personalised insights on your spending patterns and savings opportunities.",
            "action": "Seed your earnings data and import SMS expenses to get started.",
        })

    return insights


# ═══════════════════════════════════════════════════════════════
#  LLM prompt building
# ═══════════════════════════════════════════════════════════════
SYSTEM_PROMPT = """You are GigPay's financial advisor for Indian gig workers (delivery partners).
You speak simply and practically. You give specific, data-driven
advice based ONLY on the numbers provided. Every insight MUST reference
actual figures from the data. Keep response concise.
Format your response as a JSON array of insight objects exactly like this:
[
  {
    "type": "spending",
    "title": "Short clear title",
    "body": "2-3 sentences referencing actual numbers from the data",
    "action": "One specific actionable step"
  }
]
Types must be one of: spending, savings, tax, earnings_pattern, advice
Return ONLY valid JSON. No markdown, no extra text before or after the array."""


def _build_prompt(earnings: list[dict], expenses: list[dict]) -> str:
    """Build a focused prompt using last 7 days of real data."""
    daily_lines = []
    total_earned = 0
    days_worked = 0

    for row in earnings:
        d = row.get("date")
        if isinstance(d, datetime):
            d = d.strftime("%d %b")
        elif hasattr(d, "strftime"):
            d = d.strftime("%d %b")
        else:
            d = str(d)[:10]
        net = float(row.get("net_earnings") or 0)
        inc = float(row.get("incentives_earned") or 0)
        worked = int(row.get("worked") or 0)
        total_earned += net + inc
        if worked:
            days_worked += 1
            daily_lines.append(f"  {d}: earned Rs.{net/100:.0f} + Rs.{inc/100:.0f} incentive")
        else:
            daily_lines.append(f"  {d}: day off")

    by_cat: dict[str, float] = defaultdict(float)
    total_spent = 0
    expense_lines = []
    for row in expenses:
        amt = float(row.get("amount") or 0)
        total_spent += amt
        cat = str(row.get("category") or "other")
        merchant = row.get("merchant") or "unknown"
        by_cat[cat] += amt
        expense_lines.append(f"  Rs.{amt/100:.0f} on {cat} ({merchant})")

    cat_lines = "\n".join(f"  {c}: Rs.{v/100:.0f}" for c, v in by_cat.items())

    return f"""Last 7 days for a Zomato delivery partner in Mumbai:

EARNINGS:
{chr(10).join(daily_lines) or '  No data'}
Total: Rs.{total_earned/100:.0f} | Days worked: {days_worked} | Avg: Rs.{total_earned/100/max(days_worked,1):.0f}/day

EXPENSES:
{chr(10).join(expense_lines) or '  None'}
By category:
{cat_lines or '  None'}
Total spent: Rs.{total_spent/100:.0f}

NET: Rs.{(total_earned-total_spent)/100:.0f}

Give 4 insights:
1. Earnings summary with actual daily amounts
2. Spending analysis with categories
3. Savings tip with real numbers
4. One action they can do this week"""


# ═══════════════════════════════════════════════════════════════
#  LLM call
# ═══════════════════════════════════════════════════════════════
def _call_llm(user_prompt: str) -> list[dict] | None:
    """Call OpenRouter API. Returns parsed JSON list or None."""
    if not INSIGHTS_MODEL_API_KEY:
        logger.info("No LLM API key — skipping LLM call")
        return None

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
            timeout=15,
        )
        raw = response.choices[0].message.content.strip()
        logger.info("LLM raw response length: %d chars", len(raw))

        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1]
            if raw.endswith("```"):
                raw = raw[: raw.rfind("```")]
            raw = raw.strip()

        parsed = json.loads(raw)
        if not isinstance(parsed, list):
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
    connected = False
    try:
        from openai import OpenAI
        client = OpenAI(api_key=INSIGHTS_MODEL_API_KEY, base_url=OPENROUTER_BASE_URL)
        resp = client.chat.completions.create(
            model=INSIGHTS_MODEL_NAME,
            messages=[{"role": "user", "content": "ping"}],
            max_tokens=5, timeout=5,
        )
        connected = bool(resp.choices)
    except Exception as exc:
        logger.warning("Insights LLM check failed: %s", exc)

    return {"status": "ok", "llm_connected": connected}


@router.get("/{user_id}")
async def get_insights(user_id: str):
    """
    Last 7 days earnings + expenses → LLM (if available) → data-driven insights.
    NEVER returns generic seeds — always uses actual user data.
    """

    # 1. Fetch LAST 7 DAYS data
    earnings = _fetch_last7_earnings(user_id)
    expenses = _fetch_last7_expenses(user_id)

    logger.info(
        "User %s — fetched %d earnings rows, %d expense rows (last 7 days)",
        user_id, len(earnings), len(expenses),
    )

    # 2. If no data at all → return a "get started" message
    if not earnings and not expenses:
        logger.info("No data for user %s", user_id)
        return InsightsResponse(
            user_id=user_id,
            insights=[InsightItem(
                type="advice",
                title="No data yet — let's get started",
                body="Seed your earnings data and import a few SMS to see personalised financial insights here.",
                action="Tap 'Seed Earnings Data' and 'Simulate SMS Import' on the chart page.",
            )],
            is_seeded=True,
        )

    # 3. Try LLM first
    user_prompt = _build_prompt(earnings, expenses)
    logger.info("Prompt built (%d chars), calling LLM...", len(user_prompt))
    llm_result = _call_llm(user_prompt)

    if llm_result:
        try:
            validated = [InsightItem(**item) for item in llm_result]
            logger.info("Generated %d LLM insights for user %s", len(validated), user_id)
            return InsightsResponse(user_id=user_id, insights=validated, is_seeded=False)
        except Exception as exc:
            logger.error("LLM response validation failed: %s", exc)

    # 4. LLM failed → generate DATA-DRIVEN insights from real numbers
    logger.info("LLM unavailable — generating data-driven insights for user %s", user_id)
    data_insights = _generate_data_insights(earnings, expenses)

    return InsightsResponse(
        user_id=user_id,
        insights=[InsightItem(**i) for i in data_insights],
        is_seeded=False,  # NOT seeded — these use real data
    )
