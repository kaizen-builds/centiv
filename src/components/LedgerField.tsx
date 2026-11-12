"use client";

/**
 * Ambient ledger backdrop: faint horizontal accounting lines and a soft
 * vertical margin rule in burnt orange. Static — no animation. Used behind the
 * landing hero and final CTA. /app has no ambient field.
 */
export default function LedgerField({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            // Horizontal ledger rules
            "repeating-linear-gradient(to bottom, transparent 0 31px, rgba(180, 73, 26, 0.07) 31px 32px)",
            // Soft vertical margin (accounting paper)
            "linear-gradient(to right, transparent 0, transparent 11.5%, rgba(180, 73, 26, 0.1) 11.5%, rgba(180, 73, 26, 0.1) calc(11.5% + 1px), transparent calc(11.5% + 1px))",
          ].join(", "),
          backgroundSize: "100% 32px, 100% 100%",
          maskImage: "radial-gradient(ellipse 70% 65% at 50% 40%, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 65% at 50% 40%, black 20%, transparent 75%)",
        }}
      />
    </div>
  );
}
