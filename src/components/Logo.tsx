import { useId } from "react";

// Centiv identity: a press-stamp / milled-coin die with a cent-mark C
// cut through it. Cream shows through the cut. Reads at 16px. Default fill is the burnt-orange accent.

/**
 * The Centiv mark: a milled-coin die with a cent-mark C carved through
 * it. Cream of the page shows in the cut. Default colour is the burnt-orange ink (`--color-cent`).
 */
export function CentivMark({
  size = 24,
  color = "var(--color-cent)",
  className = "",
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true" className={className}>
      <defs>
        <mask id={`cm-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="40" height="40">
          <rect width="40" height="40" fill="white" />
          {/* Cent-mark C cut */}
          <path
            d="M27.2 13.1 A9.4 9.4 0 1 0 27.2 26.9"
            stroke="black"
            strokeWidth="4.6"
            strokeLinecap="round"
            fill="none"
          />
          <line x1="20" y1="10.2" x2="20" y2="29.8" stroke="black" strokeWidth="3.3" strokeLinecap="round" />
        </mask>
      </defs>
      {/* Coin face */}
      <circle cx="20" cy="20" r="18.6" fill={color} mask={`url(#cm-${id})`} />
      {/* Milled / reeded edge — ticks sit outside the mask so they stay solid */}
      {Array.from({ length: 36 }).map((_, i) => {
        const a = (i * 10 * Math.PI) / 180;
        const x1 = 20 + Math.cos(a) * 17.2;
        const y1 = 20 + Math.sin(a) * 17.2;
        const x2 = 20 + Math.cos(a) * 18.8;
        const y2 = 20 + Math.sin(a) * 18.8;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.15" strokeLinecap="round" />;
      })}
    </svg>
  );
}

/** Kept for older imports: the mark on its own. */
export function CentivC({ size = 24, className = "" }: { size?: number; className?: string }) {
  return <CentivMark size={size} className={className} />;
}

/** Mark + wordmark lockup: coin mark, tight gap, lowercase geometric wordmark. */
export function CentivWordmark({ className = "", size = 22 }: { className?: string; size?: number }) {
  return (
    <span className={`inline-flex items-center text-bone ${className}`} aria-label="Centiv" role="img" style={{ fontSize: size, gap: "0.32em" }}>
      <CentivMark size={Math.round(size * 1.14)} />
      <span aria-hidden="true" className="font-medium leading-none tracking-[-0.035em]">
        centiv
      </span>
    </span>
  );
}

/**
 * Circular rubber stamp: thin double ring + milled dashes + the cent-mark C
 * (no vertical bar when used as a compact decision stamp). Colour follows currentColor.
 */
export function Stamp({
  size = 28,
  color = "currentColor",
  notch,
  className = "",
  label,
}: {
  size?: number;
  color?: string;
  notch?: string;
  className?: string;
  label?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle cx="20" cy="20" r="18.6" stroke={color} strokeWidth="1.3" />
      <circle cx="20" cy="20" r="16.1" stroke={color} strokeWidth="0.7" strokeDasharray="0.8 2.0" opacity="0.8" />
      {/* Cent-mark C */}
      <path
        d="M26.6 13.4 A8.6 8.6 0 1 0 26.6 26.6"
        stroke={color}
        strokeWidth="3.6"
        strokeLinecap="round"
        fill="none"
      />
      <line x1="20" y1="11.2" x2="20" y2="28.8" stroke={notch ?? color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Nib — the mint inspector: a rubber-stamp figure in a burnt-orange coat with an
 * ochre coin-edge collar, holding a tally punch. Used sparingly.
 */
export function Nib({ size = 72, mood = "idle" }: { size?: number; mood?: "idle" | "stop" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <circle cx="36" cy="11" r="6" fill="var(--color-cent)" />
      <path d="M32 16.5h8l1.5 8h-11z" fill="var(--color-cent)" />
      <rect x="21" y="24" width="30" height="6" rx="3" fill="var(--color-gold)" />
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={i} x1={23.5 + i * 3.1} y1="25.2" x2={23.5 + i * 3.1} y2="28.8" stroke="#9a6b14" strokeOpacity="0.55" strokeWidth="0.8" />
      ))}
      <path d="M19 30h34l3 26a4 4 0 0 1-4 4.5H20a4 4 0 0 1-4-4.5z" fill="var(--color-cent)" />
      <path d="M36 31v29" stroke="#fef8f0" strokeOpacity="0.18" strokeWidth="1.25" />
      {mood === "stop" ? (
        <path d="M28.5 41h5M38.5 41h5" stroke="#fef8f0" strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="31" cy="40.5" r="1.9" fill="#fef8f0" />
          <circle cx="41" cy="40.5" r="1.9" fill="#fef8f0" />
        </>
      )}
      <path d="M17 61.5h38" stroke="var(--color-gold)" strokeWidth="1.6" strokeLinecap="round" />
      <g transform="rotate(-24 58 46)">
        <rect x="55" y="38" width="6" height="14" rx="3" fill="var(--color-gold)" />
        <path d="M58 52v4" stroke={mood === "stop" ? "var(--color-hold)" : "var(--color-cent)"} strokeWidth="1.8" strokeLinecap="round" />
      </g>
    </svg>
  );
}
