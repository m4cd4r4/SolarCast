"use client";

import { useState } from "react";
import type { ForecastResponse } from "@/lib/types";
import { usePersistedState } from "@/lib/use-persisted-state";

interface SystemHealthProps {
  forecast: ForecastResponse;
}

interface DailyReading {
  date: string;
  actual_kwh: number;
}

export function SystemHealth({ forecast }: SystemHealthProps) {
  const [readings, setReadings] = usePersistedState<DailyReading[]>("solarcast_readings", []);
  const [inputKwh, setInputKwh] = useState("");
  const [inputDate, setInputDate] = useState(new Date().toISOString().slice(0, 10));

  function handleAddReading() {
    const kwh = parseFloat(inputKwh);
    if (isNaN(kwh) || kwh < 0) return;

    const filtered = readings.filter((r) => r.date !== inputDate);
    const updated = [...filtered, { date: inputDate, actual_kwh: kwh }].sort((a, b) => b.date.localeCompare(a.date));
    setReadings(updated);
    setInputKwh("");
  }

  // Match readings to forecast days
  const comparisons = readings
    .map((reading) => {
      const forecastDay = forecast.daily.find((d) => d.date === reading.date);
      if (!forecastDay) return null;
      const diff = reading.actual_kwh - forecastDay.total_kwh;
      const diffPct = forecastDay.total_kwh > 0 ? (diff / forecastDay.total_kwh) * 100 : 0;
      return { ...reading, expected: forecastDay.total_kwh, diff, diffPct };
    })
    .filter(Boolean) as Array<{
      date: string;
      actual_kwh: number;
      expected: number;
      diff: number;
      diffPct: number;
    }>;

  // Overall health score (based on matched readings)
  const avgDiffPct =
    comparisons.length > 0
      ? comparisons.reduce((s, c) => s + Math.abs(c.diffPct), 0) / comparisons.length
      : null;

  let healthGrade: { label: string; color: string; advice: string } | null = null;
  if (avgDiffPct !== null) {
    if (avgDiffPct <= 10) {
      healthGrade = {
        label: "Excellent",
        color: "text-emerald-400",
        advice: "Your system is performing as expected. Panels are clean and operating efficiently.",
      };
    } else if (avgDiffPct <= 20) {
      healthGrade = {
        label: "Good",
        color: "text-sky-400",
        advice: "Minor variance from forecast. This is normal due to localised weather differences.",
      };
    } else if (avgDiffPct <= 35) {
      healthGrade = {
        label: "Fair",
        color: "text-amber-400",
        advice: "Noticeable gap between forecast and actual. Consider checking for shading, dirty panels, or inverter issues.",
      };
    } else {
      healthGrade = {
        label: "Needs Attention",
        color: "text-red-400",
        advice: "Significant underperformance detected. Check for panel damage, inverter faults, heavy shading, or bird droppings.",
      };
    }
  }

  return (
    <div className="glass-card p-5 space-y-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <span className="text-emerald-400 text-lg leading-none">&#9825;</span>
        System Health
      </h2>

      {/* Health score */}
      {healthGrade ? (
        <div className={`rounded-xl p-4 bg-white/5 border border-white/10`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Health Score</p>
              <p className={`text-2xl font-bold ${healthGrade.color}`}>{healthGrade.label}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Avg variance</p>
              <p className="text-lg font-mono text-white">{avgDiffPct!.toFixed(0)}%</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">{healthGrade.advice}</p>
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <p className="text-slate-400 text-sm">
            Enter your actual meter readings below to see your system health score.
          </p>
          <p className="text-slate-500 text-xs mt-1">
            Compare inverter/meter readings with our forecast to detect issues.
          </p>
        </div>
      )}

      {/* Input form */}
      <div className="space-y-2">
        <label className="block text-xs text-slate-400">Log actual production</label>
        <div className="flex gap-2">
          <input
            type="date"
            value={inputDate}
            onChange={(e) => setInputDate(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
              focus:outline-none focus:border-amber-500/50"
          />
          <input
            type="number"
            placeholder="kWh"
            value={inputKwh}
            onChange={(e) => setInputKwh(e.target.value)}
            step="0.1"
            min="0"
            className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
              focus:outline-none focus:border-amber-500/50"
          />
          <button
            onClick={handleAddReading}
            className="px-4 py-2 rounded-lg text-sm font-medium
              bg-gradient-to-r from-amber-500 to-orange-500 text-white
              hover:from-amber-400 hover:to-orange-400 transition-all"
          >
            Add
          </button>
        </div>
      </div>

      {/* Comparison table */}
      {comparisons.length > 0 && (
        <div className="space-y-1">
          <div className="grid grid-cols-4 text-[10px] text-slate-500 uppercase tracking-wider px-2">
            <span>Date</span>
            <span className="text-right">Forecast</span>
            <span className="text-right">Actual</span>
            <span className="text-right">Variance</span>
          </div>
          {comparisons.slice(0, 7).map((c) => (
            <div
              key={c.date}
              className="grid grid-cols-4 text-sm py-1.5 px-2 rounded bg-white/5"
            >
              <span className="text-slate-400 text-xs">
                {new Date(c.date + "T00:00:00").toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
              <span className="text-right text-white">{c.expected.toFixed(1)}</span>
              <span className="text-right text-white">{c.actual_kwh.toFixed(1)}</span>
              <span
                className={`text-right font-mono ${
                  Math.abs(c.diffPct) <= 10
                    ? "text-emerald-400"
                    : Math.abs(c.diffPct) <= 25
                      ? "text-amber-400"
                      : "text-red-400"
                }`}
              >
                {c.diffPct > 0 ? "+" : ""}
                {c.diffPct.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* All readings management */}
      {readings.length > 0 && (
        <details className="group">
          <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
            All readings ({readings.length})
          </summary>
          <div className="mt-2 space-y-1">
            {readings.map((r) => (
              <div
                key={r.date}
                className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white/5"
              >
                <span className="text-slate-400">{r.date}</span>
                <span className="text-white">{r.actual_kwh.toFixed(1)} kWh</span>
                <button
                  onClick={() => setReadings(readings.filter((x) => x.date !== r.date))}
                  className="text-slate-600 hover:text-red-400 transition-colors"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
