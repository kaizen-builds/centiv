/**
 * Detect which integrations can run live from env (no secrets leaked to clients).
 * Keys stay server-side; the browser only sees booleans via /api/status.
 */

import { VERIFIED_RUN, declinedCall, paidCalls } from "@/lib/verified-run";
import { liveGate } from "./live";

export type IntegrationFlags = {
  serv: boolean;
  reppo: boolean;
  /** Passport session + mid-task cap enforcement always runs locally for public runs. */
  passport: "local";
  /** x402 quote source for leftover catalogue paths; the public demo is a recorded replay. */
  x402: "local" | "upstream";
};

export type EngineMode = "simulated" | "hybrid" | "live";

export function readFlags(): IntegrationFlags {
  return {
    serv: Boolean(process.env.SERV_API_KEY?.trim()),
    reppo: Boolean(process.env.REPPO_API_KEY?.trim()),
    passport: "local",
    x402: process.env.X402_DATA_URL?.trim() ? "upstream" : "local",
  };
}

/** Public runs never pay for real, so they are never "live" end to end. */
export function engineMode(flags: IntegrationFlags = readFlags()): EngineMode {
  return flags.serv || flags.reppo ? "hybrid" : "simulated";
}

export function publicStatus() {
  const flags = readFlags();
  const mode = engineMode(flags);
  const live = liveGate();
  return {
    mode,
    integrations: {
      serv: flags.serv ? "live" : "simulated",
      reppo: flags.reppo ? "live" : "simulated",
      passport: "local-enforced",
      x402: flags.x402,
    },
    payments: {
      public: "replay",
      receipts: "The public demo replays the recorded 12 Nov 19:38 WAT run. Real transaction links are marked recorded. No money moves.",
    },
    replay: {
      available: true,
      label: VERIFIED_RUN.label,
      session_id: VERIFIED_RUN.passport.session_id,
      settlement: VERIFIED_RUN.settlement.caip2,
      paid_calls: paidCalls.length,
      declined_calls: declinedCall ? 1 : 0,
      decline_code: declinedCall?.error_code ?? null,
      tx: paidCalls.map((c) => ({ hash: c.tx_hash, basescan: c.basescan_url })),
      evidence: "/api/evidence",
      section: "/#verified-run",
      note: "SERV Reasoning chose a short topic and weighed each call before payment. Reppo scored paid excerpts after the fact and did not block or undo a payment. The featured call 3 refusal is the retake in the same session.",
    },
    live_demo: {
      enabled: live.enabled,
      reason: live.reason,
      scope: "Owner-only, on a local machine with kpass and an approved Kite Passport session.",
    },
    note:
      mode === "simulated"
        ? "The public demo replays the recorded 12 Nov 19:38 WAT run. Transaction links are real and marked recorded. No money moves."
        : "SERV reasoning is live where configured on the owner live path. The public demo is a replay of the recorded 12 Nov 19:38 WAT run. No money moves.",
  };
}
