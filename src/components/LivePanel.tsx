"use client";

import { useEffect, useState } from "react";
import type { AuditRow, Decision } from "@/lib/centiv";
import { ProvenanceBadge } from "./ui";

type ServDecision = { decision: Decision; rationale: string; source: "serv" | "heuristic" };
type LiveReppoScore = {
  source: "reppo" | "unconfigured" | "error" | "pending";
  score100?: number;
  decision?: string;
  route?: string;
  confidence?: string;
  reason?: string;
  evalId?: string;
  note: string;
};
type LiveStatus = { enabled: boolean; reason: string; merchant: string; limits?: { maxPerCallUsdc: number; maxTotalUsdc: number; spentThisProcessUsdc: number } };
type TopicSource = "serv" | "fallback" | "direct";
type LiveResult = {
  status: "paid" | "declined" | "skipped" | "error";
  question?: string;
  topic: string;
  topic_source?: TopicSource;
  topic_rationale?: string;
  price?: number;
  tx_hash?: string;
  basescan_url?: string;
  spent_total?: string;
  error_code?: string;
  error?: string;
  reply?: { provider: string; excerpt: string; source_count?: number };
  serv?: ServDecision;
  reppo?: LiveReppoScore;
};

function isLocalHost(host: string) {
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

/** Localhost-only fixture so the panel can be screenshot without arming payments. */
const PREVIEW_RESULTS: LiveResult[] = [
  {
    status: "paid",
    question: "Is anything big happening with Ethereum ETFs this week?",
    topic: "ethereum etf",
    topic_source: "direct",
    topic_rationale: "Preview only — this topic is shown as set directly, not chosen by SERV.",
    price: 0.001,
    tx_hash: "0xpreview0000000000000000000000000000000000000000000000000000000000",
    basescan_url: "https://basescan.org/tx/0xpreview0000000000000000000000000000000000000000000000000000000000",
    spent_total: "0.001",
    serv: {
      decision: "spend",
      rationale: "Fresh filtered news on Ethereum is directly useful for a research brief and likely to add current primary evidence.",
      source: "serv",
    },
    reppo: { source: "unconfigured", note: "Reppo: not configured" },
    reply: {
      provider: "Otto AI",
      excerpt: "Preview excerpt only — this row is a localhost fixture for screenshots, not a real payment or a Reppo score.",
    },
  },
];

function ReppoLine({ reppo }: { reppo: LiveReppoScore }) {
  const label =
    reppo.source === "unconfigured"
      ? "not configured"
      : reppo.source === "reppo" && reppo.score100 != null
        ? `${reppo.score100} / 100`
        : reppo.source === "pending"
          ? "settling"
          : "unavailable";
  return (
    <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-cent">
      <span className="pill pill-sage h-6 px-2.5 text-[11px] font-semibold text-cent">
        Reppo: <span className="serif-em font-normal">{label}</span>
      </span>
      <span className="text-[12.5px]">{reppo.note}</span>
    </p>
  );
}

/**
 * Owner-only live payment panel for the judges' video. Renders nothing unless
 * GET /api/live reports that live mode is armed — which never happens on Vercel.
 * A localhost-only ?live-preview=1 query shows a fixture row for screenshots
 * and never enables payments.
 */
export function LivePanel({ onRow }: { onRow: (row: Omit<AuditRow, "id">) => void }) {
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [token, setToken] = useState("");
  const [question, setQuestion] = useState("Is anything big happening with Ethereum ETFs this week?");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<LiveResult[]>([]);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    fetch("/api/live")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
    const host = window.location.hostname;
    const q = new URLSearchParams(window.location.search);
    if (isLocalHost(host) && q.get("live-preview") === "1") {
      setPreview(true);
      setResults(PREVIEW_RESULTS);
    }
  }, []);

  if (!status?.enabled && !preview) return null;

  const pay = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question }),
      });
      const data = (await res.json()) as LiveResult & { error?: string };
      const r: LiveResult = res.ok || data.status ? data : { status: "error", topic: data.topic || "", question, error: data.error || res.statusText };
      setResults((x) => [r, ...x]);
      const servLine = r.serv ? `SERV ${r.serv.decision} (${r.serv.source}): ${r.serv.rationale}` : "";
      const reppoLine = r.reppo
        ? r.reppo.source === "reppo" && r.reppo.score100 != null
          ? `Reppo ${r.reppo.score100}/100: ${r.reppo.note}`
          : r.reppo.note
        : "";
      onRow({
        runId: "live",
        runLabel: "L",
        at: Date.now(),
        service: `Otto AI · filtered news “${r.topic || "?"}”`,
        decision: r.status === "paid" ? "spend" : r.status === "skipped" ? "skip" : "decline",
        amount: r.price ?? 0,
        charged: r.status === "paid" ? r.price ?? 0 : 0,
        remaining: 0,
        reason: r.status === "paid"
          ? `${servLine ? servLine + " " : ""}${reppoLine ? reppoLine + " " : ""}Paid via Kite Passport · session spent ${r.spent_total ?? "?"} USDC.`
          : `${servLine ? servLine + " " : ""}${reppoLine ? reppoLine + " " : ""}${r.error_code ?? "error"} — ${r.error ?? ""}`.trim(),
        receipt: r.tx_hash,
        receiptUrl: r.basescan_url,
        provenance: "live",
      });
    } finally {
      setBusy(false);
    }
  };

  const limits = status?.limits;
  const merchant = status?.merchant ?? "the merchant";

  return (
    <section aria-labelledby="live-title" className="card mt-6 border-cent/40 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="live-title" className="eyebrow">Owner live mode · this machine only</h2>
        <ProvenanceBadge p="live" />
      </div>
      {preview && !status?.enabled && (
        <p className="mt-2 text-[12.5px] text-dim">Localhost preview only — payments are not armed. The Reppo line shows the honest unconfigured state.</p>
      )}
      <p className="mt-2 text-[13px] text-mute">
        Real USDC through your approved Kite Passport session to {merchant}. Type a full question; SERV picks a short Otto topic (or a built-in extractor if SERV is unavailable). SERV then weighs each call before anything is signed. After a paid result, Reppo scores the excerpt when a key is configured. Centiv limit {limits?.maxPerCallUsdc ?? "—"} per call, {limits?.maxTotalUsdc ?? "—"} per run (spent so far {limits?.spentThisProcessUsdc ?? 0}). Kite Passport enforces its own caps on top.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <input type="password" autoComplete="off" placeholder="Owner token" value={token} onChange={(e) => setToken(e.target.value)} className="num h-10 w-56 rounded-full border hairline-strong bg-white px-4 text-[12.5px]" aria-label="Owner token" />
          <button onClick={pay} disabled={busy || !token || preview || !question.trim()} className="pill pill-cent h-10 px-5 text-[13px] disabled:opacity-50">
            {busy ? "Paying…" : "Pay & fetch (Live)"}
          </button>
        </div>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          className="min-h-[52px] w-full resize-none rounded-2xl border hairline-strong bg-white px-4 py-2.5 text-[14px] leading-[1.45]"
          aria-label="Research question"
          placeholder="Ask a full question — SERV will pick a short Otto topic"
        />
      </div>
      {results.length > 0 && (
        <ul className="mt-4 space-y-2">
          {results.map((r, i) => (
            <li key={i} className={`rounded-md border px-3 py-2 text-[12.5px] ${r.status === "paid" ? "border-pass/40 bg-pass/[0.06]" : r.status === "skipped" ? "border-cent/25 bg-sage/60" : "border-stop/45 bg-stop/[0.06]"}`}>
              <span className="font-semibold">{r.status === "paid" ? "Paid" : r.status === "declined" ? "Declined" : r.status === "skipped" ? "Skipped" : "Error"}</span>
              {r.question ? (
                <span className="text-mute">
                  {" "}
                  · “{r.question}” → <span className="font-medium text-bone">{r.topic}</span>
                  {r.topic_source === "serv" ? " · SERV" : r.topic_source === "fallback" ? " · built-in" : r.topic_source === "direct" ? " · set directly" : ""}
                </span>
              ) : (
                <span> · “{r.topic}”</span>
              )}
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
              {r.reppo && <ReppoLine reppo={r.reppo} />}
              {r.reply && <p className="mt-1 text-mute">{r.reply.excerpt.slice(0, 280)}… <span className="text-dim">— {r.reply.provider}</span></p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
