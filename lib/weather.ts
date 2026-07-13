import "server-only";

export type WeatherCondition = "clear" | "mist" | "rain" | "storm" | "snow";

export interface SkyState {
  condition: WeatherCondition;
  /** 0 (overcast night) .. 1 (bright clear day) */
  brightness: number;
  /** 0 (barely) .. 1 (intense); meaningless when condition is "clear" */
  intensity: number;
}

const SEOUL_LATITUDE = 37.5665;
const SEOUL_LONGITUDE = 126.978;
const REVALIDATE_SECONDS = 1800;
const NIGHT_BRIGHTNESS = 0.82;
const MAX_CLOUD_DIMMING = 0.15;

const MIN_INTENSITY = 0.3;
const MAX_RAIN_MM_PER_HOUR = 8;
const MAX_SNOW_CM_PER_HOUR = 2;
const FOG_VISIBILITY_FLOOR_M = 100;
const FOG_VISIBILITY_CEIL_M = 3000;

const DEFAULT_SKY: SkyState = { condition: "clear", brightness: 1, intensity: 0 };

// WMO weather codes: https://open-meteo.com/en/docs
function classifyWeatherCode(code: number): WeatherCondition {
  if (code === 45 || code === 48) return "mist";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return "rain";
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "storm";
  return "clear";
}

function computeBrightness(isDay: boolean, cloudCoverPercent: number): number {
  if (!isDay) return NIGHT_BRIGHTNESS;
  const clamped = Math.min(100, Math.max(0, cloudCoverPercent));
  return 1 - (clamped / 100) * MAX_CLOUD_DIMMING;
}

function computeIntensity(
  condition: WeatherCondition,
  precipitationMm: number,
  snowfallCm: number,
  visibilityM: number
): number {
  let raw: number;
  switch (condition) {
    case "rain":
    case "storm":
      raw = precipitationMm / MAX_RAIN_MM_PER_HOUR;
      break;
    case "snow":
      raw = snowfallCm / MAX_SNOW_CM_PER_HOUR;
      break;
    case "mist":
      raw =
        1 -
        (visibilityM - FOG_VISIBILITY_FLOOR_M) /
          (FOG_VISIBILITY_CEIL_M - FOG_VISIBILITY_FLOOR_M);
      break;
    default:
      return 0;
  }
  const clamped = Math.min(1, Math.max(0, raw));
  return MIN_INTENSITY + clamped * (1 - MIN_INTENSITY);
}

export async function getSkyState(): Promise<SkyState> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${SEOUL_LATITUDE}&longitude=${SEOUL_LONGITUDE}` +
      `&current=weather_code,cloud_cover,is_day,precipitation,snowfall,visibility&timezone=Asia%2FSeoul`;
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return DEFAULT_SKY;

    const current = (await res.json())?.current;
    const code = current?.weather_code;
    if (typeof code !== "number") return DEFAULT_SKY;

    const condition = classifyWeatherCode(code);

    return {
      condition,
      brightness: computeBrightness(
        current?.is_day !== 0,
        typeof current?.cloud_cover === "number" ? current.cloud_cover : 0
      ),
      intensity: computeIntensity(
        condition,
        typeof current?.precipitation === "number" ? current.precipitation : 0,
        typeof current?.snowfall === "number" ? current.snowfall : 0,
        typeof current?.visibility === "number" ? current.visibility : FOG_VISIBILITY_CEIL_M
      ),
    };
  } catch {
    return DEFAULT_SKY;
  }
}
