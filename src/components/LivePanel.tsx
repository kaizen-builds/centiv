"use client";

import { useEffect, useState } from "react";
import type { AuditRow, Decision } from "@/lib/centiv";
import { ProvenanceBadge } from "./ui";

type ServDecision = { decision: Decision; rationale: string; source: "serv" | "heuristic" };
type LiveStatus = { enabled: boolean; reason: string; merchant: string; limits?: { maxPerCallUsdc: number; maxTotalUsdc: number; spentThisProcessUsdc: number } };
type LiveResult = {
  status: "paid" | "declined" | "skipped" | "error";
  topic: string;
  price?: number;
  tx_hash?: string;
  basescan_url?: string;
  spent_total?: string;
  error_code?: string;
  error?: string;
  reply?: { provider: string; excerpt: string; source_count?: number };
  serv?: ServDecision;
};

/**
 * Owner-only live payment panel for the judges' video. Renders nothing unless
 * GET /api/live reports that live mode is armed — which never happens on Vercel.
 */
export function LivePanel({ onRow }: { onRow: (row: Omit<AuditRow, "id">) => void }) {
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [token, setToken] = useState("");
  const [topic, setTopic] = useState("ethereum");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<LiveResult[]>([]);

  useEffect(() => {
    fetch("/api/live")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  if (!status?.enabled) return null;

  const pay = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic }),
      });
      const data = (await res.json()) as LiveResult & { error?: string };
      const r: LiveResult = res.ok || data.status ? data : { status: "error", topic, error: data.error || res.statusText };
      setResults((x) => [r, ...x]);
      const servLine = r.serv ? `SERV ${r.serv.decision} (${r.serv.source}): ${r.serv.rationale}` : "";
      onRow({
        runId: "live",
        runLabel: "L",
        at: Date.now(),
        service: `Otto AI · filtered news “${topic}”`,
        decision: r.status === "paid" ? "spend" : r.status === "skipped" ? "skip" : "decline",
        amount: r.price ?? 0,
        charged: r.status === "paid" ? r.price ?? 0 : 0,
        remaining: 0,
        reason: r.status === "paid"
          ? `${servLine ? servLine + " " : ""}Paid via Kite Passport · session spent ${r.spent_total ?? "?"} USDC.`
          : `${servLine ? servLine + " " : ""}${r.error_code ?? "error"} — ${r.error ?? ""}`.trim(),
        receipt: r.tx_hash,
        receiptUrl: r.basescan_url,
        provenance: "live",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="live-title" className="card mt-6 border-cent/40 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="live-title" className="eyebrow">Owner live mode · this machine only</h2>
        <ProvenanceBadge p="live" />
      </div>
      <p className="mt-2 text-[13px] text-mute">
        Real USDC through your approved Passport session to {status.merchant}. SERV Reasoning weighs each call before anything is signed. Centiv limit {status.limits?.maxPerCallUsdc} per call, {status.limits?.maxTotalUsdc} per run (spent so far {status.limits?.spentThisProcessUsdc}). Passport enforces its own caps on top.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <input type="password" autoComplete="off" placeholder="Owner token" value={token} onChange={(e) => setToken(e.target.value)} className="num h-10 w-56 rounded-full border hairline-strong bg-white px-4 text-[12.5px]" aria-label="Owner token" />
        <input value={topic} onChange={(e) => setTopic(e.target.value)} className="h-10 w-44 rounded-full border hairline-strong bg-white px-4 text-[13px]" aria-label="Topic (one or two words)" />
        <button onClick={pay} disabled={busy || !token} className="pill pill-cent h-10 px-5 text-[13px] disabled:opacity-50">
          {busy ? "Paying…" : "Pay & fetch (Live)"}
        </button>
      </div>
      {results.length > 0 && (
        <ul className="mt-4 space-y-2">
          {results.map((r, i) => (
            <li key={i} className={`rounded-md border px-3 py-2 text-[12.5px] ${r.status === "paid" ? "border-pass/40 bg-pass/[0.06]" : r.status === "skipped" ? "border-cent/25 bg-sage/60" : "border-stop/45 bg-stop/[0.06]"}`}>
              <span className="font-semibold">{r.status === "paid" ? "Paid" : r.status === "declined" ? "Declined" : r.status === "skipped" ? "Skipped" : "Error"}</span> · “{r.topic}”
              {r.basescan_url && (
                <>
                  {" "}· <a className="num text-cent underline" href={r.basescan_url} target="_blank" rel="noopener noreferrer">{r.tx_hash?.slice(0, 10)}… on Basescan ↗</a>
                </>
              )}
              {r.error_code && <span className="num text-stop"> · {r.error_code}</span>}
              {r.error && <span className="text-mute"> · {r.error}</span>}
              {r.serv && (
                <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-cent">
                  <span className="pill pill-sage h-6 px-2.5 text-[11px] font-semibold text-cent">
                    SERV Reasoning: <span className="serif-em font-normal">{r.serv.decision}</span>
                    {r.serv.source === "heuristic" ? <span className="ml-1 font-normal text-dim">· built-in</span> : null}
                  </span>
                  <span className="text-[12.5px]">{r.serv.rationale}</span>
                </p>
              )}
              {r.reply && <p className="mt-1 text-mute">{r.reply.excerpt.slice(0, 280)}… <span className="text-dim">— {r.reply.provider}</span></p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
