"use client";

import { useState, useEffect } from "react";
import type { ForecastResponse } from "@/lib/types";

interface HistoricalComparisonProps {
  forecast: ForecastResponse;
}

interface NasaMonthlyData {
  month: string;
  avgGhi: number;
  avgTemp: number;
  clearDays: number;
}

// NASA POWER monthly climatology averages for Australian capital cities (kWh/m²/day)
// Source: NASA POWER Data Access Viewer — 20-year averages
const NASA_MONTHLY_GHI: Record<string, number[]> = {
  // [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec] in kWh/m²/day
  Perth:     [8.2, 7.5, 6.2, 4.6, 3.3, 2.7, 2.9, 3.8, 5.1, 6.5, 7.6, 8.3],
  Sydney:    [6.8, 6.2, 5.2, 4.1, 3.2, 2.8, 3.0, 3.8, 4.9, 5.9, 6.5, 6.9],
  Melbourne: [7.0, 6.3, 4.9, 3.4, 2.3, 1.9, 2.1, 2.9, 4.0, 5.2, 6.2, 6.9],
  Brisbane:  [6.8, 6.2, 5.5, 4.6, 3.7, 3.3, 3.6, 4.4, 5.5, 6.2, 6.7, 6.9],
  Adelaide:  [7.8, 7.0, 5.5, 3.8, 2.6, 2.1, 2.3, 3.2, 4.6, 5.9, 7.0, 7.7],
  Hobart:    [6.2, 5.5, 4.1, 2.8, 1.8, 1.5, 1.6, 2.3, 3.4, 4.5, 5.5, 6.1],
  Darwin:    [5.6, 5.2, 5.5, 6.0, 5.8, 5.7, 6.0, 6.5, 7.0, 7.0, 6.4, 5.8],
  Canberra:  [7.2, 6.5, 5.2, 3.7, 2.6, 2.2, 2.4, 3.2, 4.5, 5.7, 6.6, 7.2],
};

function findClosestCity(lat: number, lon: number): string {
  const cities: Record<string, [number, number]> = {
    Perth: [-31.95, 115.86],
    Sydney: [-33.87, 151.21],
    Melbourne: [-37.81, 144.96],
    Brisbane: [-27.47, 153.03],
    Adelaide: [-34.93, 138.60],
    Hobart: [-42.88, 147.33],
    Darwin: [-12.46, 130.84],
    Canberra: [-35.28, 149.13],
  };

  let closest = "Perth";
  let minDist = Infinity;
  for (const [name, [cLat, cLon]] of Object.entries(cities)) {
    const d = Math.sqrt((lat - cLat) ** 2 + (lon - cLon) ** 2);
    if (d < minDist) {
      minDist = d;
      closest = name;
    }
  }
  return closest;
}

export function HistoricalComparison({ forecast }: HistoricalComparisonProps) {
  const city = findClosestCity(forecast.latitude, forecast.longitude);
  const monthlyGhi = NASA_MONTHLY_GHI[city] ?? NASA_MONTHLY_GHI.Perth;
  const currentMonth = new Date().getMonth(); // 0-indexed
  const monthName = new Date().toLocaleDateString("en-AU", { month: "long" });

  // NASA typical daily GHI for this month (kWh/m²/day)
  const typicalGhi = monthlyGhi[currentMonth];

  // Convert GHI to expected system production
  // Production = GHI × system_kw × efficiency × performance_ratio
  const performanceRatio = 0.78; // typical system PR
  const typicalDailyKwh = typicalGhi * forecast.system_kw * performanceRatio;
  const typicalWeeklyKwh = typicalDailyKwh * 7;

  // Current forecast average
  const forecastAvgDaily = forecast.total_forecast_kwh / forecast.daily.length;

  // Comparison
  const diff = forecastAvgDaily - typicalDailyKwh;
  const diffPct = typicalDailyKwh > 0 ? (diff / typicalDailyKwh) * 100 : 0;
  const isAbove = diff > 0;

  // Monthly bar chart data
  const maxGhi = Math.max(...monthlyGhi);

  return (
    <div className="glass-card p-5 space-y-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <span className="text-sky-400 text-base leading-none">&#128202;</span>
        Historical Comparison
      </h2>

      <p className="text-xs text-slate-500">
        NASA POWER 20-year average for {city} &middot; {monthName}
      </p>

      {/* Comparison cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-400">NASA Typical</p>
          <p className="text-xl font-bold text-sky-400">{typicalDailyKwh.toFixed(1)}</p>
          <p className="text-xs text-slate-500">kWh/day</p>
        </div>
        <div className={`rounded-xl p-3 text-center border ${
          isAbove
            ? "bg-emerald-500/10 border-emerald-500/20"
            : "bg-orange-500/10 border-orange-500/20"
        }`}>
          <p className="text-xs text-slate-400">Your Forecast</p>
          <p className={`text-xl font-bold ${isAbove ? "text-emerald-400" : "text-orange-400"}`}>
            {forecastAvgDaily.toFixed(1)}
          </p>
          <p className="text-xs text-slate-500">kWh/day</p>
        </div>
      </div>

      {/* Verdict */}
      <div className={`rounded-lg p-3 text-sm ${
        isAbove ? "bg-emerald-500/10" : "bg-orange-500/10"
      }`}>
        <p className={isAbove ? "text-emerald-300" : "text-orange-300"}>
          {isAbove ? "+" : ""}{diffPct.toFixed(0)}% vs historical average
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {isAbove
            ? `This week's forecast is above the 20-year ${monthName} average. Great solar conditions ahead!`
            : `This week is below the ${monthName} average. Cloud cover or weather patterns are reducing expected output.`}
        </p>
      </div>

      {/* Annual solar profile */}
      <details className="group">
        <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
          {city} monthly solar profile
        </summary>
        <div className="mt-3 space-y-2">
          <div className="flex items-end gap-1 h-24">
            {monthlyGhi.map((ghi, i) => {
              const height = (ghi / maxGhi) * 100;
              const isCurrent = i === currentMonth;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t transition-all ${
                      isCurrent ? "bg-amber-400" : "bg-white/15"
                    }`}
                    style={{ height: `${height}%` }}
                    title={`${MONTH_LABELS[i]}: ${ghi.toFixed(1)} kWh/m²/day → ~${(ghi * forecast.system_kw * performanceRatio).toFixed(1)} kWh/day`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-1">
            {MONTH_LABELS.map((label, i) => (
              <div
                key={label}
                className={`flex-1 text-center text-[9px] ${
                  i === currentMonth ? "text-amber-400 font-bold" : "text-slate-600"
                }`}
              >
                {label}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-600">
            Data: NASA POWER CERES/MERRA2 20-year climatology. Bar height = avg daily GHI (kWh/m&sup2;/day).
          </p>
        </div>
      </details>
    </div>
  );
}

const MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
