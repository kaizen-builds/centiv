import { VERIFIED_RUN, declinedCall, paidCalls } from "@/lib/verified-run";

const short = (h: string) => `${h.slice(0, 10)}…${h.slice(-4)}`;
const clock = (wat: string) => {
  const t = wat.split(", ")[1] ?? wat;
  return t.replace(" WAT", "");
};

type Line = {
  key: string;
  time?: string;
  kind: "meta" | "serv" | "pay" | "reppo" | "note" | "refuse";
  text: string;
  href?: string;
  hrefLabel?: string;
};

function lines(): Line[] {
  const out: Line[] = [];
  for (const c of VERIFIED_RUN.calls) {
    if (c.outcome === "paid") {
      if (c.serv) {
        out.push({
          key: `serv-${c.n}`,
          time: clock(c.onchain.timestamp_wat),
          kind: "serv",
          text: `Call ${c.n}  SERV Reasoning  ${c.serv.decision}`,
        });
      }
      out.push({
        key: `pay-${c.n}`,
        time: clock(c.onchain.timestamp_wat),
        kind: "pay",
        text: `Paid  ${Number(c.price_usdc).toFixed(3)} USDC  on Base`,
        href: c.basescan_url,
        hrefLabel: short(c.tx_hash),
      });
      if (c.paid_despite_serv_skip) {
        out.push({
          key: `skipnote-${c.n}`,
          kind: "note",
          text: "Paid despite SERV’s skip, so the cap could be shown. Kite Passport is the hard limit.",
        });
      }
      if (c.reppo) {
        const later = c.reppo.settled === "after_the_call" ? ", settled later" : "";
        out.push({
          key: `reppo-${c.n}`,
          kind: "reppo",
          text: `Reppo  ${c.reppo.score100}/100  after the fact, below ${c.reppo.pass_mark}${later}. Does not undo the payment.`,
        });
      }
    } else {
      if (c.serv) {
        out.push({
          key: `serv-${c.n}`,
          time: c.attempted_at_wat ? clock(c.attempted_at_wat) : undefined,
          kind: "serv",
          text: `Call ${c.n}  SERV Reasoning  ${c.serv.decision}`,
        });
      }
      out.push({
        key: `refuse-${c.n}`,
        time: c.attempted_at_wat ? clock(c.attempted_at_wat) : undefined,
        kind: "refuse",
        text: `Kite Passport refused  ${c.error_code}  — nothing signed, no money moved.`,
      });
    }
  }
  return out;
}

/**
 * Log of the recorded 12 Nov 2026, 18:27 WAT run.
 * Every line is from verified-run.json — no invented scores or payments.
 */
export default function RunTerminal({ className = "" }: { className?: string }) {
  const caps = VERIFIED_RUN.passport.caps;
  const log = lines();
  const first = paidCalls[0];
  const when = first ? first.onchain.timestamp_wat.split(", ")[0] : "";
  const spent = VERIFIED_RUN.passport.usage_after.spent_total_usdc;
  const refused = declinedCall?.error_code ?? "session_total_exceeded";

  return (
    <figure
      className={`term ${className}`}
      aria-label={`Recorded run at 18:27 WAT: two paid calls of 0.001 USDC, then Kite Passport refused call 3 with ${refused}`}
    >
      <figcaption className="term-bar">
        <span className="flex items-center gap-2 min-w-0">
          <span className="term-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="truncate">
            <span className="hidden sm:inline">Recorded run · {when}, 18:27 WAT</span>
            <span className="sm:hidden">{when}, 18:27 WAT</span>
          </span>
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
        <p className="term-meta print" style={{ animationDelay: "120ms" }}>
          Topic “ethereum etf” set directly, not chosen by SERV
        </p>
        <ol className="mt-3 space-y-1.5">
          {log.map((l, i) => (
            <li key={l.key} className={`term-line term-${l.kind} print`} style={{ animationDelay: `${160 + i * 95}ms` }}>
              {l.time && <span className="term-time">{l.time}</span>}
              <span className="min-w-0 flex-1">
                {l.text}
                {l.href && l.hrefLabel && (
                  <>
                    {"  "}
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className="term-link" title={l.href}>
                      {l.hrefLabel}
                    </a>
                  </>
                )}
              </span>
            </li>
          ))}
        </ol>
        <p className="term-foot print" style={{ animationDelay: `${180 + log.length * 95}ms` }}>
          Spent ${spent} of ${caps.max_total_amount}. Call 3 never signed.
        </p>
      </div>
    </figure>
  );
}
