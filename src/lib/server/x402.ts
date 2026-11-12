/**
 * x402 pay-per-call client.
 *
 * Official Kite signal repos / docs:
 * - https://docs.gokite.ai/passport/payments (session execute pays x402)
 * - https://docs.gokite.ai/passport/seller (402 → PAYMENT-REQUIRED → settle)
 * - Priority repos: kite-x402-hono, kite-x402-explorer, kite-x402-axum, kite_counter_dapp
 * - Official test endpoint: https://x402.dev.gokite.ai/api/weather?location=San%20Francisco
 *
 * The public-demo catalogue mirrors the recorded Otto Ethereum ETF run (12 Nov 2026, 18:27 WAT).
 * Real payments happen only through the owner-gated local route /api/live,
 * never from a visitor's request. Public runs always settle as Simulated.
 *
 * We still:
 * 1. Quote against the local research catalogue (prices match the recorded run), OR
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

function mockOttoPayload(topic: string) {
  const recorded = topic.trim().toLowerCase() === "ethereum etf";
  if (recorded) {
    return {
      provider: "Otto AI",
      topic,
      source_count: 180,
      note: "Simulated payment — no funds moved. Wording is from Otto AI’s paid reply in the recorded run of 12 Nov 2026, 18:27 WAT, published in the evidence file.",
      excerpt:
        "Ethereum ETF coverage is plentiful, so this is a direct analysis of the most important current developments. The dominant theme right now is persistent institutional outflow from spot ETH ETFs. Lookonchain shows ETH ETFs bleeding $132.41M in a single day (Nov 12) and $422.51M over seven days, with Cointelegraph confirming continued net outflows across BTC, ETH, and XRP products.",
    };
  }
  return {
    provider: "Otto AI",
    topic,
    source_count: 0,
    note: "Simulated payment — no funds moved. This is not a real Otto AI briefing for this topic.",
    excerpt: `In the public demo, payments are simulated, so Centiv does not buy a live briefing for “${topic}”. A live run would pay Otto AI for filtered news on that topic, inside the Kite Passport cap.`,
  };
}

export async function payForData(opts: {
  candidate: Candidate;
  quote: X402Quote;
  scenarioKey: Scenario["key"];
  topic?: string;
}): Promise<X402PayResult> {
  void opts.scenarioKey;
  const topic = (opts.topic || "ethereum etf").trim();
  // Public path: simulated settlement. Payload and receipt are labelled.
  const receipt = `sim_${randomBytes(8).toString("hex")}`;
  return {
    ok: true,
    source: "simulated",
    receipt,
    payload: mockOttoPayload(topic),
    yields: opts.candidate.yields || `Otto AI filtered news for “${topic}”. Demo payment is simulated.`,
  };
}
