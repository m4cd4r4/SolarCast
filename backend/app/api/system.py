"""System estimation endpoints — annual production, ROI, sizing."""

from fastapi import APIRouter, HTTPException

from app.models.schemas import SystemEstimateResponse, SystemSetup
from app.services.pvgis import estimate_pv_production

router = APIRouter()


@router.post("/estimate", response_model=SystemEstimateResponse)
async def estimate_system(setup: SystemSetup):
    """Estimate annual production for a PV system configuration using PVGIS."""
    try:
        estimate = await estimate_pv_production(
            latitude=setup.latitude,
            longitude=setup.longitude,
            peak_power_kw=setup.peak_power_kw,
            tilt=setup.tilt_deg,
            azimuth=setup.azimuth_deg,
            system_loss_pct=(1 - setup.efficiency) * 100,
        )
    except Exception as e:
        raise HTTPException(502, f"PVGIS service unavailable: {e}")

    return SystemEstimateResponse(
        annual_energy_kwh=round(estimate.annual_energy_kwh, 1),
        monthly_kwh=[round(m.energy_kwh, 1) for m in estimate.monthly],
        peak_power_kw=estimate.peak_power_kw,
        tilt_deg=estimate.tilt_deg,
        azimuth_deg=estimate.azimuth_deg,
        system_loss_pct=estimate.system_loss_pct,
    )
