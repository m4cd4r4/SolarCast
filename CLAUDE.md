# SolarCast

Solar production forecasting and energy intelligence for Australian homeowners.

## Architecture

```
frontend/          Next.js 15 + TypeScript + Tailwind (glassmorphism)
backend/           FastAPI (Python) + pvlib
  app/
    api/           REST endpoints (forecast, system, prices)
    services/      External API clients (Open-Meteo, PVGIS, NASA POWER)
    models/        Pydantic schemas
    core/          Config, auth, database
```

## External APIs (All Free)

| API | Purpose | Auth |
|-----|---------|------|
| Open-Meteo | Solar irradiance forecast (7-16 days) | None |
| NASA POWER | Historical solar data (20+ years) | None |
| PVGIS | PV system production estimates | None |
| OpenElectricity | AU wholesale electricity prices | Free API key |

## Running Locally

```bash
# Backend
cd backend
python -m venv .venv && .venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev  # port 3000
```

## Key Decisions

- **No database required for MVP** — forecast data is computed on-the-fly from external APIs
- **Simplified solar model** — GHI × system_size × efficiency × temp_derating (upgrade to full pvlib transposition later)
- **Australian-first** — AEMO/NEM market integration, southern hemisphere defaults
- **Plain English output** — every forecast includes a human-readable description
