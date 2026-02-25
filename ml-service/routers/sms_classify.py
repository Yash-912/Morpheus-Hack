"""
SMS Classification Router
─────────────────────────
POST /sms/classify   — batch-classify SMS messages into expense categories
GET  /sms/classify/health — health check for the SMS classifier model

This endpoint is called by two consumers:
  1. sms.worker.js  (via Redis Bull queue → MLService.classifySmsMessages())
  2. expenses.controller.js smsBatch() (direct call via MLService.classifySmsMessages())

Both send { "messages": [{ "body": "...", "timestamp": "..." }] }
and expect { "classified": [...], "total_received", "total_classified", "total_skipped" }
"""

import logging

from fastapi import APIRouter, HTTPException

from schemas.sms_schema import (
    SmsClassifyRequest,
    SmsClassifyResponse,
    ClassifiedExpense,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sms", tags=["sms"])


def _get_classifier():
    """Lazy import to share the singleton loaded in main.py."""
    from main import sms_classifier
    return sms_classifier


# ── POST /sms/classify ─────────────────────────────────────────
@router.post("/classify", response_model=SmsClassifyResponse)
async def classify_sms(payload: SmsClassifyRequest):
    """
    Classify a batch of SMS messages into expense categories.

    Pipeline per message:
      1. TF-IDF vectorise → LogisticRegression predict_proba
      2. If confidence ≥ 0.50 → use model category, else regex fallback
      3. Regex-extract amount (₹ / Rs.) and merchant ("at …" / "to …")
      4. Mark fuel/toll/maintenance as tax-deductible
      5. Filter out "not_expense" (OTPs, salary credits, balance alerts)
    """
    classifier = _get_classifier()
    if not classifier.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="SMS classifier model not loaded — check ML_MODELS_PATH",
        )

    classified: list[ClassifiedExpense] = []
    total_skipped = 0

    for msg in payload.messages:
        try:
            result = classifier.classify(msg.body)

            # Skip non-expense classifications (OTPs, balance alerts, etc.)
            if result["category"] in ("not_expense", "no_expense"):
                total_skipped += 1
                continue

            # Convert amount_rupees → amount in paise for DB compatibility
            amount_rupees = result.get("amount_rupees")
            amount_paise = int(round(amount_rupees * 100)) if amount_rupees else 0

            classified.append(
                ClassifiedExpense(
                    original_text=msg.body,
                    timestamp=msg.timestamp,
                    category=result["category"],
                    amount_rupees=amount_rupees,
                    amount=amount_paise,
                    merchant=result.get("merchant"),
                    is_tax_deductible=result.get("is_tax_deductible", False),
                    confidence=result.get("confidence", 0.0),
                )
            )
        except Exception as exc:
            logger.error("Failed to classify SMS: %s — %s", msg.body[:50], exc)
            total_skipped += 1

    logger.info(
        "SMS classification complete — received=%d, classified=%d, skipped=%d",
        len(payload.messages),
        len(classified),
        total_skipped,
    )

    return SmsClassifyResponse(
        classified=classified,
        total_received=len(payload.messages),
        total_classified=len(classified),
        total_skipped=total_skipped,
    )


# ── GET /sms/classify/health ───────────────────────────────────
@router.get("/classify/health")
async def sms_health():
    return {
        "status": "ok",
        "model_loaded": _get_classifier().is_loaded,
    }
