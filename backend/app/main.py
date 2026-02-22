from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.forecast import router as forecast_router
from app.api.system import router as system_router
from app.api.prices import router as prices_router
from app.core.config import settings

app = FastAPI(
    title="SolarCast API",
    description="Solar production forecasting and energy intelligence for Australian homeowners",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forecast_router, prefix="/api/forecast", tags=["forecast"])
app.include_router(system_router, prefix="/api/system", tags=["system"])
app.include_router(prices_router, prefix="/api/prices", tags=["prices"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "solarcast"}
