// Logo Nalika — variante 2a "huella-corazón" (Claude Design, ronda 2, 2026-07-22).
// Isotipo: 3 almohadillas elípticas + corazón como palma. Wordmark: "nalika"
// en minúsculas, Baloo 2 SemiBold (var --font-logo, cargada en el root layout).

const HEART_PATH =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

export function PawHeart({ size = 28, color = "#E07A5F" }: { size?: number; color?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill={color}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="12.7" cy="15.1" rx="4.8" ry="5.8" transform="rotate(-25 12.7 15.1)" />
      <ellipse cx="24" cy="10.8" rx="5" ry="6" />
      <ellipse cx="35.3" cy="15.1" rx="4.8" ry="5.8" transform="rotate(25 35.3 15.1)" />
      <g transform="translate(10.6 20.1) scale(1.12)">
        <path d={HEART_PATH} />
      </g>
    </svg>
  );
}

export function NalikaLogo({
  size = 26,
  light = false,
  className = "",
}: {
  size?: number;
  light?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <PawHeart size={size} />
      <span
        className="font-logo font-semibold leading-none"
        style={{
          fontSize: size * 0.82,
          letterSpacing: "-0.3px",
          color: light ? "#ffffff" : "#16171D",
        }}
      >
        nalika
      </span>
    </span>
  );
}
