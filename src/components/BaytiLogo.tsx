interface LogoProps {
  color?: string;
  height?: number;
  wordmark?: boolean;
}

const TEAL = "#11c6bf";

export function BaytiLogo({ color = "#101929", height = 38, wordmark = true }: LogoProps) {
  return (
    <svg
      height={height}
      viewBox={`0 0 100 ${wordmark ? 118 : 74}`}
      fill="none"
      style={{ display: "block" }}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Bayti"
    >
      <path
        d="M20 48 L50 22 L80 48"
        stroke={color}
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="62" r="7.5" fill={TEAL} />
      {wordmark && (
        <text
          x="50"
          y="108"
          textAnchor="middle"
          fontFamily="Outfit, sans-serif"
          fontWeight="700"
          fontSize="27"
          letterSpacing="1.5"
          fill={color}
        >
          BAYTI
        </text>
      )}
    </svg>
  );
}
