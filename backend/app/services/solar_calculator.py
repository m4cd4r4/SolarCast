"""Solar production calculator.

Converts raw irradiance forecasts into estimated kWh production
for a specific PV system configuration. Uses simplified pvlib-based
calculations for real-time forecasting.
"""

import math
from dataclasses import dataclass

from app.services.open_meteo import SolarForecast, SolarForecastPoint


@dataclass
class HourlyProduction:
    time: str
    estimated_kwh: float
    ghi_wm2: float
    cloud_cover_pct: int
    temperature_c: float
    weather_description: str


@dataclass
class DailyProductionSummary:
    date: str
    total_kwh: float
    peak_kw: float
    peak_hour: str
    avg_cloud_cover_pct: float
    sunshine_hours: int  # hours with meaningful production
    description: str  # Plain English summary
    hourly: list[HourlyProduction]


@dataclass
class SystemConfig:
    peak_power_kw: float   # Installed system size (e.g., 6.6)
    tilt_deg: float         # Panel tilt angle
    azimuth_deg: float      # Panel direction (0=north for southern hemisphere)
    efficiency: float       # System efficiency factor (0.0-1.0), typically 0.80-0.86
    latitude: float
    longitude: float


# Temperature coefficient for crystalline silicon (typical: -0.4%/°C above 25°C)
TEMP_COEFFICIENT = -0.004
STC_TEMP = 25.0  # Standard Test Conditions temperature
NOCT_FACTOR = 0.035  # Approximate cell temp rise per W/m2


def _estimate_cell_temperature(ambient_c: float, ghi_wm2: float) -> float:
    """Estimate cell temperature from ambient temperature and irradiance."""
    return ambient_c + NOCT_FACTOR * ghi_wm2


def _temperature_derating(cell_temp_c: float) -> float:
    """Calculate temperature derating factor (1.0 = no derating)."""
    delta = cell_temp_c - STC_TEMP
    if delta <= 0:
        return 1.0
    return max(0.5, 1.0 + TEMP_COEFFICIENT * delta)


def _cloud_description(cloud_pct: int) -> str:
    if cloud_pct <= 10:
        return "Clear skies"
    if cloud_pct <= 30:
        return "Mostly sunny"
    if cloud_pct <= 60:
        return "Partly cloudy"
    if cloud_pct <= 85:
        return "Mostly cloudy"
    return "Overcast"


def _daily_description(total_kwh: float, system_kw: float, avg_cloud: float) -> str:
    """Generate a plain English forecast summary."""
    capacity_factor = total_kwh / (system_kw * 24) * 100 if system_kw > 0 else 0
    cloud_desc = _cloud_description(int(avg_cloud))

    if capacity_factor > 18:
        quality = "Excellent"
    elif capacity_factor > 12:
        quality = "Good"
    elif capacity_factor > 6:
        quality = "Fair"
    else:
        quality = "Poor"

    return f"{quality} solar day. {cloud_desc}. Expected ~{total_kwh:.1f} kWh from your {system_kw:.1f} kW system."


def estimate_production(
    forecast: SolarForecast,
    system: SystemConfig,
) -> list[DailyProductionSummary]:
    """Convert irradiance forecast into estimated kWh production.

    Uses a simplified model:
    Production = GHI × System_Size × Efficiency × Temp_Derating / 1000

    This is intentionally simple for the MVP. Can be upgraded to full
    pvlib transposition + spectral modelling later.
    """
    daily_groups: dict[str, list[tuple[SolarForecastPoint, HourlyProduction]]] = {}

    for point in forecast.hourly:
        date_str = point.time[:10]  # "2024-01-15T10:00" -> "2024-01-15"

        if point.ghi_wm2 <= 0:
            prod = HourlyProduction(
                time=point.time,
                estimated_kwh=0,
                ghi_wm2=0,
                cloud_cover_pct=point.cloud_cover_pct,
                temperature_c=point.temperature_c,
                weather_description="Night" if point.ghi_wm2 == 0 else "No sun",
            )
        else:
            cell_temp = _estimate_cell_temperature(point.temperature_c, point.ghi_wm2)
            temp_factor = _temperature_derating(cell_temp)

            # Simplified production estimate (1 hour interval)
            kwh = (
                point.ghi_wm2
                * system.peak_power_kw
                * system.efficiency
                * temp_factor
                / 1000  # W -> kW
            )

            prod = HourlyProduction(
                time=point.time,
                estimated_kwh=round(kwh, 3),
                ghi_wm2=point.ghi_wm2,
                cloud_cover_pct=point.cloud_cover_pct,
                temperature_c=point.temperature_c,
                weather_description=_cloud_description(point.cloud_cover_pct),
            )

        if date_str not in daily_groups:
            daily_groups[date_str] = []
        daily_groups[date_str].append((point, prod))

    summaries = []
    for date_str, pairs in sorted(daily_groups.items()):
        hourly_prods = [p for _, p in pairs]
        producing = [p for p in hourly_prods if p.estimated_kwh > 0]

        total_kwh = sum(p.estimated_kwh for p in hourly_prods)
        peak = max(hourly_prods, key=lambda p: p.estimated_kwh)
        avg_cloud = sum(p.cloud_cover_pct for p in hourly_prods) / len(hourly_prods) if hourly_prods else 0

        summaries.append(DailyProductionSummary(
            date=date_str,
            total_kwh=round(total_kwh, 2),
            peak_kw=round(peak.estimated_kwh, 3),
            peak_hour=peak.time,
            avg_cloud_cover_pct=round(avg_cloud, 1),
            sunshine_hours=len(producing),
            description=_daily_description(total_kwh, system.peak_power_kw, avg_cloud),
            hourly=hourly_prods,
        ))

    return summaries
