// Centiv shared types, catalogue scenarios, and helpers.
// Live orchestration lives in src/lib/server/* and /api/*.
// Shared types and helpers. The public demo is a replay of the recorded run
// (see recorded-replay.ts and verified-run.json). No money moves on that path.

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
  name: "Centiv research agent",
  did: "simulated",
  owner: "Passkey · this device (simulated in the public app)",
  network: "Kite Passport session · simulated here",
  fingerprint: "",
};

/** Matches the recorded run: $0.001 per call, $0.002 total. */
export const DEFAULT_SESSION: SessionConfig = { budget: 0.002, perTx: 0.001, windowMin: 30 };

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
  receiptUrl?: string;
  provenance?: "live" | "simulated" | "replay";
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
  /** Short Otto topic chosen from the question. Absent on older recorded shapes. */
  topic?: string;
  topicSource?: "serv" | "fallback" | "direct";
  topicRationale?: string;
  steps: Step[];
  status: "running" | "done";
  gate?: GateResult;
  answer?: Answer;
  /** Banner on the public demo when this run is a replay of the recorded proof. */
  replayLabel?: string;
  replayNote?: string;
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
  key: "eth-news";
  question: string;
  candidates: Candidate[];
  outcomes: {
    full: { gate: GateResult; answer: Answer };
    partial: { gate: GateResult; answer: Answer };
  };
}

const OTTO_ENDPOINT = "GET https://x402.ottoai.services/filtered-news?topic=ethereum%20etf";
const OTTO_SERVICE = "Otto AI · Ethereum ETF news";
const OTTO_YIELDS = "Otto AI ETH ETF briefing · 180 sources. Wording from the recorded run of 12 Nov 2026, 18:27 WAT. Demo payment is simulated.";

const ottoCall = (rationale: string): Candidate => ({
  service: OTTO_SERVICE,
  endpoint: OTTO_ENDPOINT,
  price: 0.001,
  value: "high",
  rationale,
  yields: OTTO_YIELDS,
});

const ottoAnswer: Answer = {
  headline: "Otto AI’s briefing: persistent outflows from spot Ethereum ETFs.",
  points: [
    "Otto AI (180 sources, 12 Nov 2026) said the dominant theme was persistent institutional outflow from spot ETH ETFs, with Lookonchain showing $132.41M leaving in a single day (12 Nov) and $422.51M over seven days, and Cointelegraph confirming continued net outflows across BTC, ETH and XRP products.",
    "The same briefing said a brief relief on 10 Nov, when ETH outflows shrank to $1.3M, was erased the next session with $144.8M leaving, and cited BlackRock-related ETF selling alongside ETH breaking below $2,000.",
    "Those figures are Otto AI’s, not independently verified by Centiv. In this public demo the payments are simulated; the wording is from the recorded run.",
  ],
  sources: "Otto AI /filtered-news?topic=ethereum etf, wording from the recorded run of 12 Nov 2026, 18:27 WAT. Claims are Otto AI’s. Demo payments are simulated.",
};

// The engine runs evaluateDraft for the gate; these placeholders are unused on screen.
const unusedGate = (note: string): GateResult => ({
  verdict: "accept",
  score: 0,
  note,
  source: "heuristic",
});

export const SCENARIOS: Record<Scenario["key"], Scenario> = {
  "eth-news": {
    key: "eth-news",
    question: "Is anything big happening with Ethereum ETFs this week?",
    candidates: [
      ottoCall("The question is about Ethereum now, and this is the primary paid briefing — worth the $0.001 inside the cap."),
      ottoCall("A second call at $0.001 still fits the $0.002 total, as in the recorded run."),
      ottoCall("A third call would be another $0.001 for the same endpoint. The $0.002 cap is already spent, so Kite Passport should refuse it."),
    ],
    outcomes: {
      full: {
        gate: unusedGate("Placeholder. The engine scores the draft separately."),
        answer: {
          ...ottoAnswer,
          points: [
            ...ottoAnswer.points.slice(0, 2),
            "Those figures are Otto AI’s, not independently verified by Centiv. In this public demo the payments are simulated; the wording is from the recorded run. All requested calls fitted the session, which is not what happened on the recorded run (the third call was refused).",
          ],
        },
      },
      partial: {
        gate: unusedGate("Placeholder. The engine scores the draft separately."),
        answer: {
          ...ottoAnswer,
          points: [
            ...ottoAnswer.points.slice(0, 2),
            "A third call for the same endpoint was not bought once the $0.002 cap was spent. Those figures are Otto AI’s, not independently verified by Centiv. In this public demo the payments are simulated; the wording is from the recorded run.",
          ],
        },
      },
    },
  },
};

export function pickScenario(_question: string): Scenario {
  return SCENARIOS["eth-news"];
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
