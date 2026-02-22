"""Open-Meteo API client for solar irradiance forecasts.

Free, no API key required. 600 calls/min, 10,000 calls/day.
Provides GHI, DNI, DHI, cloud cover, UV index, and temperature.
"""

from dataclasses import dataclass
from datetime import date

import httpx

from app.core.config import settings


@dataclass
class SolarForecastPoint:
    time: str
    ghi_wm2: float  # Global Horizontal Irradiance (W/m2)
    dni_wm2: float  # Direct Normal Irradiance (W/m2)
    dhi_wm2: float  # Diffuse Horizontal Irradiance (W/m2)
    cloud_cover_pct: int  # Cloud cover (0-100%)
    temperature_c: float
    uv_index: float


@dataclass
class SolarForecast:
    latitude: float
    longitude: float
    timezone: str
    hourly: list[SolarForecastPoint]


HOURLY_PARAMS = [
    "shortwave_radiation",       # GHI
    "direct_radiation",          # DNI
    "diffuse_radiation",         # DHI
    "cloudcover",
    "temperature_2m",
    "uv_index",
]


async def get_solar_forecast(
    latitude: float,
    longitude: float,
    forecast_days: int = 7,
) -> SolarForecast:
    """Fetch solar irradiance forecast from Open-Meteo.

    Args:
        latitude: Location latitude (-90 to 90)
        longitude: Location longitude (-180 to 180)
        forecast_days: Number of days to forecast (1-16)
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": ",".join(HOURLY_PARAMS),
        "forecast_days": min(forecast_days, 16),
        "timezone": "auto",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.open_meteo_base_url}/forecast",
            params=params,
            timeout=30.0,
        )
        resp.raise_for_status()
        data = resp.json()

    hourly = data["hourly"]
    points = [
        SolarForecastPoint(
            time=hourly["time"][i],
            ghi_wm2=hourly["shortwave_radiation"][i] or 0,
            dni_wm2=hourly["direct_radiation"][i] or 0,
            dhi_wm2=hourly["diffuse_radiation"][i] or 0,
            cloud_cover_pct=hourly["cloudcover"][i] or 0,
            temperature_c=hourly["temperature_2m"][i] or 0,
            uv_index=hourly["uv_index"][i] or 0,
        )
        for i in range(len(hourly["time"]))
    ]

    return SolarForecast(
        latitude=data["latitude"],
        longitude=data["longitude"],
        timezone=data.get("timezone", "Australia/Perth"),
        hourly=points,
    )


async def get_historical_weather(
    latitude: float,
    longitude: float,
    start_date: date,
    end_date: date,
) -> dict:
    """Fetch historical weather data from Open-Meteo archive API."""
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "hourly": ",".join(HOURLY_PARAMS),
        "timezone": "auto",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.open_meteo_base_url.replace('/forecast', '')}/archive",
            params=params,
            timeout=30.0,
        )
        resp.raise_for_status()
        return resp.json()
