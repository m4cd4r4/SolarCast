"use client";

import { useState } from "react";
import type { DailyForecast } from "@/lib/types";
import { HourlyChart } from "./hourly-chart";

interface DailyCardsProps {
  daily: DailyForecast[];
}

export function DailyCards({ daily }: DailyCardsProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const maxKwh = Math.max(...daily.map((d) => d.total_kwh));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">7-Day Forecast</h2>

      <div className="grid gap-3">
        {daily.map((day) => {
          const isSelected = selectedDay === day.date;
          const barWidth = maxKwh > 0 ? (day.total_kwh / maxKwh) * 100 : 0;
          const isToday = day.date === new Date().toISOString().slice(0, 10);

          return (
            <div key={day.date}>
              <button
                onClick={() => setSelectedDay(isSelected ? null : day.date)}
                className={`w-full glass-card p-4 text-left transition-all cursor-pointer ${
                  isSelected ? "solar-glow border-amber-500/30" : "glass-card-hover"
                } ${isToday ? "ring-1 ring-amber-500/20" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[48px]">
                      <p className="text-xs text-slate-500">{formatWeekday(day.date)}</p>
                      <p className="text-sm font-medium text-white">{formatDayMonth(day.date)}</p>
                      {isToday && (
                        <span className="text-[10px] text-amber-400 font-medium">TODAY</span>
                      )}
                    </div>
                    <WeatherIcon cloudPct={day.avg_cloud_cover_pct} />
                    <div>
                      <p className="text-sm text-white font-medium">
                        {day.total_kwh.toFixed(1)} kWh
                      </p>
                      <p className="text-xs text-slate-400">
                        {day.sunshine_hours}h sun &middot; {day.avg_cloud_cover_pct.toFixed(0)}%
                        cloud
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Peak</p>
                    <p className="text-sm text-amber-400 font-mono">
                      {day.peak_kw.toFixed(2)} kW
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatTime(day.peak_hour)}
                    </p>
                  </div>
                </div>

                {/* Production bar */}
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="production-bar h-full"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                <p className="text-xs text-slate-400 mt-2 italic">{day.description}</p>
              </button>

              {/* Expanded hourly view */}
              {isSelected && (
                <div className="mt-2 glass-card p-4 animate-[fadeIn_0.2s_ease-out]">
                  <HourlyChart hourly={day.hourly} systemKw={day.peak_kw} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeatherIcon({ cloudPct }: { cloudPct: number }) {
  let icon: string;
  let color: string;

  if (cloudPct <= 10) {
    icon = "\u2600\uFE0F"; // sun
    color = "text-amber-400";
  } else if (cloudPct <= 40) {
    icon = "\u26C5"; // sun behind cloud
    color = "text-amber-300";
  } else if (cloudPct <= 70) {
    icon = "\u2601\uFE0F"; // cloud
    color = "text-slate-400";
  } else {
    icon = "\u2601\uFE0F"; // heavy cloud
    color = "text-slate-500";
  }

  return <span className={`text-2xl ${color}`}>{icon}</span>;
}

function formatWeekday(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short" });
}

function formatDayMonth(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

function formatTime(timeStr: string): string {
  const hour = parseInt(timeStr.split("T")[1]?.split(":")[0] ?? "0", 10);
  return hour === 0 ? "12am" : hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour - 12}pm`;
}
