"""
GigPay ML Service — FastAPI entry point.

Loads all saved models on startup and mounts route modules.
"""

import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ── App ─────────────────────────────────────────────────────────
app = FastAPI(
    title="GigPay ML Service",
    description="Earnings forecasting, hot-zone clustering, SMS classification",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model singletons (loaded once at startup) ──────────────────
from models.earnings_model import EarningsModel   # noqa: E402
from models.sms_classifier import SmsClassifier   # noqa: E402

earnings_model = EarningsModel()
sms_classifier = SmsClassifier()


@app.on_event("startup")
async def _load_models():
    models_dir = os.getenv("ML_MODELS_PATH", "./data/saved_models")
    logger.info("Loading ML models from %s …", models_dir)
    earnings_model.load(models_dir)
    sms_classifier.load(models_dir)
    logger.info(
        "Model status — earnings: %s, sms: %s",
        earnings_model.is_loaded,
        sms_classifier.is_loaded,
    )


# ── APScheduler — zone clustering cron (every 5 min) ───────────
from apscheduler.schedulers.asyncio import AsyncIOScheduler  # noqa: E402
from zone_clustering import run_clustering                    # noqa: E402

scheduler = AsyncIOScheduler()


@app.on_event("startup")
async def _start_scheduler():
    scheduler.add_job(run_clustering, "interval", minutes=5, id="zone_clustering")
    scheduler.start()
    logger.info("APScheduler started — zone clustering every 5 min")
    # Run once immediately so cache is warm
    try:
        run_clustering()
    except Exception as exc:
        logger.warning("Initial clustering failed (non-fatal): %s", exc)


@app.on_event("shutdown")
async def _stop_scheduler():
    scheduler.shutdown(wait=False)


# ── Routers ─────────────────────────────────────────────────────
from routers.predict import router as predict_router        # noqa: E402
from routers.sms_classify import router as sms_router       # noqa: E402
from routers.insights import router as insights_router      # noqa: E402
from routers.zones import router as zones_router            # noqa: E402

app.include_router(predict_router)
app.include_router(sms_router)
app.include_router(insights_router)
app.include_router(zones_router)


# ── Health check ────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "models": {
            "earnings": earnings_model.is_loaded,
            "sms_classifier": sms_classifier.is_loaded,
        },
    }
