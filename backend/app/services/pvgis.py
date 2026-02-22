"""PVGIS API client for PV system performance estimates.

Free, no API key required. 30 calls/second.
Provides system production estimates with loss calculations.
Must be called server-side (CORS blocked).
"""

from dataclasses import dataclass

import httpx

from app.core.config import settings


@dataclass
class MonthlyProduction:
    month: int
    energy_kwh: float  # Monthly energy production (kWh)
    irradiance_kwh_m2: float  # Monthly in-plane irradiance (kWh/m2)
    avg_temperature_c: float


@dataclass
class SystemEstimate:
    annual_energy_kwh: float
    monthly: list[MonthlyProduction]
    system_loss_pct: float
    peak_power_kw: float
    tilt_deg: float
    azimuth_deg: float


async def estimate_pv_production(
    latitude: float,
    longitude: float,
    peak_power_kw: float,
    tilt: float = 25.0,
    azimuth: float = 0.0,
    system_loss_pct: float = 14.0,
) -> SystemEstimate:
    """Estimate annual PV production using PVGIS.

    Args:
        latitude: Location latitude
        longitude: Location longitude
        peak_power_kw: Installed peak power in kW
        tilt: Panel tilt angle in degrees (0=horizontal, 90=vertical)
        azimuth: Panel azimuth in degrees (0=south in northern hemisphere,
                 0=north in southern hemisphere, 180=north/south respectively)
        system_loss_pct: Total system losses as percentage (default 14%)
    """
    params = {
        "lat": latitude,
        "lon": longitude,
        "peakpower": peak_power_kw,
        "loss": system_loss_pct,
        "angle": tilt,
        "aspect": azimuth,
        "outputformat": "json",
        "pvcalculation": 1,
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.pvgis_base_url}/PVcalc",
            params=params,
            timeout=30.0,
        )
        resp.raise_for_status()
        data = resp.json()

    outputs = data["outputs"]
    monthly = [
        MonthlyProduction(
            month=m["month"],
            energy_kwh=m["E_m"],
            irradiance_kwh_m2=m["H(i)_m"],
            avg_temperature_c=m.get("T2m", 0),
        )
        for m in outputs["monthly"]["fixed"]
    ]

    totals = outputs["totals"]["fixed"]
    return SystemEstimate(
        annual_energy_kwh=totals["E_y"],
        monthly=monthly,
        system_loss_pct=system_loss_pct,
        peak_power_kw=peak_power_kw,
        tilt_deg=tilt,
        azimuth_deg=azimuth,
    )
