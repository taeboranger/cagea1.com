import { getSkyState } from "@/lib/weather";

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Convex curve: light precipitation stays sparse, heavy precipitation ramps up hard.
function scaleCount(min: number, max: number, intensity: number, power: number) {
  return Math.round(min + Math.pow(intensity, power) * (max - min));
}

const VARIANTS: Record<
  "snow" | "rain" | "storm" | "mist",
  {
    count: (intensity: number) => number;
    style: (seed: number, intensity: number) => React.CSSProperties;
  }
> = {
  snow: {
    count: (intensity) => scaleCount(12, 420, intensity, 1.3),
    style: (seed, intensity) => {
      // bigger pixels read as "closer": more opaque
      const depth = seededRandom(seed * 3.1);
      const size = Math.round(2 + depth * 5);
      return {
        left: `${seededRandom(seed * 7.7) * 100}%`,
        width: `${size}px`,
        height: `${size}px`,
        opacity: 0.3 + depth * 0.45,
        animationDuration: `${(14 + seededRandom(seed * 5.3) * 16) / (0.5 + intensity * 1.4)}s`,
        animationDelay: `${-seededRandom(seed * 9.1) * 30}s`,
      };
    },
  },
  rain: {
    count: (intensity) => scaleCount(15, 560, intensity, 1.15),
    style: (seed, intensity) => ({
      left: `${seededRandom(seed * 7.7) * 100}%`,
      height: `${Math.round((8 + seededRandom(seed * 3.1) * 8) * (1 + intensity * 0.5))}px`,
      opacity: 0.2 + seededRandom(seed * 3.1) * 0.25 + intensity * 0.15,
      animationDuration: `${(0.5 + seededRandom(seed * 5.3) * 0.4) / (0.6 + intensity * 0.8)}s`,
      animationDelay: `${-seededRandom(seed * 9.1) * 2}s`,
    }),
  },
  storm: {
    count: (intensity) => scaleCount(40, 700, intensity, 1.1),
    style: (seed, intensity) => ({
      left: `${seededRandom(seed * 7.7) * 100}%`,
      height: `${Math.round((10 + seededRandom(seed * 3.1) * 10) * (1 + intensity * 0.5))}px`,
      opacity: 0.3 + seededRandom(seed * 3.1) * 0.25 + intensity * 0.15,
      animationDuration: `${(0.3 + seededRandom(seed * 5.3) * 0.25) / (0.6 + intensity * 0.8)}s`,
      animationDelay: `${-seededRandom(seed * 9.1) * 1.5}s`,
    }),
  },
  mist: {
    count: (intensity) => scaleCount(20, 160, intensity, 1),
    style: (seed, intensity) => {
      const size = Math.round(2 + seededRandom(seed * 3.1) * 5);
      return {
        left: `${seededRandom(seed * 7.7) * 100}%`,
        top: `${seededRandom(seed * 13.1) * 100}%`,
        width: `${size}px`,
        height: `${size}px`,
        opacity: (0.15 + seededRandom(seed * 11.3) * 0.25) * (0.5 + intensity * 0.8),
        animationDuration: `${40 + seededRandom(seed * 5.3) * 40}s`,
        animationDelay: `${-seededRandom(seed * 9.1) * 80}s`,
      };
    },
  },
};

const AMBIENT_MIST_THRESHOLD = 0.5;

function renderLayer(
  variantKey: "snow" | "rain" | "storm" | "mist",
  intensity: number
) {
  const variant = VARIANTS[variantKey];
  const count = variant.count(intensity);
  const items = Array.from({ length: count }, (_, i) => ({
    id: i,
    style: variant.style(i + 1, intensity),
  }));

  return (
    <div
      key={variantKey}
      className={`weather-overlay weather-overlay--${variantKey}`}
      aria-hidden="true"
    >
      {items.map((item) => (
        <span key={item.id} style={item.style} />
      ))}
    </div>
  );
}

export default async function WeatherOverlay() {
  const { condition, intensity } = await getSkyState();
  if (condition === "clear") {
    return null;
  }

  // Heavy rain/snow tends to come with reduced visibility, so layer in a
  // light ambient mist once precipitation gets intense enough.
  const hasAmbientMist =
    condition !== "mist" && intensity > AMBIENT_MIST_THRESHOLD;
  const ambientMistIntensity = hasAmbientMist
    ? (intensity - AMBIENT_MIST_THRESHOLD) / (1 - AMBIENT_MIST_THRESHOLD)
    : 0;

  return (
    <>
      {renderLayer(condition, intensity)}
      {hasAmbientMist && renderLayer("mist", ambientMistIntensity)}
    </>
  );
}
