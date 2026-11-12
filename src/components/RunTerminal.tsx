import CapProgress, { recordedCapState } from "./CapProgress";
import { VERIFIED_RUN, declinedCall, paidCalls } from "@/lib/verified-run";

const clock = (wat: string) => {
  const t = wat.split(", ")[1] ?? wat;
  return t.replace(" WAT", "");
};

const runWhen = paidCalls[0]
  ? paidCalls[0].onchain.timestamp_wat.replace(/, (\d{1,2}:\d{2}):\d{2} WAT/, ", $1 WAT")
  : "12 Nov 2026, 19:38 WAT";

/**
 * Short log of the recorded 12 Nov 2026, 19:38 WAT run, for the landing hero.
 * Full receipts live in one collapsed place on the proof section.
 */
export default function RunTerminal({ className = "" }: { className?: string }) {
  const caps = VERIFIED_RUN.passport.caps;
  const spent = VERIFIED_RUN.passport.usage_after.spent_total_usdc;
  const refused = declinedCall?.error_code ?? "session_total_exceeded";
  const cap = recordedCapState();

  return (
    <figure
      className={`term ${className}`}
      aria-label={`Recorded run at 19:38 WAT: two paid calls of 0.001 USDC, then Kite Passport refused call 3 with ${refused}`}
    >
      <figcaption className="term-bar">
        <span className="flex min-w-0 items-center gap-2">
          <span className="term-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="truncate">Recorded run · {runWhen}</span>
        </span>
        <span className="shrink-0">Replay</span>
      </figcaption>
      <div className="term-body">
        {VERIFIED_RUN.question && (
          <p className="term-q print" style={{ animationDelay: "40ms" }}>
            “{VERIFIED_RUN.question}”
          </p>
        )}
        <p className="term-meta print" style={{ animationDelay: "90ms" }}>
          Kite Passport  ${caps.max_amount_per_tx} per call  ·  ${caps.max_total_amount} total
        </p>
        <CapProgress spent={cap.spent} cap={cap.cap} blocked={cap.blocked} tone="dark" className="mt-4" />
        <ol className="mt-4 space-y-1.5">
          {paidCalls.map((c, i) => (
            <li key={c.tx_hash} className="term-line term-pay print" style={{ animationDelay: `${160 + i * 95}ms` }}>
              <span className="term-time">{clock(c.onchain.timestamp_wat)}</span>
              <span className="min-w-0 flex-1">
                <span className="mr-1.5 text-[#a88ea0]" aria-hidden="true">
                  ›
                </span>
                Call {c.n}  paid  {Number(c.price_usdc).toFixed(3)} USDC  ·  “{c.topic}”
              </span>
            </li>
          ))}
          {declinedCall && (
            <li className="term-line term-refuse print" style={{ animationDelay: `${160 + paidCalls.length * 95}ms` }}>
              <span className="term-time">{declinedCall.attempted_at_wat ? clock(declinedCall.attempted_at_wat) : ""}</span>
              <span className="min-w-0 flex-1">
                <span className="mr-1.5 text-[#a88ea0]" aria-hidden="true">
                  ›
                </span>
                Call {declinedCall.n}  Kite Passport refused  {declinedCall.error_code}
              </span>
            </li>
          )}
        </ol>
        <p className="term-foot print" style={{ animationDelay: `${200 + (paidCalls.length + 1) * 95}ms` }}>
          Spent ${spent} of ${caps.max_total_amount}. Call 3 never signed.
        </p>
      </div>
    </figure>
  );
}
