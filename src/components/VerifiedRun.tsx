import type { ReactNode } from "react";
import { Stamp } from "./Logo";
import { DecisionTag, ProvenanceBadge, VerdictTag } from "./ui";
import { RECORDED_REPPO } from "@/lib/reppo-eval";
import { VERIFIED_RUN, basescanAddress, declinedCall, paidCalls } from "@/lib/verified-run";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const time = (wat: string) => wat.split(", ")[1] ?? wat; // "13:48:06 WAT"
const date = (wat: string) => wat.split(", ")[0] ?? wat;
const utcClock = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss} UTC`;
};
const clocks = (wat: string, utc: string) => `${time(wat)} · ${utcClock(utc)}`;

/**
 * Replay of Centiv's real, Passport-capped x402 run. Everything here is read from
 * src/data/verified-run.json, verified against Base mainnet. Badged Replay — this
 * section never spends; visitors click through to public on-chain proof.
 */
export default function VerifiedRun({
  compact = false,
  collapseReplies = false,
  receipts = false,
  id = "verified-run",
  children,
}: {
  compact?: boolean;
  /** Tuck the paid replies behind a disclosure so the proof rows stay scannable. */
  collapseReplies?: boolean;
  /** Landing layout: session details and the full Reppo result sit behind disclosures, so it reads as receipts. */
  receipts?: boolean;
  id?: string;
  children?: ReactNode;
}) {
  const r = VERIFIED_RUN;
  const p = r.passport;
  const caps = p.caps;
  const ttlMin = Math.round(caps.ttl_seconds / 60);
  const firstTransfer = paidCalls[0]?.onchain.usdc_transfer;
  const wallets = firstTransfer ? { from: firstTransfer.from, to: firstTransfer.to } : null;
  const replies = (
    <div className="grid gap-4 md:grid-cols-2">
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
  );
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <div className="card-gold relative overflow-hidden p-6 sm:p-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ProvenanceBadge p="replay" />
          <span className="num text-[11px] uppercase tracking-[0.12em] text-dim">
            {date(p.approved_at_wat)} · Base mainnet · USDC
          </span>
        </div>

        <h2 id={`${id}-title`} className={`mt-5 font-normal leading-[1.08] tracking-[-0.035em] text-bone ${compact ? "text-[32px] md:text-[40px]" : "text-[32px] md:text-[44px]"}`}>
          Verified live run: two calls paid, <span className="serif-em">the third declined</span>
        </h2>
        <p className="mt-4 max-w-[680px] text-[15.5px] leading-[1.6] text-mute">
          A real run, replayed. The owner approved a small Kite Passport session with a passkey: ${caps.max_amount_per_tx} a
          call, ${caps.max_total_amount} in total. Centiv paid Otto AI twice in USDC on Base. On the third call, Passport
          refused and no money moved. Both payments are on Basescan. This page never spends.
        </p>
        {children}

        {receipts ? (
          <>
        {/* Session: caps up front, the rest on tap */}
        <div className="mt-7 rounded-[14px] border border-[rgba(201,146,46,0.45)] bg-white">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 sm:px-5">
            <span className="text-[12px] text-dim">Caps, set with a passkey</span>
            <span className="fig text-[15px] text-bone">
              ${caps.max_amount_per_tx} per call · ${caps.max_total_amount} total · {ttlMin} min
            </span>
          </p>
          <details className="group border-t border-[rgba(201,146,46,0.3)]">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 text-[13.5px] font-medium text-bone sm:px-5 [&::-webkit-details-marker]:hidden">
              Session details
              <span aria-hidden="true" className="text-[18px] leading-none text-dim transition group-open:rotate-45">+</span>
            </summary>
            <dl className="grid gap-x-6 gap-y-1 px-4 pb-4 text-[12.5px] sm:gap-y-2.5 sm:grid-cols-[auto_minmax(0,1fr)] sm:px-5">
              <dt className="text-dim">Passport session</dt>
              <dd className="num mb-2 break-all text-bone sm:mb-0">{p.session_id}</dd>
              <dt className="text-dim">Approved</dt>
              <dd className="fig mb-2 text-bone sm:mb-0">{clocks(p.approved_at_wat, p.approved_at_utc)}</dd>
              <dt className="text-dim">Scope</dt>
              <dd className="num mb-2 break-all text-bone sm:mb-0">
                {p.scope.method} {p.scope.host}{p.scope.path_prefix}
              </dd>
              {wallets && (
                <>
                  <dt className="text-dim">Paid from</dt>
                  <dd className="num mb-2 text-bone sm:mb-0">
                    <a className="underline decoration-dotted underline-offset-2 hover:text-cent" href={basescanAddress(wallets.from)} target="_blank" rel="noopener noreferrer" title={wallets.from}>{short(wallets.from)}</a> (Passport wallet)
                  </dd>
                  <dt className="text-dim">Paid to</dt>
                  <dd className="num mb-2 text-bone sm:mb-0">
                    <a className="underline decoration-dotted underline-offset-2 hover:text-cent" href={basescanAddress(wallets.to)} target="_blank" rel="noopener noreferrer" title={wallets.to}>{short(wallets.to)}</a> (Otto AI)
                  </dd>
                </>
              )}
            </dl>
          </details>
        </div>

          </>
        ) : (
          <>
        {/* Session strip */}
        <dl className="mt-7 grid gap-px overflow-hidden rounded-[14px] border border-[rgba(201,146,46,0.45)] bg-[rgba(201,146,46,0.3)] sm:grid-cols-3">
          {[
            ["Passport session", <span key="s" className="num break-all text-[12.5px]">{p.session_id}</span>],
            ["Caps, set with a passkey", <span key="c" className="fig text-[15px]">${caps.max_amount_per_tx} per call · ${caps.max_total_amount} total · {ttlMin} min</span>],
            ["Scope", <span key="sc" className="num text-[12px]"><span className="whitespace-nowrap">{p.scope.method} {p.scope.host}</span><wbr /><span className="whitespace-nowrap">{p.scope.path_prefix}</span></span>],
            ["Approved", <span key="a" className="fig text-[15px]">{clocks(p.approved_at_wat, p.approved_at_utc)}</span>],
          ].map(([k, v]) => (
            <div key={k as string} className={`bg-white px-4 py-3.5 ${k === "Passport session" ? "sm:col-span-3" : ""}`}>
              <dt className="text-[11.5px] text-dim">{k}</dt>
              <dd className="mt-1.5 text-bone">{v}</dd>
            </div>
          ))}
        </dl>
          </>
        )}

        {/* The three calls */}
        <ol className="mt-6 divide-y divide-[rgba(201,146,46,0.25)] rounded-[14px] border border-[rgba(201,146,46,0.45)] bg-white">
          {paidCalls.map((c) => (
            <li key={c.tx_hash} className="grid grid-cols-[30px_minmax(0,1fr)] items-start gap-x-3 gap-y-3 px-4 py-4 sm:grid-cols-[34px_minmax(0,1fr)_auto] sm:px-5">
              <Stamp size={30} className="stamp-in text-gold" notch="var(--color-cent)" label="Bought" />
              <div className="min-w-0">
                <p className="num text-[10.5px] uppercase tracking-[0.12em] text-dim">Call {c.n} · topic “{c.topic}”</p>
                <p className="mt-1 text-[15px] font-medium tracking-[-0.015em] text-bone">
                  Paid {c.onchain.usdc_transfer.amount_usdc.toFixed(3)} USDC to Otto AI · block {c.onchain.block.toLocaleString("en-GB")} · {clocks(c.onchain.timestamp_wat, c.onchain.timestamp_utc)}
                </p>
                {receipts ? (
                  <p className="num mt-1 text-[11.5px] leading-[1.6] text-dim">
                    Passport wallet → Otto AI · session spent ${c.session_spent_after_usdc} of ${caps.max_total_amount}
                  </p>
                ) : (
                  <p className="num mt-1 text-[11.5px] leading-[1.6] text-dim">
                    From <a className="underline decoration-dotted underline-offset-2 hover:text-bone" href={basescanAddress(c.onchain.usdc_transfer.from)} target="_blank" rel="noopener noreferrer">{short(c.onchain.usdc_transfer.from)}</a> (Passport wallet) → {" "}
                    <a className="underline decoration-dotted underline-offset-2 hover:text-bone" href={basescanAddress(c.onchain.usdc_transfer.to)} target="_blank" rel="noopener noreferrer">{short(c.onchain.usdc_transfer.to)}</a> (Otto AI) · session spent ${c.session_spent_after_usdc} of ${caps.max_total_amount}
                  </p>
                )}
              </div>
              <div className="col-start-2 flex flex-wrap items-center gap-2 sm:col-start-auto sm:flex-col sm:items-end">
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
            <li className="row-stop grid grid-cols-[30px_minmax(0,1fr)] items-start gap-x-3 gap-y-3 bg-stop/[0.05] px-4 py-4 sm:grid-cols-[34px_minmax(0,1fr)_auto] sm:px-5">
              <Stamp size={30} className="stamp-in text-stop" label="Declined" />
              <div className="min-w-0">
                <p className="num text-[10.5px] uppercase tracking-[0.12em] text-dim">Call {declinedCall.n} · topic “{declinedCall.topic}”</p>
                <p className="mt-1 text-[15px] font-medium tracking-[-0.015em] text-stop">Declined by Kite Passport. Nothing was signed and no money moved.</p>
                <p className="num mt-1 text-[12px] text-mute">
                  <span className="rounded bg-stop/10 px-1.5 py-0.5 text-stop">{declinedCall.error_code}</span> · “{declinedCall.error}”
                </p>
              </div>
              <div className="col-start-2 flex flex-wrap items-center gap-2 sm:col-start-auto sm:flex-col sm:items-end">
                <DecisionTag d="decline" />
                <span className="num text-[12px] text-dim">no transaction</span>
              </div>
            </li>
          )}
        </ol>

        {/* What Centiv bought */}
        {collapseReplies ? (
          <details className="group mt-6 rounded-[14px] border border-[rgba(201,146,46,0.35)] bg-[#fffdf8]">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-[14px] font-medium text-bone [&::-webkit-details-marker]:hidden">
              What the two paid calls returned
              <span aria-hidden="true" className="text-[18px] leading-none text-dim transition group-open:rotate-45">+</span>
            </summary>
            <div className="px-4 pb-4 sm:px-5 sm:pb-5">{replies}</div>
          </details>
        ) : (
          <div className="mt-6">{replies}</div>
        )}

        {receipts ? (
          <>
        {/* Recorded real Reppo check of the brief drawn from this run: score first, the rest on tap */}
        <div className="mt-6 rounded-[14px] border border-[rgba(91,42,78,0.28)] bg-[#faf6f8]">
          <div className="px-4 pt-4 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="num text-[10.5px] uppercase tracking-[0.12em] text-[#5B2A4E]">Reppo independent check of this run’s brief</p>
              <ProvenanceBadge p="replay" short title="Replay · a real past check, recorded" />
            </div>
            <p className="mt-2.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-[15px] font-medium tracking-[-0.015em] text-bone">
              <span className="fig text-[22px] leading-none">
                {RECORDED_REPPO.verdict.score}
                <span className="text-[14px] text-mute">/100</span>
              </span>
              <span>
                {RECORDED_REPPO.verdict.decision}, routed to {RECORDED_REPPO.verdict.route}
                <span className="font-normal text-mute"> · {RECORDED_REPPO.verdict.confidence} confidence</span>
              </span>
            </p>
            <p className="mt-2 text-[12.5px] leading-[1.55] text-dim">
              Recorded on {date(RECORDED_REPPO.evaluated_at_wat)}, {clocks(RECORDED_REPPO.evaluated_at_wat, RECORDED_REPPO.evaluated_at_utc)}. Not a live score of questions visitors ask here.
            </p>
          </div>
          <details className="group mt-3 border-t border-[rgba(91,42,78,0.18)]">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 text-[13.5px] font-medium text-bone sm:px-5 [&::-webkit-details-marker]:hidden">
              Sub-scores, explanation and the brief
              <span aria-hidden="true" className="text-[18px] leading-none text-dim transition group-open:rotate-45">+</span>
            </summary>
            <div className="px-4 pb-5 sm:px-5">
              <p className="text-[13.5px] leading-[1.6] text-mute">{RECORDED_REPPO.verdict.reason}</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Object.entries(RECORDED_REPPO.verdict.rubric_scores).map(([k, val]) => (
                  <div key={k} className="rounded-[10px] bg-white px-3 py-2">
                    <dt className="num text-[10px] uppercase tracking-[0.1em] text-dim">{k.replace(/_/g, " ")}</dt>
                    <dd className="fig mt-1 text-[15px] text-bone">{val}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 space-y-2 rounded-[10px] bg-white p-4 text-[13.5px] leading-[1.6] text-mute">
                <p className="num text-[10.5px] uppercase tracking-[0.12em] text-dim">The brief Reppo scored</p>
                <p className="italic">“{RECORDED_REPPO.brief.question}”</p>
                <p className="font-medium text-bone">{RECORDED_REPPO.brief.headline}</p>
                {RECORDED_REPPO.brief.points.map((para) => (
                  <p key={para.slice(0, 48)}>{para}</p>
                ))}
                <p className="text-[12px] text-dim">{RECORDED_REPPO.brief.sources}</p>
              </div>
              <p className="mt-4 text-[12px] leading-[1.6] text-dim">
                Independent panel score from the Reppo Evaluation API on {RECORDED_REPPO.evaluated_at_wat} · {utcClock(RECORDED_REPPO.evaluated_at_utc)}. This is a recorded
                check of the verified-run brief, not a live score of questions visitors ask on this site.{" "}
                <a href={RECORDED_REPPO.evidence_path} className="underline underline-offset-2 hover:text-bone">
                  Result JSON
                </a>
                {" · "}
                <span className="num break-all">eval {RECORDED_REPPO.verdict.eval_id}</span>
                . Reppo did not return a public share URL, so the raw result is published here.
              </p>
            </div>
          </details>
        </div>

          </>
        ) : (
          <>
        {/* Recorded real Reppo check of the brief drawn from this run */}
        <div className="mt-6 rounded-[14px] border border-[rgba(91,42,78,0.28)] bg-[#faf6f8] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="num text-[10.5px] uppercase tracking-[0.12em] text-[#5B2A4E]">{RECORDED_REPPO.label}</p>
            <VerdictTag v={RECORDED_REPPO.verdict.decision === "reject" ? "reject" : "accept"} score={RECORDED_REPPO.verdict.score / 100} />
          </div>
          <p className="mt-3 text-[16px] font-medium tracking-[-0.015em] text-bone">
            Score {RECORDED_REPPO.verdict.score} / 100 · {RECORDED_REPPO.verdict.decision}, routed to {RECORDED_REPPO.verdict.route}
            <span className="font-normal text-mute"> · {RECORDED_REPPO.verdict.confidence} confidence</span>
          </p>
          <p className="mt-2 text-[13.5px] leading-[1.6] text-mute">{RECORDED_REPPO.verdict.reason}</p>
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(RECORDED_REPPO.verdict.rubric_scores).map(([k, v]) => (
              <div key={k} className="rounded-[10px] bg-white px-3 py-2">
                <dt className="num text-[10px] uppercase tracking-[0.1em] text-dim">{k.replace(/_/g, " ")}</dt>
                <dd className="fig mt-1 text-[15px] text-bone">{v}</dd>
              </div>
            ))}
          </dl>
          <details className="group mt-4">
            <summary className="cursor-pointer list-none text-[13.5px] font-medium text-bone [&::-webkit-details-marker]:hidden">
              The brief Reppo scored
              <span aria-hidden="true" className="ml-2 text-[16px] leading-none text-dim transition group-open:hidden">+</span>
            </summary>
            <div className="mt-3 space-y-2 text-[13.5px] leading-[1.6] text-mute">
              <p className="italic">“{RECORDED_REPPO.brief.question}”</p>
              <p className="font-medium text-bone">{RECORDED_REPPO.brief.headline}</p>
              {RECORDED_REPPO.brief.points.map((para) => (
                <p key={para.slice(0, 48)}>{para}</p>
              ))}
              <p className="text-[12px] text-dim">{RECORDED_REPPO.brief.sources}</p>
            </div>
          </details>
          <p className="mt-4 text-[12px] leading-[1.6] text-dim">
            Independent panel score from the Reppo Evaluation API on {RECORDED_REPPO.evaluated_at_wat} · {utcClock(RECORDED_REPPO.evaluated_at_utc)}. This is a recorded
            check of the verified-run brief, not a live score of questions visitors ask on this site.{" "}
            <a href={RECORDED_REPPO.evidence_path} className="underline underline-offset-2 hover:text-bone">
              Result JSON
            </a>
            {" · "}
            <span className="num">eval {RECORDED_REPPO.verdict.eval_id}</span>
            . Reppo did not return a public share URL, so the raw result is published here.
          </p>
        </div>
          </>
        )}

        <p className="mt-6 text-[12px] leading-[1.6] text-dim">
          Payments settled in USDC on Base mainnet ({r.settlement.caip2}). Kite Passport enforced the session caps. Each
          transaction was submitted by an x402 facilitator that paid the gas. The USDC moved from the Passport wallet, as
          the Transfer log shows. Checked against {r.verification.rpc.replace("https://", "")} on {r.verification.checked_at_utc.slice(0, 10)}.{" "}
          <a href="/api/evidence" className="underline underline-offset-2 hover:text-bone">Evidence JSON</a>
          {" · "}
          <a href="/api/reppo-eval" className="underline underline-offset-2 hover:text-bone">Reppo result</a>.
        </p>
      </div>
    </section>
  );
}
