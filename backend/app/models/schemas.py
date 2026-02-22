"""Pydantic schemas for API request/response models."""

from pydantic import BaseModel, Field


class SystemSetup(BaseModel):
    """User's solar system configuration."""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    peak_power_kw: float = Field(..., gt=0, le=100, description="System size in kW")
    tilt_deg: float = Field(default=25.0, ge=0, le=90, description="Panel tilt angle")
    azimuth_deg: float = Field(
        default=0.0,
        ge=-180,
        le=180,
        description="Panel azimuth (0=north for AU, 180=south)",
    )
    efficiency: float = Field(
        default=0.82,
        ge=0.5,
        le=1.0,
        description="System efficiency factor",
    )


class ForecastRequest(BaseModel):
    """Request for solar production forecast."""
    system: SystemSetup
    forecast_days: int = Field(default=7, ge=1, le=16)


class QuickForecastRequest(BaseModel):
    """Simplified forecast request — just location and system size."""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    peak_power_kw: float = Field(..., gt=0, le=100)


class HourlyProductionResponse(BaseModel):
    time: str
    estimated_kwh: float
    ghi_wm2: float
    cloud_cover_pct: int
    temperature_c: float
    weather_description: str


class DailyForecastResponse(BaseModel):
    date: str
    total_kwh: float
    peak_kw: float
    peak_hour: str
    avg_cloud_cover_pct: float
    sunshine_hours: int
    description: str
    hourly: list[HourlyProductionResponse]


class ForecastResponse(BaseModel):
    latitude: float
    longitude: float
    system_kw: float
    forecast_days: int
    total_forecast_kwh: float
    daily: list[DailyForecastResponse]


class SystemEstimateResponse(BaseModel):
    annual_energy_kwh: float
    monthly_kwh: list[float]
    peak_power_kw: float
    tilt_deg: float
    azimuth_deg: float
    system_loss_pct: float


class PricePoint(BaseModel):
    time: str
    price_aud_mwh: float  # $/MWh wholesale price
    region: str


class PriceForecastResponse(BaseModel):
    region: str
    current_price_aud_mwh: float
    prices: list[PricePoint]
    recommendation: str  # "Export now" / "Hold battery" / etc.
