import type { ReactNode } from "react";
import { Stamp } from "./Logo";
import { DecisionTag, ProvenanceBadge } from "./ui";
import { VERIFIED_RUN, basescanAddress, declinedCall, paidCalls, type PaidCall } from "@/lib/verified-run";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const time = (wat: string) => wat.split(", ")[1] ?? wat;
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

function ServLine({ decision, rationale }: { decision: string; rationale: string }) {
  return (
    <details className="group mt-2">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 [&::-webkit-details-marker]:hidden">
        <span className="pill pill-sage inline-flex h-6 items-center px-2.5 text-[11px] font-semibold text-cent">
          SERV Reasoning: <span className="serif-em ml-1 font-normal">{decision}</span>
        </span>
        <span className="text-[12px] text-dim underline decoration-cent/20 underline-offset-2 group-open:text-mute">Why</span>
      </summary>
      <p className="mt-1.5 text-[13.5px] leading-[1.55] text-mute">{rationale}</p>
    </details>
  );
}

function ReppoLine({ call }: { call: PaidCall }) {
  const r = call.reppo;
  if (!r) return null;
  const below = r.score100 < r.pass_mark;
  return (
    <details className="group mt-1.5">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 [&::-webkit-details-marker]:hidden">
        <span className="pill pill-sage inline-flex h-6 items-center px-2.5 text-[11px] font-semibold text-cent">
          Reppo: <span className="serif-em ml-1 font-normal">{r.score100} / 100</span>
        </span>
        <span className="text-[12.5px] text-dim">
          after the fact{below ? `, below ${r.pass_mark}` : ""}
          {r.settled === "after_the_call" ? " · settled later" : ""}. Does not undo the payment.
        </span>
      </summary>
      <p className="mt-1.5 text-[13.5px] leading-[1.55] text-mute">{r.note}</p>
    </details>
  );
}

/**
 * Replay of Centiv's real, Kite Passport-capped x402 run on 12 Nov 2026, 18:27 WAT.
 * Everything here is read from src/data/verified-run.json, checked against Base.
 * SERV weighed each call before payment. Reppo scored paid excerpts after the fact.
 */
export default function VerifiedRun({
  compact = false,
  collapseReplies = true,
  receipts = false,
  hideLead = false,
  id = "verified-run",
  children,
}: {
  compact?: boolean;
  collapseReplies?: boolean;
  /** Kept so existing call sites compile; the layout is now a single receipts-style card. */
  receipts?: boolean;
  /** Hide the title and long intro when a parent section already tells the story. */
  hideLead?: boolean;
  id?: string;
  children?: ReactNode;
}) {
  void receipts;
  const r = VERIFIED_RUN;
  const p = r.passport;
  const caps = p.caps;
  const runDate = paidCalls[0] ? date(paidCalls[0].onchain.timestamp_wat) : date(p.expires_at_wat);
  const firstTransfer = paidCalls[0]?.onchain.usdc_transfer;
  const wallets = firstTransfer ? { from: firstTransfer.from, to: firstTransfer.to } : null;
  const ttlMin = caps.ttl_seconds ? Math.round(caps.ttl_seconds / 60) : null;
  const sameBriefing = paidCalls.length === 2 && paidCalls[0].reply.excerpt.join() === paidCalls[1].reply.excerpt.join();
  const replyCall = paidCalls[0];

  const replies = replyCall ? (
    <figure className="rounded-[14px] border border-[rgba(196, 148, 100,0.35)] bg-[#fffdf8] p-5">
      <figcaption className="flex flex-wrap items-center justify-between gap-2">
        <span className="num text-[10.5px] uppercase tracking-[0.12em] text-gold-deep">
          {sameBriefing ? "Paid reply · both calls, same briefing" : `Paid reply · “${replyCall.topic}”`}
        </span>
        <span className="num text-[10.5px] text-dim">{replyCall.reply.source_count} sources</span>
      </figcaption>
      <blockquote className="mt-3 space-y-2 text-[13.5px] leading-[1.7] text-mute">
        {(compact ? replyCall.reply.excerpt.slice(0, 1) : replyCall.reply.excerpt).map((para) => (
          <p key={para.slice(0, 40)}>{para.length > 640 ? `${para.slice(0, 640).replace(/\s+\S*$/, "")}…` : para}</p>
        ))}
      </blockquote>
      <p className="mt-3 border-t border-[rgba(196, 148, 100,0.25)] pt-2 text-[11.5px] text-dim">
        Source: Otto AI ({replyCall.reply.attribution.replace(/[[\]]/g, "")}). Claims are Otto AI’s and Centiv has not verified them.
        {sameBriefing ? " Both paid calls returned this same briefing." : ""}
      </p>
    </figure>
  ) : null;

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <div className="card-gold relative overflow-hidden p-6 sm:p-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ProvenanceBadge p="replay" />
          <span className="num text-[11px] uppercase tracking-[0.12em] text-dim">
            {runDate} · Base mainnet · USDC
          </span>
        </div>

        {!hideLead && (
          <>
            <h2 id={`${id}-title`} className={`mt-5 font-normal leading-[1.08] tracking-[-0.035em] text-bone ${compact ? "text-[32px] md:text-[40px]" : "text-[32px] md:text-[44px]"}`}>
              Two paid. Call 3 <span className="serif-em">refused.</span>
            </h2>
            <p className="mt-4 max-w-[640px] text-[15.5px] leading-[1.65] text-mute">
              A real run, replayed. The question: “{r.question ?? "Ethereum news"}”. The owner approved a Kite Passport
              session: ${caps.max_amount_per_tx} a call, ${caps.max_total_amount} in total, scoped to Otto AI. SERV Reasoning
              weighed each call before payment. Two payments settled in USDC on Base. On the third call, Kite Passport
              refused — nothing was signed. Reppo scored the paid excerpts after the fact (66 and 60, both below 70). It
              does not block or undo a payment. The question sat in the Kite Passport task; the topic “ethereum etf” was
              set directly for the three calls, not chosen by SERV.
            </p>
          </>
        )}
        {hideLead && <h2 id={`${id}-title`} className="sr-only">Receipts from the recorded run</h2>}
        {children}

        <div className="mt-7 rounded-[14px] border border-[rgba(196, 148, 100,0.45)] bg-white">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 sm:px-5">
            <span className="text-[12px] text-dim">Caps, set with a passkey</span>
            <span className="fig text-[15px] text-bone">
              ${caps.max_amount_per_tx} per call · ${caps.max_total_amount} total
              {ttlMin ? ` · ${ttlMin} min` : ""}
            </span>
          </p>
          <details className="group border-t border-[rgba(196, 148, 100,0.3)]">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 text-[13.5px] font-medium text-bone sm:px-5 [&::-webkit-details-marker]:hidden">
              Session details
              <span aria-hidden="true" className="text-[18px] leading-none text-dim transition group-open:rotate-45">
                +
              </span>
            </summary>
            <dl className="grid gap-x-6 gap-y-1 px-4 pb-4 text-[12.5px] sm:gap-y-2.5 sm:grid-cols-[auto_minmax(0,1fr)] sm:px-5">
              <dt className="text-dim">Kite Passport session</dt>
              <dd className="num mb-2 break-all text-bone sm:mb-0">{p.session_id}</dd>
              <dt className="text-dim">Expires</dt>
              <dd className="fig mb-2 text-bone sm:mb-0">{clocks(p.expires_at_wat, p.expires_at_utc)}</dd>
              <dt className="text-dim">Scope</dt>
              <dd className="num mb-2 break-all text-bone sm:mb-0">
                {p.scope.method} {p.scope.host}
                {p.scope.path_prefix}
              </dd>
              {wallets && (
                <>
                  <dt className="text-dim">Paid from</dt>
                  <dd className="num mb-2 text-bone sm:mb-0">
                    <a
                      className="underline decoration-dotted underline-offset-2 hover:text-cent"
                      href={basescanAddress(wallets.from)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={wallets.from}
                    >
                      {short(wallets.from)}
                    </a>{" "}
                    (Kite Passport wallet)
                  </dd>
                  <dt className="text-dim">Paid to</dt>
                  <dd className="num mb-2 text-bone sm:mb-0">
                    <a
                      className="underline decoration-dotted underline-offset-2 hover:text-cent"
                      href={basescanAddress(wallets.to)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={wallets.to}
                    >
                      {short(wallets.to)}
                    </a>{" "}
                    (Otto AI)
                  </dd>
                </>
              )}
            </dl>
          </details>
        </div>

        <ol className="mt-6 divide-y divide-[rgba(196, 148, 100,0.25)] rounded-[14px] border border-[rgba(196, 148, 100,0.45)] bg-white">
          {paidCalls.map((c) => (
            <li
              key={c.tx_hash}
              className="grid grid-cols-[30px_minmax(0,1fr)] items-start gap-x-3 gap-y-3 px-4 py-4 sm:grid-cols-[34px_minmax(0,1fr)_auto] sm:px-5"
            >
              <Stamp size={30} className="stamp-in text-gold" notch="var(--color-cent)" label="Bought" />
              <div className="min-w-0">
                <p className="num text-[10.5px] uppercase tracking-[0.12em] text-dim">
                  Call {c.n} · topic “{c.topic}”
                </p>
                <p className="mt-1 text-[15px] font-medium tracking-[-0.015em] text-bone">
                  Paid {c.onchain.usdc_transfer.amount_usdc.toFixed(3)} USDC to Otto AI · block{" "}
                  {c.onchain.block.toLocaleString("en-GB")} · {clocks(c.onchain.timestamp_wat, c.onchain.timestamp_utc)}
                </p>
                {c.serv && <ServLine decision={c.serv.decision} rationale={c.serv.rationale} />}
                {c.paid_despite_serv_skip && (
                  <p className="mt-1.5 text-[13.5px] leading-[1.55] text-mute">
                    SERV flagged it, the agent paid anyway — Kite Passport is the hard limit.
                  </p>
                )}
                <ReppoLine call={c} />
                <p className="num mt-1 text-[11.5px] leading-[1.6] text-dim">
                  Session spent ${c.session_spent_after_usdc} of ${caps.max_total_amount}
                </p>
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
                <p className="num text-[10.5px] uppercase tracking-[0.12em] text-dim">
                  Call {declinedCall.n} · topic “{declinedCall.topic}”
                </p>
                <p className="mt-1 text-[15px] font-medium tracking-[-0.015em] text-stop">
                  Declined by Kite Passport. Nothing was signed and no money moved.
                </p>
                {declinedCall.serv && <ServLine decision={declinedCall.serv.decision} rationale={declinedCall.serv.rationale} />}
                <p className="num mt-1.5 text-[12px] text-mute">
                  <span className="rounded bg-stop/10 px-1.5 py-0.5 text-stop">{declinedCall.error_code}</span> · “
                  {declinedCall.error}”
                </p>
              </div>
              <div className="col-start-2 flex flex-wrap items-center gap-2 sm:col-start-auto sm:flex-col sm:items-end">
                <DecisionTag d="decline" />
                <span className="num text-[12px] text-dim">no transaction</span>
              </div>
            </li>
          )}
        </ol>

        {replies &&
          (collapseReplies ? (
            <details className="group mt-6 rounded-[14px] border border-[rgba(196, 148, 100,0.35)] bg-[#fffdf8]">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-[14px] font-medium text-bone [&::-webkit-details-marker]:hidden">
                What the two paid calls returned
                <span aria-hidden="true" className="text-[18px] leading-none text-dim transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="px-4 pb-4 sm:px-5 sm:pb-5">{replies}</div>
            </details>
          ) : (
            <div className="mt-6">{replies}</div>
          ))}

        <p className="mt-6 text-[12.5px] leading-[1.65] text-dim">
          SERV Reasoning weighed each call before payment. Reppo scored the two paid excerpts after they settled — it
          does not block or undo a payment. Payments settled in USDC on Base mainnet ({r.settlement.caip2}). Each
          transaction was submitted by an x402 facilitator that paid the gas. The USDC moved from the Kite Passport
          wallet, as the Transfer log shows. Checked against {r.verification.rpc.replace("https://", "")} on{" "}
          {r.verification.checked_at_utc.slice(0, 10)}.{" "}
          <a href="/api/evidence" className="underline underline-offset-2 hover:text-bone">
            Evidence JSON
          </a>
          .
        </p>
      </div>
    </section>
  );
}
