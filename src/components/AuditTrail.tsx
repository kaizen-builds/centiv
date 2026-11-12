"use client";
import { useState } from "react";
import type { AuditRow, Session } from "@/lib/centiv";
import { clock, usdc } from "@/lib/centiv";
import { Count, DecisionTag, GateSourceLabel, Money, ProvenanceBadge, Receipt, VerdictTag } from "./ui";
import { VERIFIED_RUN, replayAuditRows } from "@/lib/verified-run";

const REPLAY_ROWS = replayAuditRows();
const REPLAY_CAPS = VERIFIED_RUN.passport.caps;
import { Stamp } from "./Logo";

export function AuditTrail({
  rows,
  session,
  spent,
}: {
  rows: AuditRow[];
  session: Session;
  spent: number;
}) {
  // Two ledgers, never mixed: the visitor's demo session (a replay of the recorded run) and the verified-run evidence ledger.
  const [view, setView] = useState<"session" | "replay">(rows.length ? "session" : "replay");
  const [seen, setSeen] = useState(rows.length);
  if (rows.length !== seen) {
    setSeen(rows.length);
    if (rows.length > seen) setView("session");
  }
  const replay = view === "replay";
  const viewRows = replay ? REPLAY_ROWS : rows;
  const active = replay || session.status === "active";
  const budget = replay ? Number(REPLAY_CAPS.max_total_amount) : session.budget;
  const perTx = replay ? Number(REPLAY_CAPS.max_amount_per_tx) : session.perTx;
  const spentNow = replay ? REPLAY_ROWS.reduce((a, r) => a + r.charged, 0) : spent;
  const remaining = Math.max(0, +(budget - spentNow).toFixed(6));
  const bought = viewRows.filter((r) => r.decision === "spend");
  const declined = viewRows.filter((r) => r.decision === "decline");
  const skipped = viewRows.filter((r) => r.decision === "skip");
  const scored = viewRows.filter((r) => r.score !== undefined);
  const runScores = Array.from(new Map(scored.map((r) => [r.runId, r.score as number])).values());
  const avg = runScores.length ? runScores.reduce((a, b) => a + b, 0) / runScores.length : 0;
  const lastDecline = declined[declined.length - 1];

  const body = (
    <div>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Audit trail</p>
          <h2 id="audit-title" className="mt-3 font-display text-[40px] leading-[1.02] tracking-[-0.035em] md:text-[58px]">
            Every cent, <span className="serif-em text-cent">stamped.</span>
          </h2>
          <p className="mt-3 max-w-xl text-[14.5px] leading-[1.55] text-mute">
            Each buy, skip and decline — with the reason SERV gave, what it cost, what was left, and the Reppo quality score after a payment, if one was recorded.
          </p>
          <div role="tablist" aria-label="Which ledger" className="mt-5 inline-flex flex-wrap gap-1 rounded-full border hairline-strong bg-ink-2 p-1">
            <button role="tab" aria-selected={!replay} onClick={() => setView("session")} className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] transition ${!replay ? "bg-ink-4 text-bone" : "text-dim hover:text-bone"}`}>
              This demo <ProvenanceBadge p="replay" short />
            </button>
            <button role="tab" aria-selected={replay} onClick={() => setView("replay")} className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] transition ${replay ? "bg-ink-4 text-bone" : "text-dim hover:text-bone"}`}>
              Verified run <ProvenanceBadge p="replay" short />
            </button>
          </div>
          {replay ? (
            <p className="mt-3 max-w-xl text-[12.5px] leading-[1.55] text-dim">
              Real receipts from Kite Passport session <span className="num text-mute">{VERIFIED_RUN.passport.session_id}</span>, on 12 Nov 2026, 19:38 WAT. Times in WAT. SERV chose a topic and weighed each call; Reppo scored the paid excerpts after the fact.
            </p>
          ) : (
            <p className="mt-3 max-w-xl text-[12.5px] leading-[1.55] text-dim">
              The public demo replays the same recorded run. Transaction links are real and marked recorded. No money moves.
            </p>
          )}
        </div>
      </div>

      {/* Stat strip */}
      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-md border hairline-strong bg-[var(--line-strong)] sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Approved", <Money key="a" value={active ? budget : 0} className="text-bone" />],
          ["Spent", <Money key="s" value={spentNow} className="text-bone" />],
          ["Remaining", <Money key="r" value={active ? remaining : 0} className="text-bone" />],
          ["Calls bought", <Count key="b" value={bought.length} className="text-bone" />],
          ["Skipped · declined", <span key="d" className="num"><Count value={skipped.length} className="text-skip" /><span className="text-dim"> · </span><Count value={declined.length} className={declined.length ? "text-stop" : "text-bone"} /></span>],
          ["Avg gate score", replay ? <span key="p" className="num text-[16px] text-bone">{REPLAY_ROWS.filter((row) => row.score !== undefined).map((row) => row.score).filter((v, i, a) => a.indexOf(v) === i).join(" · ") || "—"}<span className="ml-1 text-[11px] font-normal text-dim">after the fact</span></span> : <Count key="p" value={avg} decimals={2} className={avg >= 0.75 ? "text-pass" : "text-bone"} />],
        ].map(([k, v]) => (
          <div key={k as string} className="bg-ink-2 px-4 py-4">
            <dt className="text-[11.5px] text-dim">{k}</dt>
            <dd className="mt-2 text-[26px] leading-none">{v}</dd>
          </div>
        ))}
      </dl>

      {/* Budget ledger bar */}
      <div className="mt-5" aria-hidden={!active}>
        <div className="relative h-2 overflow-visible rounded-[2px] bg-ink-3">
          <div className="absolute inset-0 flex overflow-hidden rounded-[2px]">
            {bought.map((r) => (
              <span
                key={r.id}
                className="h-full border-r-2 border-ink bg-cent transition-[width] duration-700 ease-out"
                style={{ width: `${(r.charged / (budget || 1)) * 100}%` }}
                title={`${r.service} · ${usdc(r.charged)} USDC`}
              />
            ))}
          </div>
          {lastDecline && (
            <span
              className="row-stop absolute inset-y-[-3px] rounded-[2px] border border-dashed border-stop/80"
              style={{
                left: `${(spentNow / (budget || 1)) * 100}%`,
                width: `${Math.max(0.04, Math.min(lastDecline.amount / (budget || 1), 1 - spentNow / (budget || 1))) * 100}%`,
                background: "repeating-linear-gradient(135deg, rgba(165,102,14,.22) 0 4px, transparent 4px 8px)",
              }}
              title={`Declined: ${usdc(lastDecline.amount)} USDC`}
            />
          )}
        </div>
        <div className="num mt-2 flex justify-between text-[11px] text-dim">
          <span>0.00</span>
          {lastDecline ? (
            <span className="text-stop">
              {replay
                ? `Kite Passport declined call 3 — the ${usdc(budget)} session total was used up`
                : `Declined ${usdc(lastDecline.amount)} — over the ${usdc(perTx)} per-call cap and the ${usdc(remaining)} left`}
            </span>
          ) : (
            <span>per-call cap {usdc(perTx)}</span>
          )}
          <span>{usdc(budget)} USDC</span>
        </div>
      </div>

      {/* Ledger table */}
      <div className="mt-6 overflow-x-auto rounded-md border hairline-strong">
        <table className="w-full min-w-[920px] border-collapse text-left">
          <caption className="sr-only">Audit trail of every spending decision</caption>
          <thead>
            <tr className="border-b hairline bg-ink-2 text-[11px] uppercase tracking-[0.1em] text-dim">
              <th scope="col" className="w-12 py-3 pl-4 font-medium"><span className="sr-only">Stamp</span></th>
              <th scope="col" className="px-3 py-3 font-medium">Time</th>
              <th scope="col" className="px-2 py-3 font-medium">Run</th>
              <th scope="col" className="px-4 py-3 font-medium">Call &amp; reason</th>
              <th scope="col" className="px-4 py-3 font-medium">Decision</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Remaining</th>
              <th scope="col" className="px-4 py-3 font-medium">Quality score</th>
              <th scope="col" className="px-4 py-3 font-medium">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {viewRows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center">
                  <p className="font-display text-[20px] text-bone">No calls in this session yet.</p>
                  <p className="mt-1 text-[13.5px] text-dim">Run the A → B demo to stamp a paid call and a decline here, or ask your own question.</p>
                </td>
              </tr>
            )}
            {viewRows.map((r) => (
              <tr key={r.id} className={`${r.decision === "decline" ? "row-stop" : "row-in"} border-b hairline align-top last:border-b-0`}>
                <td className="py-3.5 pl-4">
                  <Stamp
                    size={30}
                    className={`stamp-in ${r.decision === "spend" ? "text-gold" : r.decision === "decline" ? "text-stop" : "text-dim"}`}
                    notch={r.decision === "spend" ? "var(--color-cent)" : undefined}
                    label={r.decision === "spend" ? "Bought" : r.decision === "decline" ? "Declined" : "Skipped"}
                  />
                </td>
                <td className="num whitespace-nowrap px-3 py-4 text-[12px] text-dim">{r.atLabel ?? clock(r.at)}</td>
                <td className="px-2 py-4">
                  <span className="fig grid h-6 w-6 place-items-center rounded-full bg-ink-3 text-[12px] font-semibold text-mute">{r.runLabel}</span>
                </td>
                <td className="max-w-[340px] px-4 py-4">
                  <p className="text-[15px] font-semibold tracking-[-0.015em] text-bone">{r.service}</p>
                  <p className="mt-1 text-[12.5px] leading-[1.45] text-dim">{r.reason}</p>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col items-start gap-1.5">
                    <DecisionTag d={r.decision} />
                    {r.provenance && <ProvenanceBadge p={r.provenance} short />}
                  </div>
                </td>
                <td className="fig whitespace-nowrap px-4 py-4 text-right text-[16px]">
                  {r.decision === "spend" ? (
                    <span className="text-bone">−${usdc(r.charged)}</span>
                  ) : (
                    <span className={r.decision === "decline" ? "text-stop line-through decoration-stop/50" : "text-dim line-through"}>${usdc(r.amount)}</span>
                  )}
                </td>
                <td className="fig whitespace-nowrap px-4 py-4 text-right text-[16px] text-bone">${usdc(r.remaining)}</td>
                <td className="px-4 py-4">
                  {r.verdict ? (
                    <div className="flex flex-col items-start gap-1">
                      <VerdictTag v={r.verdict} score={r.score} />
                      <GateSourceLabel source={r.gateSource} />
                    </div>
                  ) : r.provenance === "replay" || r.provenance === "live" ? (
                    <span className="text-[12px] text-dim">—</span>
                  ) : (
                    <span className="shimmer-text text-[12px]">scoring…</span>
                  )}
                </td>
                <td className="num whitespace-nowrap px-4 py-4 text-[12px]">
                  {r.receipt ? (
                    <Receipt receipt={r.receipt} url={r.receiptUrl} provenance={r.provenance} />
                  ) : (
                    <span className="text-dim">{r.decision === "decline" ? "not signed" : "—"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <section id="audit" aria-labelledby="audit-title" className="mt-20 scroll-mt-24 border-t hairline pt-14">
      {body}
    </section>
  );
}
