/**
 * x402 pay-per-call client.
 *
 * Official Kite signal repos / docs:
 * - https://docs.gokite.ai/passport/payments (session execute pays x402)
 * - https://docs.gokite.ai/passport/seller (402 → PAYMENT-REQUIRED → settle)
 * - Priority repos: kite-x402-hono, kite-x402-explorer, kite-x402-axum, kite_counter_dapp
 * - Official test endpoint: https://x402.dev.gokite.ai/api/weather?location=San%20Francisco
 *
 * Centiv's research use case is ETH funding history. There is no public
 * funding x402 catalogue endpoint that works without a funded Passport wallet,
 * so we:
 * 1. Quote against our local research catalogue (prices mirror the demo scenes), OR
 * 2. Probe X402_DATA_URL for a real 402 PAYMENT-REQUIRED header when set, OR
 *
 * Public runs (/api/run) ALWAYS settle as Simulated: no funds move and the
 * receipt is a `sim_`-prefixed id that can never pass for an on-chain hash.
 * Real payments happen only through the owner-gated local route /api/live
 * (see src/lib/server/live.ts), never from a visitor's request.
 */

import { randomBytes } from "node:crypto";
import type { Candidate, Scenario } from "@/lib/centiv";
import { SCENARIOS } from "@/lib/centiv";

export type X402Quote = {
  service: string;
  endpoint: string;
  price: number;
  currency: "USDC";
  source: "catalogue" | "payment-required" | "simulated";
  url?: string;
  rawAccepts?: unknown;
};

export type X402PayResult = {
  ok: boolean;
  receipt?: string;
  payload?: unknown;
  yields?: string;
  source: "simulated";
  error?: string;
};

function decodePaymentRequired(header: string | null): { amountUsdc?: number; raw?: unknown } {
  if (!header) return {};
  try {
    const json = Buffer.from(header, "base64").toString("utf8");
    const parsed = JSON.parse(json) as {
      accepts?: { amount?: string; extra?: { name?: string } }[];
    };
    const accept = parsed.accepts?.[0];
    if (!accept?.amount) return { raw: parsed };
    // amount is atomic USDC (6 decimals)
    const atomic = Number(accept.amount);
    if (!Number.isFinite(atomic)) return { raw: parsed };
    return { amountUsdc: atomic / 1_000_000, raw: parsed };
  } catch {
    return {};
  }
}

/** Map scenario candidates (research catalogue). */
export function catalogueCandidates(key: Scenario["key"]): Candidate[] {
  return SCENARIOS[key].candidates;
}

export async function quoteCandidate(c: Candidate): Promise<X402Quote> {
  const upstream = process.env.X402_DATA_URL?.trim();
  // Only probe upstream for the primary (high-value) call when configured.
  if (upstream && c.value === "high") {
    try {
      const res = await fetch(upstream, {
        method: "GET",
        headers: { Accept: "application/json" },
        redirect: "manual",
        signal: AbortSignal.timeout(12_000),
      });
      if (res.status === 402) {
        const header =
          res.headers.get("PAYMENT-REQUIRED") ||
          res.headers.get("payment-required") ||
          res.headers.get("X-Payment-Required");
        const decoded = decodePaymentRequired(header);
        const price = decoded.amountUsdc && decoded.amountUsdc > 0 ? decoded.amountUsdc : c.price;
        return {
          service: c.service,
          endpoint: c.endpoint,
          price: +price.toFixed(6),
          currency: "USDC",
          source: "payment-required",
          url: upstream,
          rawAccepts: decoded.raw,
        };
      }
    } catch (e) {
      console.error("x402 upstream quote failed", e);
    }
  }

  return {
    service: c.service,
    endpoint: c.endpoint,
    price: c.price,
    currency: "USDC",
    source: process.env.SERV_API_KEY || process.env.REPPO_API_KEY ? "catalogue" : "simulated",
    url: upstream,
  };
}

function mockFundingPayload() {
  return {
    asset: "ETH",
    window: "7d",
    venues: ["A", "B", "C", "D"],
    note: "Simulated funding rows for Centiv demo — not live venue data.",
    series: [
      { t: "t-7d", avg: 0.011 },
      { t: "t-3d", avg: 0.006 },
      { t: "t-0", avg: 0.002 },
    ],
    negatives: { B: 3, D: 3 },
  };
}

function mockDepthPayload() {
  return {
    asset: "ETH",
    resolution: "1m",
    note: "Simulated depth snapshots for Centiv demo — not live venue data.",
    askDepthChangePct: { B: -22, D: -22, A: 0, C: 0 },
  };
}

export async function payForData(opts: {
  candidate: Candidate;
  quote: X402Quote;
  scenarioKey: Scenario["key"];
}): Promise<X402PayResult> {
  // Public path: simulated settlement under the Passport session ledger
  // (the cap check itself is real). Payload and receipt are labelled.
  const payload = opts.scenarioKey === "depth" ? mockDepthPayload() : mockFundingPayload();
  const receipt = `sim_${randomBytes(8).toString("hex")}`;
  return {
    ok: true,
    source: "simulated",
    receipt,
    payload,
    yields: opts.candidate.yields || (opts.scenarioKey === "depth" ? "Depth snapshots (demo catalogue)" : "84 rows · 4 venues × 21 funding intervals"),
  };
}
