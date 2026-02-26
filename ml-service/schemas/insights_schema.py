"""
Pydantic models for the financial insights endpoint.
"""

from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel, Field


class InsightItem(BaseModel):
    """A single financial insight returned by the LLM."""

    type: Literal["spending", "savings", "tax", "earnings_pattern", "advice"]
    title: str
    body: str
    action: str


class InsightsResponse(BaseModel):
    """Full response wrapper for the insights endpoint."""

    user_id: str
    insights: List[InsightItem]
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    data_period_days: int = 90
    is_seeded: bool = False
