// Public-demo replay of the featured recorded run (src/data/verified-run.json).
// No money moves. Receipts are the real Base transaction hashes, labelled recorded.

import type { Answer, AuditRow, Check, Run, Step } from "@/lib/centiv";
import { usdc } from "@/lib/centiv";
import {
  declinedCall,
  paidCalls,
  VERIFIED_RUN,
  type DeclinedCall,
} from "@/lib/verified-run";

export const REPLAY_BANNER = "Replay of a real run · 12 Nov 19:38 WAT · no money moves";

export function recordedQuestion(): string {
  return VERIFIED_RUN.question ?? "What's moving in the crypto and ETH ETF market this week?";
}

export function sameRecordedQuestion(q: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ").replace(/[?’']/g, "'");
  return norm(q) === norm(recordedQuestion());
}

function shortTx(h: string) {
  return `${h.slice(0, 10)}…${h.slice(-4)}`;
}

function capChecks(spentBefore: number, price: number, okTotal: boolean): Check[] {
  const caps = VERIFIED_RUN.passport.caps;
  const per = Number(caps.max_amount_per_tx);
  const total = Number(caps.max_total_amount);
  return [
    { label: "Per-call cap", ok: price <= per, detail: `$${usdc(price)} ≤ $${usdc(per)}` },
    okTotal
      ? { label: "Session total", ok: true, detail: `$${usdc(spentBefore + price)} ≤ $${usdc(total)}` }
      : { label: "Session total", ok: false, detail: `$${usdc(spentBefore)} already spent · session_total_exceeded` },
    { label: "Time window", ok: true, detail: "Session was still open" },
  ];
}

function paidAnswer(): Answer {
  const points: string[] = paidCalls.map((c) => {
    const opening = c.reply.excerpt[0] ?? "";
    const clipped = opening.length > 280 ? `${opening.slice(0, 280).replace(/\s+\S*$/, "")}…` : opening;
    return `Call ${c.n} (“${c.topic}”, ${c.reply.source_count} sources): ${clipped}`;
  });
  if (declinedCall) {
    points.push(
      `Call ${declinedCall.n} (“${declinedCall.topic}”) was refused by Kite Passport with ${declinedCall.error_code} — ${declinedCall.error}. Nothing was signed.`,
    );
  }
  points.push(
    "Those figures are Otto AI’s, not independently verified by Centiv. This panel is a replay of the recorded 12 Nov 19:38 WAT run — no money moves.",
  );
  return {
    headline: "Recorded brief from the two paid Otto calls. Call 3 was refused.",
    points,
    sources: paidCalls
      .map((c) => `Otto AI /filtered-news?topic=${encodeURIComponent(c.topic)} · ${c.reply.source_count} sources · recorded tx ${shortTx(c.tx_hash)}`)
      .join(" · "),
  };
}

/** Build the step-by-step replay the public demo plays. */
export function buildRecordedReplay(opts: {
  question: string;
  runId: string;
  runLabel: string;
}): { run: Run; audit: Omit<AuditRow, "id" | "at">[]; session: { spent: number; remaining: number } } {
  const matched = sameRecordedQuestion(opts.question);
  const caps = VERIFIED_RUN.passport.caps;
  const cap = Number(caps.max_total_amount);
  const steps: Step[] = [];
  const audit: Omit<AuditRow, "id" | "at">[] = [];
  let seq = 0;
  const nextId = () => `${opts.runId}_${seq++}`;

  steps.push({
    id: nextId(),
    kind: "reason",
    status: "done",
    title: REPLAY_BANNER,
    detail: matched
      ? "The default question, SERV topics, payments and the Kite Passport refusal are from the recorded run. Transaction links are real and marked recorded. No money moves."
      : "This public demo always replays the recorded example from 12 Nov 19:38 WAT. Your question isn’t fetched live, and the steps below are that recorded run — not an answer to what you typed. No money moves.",
  });

  let spent = 0;

  for (const c of paidCalls) {
    if (c.topic_rationale) {
      steps.push({
        id: nextId(),
        kind: "reason",
        status: "done",
        title: `SERV chose topic “${c.topic}”`,
        detail: c.topic_rationale,
      });
    } else {
      steps.push({
        id: nextId(),
        kind: "reason",
        status: "done",
        title: `Topic “${c.topic}”`,
        detail: "Short Otto topic from the recorded run.",
      });
    }

    steps.push({
      id: nextId(),
      kind: "quote",
      status: "done",
      title: `x402 quote · Otto AI · “${c.topic}”`,
      detail: `402 Payment Required — ${c.method} ${c.url} · recorded`,
      amount: c.onchain.usdc_transfer.amount_usdc,
    });

    if (c.serv) {
      steps.push({
        id: nextId(),
        kind: "reason",
        status: "done",
        title: `Buy this call for $${usdc(c.onchain.usdc_transfer.amount_usdc)}?`,
        detail: `${c.serv.rationale} (SERV · ${c.serv.decision})`,
      });
    }

    steps.push({
      id: nextId(),
      kind: "check",
      status: "done",
      title: "Kite Passport limits",
      checks: capChecks(spent, c.onchain.usdc_transfer.amount_usdc, true),
    });

    steps.push({
      id: nextId(),
      kind: "pay",
      status: "done",
      title: `Paying $${usdc(c.onchain.usdc_transfer.amount_usdc)} via x402 · Recorded`,
      detail: `Recorded settlement on Base block ${c.onchain.block.toLocaleString("en-GB")} · ${c.onchain.timestamp_wat} · no money moves in this replay`,
      amount: c.onchain.usdc_transfer.amount_usdc,
      receipt: c.tx_hash,
      receiptUrl: c.basescan_url,
      provenance: "replay",
    });

    spent = Number(c.session_spent_after_usdc);

    audit.push({
      runId: opts.runId,
      runLabel: opts.runLabel,
      service: `Otto AI · filtered news “${c.topic}”`,
      decision: "spend",
      amount: c.onchain.usdc_transfer.amount_usdc,
      charged: c.onchain.usdc_transfer.amount_usdc,
      remaining: +(cap - spent).toFixed(6),
      reason: c.serv ? `SERV ${c.serv.decision}: ${c.serv.rationale}` : "Recorded payment.",
      receipt: c.tx_hash,
      receiptUrl: c.basescan_url,
      atLabel: c.onchain.timestamp_wat.split(", ")[1],
      provenance: "replay",
      score: c.reppo?.score100,
      verdict: c.reppo?.decision === "accept" ? "accept" : c.reppo?.decision === "reject" ? "reject" : undefined,
      gateSource: c.reppo ? "reppo" : undefined,
    });

    steps.push({
      id: nextId(),
      kind: "fetch",
      status: "done",
      title: `Data received · ${c.reply.source_count} sources`,
      detail: `Otto AI filtered news for “${c.topic}”. ${c.reply.note}`,
    });

    if (c.reppo) {
      const r = c.reppo;
      const vs = r.score100 < r.pass_mark ? `below ${r.pass_mark}` : `above ${r.pass_mark}`;
      steps.push({
        id: nextId(),
        kind: "gate",
        status: r.decision === "reject" ? "blocked" : "done",
        title: `Reppo · ${r.decision} ${r.score100}/100${r.route ? ` / ${r.route}` : ""}`,
        detail: `${r.note} ${r.score100}/100, ${vs}, ${r.settled === "during_call" ? "returned during the request" : "settled after the call"}${r.evalId ? ` · eval ${r.evalId}` : ""}. Does not undo the payment.`,
      });
    }
  }

  const d = declinedCall as DeclinedCall | undefined;
  if (d) {
    const price = Number(caps.max_amount_per_tx);
    if (d.topic_rationale) {
      steps.push({
        id: nextId(),
        kind: "reason",
        status: "done",
        title: `SERV chose topic “${d.topic}”`,
        detail: d.topic_rationale,
      });
    }
    steps.push({
      id: nextId(),
      kind: "quote",
      status: "done",
      title: `x402 quote · Otto AI · “${d.topic}”`,
      detail: `402 Payment Required — ${d.method} ${d.url} · recorded`,
      amount: price,
    });
    if (d.serv) {
      steps.push({
        id: nextId(),
        kind: "reason",
        status: "done",
        title: `Buy this call for $${usdc(price)}?`,
        detail: `${d.serv.rationale} (SERV · ${d.serv.decision})`,
      });
    }
    steps.push({
      id: nextId(),
      kind: "check",
      status: "blocked",
      title: "Kite Passport limits",
      checks: capChecks(spent, price, false),
    });
    steps.push({
      id: nextId(),
      kind: "decline",
      status: "blocked",
      title: `Kite Passport refused · ${d.error_code}`,
      detail: `${d.error}. ${d.user_message} This is the recorded refusal (call 3 retake). No money moves.`,
      amount: price,
      provenance: "replay",
    });
    audit.push({
      runId: opts.runId,
      runLabel: opts.runLabel,
      service: `Otto AI · filtered news “${d.topic}”`,
      decision: "decline",
      amount: price,
      charged: 0,
      remaining: 0,
      reason: `${d.serv ? `SERV ${d.serv.decision}: ${d.serv.rationale} ` : ""}${d.declined_by} declined: ${d.error_code} — ${d.error}. Nothing was signed and no money moved.`,
      atLabel: d.attempted_at_wat?.split(", ")[1],
      provenance: "replay",
    });
  }

  steps.push({
    id: nextId(),
    kind: "draft",
    status: "done",
    title: "Drafting the brief",
    detail: "Built from the two paid, recorded excerpts. Call 3 was refused, so nothing from that call is included.",
  });

  const topics = VERIFIED_RUN.calls.map((c) => c.topic).filter(Boolean).join(" → ");

  const run: Run = {
    id: opts.runId,
    label: opts.runLabel,
    question: matched ? recordedQuestion() : opts.question,
    topic: topics,
    topicSource: "serv",
    topicRationale: "SERV chose a short Otto topic for each call in the recorded run.",
    steps,
    status: "done",
    answer: paidAnswer(),
    replayLabel: REPLAY_BANNER,
    replayNote: matched
      ? undefined
      : "This demo always replays the recorded 12 Nov 19:38 WAT example. It is not a live answer to your question.",
  };

  return { run, audit, session: { spent: cap, remaining: 0 } };
}

