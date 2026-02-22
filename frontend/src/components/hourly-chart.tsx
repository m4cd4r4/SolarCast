"use client";

import type { HourlyProduction } from "@/lib/types";

interface HourlyChartProps {
  hourly: HourlyProduction[];
  systemKw: number;
}

export function HourlyChart({ hourly }: HourlyChartProps) {
  // Filter to daytime hours with any GHI
  const daytime = hourly.filter((h) => {
    const hour = parseInt(h.time.split("T")[1]?.split(":")[0] ?? "0", 10);
    return hour >= 5 && hour <= 20;
  });

  const maxKwh = Math.max(...daytime.map((h) => h.estimated_kwh), 0.01);

  return (
    <div>
      <h3 className="text-sm font-medium text-slate-300 mb-3">Hourly Breakdown</h3>
      <div className="flex items-end gap-[3px] h-32">
        {daytime.map((h) => {
          const height = (h.estimated_kwh / maxKwh) * 100;
          const hour = parseInt(h.time.split("T")[1]?.split(":")[0] ?? "0", 10);
          const isNow = isCurrentHour(h.time);

          // Color by cloud cover
          let barColor: string;
          if (h.cloud_cover_pct <= 20) barColor = "bg-amber-400";
          else if (h.cloud_cover_pct <= 50) barColor = "bg-amber-300";
          else if (h.cloud_cover_pct <= 75) barColor = "bg-slate-400";
          else barColor = "bg-slate-500";

          return (
            <div key={h.time} className="flex-1 flex flex-col items-center gap-1 group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="glass-card p-2 text-xs whitespace-nowrap">
                  <p className="text-white font-medium">{h.estimated_kwh.toFixed(2)} kWh</p>
                  <p className="text-slate-400">
                    {h.ghi_wm2.toFixed(0)} W/m&sup2; &middot; {h.cloud_cover_pct}% cloud
                  </p>
                  <p className="text-slate-400">{h.temperature_c.toFixed(1)}&deg;C</p>
                </div>
              </div>

              {/* Bar */}
              <div
                className={`w-full rounded-t-sm transition-all ${barColor} ${
                  isNow ? "ring-2 ring-white/40" : ""
                }`}
                style={{ height: `${Math.max(height, 1)}%` }}
              />

              {/* Time label (show every 2 hours) */}
              {hour % 2 === 0 && (
                <span className={`text-[10px] ${isNow ? "text-white font-bold" : "text-slate-500"}`}>
                  {hour}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-amber-400" /> Clear
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-amber-300" /> Partly cloudy
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-slate-400" /> Cloudy
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-slate-500" /> Overcast
        </span>
      </div>
    </div>
  );
}

function isCurrentHour(timeStr: string): boolean {
  const now = new Date();
  const forecastDate = new Date(timeStr);
  return (
    now.getFullYear() === forecastDate.getFullYear() &&
    now.getMonth() === forecastDate.getMonth() &&
    now.getDate() === forecastDate.getDate() &&
    now.getHours() === forecastDate.getHours()
  );
}
