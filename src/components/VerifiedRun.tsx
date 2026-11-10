import type { ReactNode } from "react";
import { Stamp } from "./Logo";
import { DecisionTag, ProvenanceBadge } from "./ui";
import { VERIFIED_RUN, basescanAddress, declinedCall, paidCalls } from "@/lib/verified-run";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const time = (wat: string) => wat.split(", ")[1] ?? wat; // "13:48:06 WAT"
const date = (wat: string) => wat.split(", ")[0] ?? wat;

/**
 * Replay of Centiv's real, Passport-capped x402 run. Everything here is read from
 * src/data/verified-run.json, verified against Base mainnet. Badged Replay — this
 * section never spends; visitors click through to public on-chain proof.
 */
export default function VerifiedRun({ compact = false, id = "verified-run", children }: { compact?: boolean; id?: string; children?: ReactNode }) {
  const r = VERIFIED_RUN;
  const p = r.passport;
  const caps = p.caps;
  const ttlMin = Math.round(caps.ttl_seconds / 60);
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <div className="card-gold relative overflow-hidden p-6 sm:p-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ProvenanceBadge p="replay" />
          <span className="num text-[11px] uppercase tracking-[0.12em] text-dim">
            {date(p.approved_at_wat)} · Base mainnet · USDC
          </span>
        </div>

        <h2 id={`${id}-title`} className={`mt-5 font-normal leading-[1.08] tracking-[-0.035em] text-bone ${compact ? "text-[32px] md:text-[40px]" : "text-[36px] md:text-[50px]"}`}>
          Verified live run: two calls paid, <span className="serif-em">the third declined</span>
        </h2>
        <p className="mt-4 max-w-[680px] text-[15.5px] leading-[1.6] text-mute">
          This is a replay of a real run. The owner approved a tiny Kite Passport session with a passkey. Centiv bought two
          Otto AI news reports for $0.001 each, paid in real USDC, and Passport refused the third call at the cap. Click
          either receipt to check it on Basescan. Nothing on this page spends money.
        </p>
        {children}

        {/* Session strip */}
        <dl className="mt-7 grid gap-px overflow-hidden rounded-[14px] border border-[rgba(201,146,46,0.45)] bg-[rgba(201,146,46,0.3)] sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Passport session", <span key="s" className="num break-all text-[12.5px]">{p.session_id}</span>],
            ["Caps the owner approved", <span key="c" className="fig text-[15px]">${caps.max_amount_per_tx} per call · ${caps.max_total_amount} total · {ttlMin} min</span>],
            ["Scope", <span key="sc" className="num text-[12.5px]">{p.scope.method} {p.scope.host}{p.scope.path_prefix}</span>],
            ["Approved", <span key="a" className="fig text-[15px]">{time(p.approved_at_wat)} · passkey</span>],
          ].map(([k, v]) => (
            <div key={k as string} className="bg-white px-4 py-3.5">
              <dt className="text-[11.5px] text-dim">{k}</dt>
              <dd className="mt-1.5 text-bone">{v}</dd>
            </div>
          ))}
        </dl>

        {/* The three calls */}
        <ol className="mt-6 divide-y divide-[rgba(201,146,46,0.25)] rounded-[14px] border border-[rgba(201,146,46,0.45)] bg-white">
          {paidCalls.map((c) => (
            <li key={c.tx_hash} className="grid gap-3 px-4 py-4 sm:grid-cols-[34px_1fr_auto] sm:items-start sm:px-5">
              <Stamp size={30} className="stamp-in text-gold" notch="var(--color-cent)" label="Bought" />
              <div className="min-w-0">
                <p className="num text-[10.5px] uppercase tracking-[0.12em] text-dim">Call {c.n} · topic “{c.topic}”</p>
                <p className="mt-1 text-[15px] font-medium tracking-[-0.015em] text-bone">
                  Paid {c.onchain.usdc_transfer.amount_usdc.toFixed(3)} USDC to Otto AI · block {c.onchain.block.toLocaleString("en-GB")} · {time(c.onchain.timestamp_wat)}
                </p>
                <p className="num mt-1 text-[11.5px] leading-[1.6] text-dim">
                  From <a className="underline decoration-dotted underline-offset-2 hover:text-bone" href={basescanAddress(c.onchain.usdc_transfer.from)} target="_blank" rel="noopener noreferrer">{short(c.onchain.usdc_transfer.from)}</a> (Passport wallet) → {" "}
                  <a className="underline decoration-dotted underline-offset-2 hover:text-bone" href={basescanAddress(c.onchain.usdc_transfer.to)} target="_blank" rel="noopener noreferrer">{short(c.onchain.usdc_transfer.to)}</a> (Otto AI) · session spent ${c.session_spent_after_usdc} of ${caps.max_total_amount}
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <DecisionTag d="spend" />
                <a
                  href={c.basescan_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="num inline-flex items-center gap-1 rounded-full border border-cent/40 px-3 py-1 text-[12px] text-cent transition hover:bg-cent hover:text-white"
                  title={c.tx_hash}
                >
                  {short(c.tx_hash)} on Basescan ↗
                </a>
              </div>
            </li>
          ))}
          {declinedCall && (
            <li className="row-stop grid gap-3 bg-stop/[0.05] px-4 py-4 sm:grid-cols-[34px_1fr_auto] sm:items-start sm:px-5">
              <Stamp size={30} className="stamp-in text-stop" label="Declined" />
              <div className="min-w-0">
                <p className="num text-[10.5px] uppercase tracking-[0.12em] text-dim">Call {declinedCall.n} · topic “{declinedCall.topic}”</p>
                <p className="mt-1 text-[15px] font-medium tracking-[-0.015em] text-stop">Declined by Kite Passport. Nothing was signed and no money moved.</p>
                <p className="num mt-1 text-[12px] text-mute">
                  <span className="rounded bg-stop/10 px-1.5 py-0.5 text-stop">{declinedCall.error_code}</span> · “{declinedCall.error}”
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <DecisionTag d="decline" />
                <span className="num text-[12px] text-dim">no transaction</span>
              </div>
            </li>
          )}
        </ol>

        {/* What Centiv bought */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {paidCalls.map((c) => (
            <figure key={c.tx_hash} className="rounded-[14px] border border-[rgba(201,146,46,0.35)] bg-[#fffdf8] p-5">
              <figcaption className="flex flex-wrap items-center justify-between gap-2">
                <span className="num text-[10.5px] uppercase tracking-[0.12em] text-gold-deep">Paid reply · “{c.topic}”</span>
                <span className="num text-[10.5px] text-dim">{c.reply.source_count} sources</span>
              </figcaption>
              <blockquote className="mt-3 space-y-2 text-[13.5px] leading-[1.6] text-mute">
                {(compact ? c.reply.excerpt.slice(0, 1) : c.reply.excerpt).map((para) => (
                  <p key={para.slice(0, 40)}>{para.length > 520 ? `${para.slice(0, 520).replace(/\s+\S*$/, "")}…` : para}</p>
                ))}
              </blockquote>
              <p className="mt-3 border-t border-[rgba(201,146,46,0.25)] pt-2 text-[11.5px] text-dim">
                Source: Otto AI ({c.reply.attribution.replace(/[[\]]/g, "")}). Excerpt trimmed by Centiv. The claims are Otto AI’s and Centiv has not verified them.
              </p>
            </figure>
          ))}
        </div>

        <p className="mt-6 text-[12px] leading-[1.6] text-dim">
          Payments settled in USDC on Base mainnet ({r.settlement.caip2}). Kite Passport enforced the session caps. Each
          transaction was submitted by an x402 facilitator that paid the gas. The USDC moved from the Passport wallet, as
          the Transfer log shows. Checked against {r.verification.rpc.replace("https://", "")} on {r.verification.checked_at_utc.slice(0, 10)}.{" "}
          <a href="/api/evidence" className="underline underline-offset-2 hover:text-bone">Evidence JSON</a>.
        </p>
      </div>
    </section>
  );
}
