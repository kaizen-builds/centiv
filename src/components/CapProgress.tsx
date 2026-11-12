import { declinedCall, VERIFIED_RUN } from "@/lib/verified-run";

export function recordedCapState() {
  return {
    spent: Number(VERIFIED_RUN.passport.usage_after.spent_total_usdc),
    cap: Number(VERIFIED_RUN.passport.caps.max_total_amount),
    blocked: Boolean(declinedCall),
  };
}

export default function CapProgress({
  spent,
  cap = 0.002,
  blocked = false,
  tone = "light",
  className = "",
}: {
  spent: number;
  cap?: number;
  blocked?: boolean;
  tone?: "light" | "dark";
  className?: string;
}) {
  const total = cap > 0 ? cap : 0.002;
  const ratio = Math.max(0, Math.min(1, spent / total));
  const atCap = blocked || spent >= total - 1e-9;
  const mid = total / 2;
  const dark = tone === "dark";
  const label = atCap
    ? `Session cap: $${spent.toFixed(3)} of $${total.toFixed(3)} spent, call 3 refused`
    : `Session cap: $${spent.toFixed(3)} of $${total.toFixed(3)} spent`;

  return (
    <div className={`cap ${dark ? "cap-dark" : "cap-light"} ${className}`.trim()} role="img" aria-label={label}>
      <div className="cap-head">
        <span>Session cap</span>
        <span className="fig">
          ${spent.toFixed(3)} of ${total.toFixed(3)}
          {atCap ? " · blocked" : ""}
        </span>
      </div>
      <div className="cap-track">
        <div className="cap-fill" style={{ width: `${ratio * 100}%` }} />
        <span className="cap-mark" style={{ left: "50%" }} aria-hidden="true" />
        <span className="cap-mark cap-mark-end" style={{ left: "100%" }} aria-hidden="true" />
      </div>
      <div className="cap-scale">
        <span>$0</span>
        <span>${mid.toFixed(3)}</span>
        <span className={atCap ? "cap-blocked-label" : undefined}>
          ${total.toFixed(3)}
          {atCap ? " · call 3 refused" : ""}
        </span>
      </div>
    </div>
  );
}
