// Public, sanitised evidence of a real Reppo Evaluation API check.
// Source of truth: src/data/reppo-eval.json (mirrored in /evidence).
// Contains no API keys or secrets.

import data from "@/data/reppo-eval.json";

export type RecordedReppoEval = {
  label: string;
  evidence_path: string;
  console_url: string;
  reppo_public_url: string | null;
  evaluated_at_utc: string;
  evaluated_at_wat: string;
  brief: {
    question: string;
    headline: string;
    points: string[];
    sources: string;
  };
  verdict: {
    eval_id: string;
    status: string;
    score: number;
    scale: string;
    decision: "accept" | "reject" | string;
    route: "ship" | "review" | "block" | string;
    confidence: string;
    reason: string;
    rubric_scores: Record<string, number>;
    credits_charged: number;
    route_reasons: string[];
  };
};

export const RECORDED_REPPO = data as unknown as RecordedReppoEval;
export const RECORDED_REPPO_SCORE01 = +(RECORDED_REPPO.verdict.score / 100).toFixed(2);
