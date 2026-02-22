from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "SolarCast"
    debug: bool = False

    # Database
    database_url: str = "postgresql+asyncpg://localhost:5432/solarcast"

    # Redis (optional, for caching forecasts)
    redis_url: str = "redis://localhost:6379/0"

    # API base URLs (all free, no keys needed)
    open_meteo_base_url: str = "https://api.open-meteo.com/v1"
    nasa_power_base_url: str = "https://power.larc.nasa.gov/api"
    pvgis_base_url: str = "https://re.jrc.ec.europa.eu/api/v5_3"

    # OpenElectricity (free API key)
    open_electricity_base_url: str = "https://api.openelectricity.org.au"
    open_electricity_api_key: str = ""

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "https://solarcast.com.au"]

    model_config = {"env_file": ".env", "env_prefix": "SOLARCAST_"}


settings = Settings()
