"use client";

import { useState } from "react";
import type { DailyForecast } from "@/lib/types";

interface PriceOverlayProps {
  today: DailyForecast;
  tariff: number;
  feedInRate: number;
}

// Typical NEM wholesale price patterns ($/MWh) by hour
// Based on aggregated AEMO data — shoulder, peak, off-peak profiles
const TYPICAL_SPOT_PRICE: Record<string, number[]> = {
  weekday: [
    50, 45, 40, 38, 42, 55, 85, 120, 140, 110, 80, 70,
    65, 60, 65, 80, 110, 160, 180, 140, 100, 75, 60, 52,
  ],
  weekend: [
    42, 38, 35, 33, 35, 40, 55, 70, 80, 75, 65, 58,
    55, 52, 55, 65, 80, 110, 120, 95, 75, 60, 50, 45,
  ],
};

export function PriceOverlay({ today, tariff, feedInRate }: PriceOverlayProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isWeekend = [0, 6].includes(new Date(today.date + "T00:00:00").getDay());
  const profile = isWeekend ? TYPICAL_SPOT_PRICE.weekend : TYPICAL_SPOT_PRICE.weekday;

  // Calculate hourly value: production × price signal
  const hourlyValue = today.hourly
    .filter((h) => h.estimated_kwh > 0)
    .map((h) => {
      const hour = parseInt(h.time.split("T")[1]?.split(":")[0] ?? "0", 10);
      const spotPrice = profile[hour] / 1000; // $/MWh → $/kWh
      const isHighPrice = spotPrice > 0.1; // above $100/MWh
      return { hour, kwh: h.estimated_kwh, spotPrice, isHighPrice, time: h.time };
    });

  // Find best export windows (high spot price + good production)
  const exportWindows = hourlyValue
    .filter((h) => h.isHighPrice && h.kwh > 0.2)
    .sort((a, b) => b.spotPrice * b.kwh - a.spotPrice * a.kwh);

  // Find best self-consumption windows (low spot price + good production)
  const selfConsumeWindows = hourlyValue
    .filter((h) => !h.isHighPrice && h.kwh > 0.3)
    .sort((a, b) => b.kwh - a.kwh);

  // Calculate potential earnings from smart export timing
  const totalExportValue = exportWindows.reduce((s, h) => s + h.kwh * feedInRate, 0);
  const peakExportValue = exportWindows.slice(0, 3).reduce((s, h) => s + h.kwh * feedInRate * 1.5, 0);

  const maxSpot = Math.max(...profile);
  const peakHour = profile.indexOf(maxSpot);

  return (
    <div className="glass-card p-5 space-y-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <span className="text-amber-400 text-xl leading-none">&#9889;</span>
        Price-Smart Export
      </h2>

      {/* Price curve visualization */}
      <div className="space-y-2">
        <div className="flex items-end gap-[2px] h-20">
          {profile.map((price, hour) => {
            const height = (price / maxSpot) * 100;
            const production = today.hourly.find((h) => {
              const hh = parseInt(h.time.split("T")[1]?.split(":")[0] ?? "0", 10);
              return hh === hour;
            });
            const hasProduction = (production?.estimated_kwh ?? 0) > 0.1;
            const isHigh = price > maxSpot * 0.7;

            return (
              <div
                key={hour}
                className="flex-1 rounded-t transition-all"
                style={{ height: `${height}%` }}
                title={`${hour}:00 — $${(price / 10).toFixed(0)}c/kWh${hasProduction ? ` | ${production!.estimated_kwh.toFixed(2)} kWh` : ""}`}
              >
                <div
                  className={`w-full h-full rounded-t ${
                    hasProduction && isHigh
                      ? "bg-emerald-400"
                      : hasProduction
                        ? "bg-amber-400/60"
                        : isHigh
                          ? "bg-red-400/40"
                          : "bg-white/10"
                  }`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>12am</span>
          <span>6am</span>
          <span>12pm</span>
          <span>6pm</span>
          <span>11pm</span>
        </div>
        <div className="flex gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-emerald-400" /> Export window (high price + solar)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-amber-400/60" /> Solar (use it)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-red-400/40" /> Price spike (no solar)
          </span>
        </div>
      </div>

      {/* Key insight */}
      {exportWindows.length > 0 ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
          <p className="text-emerald-300 font-medium text-sm">
            Export at {formatHour(exportWindows[0].hour)} when prices peak
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Wholesale typically spikes to ~${(profile[peakHour] / 10).toFixed(0)}c/kWh at {formatHour(peakHour)}.
            {selfConsumeWindows.length > 0 &&
              ` Self-consume at ${formatHour(selfConsumeWindows[0].hour)} when prices are low.`}
          </p>
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-slate-300 text-sm">No high-value export windows today</p>
          <p className="text-slate-500 text-xs">Maximise self-consumption instead.</p>
        </div>
      )}

      {/* Detailed hourly breakdown */}
      <details className="group">
        <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
          Hourly price guide ({isWeekend ? "weekend" : "weekday"} profile)
        </summary>
        <div className="mt-3 max-h-48 overflow-y-auto space-y-1">
          {hourlyValue.map((h) => (
            <div
              key={h.hour}
              className={`flex items-center justify-between text-xs py-1.5 px-2 rounded ${
                h.isHighPrice ? "bg-emerald-500/10" : "bg-white/5"
              }`}
            >
              <span className="text-slate-400 w-12">{formatHour(h.hour)}</span>
              <span className="text-white">{h.kwh.toFixed(2)} kWh</span>
              <span className={h.isHighPrice ? "text-emerald-400 font-medium" : "text-slate-500"}>
                ~${(h.spotPrice * 100).toFixed(0)}c/kWh
              </span>
              <span className="text-slate-500 w-16 text-right">
                ${(h.kwh * (h.isHighPrice ? feedInRate * 1.5 : tariff)).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-600 mt-2">
          Prices shown are typical NEM wholesale patterns. Actual spot prices vary. Your retail tariff: ${tariff.toFixed(2)}/kWh.
        </p>
      </details>
    </div>
  );
}

function formatHour(hour: number): string {
  if (hour === 0 || hour === 24) return "12am";
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return "12pm";
  return `${hour - 12}pm`;
}
