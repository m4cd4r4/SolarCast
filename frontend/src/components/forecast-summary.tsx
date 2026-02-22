"use client";

import type { ForecastResponse } from "@/lib/types";

interface ForecastSummaryProps {
  forecast: ForecastResponse;
}

export function ForecastSummary({ forecast }: ForecastSummaryProps) {
  const today = forecast.daily[0];
  const avgDaily = forecast.total_forecast_kwh / forecast.daily.length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
