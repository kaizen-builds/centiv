"use client";
import type { Run, Step } from "@/lib/centiv";
import { usdc } from "@/lib/centiv";
import { GateSourceLabel, ProvenanceBadge, VerdictTag } from "./ui";
import { Nib, Stamp } from "./Logo";

const kindLabel: Record<Step["kind"], string> = {
  reason: "SERV",
  quote: "x402",
  check: "Passport",
  pay: "x402",
  skip: "SERV",
  decline: "Passport",
  fetch: "Data",
  draft: "SERV",
  gate: "Gate",
  answer: "",
};

function Node({ s }: { s: Step }) {
  const base = "relative z-10 grid h-[22px] w-[22px] place-items-center rounded-full border text-[10px]";
  if (s.status === "active")
    return (
      <span className={`${base} border-cent bg-ink`}>
        <span className="pulse-dot h-2 w-2 rounded-full bg-cent" />
      </span>
    );
  if (s.status === "blocked")
    return (
      <span className={`${base} border-stop/60 bg-stop/15 text-stop`}>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" /></svg>
      </span>
    );
  if (s.status === "skipped")
    return (
      <span className={`${base} border-skip/50 bg-ink text-skip`}>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 5h7M6 2.5 8.5 5 6 7.5" stroke="currentColor" strokeWidth="1.25" fill="none" strokeLinecap="round" /></svg>
      </span>
    );
  const paid = s.kind === "pay";
  return (
    <span className={`${base} ${paid ? "border-pass bg-pass text-white" : "border-[var(--line-strong)] bg-ink-3 text-mute"}`}>
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 5.2 4.2 7.4 8 3" stroke="currentColor" strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>
  );
}

function StepRow({ s, last }: { s: Step; last: boolean }) {
  const tone =
    s.status === "blocked" ? "text-stop" : s.status === "skipped" ? "text-skip" : "text-bone";
  return (
    <li className="rise relative grid grid-cols-[22px_1fr_auto] gap-x-4 pb-5" style={{ animationDuration: "450ms" }}>
      {!last && <span className="absolute left-[10.5px] top-6 bottom-0 w-px bg-[var(--line-strong)]" aria-hidden="true" />}
      <Node s={s} />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2">
          <span className="num rounded-full border hairline-strong px-1.5 py-[1px] text-[9.5px] uppercase tracking-[0.1em] text-dim">{kindLabel[s.kind]}</span>
          <span className={`text-[14px] font-medium ${s.status === "active" ? "shimmer-text" : tone}`}>{s.title}</span>
        </p>
        {s.detail && <p className="mt-1 text-[12.5px] leading-[1.5] text-mute">{s.detail}</p>}
        {s.checks && (
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-3">
            {s.checks.map((c, i) => (
              <li
                key={c.label}
                className={`score-in rounded-[4px] border px-2.5 py-1.5 text-[11.5px] ${c.ok ? "border-[var(--line-strong)] bg-transparent" : "border-stop/45 bg-stop/[0.07]"}`}
                style={{ animationDelay: `${150 + i * 220}ms` }}
              >
                <span className="text-dim">{c.label}</span>
                <span className={`num mt-0.5 flex items-center gap-1.5 ${c.ok ? "text-bone" : "text-stop"}`}>
                  {c.ok ? "✓" : "✕"} {c.detail}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {s.amount !== undefined && s.amount > 0 && (
        <span className={`num self-start pt-0.5 text-[13px] ${s.kind === "decline" ? "text-stop line-through decoration-stop/60" : s.kind === "pay" ? "fig text-[16px] text-bone" : "text-dim"}`}>
          {s.kind === "pay" ? "−$" : "$"}
          {usdc(s.amount)}
        </span>
      )}
    </li>
  );
}

export function RunPanel({ runs, current, onSelect }: { runs: Run[]; current?: Run; onSelect: (id: string) => void }) {
  return (
    <section id="run" aria-labelledby="run-title" className="card scroll-mt-24 p-6" aria-live="polite">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 id="run-title" className="eyebrow">This run</h2>
          <ProvenanceBadge p="simulated" short />
        </div>
        {runs.length > 0 && (
          <div role="tablist" aria-label="Runs" className="flex gap-1 rounded-lg border hairline p-0.5">
            {runs.map((r) => (
              <button
                key={r.id}
                role="tab"
                aria-selected={current?.id === r.id}
                onClick={() => onSelect(r.id)}
                className={`num rounded-md px-2.5 py-1 text-[11.5px] transition ${current?.id === r.id ? "bg-ink-4 text-bone" : "text-dim hover:text-bone"}`}
              >
                Run {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!current ? (
        <div className="mt-6 grid place-items-center rounded-md border border-dashed hairline-strong px-6 py-10 text-center">
          <Nib size={64} />
          <p className="mt-3 font-display text-[24px] text-bone">No spend yet.</p>
          <p className="mt-1 max-w-sm text-[13.5px] text-dim">
            Ask something that might be worth a call. Each decision lands here — the reasoning, the quote, the Passport check, the payment or decline, then the quality gate’s verdict.
          </p>
        </div>
      ) : (
        <div key={current.id} className="mt-5">
          <p className="font-display text-[20px] font-medium leading-[1.4] tracking-[-0.02em] text-bone">“{current.question}”</p>
          <ol className="mt-5">
            {current.steps.map((s, i) => (
              <StepRow key={s.id} s={s} last={i === current.steps.length - 1 && !current.answer} />
            ))}
          </ol>
          {current.answer && current.gate && (
            <article
              className={`rise mt-1 rounded-md border p-5 ${
                current.gate.verdict === "accept" ? "border-cent/30 bg-cent/[0.04]" : "border-hold/35 bg-hold/[0.05]"
              }`}
              aria-label="Answer"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-3">
                  {current.gate.verdict === "accept" ? <Stamp size={26} className="stamp-in text-gold" notch="var(--color-cent)" /> : <Nib size={34} mood="stop" />}
                  <span className="text-[14px] text-bone">
                    {current.gate.verdict === "accept" ? "Accepted. Here’s the brief." : current.gate.verdict === "revise" ? "Revised before release. Here’s the brief." : "Rejected. Nothing reliable to show yet."}
                  </span>
                </p>
                <div className="flex flex-col items-end gap-1">
                  <VerdictTag v={current.gate.verdict} score={current.gate.score} />
                  <GateSourceLabel source={current.gate.source} />
                </div>
              </div>
              <h3 className="mt-4 font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.01em]">{current.answer.headline}</h3>
              <ul className="mt-3 grid gap-2 text-[14px] leading-[1.55] text-mute">
                {current.answer.points.map((p) => (
                  <li key={p} className="flex gap-3">
                    <span className="mt-[9px] h-[2px] w-3 shrink-0 rounded bg-cent" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t hairline pt-3 text-[12px] text-dim">{current.answer.sources}</p>
            </article>
          )}
        </div>
      )}
    </section>
  );
}
