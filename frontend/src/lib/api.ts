/**
 * SolarCast API client.
 *
 * For the MVP, we call external APIs directly from the frontend
 * to avoid needing the FastAPI backend running. This can be
 * migrated to the backend later for caching and auth.
 */

import type { DailyForecast, ForecastResponse, HourlyProduction } from "./types";

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

const HOURLY_PARAMS = [
  "shortwave_radiation",
  "direct_radiation",
  "diffuse_radiation",
  "cloudcover",
  "temperature_2m",
  "uv_index",
].join(",");

// Simplified solar production model (matches backend solar_calculator.py)
const TEMP_COEFFICIENT = -0.004;
const STC_TEMP = 25.0;
const NOCT_FACTOR = 0.035;

function cloudDescription(pct: number): string {
  if (pct <= 10) return "Clear skies";
  if (pct <= 30) return "Mostly sunny";
  if (pct <= 60) return "Partly cloudy";
  if (pct <= 85) return "Mostly cloudy";
  return "Overcast";
}

function dailyDescription(totalKwh: number, systemKw: number, avgCloud: number): string {
  const capacityFactor = systemKw > 0 ? (totalKwh / (systemKw * 24)) * 100 : 0;
  const cloud = cloudDescription(avgCloud);

  let quality: string;
  if (capacityFactor > 18) quality = "Excellent";
  else if (capacityFactor > 12) quality = "Good";
  else if (capacityFactor > 6) quality = "Fair";
  else quality = "Poor";

  return `${quality} solar day. ${cloud}. Expected ~${totalKwh.toFixed(1)} kWh from your ${systemKw.toFixed(1)} kW system.`;
}

export async function fetchForecast(
  latitude: number,
  longitude: number,
  peakPowerKw: number,
  efficiency: number = 0.82,
  forecastDays: number = 7,
): Promise<ForecastResponse> {
  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set("latitude", latitude.toString());
  url.searchParams.set("longitude", longitude.toString());
  url.searchParams.set("hourly", HOURLY_PARAMS);
  url.searchParams.set("forecast_days", Math.min(forecastDays, 16).toString());
  url.searchParams.set("timezone", "auto");

  const resp = await fetch(url.toString());
  if (!resp.ok) throw new Error(`Open-Meteo error: ${resp.status}`);
  const data = await resp.json();

  const hourly = data.hourly;
  const dailyGroups = new Map<string, HourlyProduction[]>();

  for (let i = 0; i < hourly.time.length; i++) {
    const time: string = hourly.time[i];
    const dateStr = time.slice(0, 10);
    const ghi = hourly.shortwave_radiation[i] ?? 0;
    const cloud = hourly.cloudcover[i] ?? 0;
    const temp = hourly.temperature_2m[i] ?? 0;

    let estimatedKwh = 0;
    let desc = "Night";

    if (ghi > 0) {
      const cellTemp = temp + NOCT_FACTOR * ghi;
      const delta = cellTemp - STC_TEMP;
      const tempFactor = delta <= 0 ? 1.0 : Math.max(0.5, 1.0 + TEMP_COEFFICIENT * delta);
      estimatedKwh = (ghi * peakPowerKw * efficiency * tempFactor) / 1000;
      desc = cloudDescription(cloud);
    }

    const point: HourlyProduction = {
      time,
      estimated_kwh: Math.round(estimatedKwh * 1000) / 1000,
      ghi_wm2: ghi,
      cloud_cover_pct: cloud,
      temperature_c: temp,
      weather_description: desc,
    };

    if (!dailyGroups.has(dateStr)) dailyGroups.set(dateStr, []);
    dailyGroups.get(dateStr)!.push(point);
  }

  const daily: DailyForecast[] = [];
  for (const [dateStr, hours] of [...dailyGroups.entries()].sort()) {
    const totalKwh = hours.reduce((s, h) => s + h.estimated_kwh, 0);
    const peak = hours.reduce((max, h) => (h.estimated_kwh > max.estimated_kwh ? h : max), hours[0]);
    const avgCloud = hours.reduce((s, h) => s + h.cloud_cover_pct, 0) / hours.length;
    const sunshineHours = hours.filter((h) => h.estimated_kwh > 0).length;

    daily.push({
      date: dateStr,
      total_kwh: Math.round(totalKwh * 100) / 100,
      peak_kw: Math.round(peak.estimated_kwh * 1000) / 1000,
      peak_hour: peak.time,
      avg_cloud_cover_pct: Math.round(avgCloud * 10) / 10,
      sunshine_hours: sunshineHours,
      description: dailyDescription(Math.round(totalKwh * 100) / 100, peakPowerKw, avgCloud),
      hourly: hours,
    });
  }

  const totalForecastKwh = daily.reduce((s, d) => s + d.total_kwh, 0);

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    system_kw: peakPowerKw,
    forecast_days: forecastDays,
    total_forecast_kwh: Math.round(totalForecastKwh * 100) / 100,
    daily,
  };
}
