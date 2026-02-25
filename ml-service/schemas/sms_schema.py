"""Pydantic request / response schemas for the SMS classification endpoint."""

from pydantic import BaseModel, Field
from typing import Optional


class SmsMessage(BaseModel):
    """A single SMS message to classify."""
    body: str = Field(..., description="Raw SMS text")
    timestamp: str = Field(
        default="",
        description="ISO-8601 timestamp when the SMS was received",
    )


class SmsClassifyRequest(BaseModel):
    """Batch of SMS messages to classify."""
    messages: list[SmsMessage] = Field(
        ..., min_length=1, max_length=200,
        description="Array of SMS messages",
    )


class ClassifiedExpense(BaseModel):
    """A single classified expense extracted from an SMS."""
    original_text: str
    timestamp: str = ""
    category: str
    amount_rupees: Optional[float] = None
    amount: int = Field(
        0,
        description="Amount in paise (amount_rupees × 100) for DB compatibility",
    )
    merchant: Optional[str] = None
    is_tax_deductible: bool = False
    confidence: float = 0.0


class SmsClassifyResponse(BaseModel):
    """Full response from the SMS classification endpoint."""
    classified: list[ClassifiedExpense]
    total_received: int
    total_classified: int
    total_skipped: int
