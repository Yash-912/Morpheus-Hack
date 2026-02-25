"""
EarningsModel — wrapper around a pre-trained GradientBoostingRegressor
that predicts a gig worker's net daily earnings (in paise).
"""

import logging
import os

import joblib
import numpy as np

logger = logging.getLogger(__name__)

# ── Feature order expected by the scaler ─────────────────────────
# The scaler was fitted on these 9 columns (no net_earnings):
SCALER_COLS = [
    "rainfall_mm",
    "temp_celsius",
    "average_rating",
    "incentives_earned",
    "efficiency_ratio",
    "prev_day_earnings",
    "prev_7day_avg",
    "prev_30day_avg",
    "days_active_last_7",
]

# Binary features that must NOT be scaled
BINARY_COLS = ["worked", "is_weekend", "is_holiday", "is_month_end"]

# Full feature order for the model (must match training order exactly)
MODEL_FEATURE_ORDER = [
    "worked", "rainfall_mm", "temp_celsius", "average_rating",
    "incentives_earned", "efficiency_ratio", "is_weekend",
    "is_holiday", "is_month_end", "prev_day_earnings", "prev_7day_avg",
    "prev_30day_avg", "days_active_last_7",
]


class EarningsModel:
    """Load and run the earnings prediction model + its scaler."""

    def __init__(self):
        self._model = None
        self._scaler = None

    # ── public helpers ──────────────────────────────────────────
    @property
    def is_loaded(self) -> bool:
        return self._model is not None and self._scaler is not None

    # ── load ────────────────────────────────────────────────────
    def load(self, path: str = "./data/saved_models") -> None:
        """Load the gradient-boosting model and its StandardScaler."""
        model_path = os.path.join(path, "earnings_model.joblib")
        scaler_path = os.path.join(path, "earnings_scaler.joblib")

        try:
            self._model = joblib.load(model_path)
            logger.info("Earnings model loaded from %s", model_path)
        except Exception as exc:
            logger.error("Failed to load earnings model: %s", exc)
            self._model = None

        try:
            self._scaler = joblib.load(scaler_path)
            logger.info("Earnings scaler loaded from %s", scaler_path)
        except Exception as exc:
            logger.error("Failed to load earnings scaler: %s", exc)
            self._scaler = None

    # ── predict ─────────────────────────────────────────────────
    def predict(self, features_dict: dict) -> dict:
        """
        Predict net daily earnings.

        Parameters
        ----------
        features_dict : dict
            Must contain the keys listed in ``SCALER_COLS`` + ``BINARY_COLS``.

        Returns
        -------
        dict  with ``predicted_earnings_paise``, ``predicted_earnings_rupees``,
              and ``confidence``.
        """
        if not self.is_loaded:
            logger.error("EarningsModel.predict() called but model is not loaded")
            return {
                "predicted_earnings_paise": 0,
                "predicted_earnings_rupees": 0.0,
                "confidence": 0.0,
            }

        try:
            # 1. Build features in exact MODEL_FEATURE_ORDER
            raw = {col: float(features_dict[col]) for col in MODEL_FEATURE_ORDER}

            # 2. Scale the continuous features only
            continuous = np.array([[raw[c] for c in SCALER_COLS]])
            scaled_vals = self._scaler.transform(continuous)[0]
            scaled_map = dict(zip(SCALER_COLS, scaled_vals))

            # 3. Build final feature vector in training order
            X = np.array([[
                scaled_map[col] if col in scaled_map else raw[col]
                for col in MODEL_FEATURE_ORDER
            ]])  # → (1, 13)

            # 6. Predict
            prediction = self._model.predict(X)[0]
            predicted_paise = max(0, int(round(prediction)))
            predicted_rupees = round(predicted_paise / 100, 2)

            # 7. Confidence based on deviation from prev_30day_avg
            prev_30 = float(features_dict.get("prev_30day_avg", 0))
            confidence = self._compute_confidence(predicted_paise, prev_30)

            return {
                "predicted_earnings_paise": predicted_paise,
                "predicted_earnings_rupees": predicted_rupees,
                "confidence": confidence,
            }

        except Exception as exc:
            logger.error("EarningsModel.predict() failed: %s", exc)
            return {
                "predicted_earnings_paise": 0,
                "predicted_earnings_rupees": 0.0,
                "confidence": 0.0,
            }

    # ── internals ───────────────────────────────────────────────
    @staticmethod
    def _compute_confidence(predicted: float, prev_30day_avg: float) -> float:
        if prev_30day_avg <= 0:
            return 0.65
        deviation = abs(predicted - prev_30day_avg) / prev_30day_avg
        if deviation <= 0.10:
            return 0.85
        if deviation <= 0.20:
            return 0.75
        return 0.65
