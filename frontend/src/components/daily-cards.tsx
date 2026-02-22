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

      {/* Compact single-row cards */}
      <div className="grid grid-cols-7 gap-2">
        {daily.map((day) => {
          const isSelected = selectedDay === day.date;
          const barHeight = maxKwh > 0 ? (day.total_kwh / maxKwh) * 100 : 0;
          const isToday = day.date === new Date().toISOString().slice(0, 10);

          return (
            <button
              key={day.date}
              onClick={() => setSelectedDay(isSelected ? null : day.date)}
              className={`glass-card p-3 text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                isSelected ? "solar-glow border-amber-500/30" : "glass-card-hover"
              } ${isToday ? "ring-1 ring-amber-500/20" : ""}`}
            >
              {/* Day label */}
              <p className={`text-[10px] uppercase tracking-wider ${isToday ? "text-amber-400 font-bold" : "text-slate-500"}`}>
                {isToday ? "Today" : formatWeekday(day.date)}
              </p>

              {/* Date */}
              <p className="text-xs text-slate-400">{formatDayMonth(day.date)}</p>

              {/* Weather icon */}
              <WeatherIcon cloudPct={day.avg_cloud_cover_pct} />

              {/* kWh — main metric */}
              <p className="text-lg font-bold text-amber-400">
                {day.total_kwh.toFixed(1)}
              </p>
              <p className="text-[10px] text-slate-500 -mt-1">kWh</p>

              {/* Mini production bar (vertical) */}
              <div className="w-5 h-10 bg-white/5 rounded-full overflow-hidden flex flex-col justify-end">
                <div
                  className="production-bar w-full rounded-full"
                  style={{ height: `${barHeight}%` }}
                />
              </div>

              {/* Sun hours + cloud */}
              <p className="text-[10px] text-slate-500">
                {day.sunshine_hours}h&nbsp;sun
              </p>
              <p className="text-[10px] text-slate-500">
                {day.avg_cloud_cover_pct.toFixed(0)}%&nbsp;cloud
              </p>
            </button>
          );
        })}
      </div>

      {/* Expanded hourly view below the row */}
      {selectedDay && (() => {
        const day = daily.find((d) => d.date === selectedDay);
        if (!day) return null;
        return (
          <div className="glass-card p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-white">
                  {new Date(day.date + "T00:00:00").toLocaleDateString("en-AU", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <p className="text-xs text-slate-400 italic">{day.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-amber-400">{day.total_kwh.toFixed(1)} kWh</p>
                <p className="text-xs text-slate-500">
                  Peak {day.peak_kw.toFixed(2)} kW at {formatTime(day.peak_hour)}
                </p>
              </div>
            </div>
            <HourlyChart hourly={day.hourly} systemKw={day.peak_kw} />
          </div>
        );
      })()}
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

  return <span className={`text-xl ${color}`}>{icon}</span>;
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
