"""Forecast API endpoints — the core of SolarCast."""

from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    DailyForecastResponse,
    ForecastRequest,
    ForecastResponse,
    HourlyProductionResponse,
    QuickForecastRequest,
)
from app.services.open_meteo import get_solar_forecast
from app.services.solar_calculator import SystemConfig, estimate_production

router = APIRouter()


@router.post("/", response_model=ForecastResponse)
async def get_forecast(request: ForecastRequest):
    """Get detailed solar production forecast for a configured system."""
    try:
        weather = await get_solar_forecast(
            latitude=request.system.latitude,
            longitude=request.system.longitude,
            forecast_days=request.forecast_days,
        )
    except Exception as e:
        raise HTTPException(502, f"Weather service unavailable: {e}")

    system = SystemConfig(
        peak_power_kw=request.system.peak_power_kw,
        tilt_deg=request.system.tilt_deg,
        azimuth_deg=request.system.azimuth_deg,
        efficiency=request.system.efficiency,
        latitude=request.system.latitude,
        longitude=request.system.longitude,
    )

    daily = estimate_production(weather, system)
    total = sum(d.total_kwh for d in daily)

    return ForecastResponse(
        latitude=weather.latitude,
        longitude=weather.longitude,
        system_kw=system.peak_power_kw,
        forecast_days=request.forecast_days,
        total_forecast_kwh=round(total, 2),
        daily=[
            DailyForecastResponse(
                date=d.date,
                total_kwh=d.total_kwh,
                peak_kw=d.peak_kw,
                peak_hour=d.peak_hour,
                avg_cloud_cover_pct=d.avg_cloud_cover_pct,
                sunshine_hours=d.sunshine_hours,
                description=d.description,
                hourly=[
                    HourlyProductionResponse(
                        time=h.time,
                        estimated_kwh=h.estimated_kwh,
                        ghi_wm2=h.ghi_wm2,
                        cloud_cover_pct=h.cloud_cover_pct,
                        temperature_c=h.temperature_c,
                        weather_description=h.weather_description,
                    )
                    for h in d.hourly
                ],
            )
            for d in daily
        ],
    )


@router.post("/quick", response_model=ForecastResponse)
async def quick_forecast(request: QuickForecastRequest):
    """Quick forecast with sensible defaults — just location + system size."""
    full_request = ForecastRequest(
        system={
            "latitude": request.latitude,
            "longitude": request.longitude,
            "peak_power_kw": request.peak_power_kw,
            "tilt_deg": 25.0,
            "azimuth_deg": 0.0,
            "efficiency": 0.82,
        },
        forecast_days=7,
    )
    return await get_forecast(full_request)
