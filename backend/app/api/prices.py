"""Electricity price endpoints — Australian wholesale market data."""

from fastapi import APIRouter

from app.models.schemas import PriceForecastResponse, PricePoint

router = APIRouter()


@router.get("/current/{region}")
async def get_current_prices(region: str = "nsw1"):
    """Get current wholesale electricity prices for an NEM region.

    Regions: nsw1, qld1, vic1, sa1, tas1

    TODO: Integrate OpenElectricity API when API key is obtained.
    For now returns a placeholder to keep the API contract stable.
    """
    return PriceForecastResponse(
        region=region,
        current_price_aud_mwh=0,
        prices=[],
        recommendation="Price data integration coming soon",
    )
