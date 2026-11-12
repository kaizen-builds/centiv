// Public, sanitised evidence of Centiv's real Kite Passport-capped x402 run.
// Source of truth: src/data/verified-run.json (mirrored in /evidence).
// Contains no keys, tokens or session secrets — only public on-chain facts.
// Featured run: 12 Nov 2026, 18:27 WAT, Ethereum ETFs. SERV weighed each call
// before payment; Reppo scored paid excerpts after the fact and did not block
// or undo a payment. The earlier 01:11 WAT run is archived in evidence/.

import data from "@/data/verified-run.json";
import type { AuditRow, Decision } from "@/lib/centiv";

export type Provenance = "live" | "simulated" | "replay";

type OnChain = {
  status: string;
  block: number;
  confirmations_at_check: number;
  timestamp_utc: string;
  timestamp_wat: string;
  tx_sender: string;
  tx_sender_note: string;
  tx_to: string;
  method: string;
  usdc_transfer: { token: string; from: string; to: string; amount_raw: number; amount_usdc: number };
  authorization_used_log: boolean;
};

export type ServVerdict = {
  decision: Decision;
  source: "serv" | "heuristic";
  rationale: string;
};

export type ReppoAfterTheFact = {
  source: "reppo";
  score100: number;
  decision?: string;
  route?: string;
  confidence?: string;
  evalId?: string;
  pass_mark: number;
  settled: "during_call" | "after_the_call";
  note: string;
};

export type PaidCall = {
  n: number;
  topic: string;
  url: string;
  method: string;
  outcome: "paid";
  price_usdc: string;
  network: string;
  payer: string;
  tx_hash: string;
  basescan_url: string;
  blockscout_url?: string;
  session_spent_after_usdc: string;
  paid_despite_serv_skip?: boolean;
  serv?: ServVerdict;
  reppo?: ReppoAfterTheFact;
  onchain: OnChain;
  reply: { provider: string; attribution: string; source_count: number; excerpt: string[]; note: string };
};

export type DeclinedCall = {
  n: number;
  topic: string;
  url: string;
  method: string;
  outcome: "declined";
  declined_by: string;
  error_code: string;
  error: string;
  user_message: string;
  money_moved: false;
  tx_hash: null;
  note: string;
  attempted_at_utc?: string;
  attempted_at_wat?: string;
  serv?: ServVerdict;
};

export type VerifiedRun = {
  label: string;
  generated_at_utc: string;
  question?: string;
  honesty?: string;
  passport: {
    environment: string;
    session_id: string;
    session_type?: string;
    request_id?: string;
    expires_at_utc: string;
    expires_at_wat: string;
    caps: { currency: string; max_amount_per_tx: string; max_total_amount: string; ttl_seconds?: number };
    scope: { mode: string; method: string; host: string; path_prefix: string };
    task_summary?: string;
    wallet: string;
    wallet_type?: string;
    usage_after: { spent_total_usdc: string };
  };
  merchant: { name: string; endpoint: string; pay_to: string };
  settlement: { chain: string; caip2: string; asset: string; asset_contract: string; note: string };
  calls: (PaidCall | DeclinedCall)[];
  verification: { rpc: string; checked_at_utc: string; method: string; chain_head_at_check?: number };
};

export const VERIFIED_RUN = data as unknown as VerifiedRun;

export const paidCalls = VERIFIED_RUN.calls.filter((c): c is PaidCall => c.outcome === "paid");
export const declinedCall = VERIFIED_RUN.calls.find((c): c is DeclinedCall => c.outcome === "declined");

export const basescanAddress = (a: string) => `https://basescan.org/address/${a}`;

/** Audit-trail rows for the real run, tagged Replay. Amounts are the real on-chain figures. */
export function replayAuditRows(): AuditRow[] {
  const cap = Number(VERIFIED_RUN.passport.caps.max_total_amount);
  const rows: AuditRow[] = paidCalls.map((c) => {
    const servLine = c.serv ? `SERV ${c.serv.decision}: ${c.serv.rationale}` : "";
    const reppoLine =
      c.reppo
        ? `Reppo ${c.reppo.score100}/100 after the fact` +
          (c.reppo.settled === "after_the_call" ? " (settled after the call)" : "") +
          `. Does not undo the payment.`
        : "";
    const skipNote = c.paid_despite_serv_skip
      ? " SERV flagged it, the agent paid anyway — Kite Passport is the hard limit."
      : "";
    return {
      id: `replay_${c.n}`,
      runId: "replay",
      runLabel: "V",
      at: Date.parse(c.onchain.timestamp_utc),
      atLabel: c.onchain.timestamp_wat.split(", ")[1],
      service: `Otto AI · filtered news “${c.topic}”`,
      decision: "spend" as const,
      amount: c.onchain.usdc_transfer.amount_usdc,
      charged: c.onchain.usdc_transfer.amount_usdc,
      remaining: +(cap - Number(c.session_spent_after_usdc)).toFixed(6),
      reason: `${servLine}${skipNote} Paid via Kite Passport session · confirmed in Base block ${c.onchain.block.toLocaleString("en-GB")}.${reppoLine ? " " + reppoLine : ""}`,
      receipt: c.tx_hash,
      receiptUrl: c.basescan_url,
      provenance: "replay",
    };
  });
  if (declinedCall) {
    const servLine = declinedCall.serv ? `SERV ${declinedCall.serv.decision}: ${declinedCall.serv.rationale} ` : "";
    rows.push({
      id: `replay_${declinedCall.n}`,
      runId: "replay",
      runLabel: "V",
      at: rows.length ? rows[rows.length - 1].at + 1000 : 0,
      atLabel: declinedCall.attempted_at_wat?.split(", ")[1] ?? "just after",
      service: `Otto AI · filtered news “${declinedCall.topic}”`,
      decision: "decline",
      amount: Number(VERIFIED_RUN.passport.caps.max_amount_per_tx),
      charged: 0,
      remaining: 0,
      reason: `${servLine}${declinedCall.declined_by} declined: ${declinedCall.error_code} — ${declinedCall.error}. Nothing was signed and no money moved.`,
      provenance: "replay",
    });
  }
  return rows;
}
