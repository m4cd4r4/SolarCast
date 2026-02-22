"use client";

import { useState, useEffect } from "react";
import type { ForecastResponse, SystemSetup } from "@/lib/types";
import { fetchForecast } from "@/lib/api";
import { usePersistedState } from "@/lib/use-persisted-state";
import { SetupForm } from "@/components/setup-form";
import { ForecastSummary } from "@/components/forecast-summary";
import { DailyCards } from "@/components/daily-cards";
import { SmartSchedule } from "@/components/smart-schedule";
import { CostSavings } from "@/components/cost-savings";
import { PriceOverlay } from "@/components/price-overlay";
import { OnboardingOverlay } from "@/components/onboarding-overlay";
function SolarCastLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" fill="#1a1f35" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      {/* Sun body */}
      <circle cx="12" cy="13" r="5.5" fill="url(#sun-grad)" />
      {/* Sun rays */}
      <rect x="11" y="4" width="2" height="3" rx="1" fill="#f59e0b" />
      <rect x="5" y="7.5" width="2" height="3" rx="1" fill="#f59e0b" transform="rotate(-45 6 9)" />
      <rect x="3" y="12" width="3" height="2" rx="1" fill="#f59e0b" />
      <rect x="5.5" y="17" width="2" height="3" rx="1" fill="#f59e0b" transform="rotate(45 6.5 18.5)" />
      {/* Bar chart (ascending) */}
      <rect x="14" y="20" width="3" height="6" rx="0.5" fill="url(#bar-grad)" />
      <rect x="18" y="16" width="3" height="10" rx="0.5" fill="url(#bar-grad)" />
      <rect x="22" y="12" width="3" height="14" rx="0.5" fill="url(#bar-grad)" />
      <rect x="26" y="8" width="3" height="18" rx="0.5" fill="url(#bar-grad)" />
      <defs>
        <linearGradient id="sun-grad" x1="12" y1="7" x2="12" y2="19" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="bar-grad" x1="20" y1="8" x2="20" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const DEFAULT_SYSTEM: SystemSetup = {
  latitude: -31.95,
  longitude: 115.86,
  peak_power_kw: 6.6,
  tilt_deg: 25,
  azimuth_deg: 0,
  efficiency: 0.82,
};

export default function Home() {
  const [system, setSystem] = usePersistedState<SystemSetup>("solarcast_system", DEFAULT_SYSTEM);
  const [tariff, setTariff] = usePersistedState<number>("solarcast_tariff", 0.33);
  const [feedInRate, setFeedInRate] = usePersistedState<number>("solarcast_fit", 0.05);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Check if first visit (after hydration)
  useEffect(() => {
    const seen = localStorage.getItem("solarcast_onboarding_seen");
    if (!seen) {
      setShowOnboarding(true);
    }
    setOnboardingChecked(true);
  }, []);

  function handleDismissOnboarding() {
    setShowOnboarding(false);
    localStorage.setItem("solarcast_onboarding_seen", "true");
  }

  function handleShowHelp() {
    setShowOnboarding(true);
  }

  async function handleForecast() {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchForecast(
        system.latitude,
        system.longitude,
        system.peak_power_kw,
        system.efficiency,
      );
      setForecast(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch forecast");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="solar-gradient-bg min-h-screen">
      {/* Onboarding overlay */}
      {showOnboarding && onboardingChecked && (
        <OnboardingOverlay onDismiss={handleDismissOnboarding} />
      )}

      {/* Header */}
      <header className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SolarCastLogo />
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">SolarCast</h1>
              <p className="text-[10px] text-slate-500 -mt-0.5">Solar Intelligence for Australia</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden md:block">
              Powered by Open-Meteo &middot; NASA POWER &middot; PVGIS
            </span>
            <button
              onClick={handleShowHelp}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10
                flex items-center justify-center text-slate-400
                hover:bg-white/10 hover:text-white hover:border-white/20
                transition-all"
              title="How SolarCast works"
            >
              <span className="text-sm font-medium">?</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Setup + Smart Schedule row */}
        <div className="grid md:grid-cols-2 gap-6">
          <SetupForm
            system={system}
            onChange={setSystem}
            onSubmit={handleForecast}
            loading={loading}
          />

          {forecast && forecast.daily[0] ? (
            <SmartSchedule today={forecast.daily[0]} systemKw={system.peak_power_kw} />
          ) : (
            <div className="glass-card p-6 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="text-4xl">{"\u2600\uFE0F"}</div>
                <p className="text-slate-400 text-sm max-w-xs">
                  Select your location and system size, then hit{" "}
                  <span className="text-amber-400">Get Solar Forecast</span> to see your
                  personalized production prediction.
                </p>
                <button
                  onClick={handleShowHelp}
                  className="text-xs text-slate-500 hover:text-amber-400 transition-colors underline underline-offset-2"
                >
                  New here? Take the tour
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="glass-card p-4 border-red-500/30 bg-red-500/10">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Forecast results */}
        {forecast && (
          <>
            <ForecastSummary forecast={forecast} />

            {/* Row 1: Cost savings + Price overlay */}
            <div className="grid md:grid-cols-2 gap-6">
              <CostSavings
                forecast={forecast}
                tariff={tariff}
                onTariffChange={setTariff}
                feedInRate={feedInRate}
                onFeedInChange={setFeedInRate}
              />
              {forecast.daily[0] && (
                <PriceOverlay
                  today={forecast.daily[0]}
                  tariff={tariff}
                  feedInRate={feedInRate}
                />
              )}
            </div>

            {/* Row 2: Daily forecast cards (full width) */}
            <DailyCards daily={forecast.daily} />

            {/* Footer with data attribution */}
            <div className="text-center py-6 space-y-1">
              <p className="text-xs text-slate-600">
                Weather data from Open-Meteo.com &middot; Historical data from NASA POWER &middot;
                System estimates from EU PVGIS
              </p>
              <p className="text-xs text-slate-600">
                Wholesale price patterns based on typical NEM profiles. Actual spot prices vary by region and time.
              </p>
              <p className="text-xs text-slate-600">
                Production estimates use a simplified model. Actual output varies with shading,
                panel condition, and local factors.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
