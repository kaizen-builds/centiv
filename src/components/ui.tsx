"use client";
import type { Decision, GateSource, Verdict } from "@/lib/centiv";
import { useTween } from "@/lib/hooks";

export function Money({ value, className = "", unit = true, prefix = "" }: { value: number; className?: string; unit?: boolean; prefix?: string }) {
  const v = useTween(value);
  const dp = value !== 0 && Math.abs(value) < 0.01 ? 3 : 2;
  return (
    <span className={`fig ${className}`}>
      {prefix}
      {v.toFixed(dp)}
      {unit && <span className="num ml-1 text-[10px] tracking-[0.06em] text-dim">USDC</span>}
    </span>
  );
}

export function Count({ value, decimals = 0, className = "" }: { value: number; decimals?: number; className?: string }) {
  const v = useTween(value);
  return <span className={`fig ${className}`}>{v.toFixed(decimals)}</span>;
}

const decisionStyle: Record<Decision, string> = {
  spend: "text-cent border-cent/35 bg-cent/[0.08]",
  skip: "text-skip border-[var(--line-strong)] bg-transparent",
  decline: "text-stop border-stop/45 bg-stop/10",
};
const decisionLabel: Record<Decision, string> = { spend: "Bought", skip: "Skipped", decline: "Declined" };

export function DecisionTag({ d }: { d: Decision }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[11px] font-semibold ${decisionStyle[d]}`}>
      <DecisionGlyph d={d} />
      {decisionLabel[d]}
    </span>
  );
}

export function DecisionGlyph({ d }: { d: Decision }) {
  if (d === "spend")
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <path d="M5 1v8M2 6l3 3 3-3" stroke="currentColor" strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (d === "skip")
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <path d="M1.5 5h7M6 2.5 8.5 5 6 7.5" stroke="currentColor" strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <circle cx="5" cy="5" r="3.8" stroke="currentColor" strokeWidth="1.25" fill="none" />
      <path d="M2.4 7.6 7.6 2.4" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

const verdictStyle: Record<Verdict, string> = {
  accept: "text-cent border-cent/40 bg-cent/10",
  revise: "text-hold border-hold/40 bg-transparent",
  reject: "text-stop border-stop/50 bg-stop/10",
};
const verdictLabel: Record<Verdict, string> = { accept: "Accept", revise: "Revise", reject: "Reject" };

export function VerdictTag({ v, score }: { v: Verdict; score?: number }) {
  return (
    <span className={`score-in inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[11px] font-semibold ${verdictStyle[v]}`}>
      {score !== undefined && <span className="num">{score.toFixed(2)}</span>}
      <span className="opacity-80">{verdictLabel[v]}</span>
    </span>
  );
}

/** Labels a gate result by its source so a built-in check is never mistaken for a live Reppo score. */
export function GateSourceLabel({ source, className = "" }: { source?: GateSource; className?: string }) {
  if (source === "reppo") {
    return <span className={`text-[11px] text-mute ${className}`}>Reppo</span>;
  }
  return <span className={`text-[11px] text-dim ${className}`}>Built-in check · Simulated</span>;
}

/** Ring gauge — olive remaining arc drains smoothly (~0.9s) as spend lands. */
export function BudgetRing({ ratio, size = 132, label }: { ratio: number; size?: number; label?: React.ReactNode }) {
  const r = 52;
  const arc = 290 / 360;
  const full = 2 * Math.PI * r * arc;
  const clamped = Math.max(0, Math.min(1, ratio));
  const v = useTween(clamped, 900);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
        <circle cx="60" cy="60" r="58" stroke="var(--line-strong)" strokeWidth="1.25" fill="none" />
        <circle cx="60" cy="60" r={r} stroke="var(--line-strong)" strokeWidth="6.5" fill="none" strokeDasharray={`${full} 999`} transform="rotate(35 60 60)" />
        <circle
          cx="60"
          cy="60"
          r={r}
          stroke="var(--color-cent)"
          strokeWidth="6.5"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${full * v} 999`}
          transform="rotate(35 60 60)"
        />
        {Array.from({ length: 60 }).map((_, i) => (
          <line key={i} x1="60" y1="3.5" x2="60" y2={i % 5 ? "5.5" : "7.5"} stroke="var(--color-bone)" strokeOpacity={i % 5 ? 0.18 : 0.4} strokeWidth="1" transform={`rotate(${i * 6} 60 60)`} />
        ))}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{label}</div>
    </div>
  );
}

export type Provenance = "live" | "simulated" | "replay";

const provClass: Record<Provenance, string> = { live: "prov prov-live", simulated: "prov prov-sim", replay: "prov prov-replay" };
const provText: Record<Provenance, string> = {
  live: "Live · real payment",
  simulated: "Simulated · no funds move",
  replay: "Replay · real on-chain run",
};
const provShort: Record<Provenance, string> = { live: "Live", simulated: "Simulated", replay: "Replay" };

/** The three provenance badges. Every receipt and run in Centiv carries exactly one. */
export function ProvenanceBadge({ p, short = false, className = "" }: { p: Provenance; short?: boolean; className?: string }) {
  return (
    <span className={`${provClass[p]} ${className}`} title={provText[p]}>
      {p === "simulated" ? (
        <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="3.6" stroke="currentColor" strokeWidth="1.25" fill="none" strokeDasharray="2 1.6" /></svg>
      ) : p === "replay" ? (
        <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 5a3 3 0 1 0 1-2.2M2 1.5V3.5h2" stroke="currentColor" strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : (
        <span className="prov-dot pulse-dot" aria-hidden="true" />
      )}
      {short ? provShort[p] : provText[p]}
    </span>
  );
}

/** Receipt cell: real hashes link to Basescan; simulated ids are italic and never linked. */
export function Receipt({ receipt, url, provenance }: { receipt?: string; url?: string; provenance?: Provenance }) {
  if (!receipt) return null;
  const short = receipt.startsWith("sim_") ? `${receipt.slice(0, 8)}…${receipt.slice(-3)}` : `${receipt.slice(0, 6)}…${receipt.slice(-4)}`;
  if (url && provenance !== "simulated")
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="num text-cent underline decoration-cent/40 underline-offset-2 hover:decoration-cent" title={receipt}>
        {short} ↗
      </a>
    );
  return (
    <span className="num receipt-sim" title={`${receipt} — simulated receipt, not an on-chain hash`}>
      {short}
    </span>
  );
}
