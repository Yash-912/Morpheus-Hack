"""
zone_clustering.py — DBSCAN-based zone discovery for Mumbai delivery hotspots.

Fetches GPS points from PostgreSQL, normalizes features, weights them,
runs DBSCAN to discover clusters, scores each cluster using weather &
time-of-day multipliers, and caches results in Redis.
"""

import json
import logging
import math
import os
from datetime import datetime, timezone

import numpy as np
import requests
from sklearn.cluster import DBSCAN

from utils.db import get_engine

logger = logging.getLogger(__name__)

# ── Redis (optional) ────────────────────────────────────────────
_redis_client = None

def _get_redis():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    redis_url = os.getenv("REDIS_URL", "")
    if not redis_url:
        return None
    try:
        import redis as _redis
        _redis_client = _redis.from_url(redis_url, decode_responses=True)
        _redis_client.ping()
        logger.info("Redis connected for zone caching")
        return _redis_client
    except Exception as exc:
        logger.warning("Redis unavailable: %s — will skip caching", exc)
        _redis_client = None
        return None

# ── Weather fetcher ─────────────────────────────────────────────
OPENWEATHER_KEY = os.getenv("OPENWEATHER_API_KEY", "")
MUMBAI_LAT, MUMBAI_LNG = 19.0760, 72.8777

def _fetch_weather() -> dict:
    """Fetch current Mumbai weather. Returns {rainfall_mm, condition}."""
    if not OPENWEATHER_KEY:
        return {"rainfall_mm": 0.0, "condition": "unknown"}
    try:
        resp = requests.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={"lat": MUMBAI_LAT, "lon": MUMBAI_LNG, "appid": OPENWEATHER_KEY},
            timeout=5,
        )
        data = resp.json()
        rain = data.get("rain", {}).get("1h", 0.0)
        cond = data.get("weather", [{}])[0].get("main", "Clear")
        return {"rainfall_mm": rain, "condition": cond.lower()}
    except Exception as exc:
        logger.warning("Weather fetch failed: %s", exc)
        return {"rainfall_mm": 0.0, "condition": "unknown"}

# ── Multipliers ─────────────────────────────────────────────────
def _weather_multiplier(rainfall_mm: float) -> float:
    if rainfall_mm > 30:
        return 1.60
    if rainfall_mm > 15:
        return 1.35
    if rainfall_mm > 5:
        return 1.15
    return 1.00

def _time_multiplier(hour: int) -> tuple[float, str]:
    if 6 <= hour < 10:
        return 0.70, "morning"
    if 10 <= hour < 14:
        return 1.30, "lunch_rush"
    if 14 <= hour < 18:
        return 0.75, "afternoon"
    if 18 <= hour < 22:
        return 1.60, "evening"
    # 22-2 late night
    return 0.85, "late_night"

# ── Haversine ───────────────────────────────────────────────────
def _haversine_km(lat1, lng1, lat2, lng2):
    R = 6371
    dLat = math.radians(lat2 - lat1)
    dLng = math.radians(lng2 - lng1)
    a = (math.sin(dLat / 2) ** 2 +
         math.cos(math.radians(lat1)) *
         math.cos(math.radians(lat2)) *
         math.sin(dLng / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

# ══════════════════════════════════════════════════════════════════
#  Main clustering function
# ══════════════════════════════════════════════════════════════════
def run_clustering() -> dict:
    """
    Fetch 500 GPS points → normalise → DBSCAN → score clusters → cache.
    Returns the full result dict.
    """
    logger.info("Starting zone clustering…")

    # ── STEP 1: Fetch points from PostgreSQL ────────────────────
    engine = get_engine()
    from sqlalchemy import text
    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT lat, lng, avg_earnings, avg_incentives, "
            "total_orders, active_workers FROM mumbai_gps_points"
        )).fetchall()

    if not rows:
        logger.warning("No GPS points found in DB")
        return _empty_result("No GPS points")

    points = [dict(r._mapping) for r in rows]
    n = len(points)
    logger.info("Fetched %d GPS points", n)

    # ── STEP 2: Normalise features & compute weight ──────────────
    earnings   = np.array([p["avg_earnings"] for p in points])
    incentives = np.array([p["avg_incentives"] for p in points])
    orders     = np.array([p["total_orders"] for p in points])
    workers    = np.array([p["active_workers"] for p in points])

    def _norm(arr):
        mn, mx = arr.min(), arr.max()
        return (arr - mn) / (mx - mn) if mx > mn else np.zeros_like(arr)

    norm_e = _norm(earnings)
    norm_i = _norm(incentives)
    norm_o = _norm(orders)
    norm_w = _norm(workers)

    weights = norm_e * 0.40 + norm_i * 0.25 + norm_o * 0.25 + norm_w * 0.10

    # ── STEP 3: Repeat points by weight ─────────────────────────
    coords = np.array([[p["lat"], p["lng"]] for p in points])
    weight_counts = np.maximum(1, np.round(weights * 10).astype(int))
    weighted_coords = np.repeat(coords, repeats=weight_counts, axis=0)
    # Track which original index each weighted row came from
    orig_indices = np.repeat(np.arange(n), repeats=weight_counts)

    logger.info("Weighted coords: %d → %d rows", n, len(weighted_coords))

    # ── STEP 4: DBSCAN ──────────────────────────────────────────
    db = DBSCAN(
        eps=0.5 / 6371,       # 0.5 km in radians
        min_samples=5,
        algorithm="ball_tree",
        metric="haversine",
    ).fit(np.radians(weighted_coords))

    labels = db.labels_
    unique_labels = set(labels)
    unique_labels.discard(-1)
    noise_count = int(np.sum(labels == -1))

    logger.info("DBSCAN found %d clusters, %d noise rows", len(unique_labels), noise_count)

    # ── STEP 5: Compute cluster properties ──────────────────────
    clusters = []
    for cluster_id in sorted(unique_labels):
        mask = labels == cluster_id
        member_orig = set(orig_indices[mask])

        cluster_points = [points[i] for i in member_orig]
        cp_lats = [p["lat"] for p in cluster_points]
        cp_lngs = [p["lng"] for p in cluster_points]
        center_lat = float(np.mean(cp_lats))
        center_lng = float(np.mean(cp_lngs))

        avg_earn = float(np.mean([p["avg_earnings"] for p in cluster_points]))
        avg_incn = float(np.mean([p["avg_incentives"] for p in cluster_points]))
        avg_ord  = float(np.mean([p["total_orders"] for p in cluster_points]))
        point_count = len(cluster_points)

        radius_km = max(
            _haversine_km(center_lat, center_lng, p["lat"], p["lng"])
            for p in cluster_points
        ) if cluster_points else 0.0

        clusters.append({
            "cluster_id": int(cluster_id),
            "center_lat": round(center_lat, 4),
            "center_lng": round(center_lng, 4),
            "radius_km": round(radius_km, 2),
            "avg_earnings": round(avg_earn, 1),
            "avg_incentives": round(avg_incn, 1),
            "avg_orders": round(avg_ord, 1),
            "point_count": point_count,
        })

    # ── STEP 6: Score clusters ──────────────────────────────────
    weather = _fetch_weather()
    w_mult = _weather_multiplier(weather["rainfall_mm"])
    now_hour = datetime.now().hour
    t_mult, time_block = _time_multiplier(now_hour)

    max_cluster_size = max((c["point_count"] for c in clusters), default=1)

    for c in clusters:
        earnings_norm = c["avg_earnings"] / 220.0

        score = (
            earnings_norm * 0.40 +
            (t_mult / 1.60) * 0.30 +
            (w_mult / 1.60) * 0.20 +
            (c["point_count"] / max_cluster_size) * 0.10
        ) * 100
        score = round(min(100, max(0, score)), 1)

        if score >= 70:
            demand = "high"
        elif score >= 40:
            demand = "medium"
        else:
            demand = "low"

        est_earn = round(c["avg_earnings"] * w_mult * t_mult, 0)

        c["score"] = score
        c["demand_level"] = demand
        c["est_earnings_per_hr"] = int(est_earn)

    # Sort by score descending
    clusters.sort(key=lambda c: c["score"], reverse=True)

    result = {
        "clusters": clusters,
        "total_clusters": len(clusters),
        "noise_points": noise_count,
        "weather_condition": weather["condition"],
        "rainfall_mm": weather["rainfall_mm"],
        "time_block": time_block,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

    # ── STEP 7: Cache in Redis ──────────────────────────────────
    r = _get_redis()
    if r:
        try:
            payload = json.dumps(result)
            r.setex("zones:clusters:current", 300, payload)
            top5 = json.dumps({"clusters": clusters[:5], "generated_at": result["generated_at"]})
            r.setex("zones:top5:current", 300, top5)
            logger.info("Cached clusters in Redis (TTL 300s)")
        except Exception as exc:
            logger.warning("Redis cache write failed: %s", exc)

    logger.info(
        "Clustering complete: %d clusters, top score %.1f, noise %d",
        len(clusters),
        clusters[0]["score"] if clusters else 0,
        noise_count,
    )
    return result


def _empty_result(reason: str) -> dict:
    return {
        "clusters": [],
        "total_clusters": 0,
        "noise_points": 0,
        "weather_condition": "unknown",
        "rainfall_mm": 0.0,
        "time_block": "unknown",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "error": reason,
    }
