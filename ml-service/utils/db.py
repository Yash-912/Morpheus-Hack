"""
Database utility — direct PostgreSQL queries via SQLAlchemy.

Reads DATABASE_URL from the backend .env (shared Neon Postgres).
"""

import logging
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any

from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load env from backend .env (shared DB) and local ml-service .env
_backend_env = os.path.join(os.path.dirname(__file__), "..", "..", "backend", ".env")
if os.path.exists(_backend_env):
    load_dotenv(_backend_env, override=False)

_ml_env = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(_ml_env):
    load_dotenv(_ml_env, override=True)

DATABASE_URL = os.getenv("DATABASE_URL", "")

# Lazy-init engine
_engine = None


def _get_engine():
    global _engine
    if _engine is None:
        from sqlalchemy import create_engine

        if not DATABASE_URL:
            raise RuntimeError("DATABASE_URL not set")
        _engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=3)
        logger.info("SQLAlchemy engine created")
    return _engine


# Public alias
get_engine = _get_engine


def get_earnings_last_90(user_id: str) -> List[Dict[str, Any]]:
    """
    Fetch earnings rows for a user from the last 90 days.

    Returns list of dicts with keys:
      date, net_amount, hours_worked, trips_count, platform
    """
    from sqlalchemy import text

    engine = _get_engine()
    cutoff = (datetime.utcnow() - timedelta(days=90)).date()

    query = text("""
        SELECT date, net_amount, hours_worked, trips_count, platform
        FROM earnings
        WHERE user_id = :uid AND date >= :cutoff
        ORDER BY date ASC
    """)

    try:
        with engine.connect() as conn:
            rows = conn.execute(query, {"uid": user_id, "cutoff": cutoff}).mappings().all()
            result = [dict(r) for r in rows]
            logger.info("Fetched %d earnings rows for user %s", len(result), user_id)
            return result
    except Exception as exc:
        logger.error("get_earnings_last_90 failed: %s", exc)
        return []


def get_expenses_last_90(user_id: str) -> List[Dict[str, Any]]:
    """
    Fetch expense rows for a user from the last 90 days.

    Returns list of dicts with keys:
      date, category, amount, is_tax_deductible, merchant
    """
    from sqlalchemy import text

    engine = _get_engine()
    cutoff = (datetime.utcnow() - timedelta(days=90)).date()

    query = text("""
        SELECT date, category, amount, is_tax_deductible, merchant
        FROM expenses
        WHERE user_id = :uid AND date >= :cutoff
        ORDER BY date ASC
    """)

    try:
        with engine.connect() as conn:
            rows = conn.execute(query, {"uid": user_id, "cutoff": cutoff}).mappings().all()
            result = [dict(r) for r in rows]
            logger.info("Fetched %d expense rows for user %s", len(result), user_id)
            return result
    except Exception as exc:
        logger.error("get_expenses_last_90 failed: %s", exc)
        return []
