"use client";

import { useState } from "react";

interface OnboardingOverlayProps {
  onDismiss: () => void;
}

const STEPS = [
  {
    title: "Welcome to SolarCast",
    icon: "\u2600\uFE0F",
    content: (
      <>
        <p className="text-slate-300 text-sm leading-relaxed">
          SolarCast predicts how much electricity your solar panels will produce
          over the next 7 days, using real-time weather data from global
          meteorological services.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <MiniStat label="Free" detail="No account needed" />
          <MiniStat label="Real-time" detail="Updated hourly" />
          <MiniStat label="Australian" detail="All capital cities" />
        </div>
      </>
    ),
  },
  {
    title: "How It Works",
    icon: "\u2699\uFE0F",
    content: (
      <>
        <div className="space-y-3">
          <Step
            num={1}
            title="You tell us your system"
            detail="Location, panel size (kW), and optionally tilt and orientation."
          />
          <Step
            num={2}
            title="We fetch weather forecasts"
            detail="Solar irradiance, cloud cover, temperature, and UV index from Open-Meteo's global weather models."
          />
          <Step
            num={3}
            title="We calculate production"
            detail="Your system size, panel efficiency, and temperature effects are combined to estimate hourly kWh output."
          />
          <Step
            num={4}
            title="You get actionable advice"
            detail="Plain English forecasts, best times to run appliances, battery tips, and daily scheduling."
          />
        </div>
      </>
    ),
  },
  {
    title: "Reading the Dashboard",
    icon: "\u2600\uFE0F",
    content: (
      <>
        <div className="space-y-3 text-sm">
          <InfoRow
            icon={<span className="w-5 h-5 rounded bg-amber-400/20 inline-flex items-center justify-center text-amber-400 text-xs font-bold">7d</span>}
            title="Daily Cards"
            detail="Click any day to expand the hourly breakdown. Bar colour shows cloud cover: amber = clear, grey = cloudy."
          />
          <InfoRow
            icon={<span className="text-emerald-400 text-lg leading-none">{"\u26A1"}</span>}
            title="Smart Schedule"
            detail="Personalised tips for when to run heavy appliances, charge your EV, or hold your battery."
          />
          <InfoRow
            icon={<span className="w-5 h-5 rounded bg-sky-400/20 inline-flex items-center justify-center text-sky-400 text-xs font-bold">#</span>}
            title="Stats Row"
            detail="Today's forecast, 7-day total, your system size, and the best production day at a glance."
          />
          <InfoRow
            icon={<span className="text-emerald-400 text-lg leading-none font-bold">$</span>}
            title="Cost Savings"
            detail="See estimated dollar savings based on your electricity tariff rate."
          />
        </div>
      </>
    ),
  },
  {
    title: "Setup Tips for Australia",
    icon: "\u2600\uFE0F",
    content: (
      <>
        <div className="space-y-2 text-sm">
          <SetupTip
            label="System size"
            value="6.6 kW"
            detail="Most popular AU size (inverter limits + rebate threshold)"
            color="amber"
          />
          <SetupTip
            label="Tilt angle"
            value={<>25-34&deg;</>}
            detail="Set to your latitude for max annual output. 25 degrees works for most roofs."
            color="sky"
          />
          <SetupTip
            label="Azimuth"
            value={<>0&deg; = North</>}
            detail="Ideal for Australia. East/west splits: use -90/+90."
            color="emerald"
          />
          <SetupTip
            label="Efficiency"
            value="82%"
            detail="Accounts for inverter, wiring, dust. Use 75% if significant shading."
            color="purple"
          />
        </div>
      </>
    ),
  },
];

export function OnboardingOverlay({ onDismiss }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Modal */}
      <div className="relative glass-card p-0 w-full max-w-lg overflow-hidden animate-[fadeIn_0.3s_ease-out]">
        {/* Progress bar */}
        <div className="h-1 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">{current.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-white">{current.title}</h2>
              <p className="text-xs text-slate-500">
                {step + 1} of {STEPS.length}
              </p>
            </div>
          </div>

          {/* Content — fixed height so navigation doesn't shift between steps */}
          <div className="h-[260px] overflow-y-auto">{current.content}</div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onDismiss}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Skip tour
            </button>

            <div className="flex items-center gap-2">
              {/* Dots */}
              <div className="flex gap-1.5 mr-3">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === step
                        ? "bg-amber-400 w-4"
                        : i < step
                          ? "bg-amber-400/40"
                          : "bg-white/15"
                    }`}
                  />
                ))}
              </div>

              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
                >
                  Back
                </button>
              )}

              <button
                onClick={() => (isLast ? onDismiss() : setStep(step + 1))}
                className="px-5 py-2 rounded-lg text-sm font-medium transition-all
                  bg-gradient-to-r from-amber-500 to-orange-500 text-white
                  hover:from-amber-400 hover:to-orange-400 hover:shadow-lg hover:shadow-amber-500/25"
              >
                {isLast ? "Get Started" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="bg-white/5 rounded-lg p-3 text-center">
      <p className="text-amber-400 font-bold text-sm">{label}</p>
      <p className="text-slate-500 text-xs">{detail}</p>
    </div>
  );
}

function Step({
  num,
  title,
  detail,
}: {
  num: number;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center mt-0.5">
        {num}
      </span>
      <div>
        <p className="text-white text-sm font-medium">{title}</p>
        <p className="text-slate-400 text-xs">{detail}</p>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="text-white font-medium">{title}</p>
        <p className="text-slate-400 text-xs">{detail}</p>
      </div>
    </div>
  );
}

function SetupTip({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: React.ReactNode;
  detail: string;
  color: "amber" | "sky" | "emerald" | "purple";
}) {
  const colorMap = {
    amber: "bg-amber-500/15 border-amber-500/25 text-amber-400",
    sky: "bg-sky-500/15 border-sky-500/25 text-sky-400",
    emerald: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400",
    purple: "bg-purple-500/15 border-purple-500/25 text-purple-400",
  };

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${colorMap[color]}`}>
      <div className="min-w-[72px] text-center">
        <p className="text-sm font-bold">{value}</p>
      </div>
      <div className="border-l border-white/10 pl-3">
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-slate-400 text-xs">{detail}</p>
      </div>
    </div>
  );
}
