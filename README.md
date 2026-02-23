# SolarCast ☀️

> Solar production forecasting for Australian homeowners

**Live:** https://frontend-black-five-12.vercel.app

---

## What it does

SolarCast gives Australian solar owners a 7-day production forecast personalised to their system and location. Enter your city and system size, hit **Get Solar Forecast**, and instantly see:

- **7-day production forecast** — daily kWh, sun hours, cloud cover, peak output
- **Smart schedule** — best windows to run appliances based on today's solar curve
- **Cost savings** — estimated savings vs grid at your tariff rate
- **Price-Smart Export** — NEM wholesale price patterns to maximise feed-in revenue
- **NASA comparison** — how today's forecast compares to 20-year climate averages

Data sources: [Open-Meteo](https://open-meteo.com) · [NASA POWER](https://power.larc.nasa.gov) · [EU PVGIS](https://re.jrc.ec.europa.eu/pvg_tools)

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 + TypeScript |
| Styling | Tailwind CSS (glassmorphism theme) |
| Backend | FastAPI (Python) |
| Deployment | Vercel (frontend) |

---

## Local development

```bash
# Frontend
cd frontend
npm install
npm run dev
# → http://localhost:3000

# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# → http://localhost:8000
```

---

## Cities supported

Perth · Sydney · Melbourne · Brisbane · Adelaide · Hobart · Darwin · Canberra

---

## Features

- Auto-loads Perth forecast on first visit — no empty state
- Persists your system config across sessions (localStorage)
- Onboarding tour for new users
- PWA-ready (manifest + icons)
- Responsive down to mobile
