"""
SmsClassifier — wrapper around a pre-trained LogisticRegression + TfidfVectorizer
that classifies Indian financial SMS into expense categories.
"""

import logging
import os
import re

import joblib

logger = logging.getLogger(__name__)

# ── Category constants ──────────────────────────────────────────
CATEGORIES = [
    "fuel",
    "toll",
    "food",
    "maintenance",
    "mobile_recharge",
    "parking",
    "not_expense",
]

TAX_DEDUCTIBLE = {"fuel", "toll", "maintenance"}

# ── Regex keyword rules (fallback when model confidence < 0.50) ─
KEYWORD_RULES = {
    "fuel": re.compile(
        r"petrol|petroleum|diesel|fuel|hp\s*pump|iocl|bpcl|nayara|shell",
        re.IGNORECASE,
    ),
    "toll": re.compile(
        r"fastag|fasttag|toll|plaza|netc", re.IGNORECASE
    ),
    "food": re.compile(
        r"zomato|swiggy|restaurant|hotel|cafe|food|pizza|burger|biryani",
        re.IGNORECASE,
    ),
    "maintenance": re.compile(
        r"service|repair|workshop|garage|servicing", re.IGNORECASE
    ),
    "mobile_recharge": re.compile(
        r"recharge|airtel|jio|vi\s|bsnl|prepaid|validity", re.IGNORECASE
    ),
    "parking": re.compile(r"parking|park", re.IGNORECASE),
}

# ── Amount extraction ───────────────────────────────────────────
AMOUNT_RE = re.compile(
    r"(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)", re.IGNORECASE
)

# ── Merchant extraction ────────────────────────────────────────
MERCHANT_RE = re.compile(
    r"(?:at|to)\s+((?:\S+\s*){1,3})", re.IGNORECASE
)


class SmsClassifier:
    """Load and run the SMS expense classifier."""

    def __init__(self):
        self._model = None
        self._vectorizer = None

    # ── public helpers ──────────────────────────────────────────
    @property
    def is_loaded(self) -> bool:
        return self._model is not None and self._vectorizer is not None

    # ── load ────────────────────────────────────────────────────
    def load(self, path: str = "./data/saved_models") -> None:
        """Load the LogisticRegression model and its TfidfVectorizer."""
        model_path = os.path.join(path, "sms_model.joblib")
        vec_path = os.path.join(path, "sms_vectorizer.joblib")

        try:
            self._model = joblib.load(model_path)
            logger.info("SMS model loaded from %s", model_path)
        except Exception as exc:
            logger.error("Failed to load SMS model: %s", exc)
            self._model = None

        try:
            self._vectorizer = joblib.load(vec_path)
            logger.info("SMS vectorizer loaded from %s", vec_path)
        except Exception as exc:
            logger.error("Failed to load SMS vectorizer: %s", exc)
            self._vectorizer = None

    # ── classify ────────────────────────────────────────────────
    def classify(self, sms_text: str) -> dict:
        """
        Classify a single SMS message.

        Returns
        -------
        dict with ``category``, ``amount_rupees``, ``merchant``,
             ``is_tax_deductible``, ``confidence``.
        """
        if not self.is_loaded:
            logger.error("SmsClassifier.classify() called but model is not loaded")
            return self._fallback_result(sms_text)

        try:
            # 1. Vectorize
            X = self._vectorizer.transform([sms_text])

            # 2. Predict with probabilities
            proba = self._model.predict_proba(X)[0]
            best_idx = proba.argmax()
            confidence = float(proba[best_idx])
            classes = list(self._model.classes_)
            category = classes[best_idx].lower()

            # 3. Fallback to regex if confidence is low
            if confidence < 0.50:
                category = self._regex_classify(sms_text)
                confidence = round(confidence, 4)

            # 4. Extract amount and merchant (always regex-based)
            amount_rupees = self._extract_amount(sms_text)
            merchant = self._extract_merchant(sms_text)

            # 5. Tax deductibility
            is_tax_deductible = category in TAX_DEDUCTIBLE

            return {
                "category": category,
                "amount_rupees": amount_rupees,
                "merchant": merchant,
                "is_tax_deductible": is_tax_deductible,
                "confidence": round(confidence, 4),
            }

        except Exception as exc:
            logger.error("SmsClassifier.classify() failed: %s", exc)
            return self._fallback_result(sms_text)

    # ── internals ───────────────────────────────────────────────
    @staticmethod
    def _regex_classify(text: str) -> str:
        """Keyword-based fallback classification."""
        for category, pattern in KEYWORD_RULES.items():
            if pattern.search(text):
                return category
        return "not_expense"

    @staticmethod
    def _extract_amount(text: str) -> float | None:
        """Extract rupee amount from SMS text."""
        match = AMOUNT_RE.search(text)
        if match:
            try:
                return float(match.group(1).replace(",", ""))
            except ValueError:
                return None
        return None

    @staticmethod
    def _extract_merchant(text: str) -> str | None:
        """Extract merchant name from SMS text (words following 'at' or 'to')."""
        match = MERCHANT_RE.search(text)
        if match:
            raw = match.group(1).strip()
            # Clean trailing punctuation
            cleaned = re.sub(r"[.,;:!?]+$", "", raw).strip()
            return cleaned if cleaned else None
        return None

    def _fallback_result(self, sms_text: str) -> dict:
        """Return a best-effort result when the ML model isn't available."""
        category = self._regex_classify(sms_text)
        return {
            "category": category,
            "amount_rupees": self._extract_amount(sms_text),
            "merchant": self._extract_merchant(sms_text),
            "is_tax_deductible": category in TAX_DEDUCTIBLE,
            "confidence": 0.0,
        }
