"""NASA POWER API client for historical solar irradiance data.

Completely free, no API key required.
Provides 20+ years of hourly irradiance data globally.
Used for baseline calculations, ML training, and system validation.
"""

from dataclasses import dataclass
from datetime import date

import httpx

from app.core.config import settings

SOLAR_PARAMS = [
    "ALLSKY_SFC_SW_DWN",   # All Sky GHI (kWh/m2/day)
    "ALLSKY_SFC_SW_DNI",   # All Sky DNI
    "ALLSKY_SFC_SW_DIFF",  # All Sky Diffuse
    "CLRSKY_SFC_SW_DWN",   # Clear Sky GHI (theoretical max)
    "T2M",                  # Temperature at 2m (°C)
    "WS2M",                # Wind speed at 2m (m/s)
    "RH2M",                # Relative humidity at 2m (%)
]


@dataclass
class HistoricalSolarDay:
    date: str
    ghi_kwh_m2: float  # All-sky GHI (kWh/m2/day)
    dni_kwh_m2: float
    diffuse_kwh_m2: float
    clear_sky_ghi_kwh_m2: float  # Theoretical max if no clouds
    temperature_c: float
    wind_speed_ms: float
    humidity_pct: float

    @property
    def cloud_impact_pct(self) -> float:
        """How much production was lost to clouds (0-100%)."""
        if self.clear_sky_ghi_kwh_m2 <= 0:
            return 0
        return (1 - self.ghi_kwh_m2 / self.clear_sky_ghi_kwh_m2) * 100


async def get_historical_solar(
    latitude: float,
    longitude: float,
    start_date: date,
    end_date: date,
) -> list[HistoricalSolarDay]:
    """Fetch historical daily solar irradiance from NASA POWER.

    Args:
        latitude: Location latitude
        longitude: Location longitude
        start_date: Start date (data available from ~2001 for hourly)
        end_date: End date
    """
    params = {
        "parameters": ",".join(SOLAR_PARAMS),
        "community": "RE",  # Renewable Energy community
        "longitude": longitude,
        "latitude": latitude,
        "start": start_date.strftime("%Y%m%d"),
        "end": end_date.strftime("%Y%m%d"),
        "format": "JSON",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.nasa_power_base_url}/temporal/daily/point",
            params=params,
            timeout=60.0,
        )
        resp.raise_for_status()
        data = resp.json()

    properties = data["properties"]["parameter"]
    dates = list(properties["ALLSKY_SFC_SW_DWN"].keys())

    return [
        HistoricalSolarDay(
            date=d,
            ghi_kwh_m2=properties["ALLSKY_SFC_SW_DWN"].get(d, 0),
            dni_kwh_m2=properties["ALLSKY_SFC_SW_DNI"].get(d, 0),
            diffuse_kwh_m2=properties["ALLSKY_SFC_SW_DIFF"].get(d, 0),
            clear_sky_ghi_kwh_m2=properties["CLRSKY_SFC_SW_DWN"].get(d, 0),
            temperature_c=properties["T2M"].get(d, 0),
            wind_speed_ms=properties["WS2M"].get(d, 0),
            humidity_pct=properties["RH2M"].get(d, 0),
        )
        for d in dates
        if properties["ALLSKY_SFC_SW_DWN"].get(d, -999) != -999
    ]
