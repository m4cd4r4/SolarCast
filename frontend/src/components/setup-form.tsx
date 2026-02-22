"use client";

import { AU_CITIES, COMMON_SYSTEM_SIZES, type SystemSetup } from "@/lib/types";

interface SetupFormProps {
  system: SystemSetup;
  onChange: (system: SystemSetup) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function SetupForm({ system, onChange, onSubmit, loading }: SetupFormProps) {
  const selectedCity = AU_CITIES.find(
    (c) => Math.abs(c.lat - system.latitude) < 0.1 && Math.abs(c.lon - system.longitude) < 0.1,
  );

  return (
    <div className="glass-card p-6 space-y-5">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <span className="text-accent-solar text-xl">&#9728;</span>
        Your Solar System
      </h2>

      {/* City selector */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">Location</label>
        <div className="flex flex-wrap gap-2">
          {AU_CITIES.map((city) => (
            <button
              key={city.name}
              onClick={() => onChange({ ...system, latitude: city.lat, longitude: city.lon })}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                selectedCity?.name === city.name
                  ? "bg-accent-solar/20 text-amber-300 border border-amber-500/40"
                  : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>

      {/* System size */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">
          System Size: <span className="text-white font-medium">{system.peak_power_kw} kW</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_SYSTEM_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => onChange({ ...system, peak_power_kw: size })}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                system.peak_power_kw === size
                  ? "bg-accent-blue/20 text-sky-300 border border-sky-500/40"
                  : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              {size} kW
            </button>
          ))}
        </div>
      </div>

      {/* Advanced settings (collapsed) */}
      <details className="group">
        <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
          Advanced settings
        </summary>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Tilt</label>
            <input
              type="number"
              value={system.tilt_deg}
              onChange={(e) => onChange({ ...system, tilt_deg: Number(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent-solar/50"
              min={0}
              max={90}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Azimuth</label>
            <input
              type="number"
              value={system.azimuth_deg}
              onChange={(e) => onChange({ ...system, azimuth_deg: Number(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent-solar/50"
              min={-180}
              max={180}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Efficiency</label>
            <input
              type="number"
              value={system.efficiency}
              onChange={(e) => onChange({ ...system, efficiency: Number(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent-solar/50"
              min={0.5}
              max={1.0}
              step={0.01}
            />
          </div>
        </div>
      </details>

      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all
          bg-gradient-to-r from-amber-500 to-orange-500 text-white
          hover:from-amber-400 hover:to-orange-400 hover:shadow-lg hover:shadow-amber-500/25
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            Forecasting...
          </span>
        ) : (
          "Get Solar Forecast"
        )}
      </button>
    </div>
  );
}
