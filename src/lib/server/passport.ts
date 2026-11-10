/**
 * Kite Passport spending session — budget, per-tx cap, TTL, USDC.e.
 *
 * Official path today is the kpass CLI (no public HTTP API yet):
 * https://docs.gokite.ai/passport
 * https://docs.gokite.ai/reference/kpass-cli
 * https://docs.gokite.ai/passport/payments
 *
 * Centiv always enforces caps mid-task before any sign/pay.
 * Public sessions here are local ledgers; real payments only go through the
 * owner-gated local route (src/lib/server/live.ts → `kpass session execute`).
 */

import type { Check, SessionConfig } from "@/lib/centiv";

export type PassportSession = SessionConfig & {
  id: string;
  status: "active";
  approvedAt: number;
  spent: number;
  asset: "USDC.e";
  network: string;
  backend: "local" | "kpass";
};

export function createLocalSession(cfg: SessionConfig): PassportSession {
  const id = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    ...cfg,
    id,
    status: "active",
    approvedAt: Date.now(),
    spent: 0,
    asset: "USDC.e",
    network: process.env.KITE_NETWORK?.trim() || "Kite (Passport session)",
    backend: "local",
  };
}

export function remaining(s: Pick<PassportSession, "budget" | "spent">): number {
  return +(s.budget - s.spent).toFixed(6);
}

export function minutesLeft(s: Pick<PassportSession, "approvedAt" | "windowMin">, now = Date.now()): number {
  const ms = s.approvedAt + s.windowMin * 60_000 - now;
  return Math.ceil(ms / 60_000);
}

export function checkLimits(
  s: Pick<PassportSession, "budget" | "spent" | "perTx" | "approvedAt" | "windowMin">,
  price: number,
  now = Date.now(),
): { ok: boolean; checks: Check[]; remaining: number } {
  const left = remaining(s);
  const mins = minutesLeft(s, now);
  const checks: Check[] = [
    {
      label: "Per-call cap",
      ok: price <= s.perTx,
      detail: `${price.toFixed(2)} ${price <= s.perTx ? "≤" : ">"} ${s.perTx.toFixed(2)}`,
    },
    {
      label: "Session budget left",
      ok: price <= left,
      detail: `${price.toFixed(2)} ${price <= left ? "≤" : ">"} ${left.toFixed(2)}`,
    },
    {
      label: "Time window",
      ok: mins > 0,
      detail: mins > 0 ? `${mins} min left` : "expired",
    },
  ];
  return { ok: checks.every((c) => c.ok), checks, remaining: left };
}

/** Refuse to sign if any Passport limit would break. */
export function assertCanSpend(s: PassportSession, price: number): void {
  const { ok, checks } = checkLimits(s, price);
  if (!ok) {
    const bad = checks.filter((c) => !c.ok).map((c) => c.label).join(", ");
    throw new Error(`Passport declined before signing: ${bad}`);
  }
}

export function recordSpend(s: PassportSession, price: number): PassportSession {
  assertCanSpend(s, price);
  return { ...s, spent: +(s.spent + price).toFixed(6) };
}
