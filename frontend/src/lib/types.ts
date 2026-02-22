export interface SystemSetup {
  latitude: number;
  longitude: number;
  peak_power_kw: number;
  tilt_deg: number;
  azimuth_deg: number;
  efficiency: number;
}

export interface HourlyProduction {
  time: string;
  estimated_kwh: number;
  ghi_wm2: number;
  cloud_cover_pct: number;
  temperature_c: number;
  weather_description: string;
}

export interface DailyForecast {
  date: string;
  total_kwh: number;
  peak_kw: number;
  peak_hour: string;
  avg_cloud_cover_pct: number;
  sunshine_hours: number;
  description: string;
  hourly: HourlyProduction[];
}

export interface ForecastResponse {
  latitude: number;
  longitude: number;
  system_kw: number;
  forecast_days: number;
  total_forecast_kwh: number;
  daily: DailyForecast[];
}

export interface SystemEstimate {
  annual_energy_kwh: number;
  monthly_kwh: number[];
  peak_power_kw: number;
  tilt_deg: number;
  azimuth_deg: number;
  system_loss_pct: number;
}

// Australian city presets
export const AU_CITIES = [
  { name: "Perth", lat: -31.95, lon: 115.86 },
  { name: "Sydney", lat: -33.87, lon: 151.21 },
  { name: "Melbourne", lat: -37.81, lon: 144.96 },
  { name: "Brisbane", lat: -27.47, lon: 153.03 },
  { name: "Adelaide", lat: -34.93, lon: 138.60 },
  { name: "Hobart", lat: -42.88, lon: 147.33 },
  { name: "Darwin", lat: -12.46, lon: 130.84 },
  { name: "Canberra", lat: -35.28, lon: 149.13 },
] as const;

export const COMMON_SYSTEM_SIZES = [3.3, 5.0, 6.6, 8.0, 10.0, 13.2] as const;
