"use client";

import type { ForecastResponse } from "@/lib/types";

interface ForecastSummaryProps {
  forecast: ForecastResponse;
}

// NASA POWER 20-year monthly GHI averages (kWh/m²/day) for AU capitals
const NASA_MONTHLY_GHI: Record<string, number[]> = {
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
    Perth: [-31.95, 115.86], Sydney: [-33.87, 151.21], Melbourne: [-37.81, 144.96],
    Brisbane: [-27.47, 153.03], Adelaide: [-34.93, 138.60], Hobart: [-42.88, 147.33],
    Darwin: [-12.46, 130.84], Canberra: [-35.28, 149.13],
  };
  let closest = "Perth";
  let minDist = Infinity;
  for (const [name, [cLat, cLon]] of Object.entries(cities)) {
    const d = Math.sqrt((lat - cLat) ** 2 + (lon - cLon) ** 2);
    if (d < minDist) { minDist = d; closest = name; }
  }
  return closest;
}

export function ForecastSummary({ forecast }: ForecastSummaryProps) {
  const today = forecast.daily[0];
  const avgDaily = forecast.total_forecast_kwh / forecast.daily.length;

  // NASA historical comparison
  const city = findClosestCity(forecast.latitude, forecast.longitude);
  const monthlyGhi = NASA_MONTHLY_GHI[city] ?? NASA_MONTHLY_GHI.Perth;
  const currentMonth = new Date().getMonth();
  const typicalDailyKwh = monthlyGhi[currentMonth] * forecast.system_kw * 0.78;
  const diffPct = typicalDailyKwh > 0 ? ((avgDaily - typicalDailyKwh) / typicalDailyKwh) * 100 : 0;
  const isAbove = diffPct >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatCard
        label="Today's Forecast"
        value={`${today?.total_kwh.toFixed(1)}`}
        unit="kWh"
        color="solar"
        sublabel={today?.description.split(".")[0] ?? ""}
      />
      <StatCard
        label="7-Day Total"
        value={`${forecast.total_forecast_kwh.toFixed(0)}`}
        unit="kWh"
        color="blue"
        sublabel={`~${avgDaily.toFixed(1)} kWh/day avg`}
      />
      <StatCard
        label="System Size"
        value={`${forecast.system_kw}`}
        unit="kW"
        color="green"
        sublabel="Installed capacity"
      />
      <StatCard
        label="Best Day"
        value={`${Math.max(...forecast.daily.map((d) => d.total_kwh)).toFixed(1)}`}
        unit="kWh"
        color="solar"
        sublabel={formatDateShort(
          forecast.daily.reduce((best, d) => (d.total_kwh > best.total_kwh ? d : best)).date,
        )}
      />
      <div className="glass-card p-4 space-y-1">
        <p className="text-xs text-slate-500 uppercase tracking-wider">vs NASA Avg</p>
        <p className={`text-2xl font-bold ${isAbove ? "text-emerald-400" : "text-orange-400"}`}>
          {isAbove ? "+" : ""}{diffPct.toFixed(0)}
          <span className="text-sm font-normal text-slate-500 ml-1">%</span>
        </p>
        <p className="text-xs text-slate-400">
          {city} {new Date().toLocaleDateString("en-AU", { month: "short" })} typical: {typicalDailyKwh.toFixed(1)}/day
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  color,
  sublabel,
}: {
  label: string;
  value: string;
  unit: string;
  color: "solar" | "blue" | "green";
  sublabel: string;
}) {
  const colorMap = {
    solar: "text-amber-400",
    blue: "text-sky-400",
    green: "text-emerald-400",
  };

  return (
    <div className="glass-card p-4 space-y-1">
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold ${colorMap[color]}`}>
        {value}
        <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>
      </p>
      <p className="text-xs text-slate-400">{sublabel}</p>
    </div>
  );
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-AU", { weekday: "short", month: "short", day: "numeric" });
}
