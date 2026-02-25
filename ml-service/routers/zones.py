"""
Zone discovery router — serves DBSCAN cluster results.

GET /zones/current → cached or live cluster data
GET /zones/health  → connectivity check
"""

import json
import logging
import os

from fastapi import APIRouter

from zone_clustering import run_clustering, _get_redis
from utils.db import get_engine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/zones", tags=["zones"])


@router.get("/health")
async def zones_health():
    """Check Redis, DB, and point count."""
    redis_ok = False
    db_ok = False
    point_count = 0

    # Redis check
    try:
        r = _get_redis()
        if r:
            r.ping()
            redis_ok = True
    except Exception:
        pass

    # DB check
    try:
        engine = get_engine()
        from sqlalchemy import text
        with engine.connect() as conn:
            row = conn.execute(text("SELECT COUNT(*) FROM mumbai_gps_points")).fetchone()
            point_count = row[0] if row else 0
            db_ok = True
    except Exception as exc:
        logger.warning("DB health check failed: %s", exc)

    return {
        "status": "ok",
        "redis_connected": redis_ok,
        "db_connected": db_ok,
        "point_count": point_count,
    }


@router.get("/current")
async def zones_current():
    """
    Return current cluster data.
    1. Try Redis cache
    2. Cache miss → run clustering live
    """
    # Try Redis cache first
    try:
        r = _get_redis()
        if r:
            cached = r.get("zones:clusters:current")
            if cached:
                logger.info("Serving zones from Redis cache")
                return json.loads(cached)
    except Exception as exc:
        logger.warning("Redis read failed: %s", exc)

    # Cache miss — run clustering
    logger.info("Cache miss — running live clustering")
    result = run_clustering()
    return result
