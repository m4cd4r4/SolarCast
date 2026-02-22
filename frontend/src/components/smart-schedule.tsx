"use client";

import type { DailyForecast } from "@/lib/types";

interface SmartScheduleProps {
  today: DailyForecast;
  systemKw: number;
}

export function SmartSchedule({ today, systemKw }: SmartScheduleProps) {
  const producing = today.hourly.filter((h) => h.estimated_kwh > 0.1);

  if (producing.length === 0) {
    return (
      <div className="glass-card p-5">
        <h2 className="text-lg font-semibold text-white mb-2">Smart Schedule</h2>
        <p className="text-slate-400 text-sm">No significant solar production expected today.</p>
      </div>
    );
  }

  // Find the best window (highest continuous production)
  const sorted = [...producing].sort((a, b) => b.estimated_kwh - a.estimated_kwh);
  const peakStart = sorted[0];
  const peakEnd = sorted[Math.min(3, sorted.length - 1)];

  // Find the best 3-hour block
  let bestBlockStart = 0;
  let bestBlockKwh = 0;
  for (let i = 0; i < producing.length - 2; i++) {
    const blockKwh = producing[i].estimated_kwh + producing[i + 1].estimated_kwh + producing[i + 2].estimated_kwh;
    if (blockKwh > bestBlockKwh) {
      bestBlockKwh = blockKwh;
      bestBlockStart = i;
    }
  }

  const bestBlock = producing.slice(bestBlockStart, bestBlockStart + 3);
  const blockStartHour = formatHour(bestBlock[0]?.time ?? "");
  const blockEndHour = formatHour(bestBlock[bestBlock.length - 1]?.time ?? "", 1);

  const totalToday = today.total_kwh;
  const selfConsumeTarget = totalToday * 0.6; // aim to self-consume 60%

  const tips = generateTips(today, systemKw, blockStartHour, blockEndHour);

  return (
    <div className="glass-card p-5 space-y-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <span className="text-accent-green">&#9889;</span>
        Smart Schedule
      </h2>

      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
        <p className="text-emerald-300 font-medium text-sm">
          Best solar window: {blockStartHour} - {blockEndHour}
        </p>
        <p className="text-slate-400 text-xs mt-1">
          ~{bestBlockKwh.toFixed(1)} kWh in this 3-hour block. Run heavy appliances now to maximize
          self-consumption.
        </p>
      </div>

      <div className="space-y-2">
        {tips.map((tip, i) => (
          <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
            <span className="text-lg mt-0.5">{tip.icon}</span>
            <div>
              <p className="text-sm text-white">{tip.title}</p>
              <p className="text-xs text-slate-400">{tip.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Tip {
  icon: string;
  title: string;
  detail: string;
}

function generateTips(
  day: DailyForecast,
  systemKw: number,
  blockStart: string,
  blockEnd: string,
): Tip[] {
  const tips: Tip[] = [];
  const totalKwh = day.total_kwh;

  // Dishwasher/washing machine
  tips.push({
    icon: "\uD83E\uDDFA",
    title: `Run washing machine ${blockStart} - ${blockEnd}`,
    detail: `Peak production window. ~${(totalKwh * 0.15).toFixed(1)} kWh covers a typical wash cycle.`,
  });

  // Pool pump
  if (totalKwh > 15) {
    tips.push({
      icon: "\uD83C\uDFCA",
      title: `Run pool pump during solar hours`,
      detail: `With ${totalKwh.toFixed(0)} kWh today, you have surplus for a 4-6hr pump cycle.`,
    });
  }

  // EV charging
  if (systemKw >= 6) {
    tips.push({
      icon: "\uD83D\uDD0C",
      title: `EV charging: ${blockStart} start`,
      detail: `${systemKw.toFixed(1)} kW system can support ~2kW EV charging while covering house load.`,
    });
  }

  // Battery advice
  if (day.avg_cloud_cover_pct > 50) {
    tips.push({
      icon: "\uD83D\uDD0B",
      title: "Hold battery charge",
      detail: `Cloudy forecast (${day.avg_cloud_cover_pct.toFixed(0)}% cloud). Save battery for evening peak pricing.`,
    });
  } else {
    tips.push({
      icon: "\uD83D\uDD0B",
      title: "Battery will likely fill by midday",
      detail: `Clear skies forecast. Consider time-shifting heavy loads to afternoon.`,
    });
  }

  // Export warning for low production days
  if (totalKwh < systemKw * 2) {
    tips.push({
      icon: "\u26A0\uFE0F",
      title: "Low production day",
      detail: `Only ~${totalKwh.toFixed(1)} kWh expected. Minimize grid exports, maximize self-consumption.`,
    });
  }

  return tips;
}

function formatHour(timeStr: string, addHours: number = 0): string {
  const hour = parseInt(timeStr.split("T")[1]?.split(":")[0] ?? "0", 10) + addHours;
  if (hour === 0 || hour === 24) return "12am";
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return "12pm";
  return `${hour - 12}pm`;
}
