const FLAKE_COUNT = 28;

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function SnowOverlay() {
  const flakes = Array.from({ length: FLAKE_COUNT }, (_, i) => {
    const size = 2 + seededRandom(i * 3.1) * 4;
    const left = seededRandom(i * 7.7) * 100;
    const duration = 10 + seededRandom(i * 5.3) * 14;
    const delay = -seededRandom(i * 9.1) * 20;
    return { id: i, size, left, duration, delay };
  });

  return (
    <div className="snow" aria-hidden="true">
      {flakes.map((flake) => (
        <span
          key={flake.id}
          style={{
            left: `${flake.left}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
