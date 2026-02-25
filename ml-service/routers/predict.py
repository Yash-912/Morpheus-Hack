"""
Earnings prediction router.

POST /predict/earnings        — upload CSV → feature engineering → per-worker forecast
GET  /predict/earnings/health — quick liveness / model-status check
"""

import io
import logging

import numpy as np
import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predict", tags=["predict"])

# ── Constants ───────────────────────────────────────────────────
INDIAN_HOLIDAYS_2023 = {
    "2023-01-26", "2023-02-18", "2023-03-08", "2023-04-07",
    "2023-04-14", "2023-05-01", "2023-08-15", "2023-09-19",
    "2023-10-02", "2023-10-24", "2023-11-13", "2023-11-14",
    "2023-11-27", "2023-12-25",
}

REQUIRED_CSV_COLS = [
    "worker_id", "date", "worked", "rainfall_mm", "temp_celsius",
    "average_rating", "incentives_earned", "net_earnings", "efficiency_ratio",
]

# 9 continuous columns the scaler was fitted on (NO net_earnings)
SCALER_COLS = [
    "rainfall_mm", "temp_celsius", "average_rating", "incentives_earned",
    "efficiency_ratio", "prev_day_earnings", "prev_7day_avg",
    "prev_30day_avg", "days_active_last_7",
]

# Final 13 features in the order the model was trained on
MODEL_FEATURE_ORDER = [
    "worked", "rainfall_mm", "temp_celsius", "average_rating",
    "incentives_earned", "efficiency_ratio", "is_weekend", "is_holiday",
    "is_month_end", "prev_day_earnings", "prev_7day_avg",
    "prev_30day_avg", "days_active_last_7",
]


# ═══════════════════════════════════════════════════════════════
#  Feature-engineering pipeline
# ═══════════════════════════════════════════════════════════════
def _engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Steps 1–2: date features + rolling / lag features."""

    # ── Step 0: parse & sort ─────────────────────────────────────
    df["date"] = pd.to_datetime(df["date"])
    df.sort_values(["worker_id", "date"], inplace=True)
    df.reset_index(drop=True, inplace=True)

    # ── Step 1: date-derived binary features ─────────────────────
    df["is_weekend"] = (df["date"].dt.dayofweek >= 5).astype(int)
    df["is_holiday"] = (
        df["date"].dt.strftime("%Y-%m-%d").isin(INDIAN_HOLIDAYS_2023).astype(int)
    )
    df["is_month_end"] = (df["date"].dt.day >= 28).astype(int)

    # ── Step 2: rolling / lag features (per worker) ──────────────
    def _per_worker(g: pd.DataFrame) -> pd.DataFrame:
        g = g.copy()
        worked_earnings = g["net_earnings"].where(g["worked"] == 1)

        g["prev_day_earnings"] = worked_earnings.shift(1).ffill()
        g["prev_7day_avg"] = (
            worked_earnings.shift(1).rolling(7, min_periods=1).mean().ffill()
        )
        g["prev_30day_avg"] = (
            worked_earnings.shift(1).rolling(30, min_periods=1).mean().ffill()
        )
        g["days_active_last_7"] = (
            g["worked"].shift(1).rolling(7, min_periods=1).sum().fillna(0)
        )

        # Fill leading NaNs with worker's own mean worked-day earnings
        worker_mean = worked_earnings.mean()
        if pd.isna(worker_mean):
            worker_mean = 0
        for col in ("prev_day_earnings", "prev_7day_avg", "prev_30day_avg"):
            g[col] = g[col].fillna(worker_mean)

        # Cast to int
        for col in ("prev_day_earnings", "prev_7day_avg", "prev_30day_avg",
                     "days_active_last_7"):
            g[col] = g[col].astype(int)

        return g

    df = df.groupby("worker_id", group_keys=False).apply(_per_worker)
    return df


# ═══════════════════════════════════════════════════════════════
#  Endpoints
# ═══════════════════════════════════════════════════════════════
@router.post("/earnings")
async def predict_earnings(file: UploadFile = File(...)):
    """
    Accept a CSV with raw platform earnings data, run the full
    feature-engineering pipeline, and return tomorrow's predicted
    earnings for every worker in the file.
    """
    from main import earnings_model          # singleton loaded at startup

    if not earnings_model.is_loaded:
        raise HTTPException(503, "Earnings model is not loaded")

    # ── 1. Read CSV ──────────────────────────────────────────────
    try:
        raw = await file.read()
        df = pd.read_csv(io.BytesIO(raw))
        logger.info("CSV received — %d rows, columns: %s", len(df), list(df.columns))
    except Exception as exc:
        logger.error("CSV parse error: %s", exc)
        raise HTTPException(400, f"Invalid CSV: {exc}")

    missing = set(REQUIRED_CSV_COLS) - set(df.columns)
    if missing:
        raise HTTPException(400, f"Missing columns: {sorted(missing)}")

    # ── 2. Feature engineering (Steps 1-2) ───────────────────────
    try:
        df = _engineer_features(df)
        logger.info("Feature engineering done — %d rows", len(df))
    except Exception as exc:
        logger.error("Feature engineering failed: %s", exc)
        raise HTTPException(500, f"Feature engineering error: {exc}")

    # ── 3. Take only the LAST row per worker ─────────────────────
    last_rows = df.groupby("worker_id").tail(1).copy()
    logger.info("Predicting for %d workers", len(last_rows))

    # ── 4. Save unscaled prev_30day_avg for confidence calc ──────
    unscaled_prev30 = last_rows.set_index("worker_id")["prev_30day_avg"].to_dict()

    # ── 5. Scale continuous features (Step 3) ────────────────────
    try:
        last_rows[SCALER_COLS] = earnings_model._scaler.transform(
            last_rows[SCALER_COLS].values
        )
    except Exception as exc:
        logger.error("Scaling failed: %s", exc)
        raise HTTPException(500, f"Scaling error: {exc}")

    # ── 6. Predict ───────────────────────────────────────────────
    results = []
    feature_matrix = last_rows[MODEL_FEATURE_ORDER].values
    worker_ids = last_rows["worker_id"].values

    predictions = earnings_model._model.predict(feature_matrix)

    for wid, pred in zip(worker_ids, predictions):
        predicted_paise = max(0, int(round(pred)))
        predicted_rupees = round(predicted_paise / 100, 2)
        confidence = earnings_model._compute_confidence(
            predicted_paise, unscaled_prev30.get(int(wid), 0)
        )
        results.append({
            "worker_id": int(wid),
            "predicted_earnings_paise": predicted_paise,
            "predicted_earnings_rupees": predicted_rupees,
            "confidence": confidence,
        })

    logger.info("Predictions complete for %d workers", len(results))
    return results


@router.get("/earnings/health")
async def earnings_health():
    from main import earnings_model
    return {"status": "ok", "model_loaded": earnings_model.is_loaded}
