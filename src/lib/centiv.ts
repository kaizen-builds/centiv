// Centiv shared types, catalogue scenarios, and helpers.
// Live orchestration lives in src/lib/server/* and /api/*.
// Scenarios remain the research use-case catalogue (funding / depth) and the
// simulated fallback when API keys are absent.

export type Decision = "spend" | "skip" | "decline";
export type Verdict = "accept" | "revise" | "reject";
export type GateSource = "reppo" | "heuristic";

export interface SessionConfig {
  budget: number; // USDC
  perTx: number; // USDC
  windowMin: number;
}

export type SessionStatus = "draft" | "approving" | "active" | "expired";

export interface Session extends SessionConfig {
  status: SessionStatus;
  id: string;
  approvedAt?: number;
}

export interface AgentIdentity {
  name: string;
  did: string;
  owner: string;
  network: string;
  fingerprint: string;
}

export const AGENT: AgentIdentity = {
  name: "centiv-research-01",
  did: "did:kite:0x7f3a9c2e41b8d05c6e19a7f2b3d4c91e",
  owner: "Passkey · this device",
  network: "Kite · USDC.e (Passport session)",
  fingerprint: "7F3A 9C2E · 41B8 D05C",
};

export const DEFAULT_SESSION: SessionConfig = { budget: 0.5, perTx: 0.2, windowMin: 30 };

export interface Candidate {
  service: string;
  endpoint: string;
  price: number;
  value: "high" | "low";
  rationale: string; // SERV Reasoning's justification
  yields: string; // what comes back if bought
}

export type StepKind = "reason" | "quote" | "check" | "pay" | "skip" | "decline" | "fetch" | "draft" | "gate" | "answer";
export type StepStatus = "active" | "done" | "blocked" | "skipped";

export interface Check {
  label: string;
  ok: boolean;
  detail: string;
}

export interface Step {
  id: string;
  kind: StepKind;
  title: string;
  detail?: string;
  status: StepStatus;
  amount?: number;
  checks?: Check[];
  receipt?: string;
}

export interface Answer {
  headline: string;
  points: string[];
  sources: string;
}

export interface GateResult {
  verdict: Verdict;
  score: number;
  note: string;
  source?: GateSource;
}

export interface Run {
  id: string;
  label: string;
  question: string;
  steps: Step[];
  status: "running" | "done";
  gate?: GateResult;
  answer?: Answer;
}

export interface AuditRow {
  id: string;
  runId: string;
  runLabel: string;
  at: number;
  service: string;
  decision: Decision;
  amount: number; // quoted price
  charged: number; // actually paid
  remaining: number;
  reason: string;
  receipt?: string;
  /** Link to a public explorer — only ever set for real (Live / Replay) receipts. */
  receiptUrl?: string;
  /** Overrides the local clock (e.g. a WAT-labelled on-chain time). */
  atLabel?: string;
  /** Where this row came from: a real live payment, a simulated one, or a replay of a real run. */
  provenance?: "live" | "simulated" | "replay";
  score?: number;
  verdict?: Verdict;
  gateSource?: GateSource;
}

export interface Scenario {
  key: "funding" | "depth";
  question: string;
  candidates: Candidate[];
  outcomes: {
    full: { gate: GateResult; answer: Answer };
    partial: { gate: GateResult; answer: Answer };
  };
}

export const SCENARIOS: Record<Scenario["key"], Scenario> = {
  funding: {
    key: "funding",
    question:
      "Are ETH perpetual funding rates turning negative across the major venues this week? I need a short, data-backed brief.",
    candidates: [
      {
        service: "Perp funding history · 7d",
        endpoint: "GET /v1/funding?asset=ETH&venues=4&window=7d",
        price: 0.18,
        value: "high",
        rationale:
          "Cached rates are 3 days old and the question is about this week. Fresh 7-day funding across four venues is the core evidence — without it the brief is a guess.",
        yields: "84 rows · 4 venues × 21 funding intervals",
      },
      {
        service: "Social sentiment scrape",
        endpoint: "POST /v1/scrape?topic=ETH%20funding&window=24h",
        price: 0.12,
        value: "low",
        rationale:
          "Sentiment would mostly restate what funding already shows. Spending 38% of what's left on it isn't justified.",
        yields: "",
      },
    ],
    outcomes: {
      full: {
        gate: {
          verdict: "accept",
          score: 0.78,
          note: "Every claim traces to purchased rows. No forecast stated as fact.",
        source: "heuristic",
        },
        answer: {
          headline: "Funding is cooling, not yet negative.",
          points: [
            "Average 8-hour ETH funding fell from 0.011% to 0.002% over seven days across all four venues.",
            "Venues B and D printed negative for three consecutive intervals on Sunday; both flipped back within 24 hours.",
            "No venue has stayed negative for a full day, so the long unwind looks partial rather than complete.",
          ],
          sources: "Perp funding history · 7d (paid 0.18 USDC). Skipped: social sentiment.",
        },
      },
      partial: {
        gate: {
          verdict: "reject",
          score: 0.31,
          note: "No fresh data was bought; the draft relies on 3-day-old cache.",
        source: "heuristic",
        },
        answer: {
          headline: "Not enough fresh data to answer.",
          points: [
            "Centiv could not buy funding history inside your current limits.",
            "Raise the per-call cap or approve a new session, then ask again.",
          ],
          sources: "No paid sources used.",
        },
      },
    },
  },
  depth: {
    key: "depth",
    question:
      "Now add 1-minute order-book depth for the same venues so I can see whether shorts are getting crowded.",
    candidates: [
      {
        service: "Order-book depth · 1-min",
        endpoint: "GET /v1/depth?asset=ETH&venues=4&res=1m&window=24h",
        price: 0.35,
        value: "high",
        rationale:
          "Depth at 1-minute resolution is the only direct evidence of crowding. High value — but it has to fit your limits.",
        yields: "5,760 snapshots · 4 venues × 1,440 minutes",
      },
    ],
    outcomes: {
      full: {
        gate: {
          verdict: "accept",
          score: 0.82,
          note: "Depth figures match purchased snapshots; crowding claim is hedged correctly.",
        source: "heuristic",
        },
        answer: {
          headline: "Short-side depth is thinning on two venues.",
          points: [
            "Ask depth within 1% of mid fell 22% on Venues B and D over 24 hours while funding dipped negative.",
            "Venues A and C are flat, so crowding is concentrated rather than market-wide.",
          ],
          sources: "Order-book depth · 1-min (paid 0.35 USDC) + earlier funding history.",
        },
      },
      partial: {
        gate: {
          verdict: "revise",
          score: 0.64,
          note: "First draft implied depth evidence it didn't have. Revised to state the gap plainly.",
        source: "heuristic",
        },
        answer: {
          headline: "Shorts don't look crowded yet — but this answer is partial.",
          points: [
            "Order-book depth was not bought: 0.35 USDC is above your 0.20 per-call cap and your 0.32 remaining.",
            "From funding alone: two brief negative runs, no sustained sign of short crowding.",
            "To finish the picture, raise the per-call cap to 0.35 USDC or approve a fresh session.",
          ],
          sources: "Reused: Perp funding history · 7d. Declined: order-book depth (cap).",
        },
      },
    },
  },
};

export function pickScenario(question: string): Scenario {
  return /depth|order.?book|crowd/i.test(question) ? SCENARIOS.depth : SCENARIOS.funding;
}

let seed = 0x5eed;
function rand() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
/** Simulated receipt id. Always `sim_`-prefixed so it can never pass for an on-chain hash. */
export function mockReceipt(len = 16) {
  const hex = "0123456789abcdef";
  let s = "sim_";
  for (let i = 0; i < len; i++) s += hex[Math.floor(rand() * 16)];
  return s;
}
export function resetSeed() {
  seed = 0x5eed;
}

export const isSimReceipt = (r?: string) => Boolean(r && r.startsWith("sim_"));

/** Two decimals normally; three for sub-cent amounts so $0.001 never reads as $0.00. */
export const usdc = (n: number) => (n !== 0 && Math.abs(n) < 0.01 ? n.toFixed(3) : n.toFixed(2));
export const shortHash = (h: string) => (h.startsWith("sim_") ? `${h.slice(0, 8)}…${h.slice(-3)}` : `${h.slice(0, 6)}…${h.slice(-4)}`);
export const clock = (t: number) =>
  new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
