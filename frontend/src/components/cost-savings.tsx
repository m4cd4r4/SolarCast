"use client";

import { useState } from "react";
import type { ForecastResponse } from "@/lib/types";

interface CostSavingsProps {
  forecast: ForecastResponse;
  tariff: number;
  onTariffChange: (tariff: number) => void;
  feedInRate: number;
  onFeedInChange: (rate: number) => void;
}

const COMMON_TARIFFS = [
  { label: "Low", rate: 0.25, desc: "$0.25/kWh" },
  { label: "Average", rate: 0.33, desc: "$0.33/kWh" },
  { label: "High", rate: 0.42, desc: "$0.42/kWh" },
  { label: "TOU Peak", rate: 0.55, desc: "$0.55/kWh" },
];

const COMMON_FIT = [
  { label: "Min", rate: 0.03, desc: "3c" },
  { label: "Low", rate: 0.05, desc: "5c" },
  { label: "Mid", rate: 0.08, desc: "8c" },
  { label: "High", rate: 0.12, desc: "12c" },
];

export function CostSavings({
  forecast,
  tariff,
  onTariffChange,
  feedInRate,
  onFeedInChange,
}: CostSavingsProps) {
  const [selfConsumePct, setSelfConsumePct] = useState(60);

  const totalKwh = forecast.total_forecast_kwh;
  const selfConsumed = totalKwh * (selfConsumePct / 100);
  const exported = totalKwh - selfConsumed;

  const selfConsumeSavings = selfConsumed * tariff;
  const exportEarnings = exported * feedInRate;
  const totalSavings = selfConsumeSavings + exportEarnings;

  const dailyAvgSavings = totalSavings / forecast.daily.length;
  const annualEstimate = dailyAvgSavings * 365;

  return (
    <div className="glass-card p-5 space-y-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <span className="text-accent-green">$</span>
        Cost Savings
      </h2>

      {/* Main savings display */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-400">7-Day Savings</p>
          <p className="text-2xl font-bold text-emerald-400">
            ${totalSavings.toFixed(2)}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-400">Daily Average</p>
          <p className="text-2xl font-bold text-white">
            ${dailyAvgSavings.toFixed(2)}
          </p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-400">Annual Estimate</p>
          <p className="text-2xl font-bold text-amber-400">
            ${annualEstimate.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-slate-400 text-xs">Self-consumed</p>
          <p className="text-white font-medium">
            {selfConsumed.toFixed(1)} kWh &times; ${tariff.toFixed(2)}
          </p>
          <p className="text-emerald-400 text-sm font-mono">
            = ${selfConsumeSavings.toFixed(2)}
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-slate-400 text-xs">Exported to grid</p>
          <p className="text-white font-medium">
            {exported.toFixed(1)} kWh &times; ${feedInRate.toFixed(2)}
          </p>
          <p className="text-sky-400 text-sm font-mono">
            = ${exportEarnings.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Controls */}
      <details className="group">
        <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
          Adjust rates &amp; self-consumption
        </summary>
        <div className="mt-3 space-y-4">
          {/* Electricity tariff */}
          <div>
            <label className="block text-xs text-slate-400 mb-2">
              Electricity tariff:{" "}
              <span className="text-white font-medium">${tariff.toFixed(2)}/kWh</span>
            </label>
            <div className="flex gap-2">
              {COMMON_TARIFFS.map((t) => (
                <button
                  key={t.rate}
                  onClick={() => onTariffChange(t.rate)}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-xs transition-all ${
                    Math.abs(tariff - t.rate) < 0.01
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="font-medium">{t.label}</div>
                  <div className="text-[10px] opacity-70">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Feed-in tariff */}
          <div>
            <label className="block text-xs text-slate-400 mb-2">
              Feed-in rate:{" "}
              <span className="text-white font-medium">${feedInRate.toFixed(2)}/kWh</span>
            </label>
            <div className="flex gap-2">
              {COMMON_FIT.map((f) => (
                <button
                  key={f.rate}
                  onClick={() => onFeedInChange(f.rate)}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-xs transition-all ${
                    Math.abs(feedInRate - f.rate) < 0.01
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                      : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="font-medium">{f.label}</div>
                  <div className="text-[10px] opacity-70">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Self-consumption slider */}
          <div>
            <label className="block text-xs text-slate-400 mb-2">
              Self-consumption:{" "}
              <span className="text-white font-medium">{selfConsumePct}%</span>
              <span className="text-slate-500 ml-1">
                (typical AU home: 30-60%)
              </span>
            </label>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={selfConsumePct}
              onChange={(e) => setSelfConsumePct(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>10% (mostly export)</span>
              <span>100% (battery/no export)</span>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
