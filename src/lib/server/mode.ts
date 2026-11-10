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
  /** x402 quote source for public runs; payment is always simulated there. */
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
      public: "simulated",
      receipts: "Public runs issue sim_-prefixed receipts. No funds move.",
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
    },
    live_demo: {
      enabled: live.enabled,
      reason: live.reason,
      scope: "Owner-only, on a local machine with kpass and an approved Passport session.",
    },
    note:
      mode === "simulated"
        ? "No API keys configured — reasoning, gate and payments are simulated. Figures are not live market data."
        : "SERV reasoning is live where configured; payments on this site are Simulated. A real Passport-capped run is available as a Replay.",
  };
}
