/**
 * Reppo Evaluation API (live shape from https://eval.reppo.xyz/agents.md).
 *
 * Note: Mintlify docs still mention the deprecated /eval-requests/* settlement-window
 * API. The live router uses:
 *   POST https://eval.reppo.xyz/api/v1/agents/evals
 *   GET  https://eval.reppo.xyz/api/v1/agents/evals/{id}
 *
 * Results are usually ready in 30–90s. We poll briefly for the demo; if still
 * pending we return a "pending" gate and keep the evalId for the audit trail.
 * Never send private data — only the public brief draft.
 */

import type { Answer, GateResult, Verdict } from "@/lib/centiv";

const BASE = process.env.REPPO_BASE_URL?.trim() || "https://eval.reppo.xyz/api/v1";

export type ReppoGate = GateResult & {
  source: "reppo" | "heuristic";
  evalId?: string;
  confidence?: string;
  route?: string;
  pending?: boolean;
};

/** Independent Reppo score of a paid live excerpt. Never invents a numeric score. */
export type LiveReppoScore = {
  source: "reppo" | "unconfigured" | "error" | "pending";
  /** 0–100 when Reppo completed. Omitted if unconfigured, failed, or still settling. */
  score100?: number;
  decision?: string;
  route?: string;
  confidence?: string;
  reason?: string;
  evalId?: string;
  note: string;
};

export function reppoConfigured(): boolean {
  return Boolean(process.env.REPPO_API_KEY?.trim());
}

function mapRoute(route?: string, decision?: string): Verdict {
  if (route === "ship" || decision === "accept") return "accept";
  if (route === "block" || decision === "reject") return "reject";
  return "revise";
}

function heuristic(answer: Answer, gotAllHigh: boolean): ReppoGate {
  if (gotAllHigh) {
    return {
      verdict: "accept",
      score: 0.78,
      note: "Heuristic gate (no REPPO_API_KEY): every claim traces to purchased rows.",
      source: "heuristic",
    };
  }
  if (answer.headline.toLowerCase().includes("not enough")) {
    return {
      verdict: "reject",
      score: 0.31,
      note: "Heuristic gate: no fresh data was bought.",
      source: "heuristic",
    };
  }
  return {
    verdict: "revise",
    score: 0.64,
    note: "Heuristic gate: answer is partial — state the data gap plainly.",
    source: "heuristic",
  };
}

type ReppoResult = {
  score100: number;
  verdict: Verdict;
  decision?: string;
  route?: string;
  confidence?: string;
  reason: string;
};

type PollOutcome =
  | { kind: "completed"; evalId: string; result: ReppoResult }
  | { kind: "failed"; evalId: string }
  | { kind: "pending"; evalId: string }
  | { kind: "submit-error"; status?: number; message: string }
  | { kind: "no-id" }
  | { kind: "thrown"; message: string };

/**
 * Shared submit + poll. Callers decide how to surface a missing key or a failure.
 * Does not invent a score.
 */
async function submitAndPoll(input: string, pollMs: number): Promise<PollOutcome> {
  const key = process.env.REPPO_API_KEY?.trim();
  if (!key) throw new Error("submitAndPoll called without REPPO_API_KEY");

  try {
    const submit = await fetch(`${BASE}/agents/evals`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taskType: "response",
        input,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!submit.ok) {
      const err = await submit.text().catch(() => "");
      console.error("Reppo submit failed", submit.status, err.slice(0, 300));
      return { kind: "submit-error", status: submit.status, message: err.slice(0, 180) };
    }

    const created = (await submit.json()) as { id?: string; status?: string };
    const evalId = created.id;
    if (!evalId) return { kind: "no-id" };

    const deadline = Date.now() + pollMs;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 4_000));
      const read = await fetch(`${BASE}/agents/evals/${encodeURIComponent(evalId)}`, {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(15_000),
      });
      if (!read.ok) continue;
      const body = (await read.json()) as {
        status?: string;
        score?: number | null;
        route?: string | null;
        result?: {
          score?: number;
          decision?: string;
          confidence?: string;
          route?: string;
          reason?: string;
        } | null;
      };

      if (body.status === "FAILED") return { kind: "failed", evalId };

      if (body.status === "COMPLETED" && body.result) {
        const score100 = body.result.score ?? body.score ?? 0;
        const route = body.result.route ?? body.route ?? undefined;
        const verdict = mapRoute(route, body.result.decision);
        return {
          kind: "completed",
          evalId,
          result: {
            score100,
            verdict,
            decision: body.result.decision,
            route,
            confidence: body.result.confidence,
            reason: body.result.reason || `Reppo ${verdict} · confidence ${body.result.confidence ?? "n/a"}.`,
          },
        };
      }
    }

    return { kind: "pending", evalId };
  } catch (e) {
    console.error("Reppo evaluate failed", e);
    return { kind: "thrown", message: e instanceof Error ? e.message : "Reppo evaluate failed" };
  }
}

function draftInput(question: string, answer: Answer): string {
  return [
    `User prompt: ${question}`,
    "",
    `AI response headline: ${answer.headline}`,
    ...answer.points.map((p, i) => `${i + 1}. ${p}`),
    "",
    `Sources: ${answer.sources}`,
    "",
    "Constraints: British English. Do not treat forecasts as facts. Flag unsourced claims. Public research brief only — no private data.",
  ].join("\n");
}

export async function evaluateDraft(opts: {
  question: string;
  answer: Answer;
  gotAllHigh: boolean;
  pollMs?: number;
}): Promise<ReppoGate> {
  const key = process.env.REPPO_API_KEY?.trim();
  if (!key) return heuristic(opts.answer, opts.gotAllHigh);

  const outcome = await submitAndPoll(draftInput(opts.question, opts.answer), opts.pollMs ?? 45_000);
  const h = heuristic(opts.answer, opts.gotAllHigh);

  if (outcome.kind === "completed") {
    return {
      verdict: outcome.result.verdict,
      score: +(outcome.result.score100 / 100).toFixed(2),
      note: outcome.result.reason,
      source: "reppo",
      evalId: outcome.evalId,
      confidence: outcome.result.confidence,
      route: outcome.result.route,
    };
  }
  if (outcome.kind === "failed") {
    return { ...h, evalId: outcome.evalId, note: `Reppo FAILED; using heuristic. ${h.note}` };
  }
  if (outcome.kind === "pending") {
    return {
      ...h,
      evalId: outcome.evalId,
      pending: true,
      note: `Reppo eval ${outcome.evalId} still settling — showing heuristic for the live demo. Poll later.`,
      source: "heuristic",
    };
  }
  if (outcome.kind === "submit-error") {
    return { ...h, note: `Reppo submit failed (${outcome.status}); using heuristic. ${h.note}` };
  }
  if (outcome.kind === "no-id") {
    return { ...h, note: `Reppo returned no id; using heuristic. ${h.note}` };
  }
  return heuristic(opts.answer, opts.gotAllHigh);
}

/**
 * Score a paid live Otto excerpt. If REPPO_API_KEY is missing, returns
 * "Reppo: not configured" with no numeric score. Never falls back to a heuristic score.
 */
export async function evaluateLiveExcerpt(opts: {
  topic: string;
  excerpt: string;
  provider: string;
  pollMs?: number;
}): Promise<LiveReppoScore> {
  if (!reppoConfigured()) {
    return { source: "unconfigured", note: "Reppo: not configured" };
  }

  const input = [
    `User prompt: Latest ${opts.topic} news for a research brief.`,
    "",
    `AI response (paid ${opts.provider} excerpt):`,
    opts.excerpt,
    "",
    "Constraints: British English. Do not treat forecasts as facts. Flag unsourced claims. Public research excerpt only — no private data.",
  ].join("\n");

  const outcome = await submitAndPoll(input, opts.pollMs ?? 40_000);

  if (outcome.kind === "completed") {
    return {
      source: "reppo",
      score100: outcome.result.score100,
      decision: outcome.result.decision,
      route: outcome.result.route,
      confidence: outcome.result.confidence,
      reason: outcome.result.reason,
      evalId: outcome.evalId,
      note: outcome.result.reason,
    };
  }
  if (outcome.kind === "pending") {
    return {
      source: "pending",
      evalId: outcome.evalId,
      note: `Reppo eval ${outcome.evalId} still settling. No score yet.`,
    };
  }
  if (outcome.kind === "failed") {
    return { source: "error", evalId: outcome.evalId, note: `Reppo FAILED for eval ${outcome.evalId}.` };
  }
  if (outcome.kind === "submit-error") {
    return { source: "error", note: `Reppo submit failed (${outcome.status}).` };
  }
  if (outcome.kind === "no-id") {
    return { source: "error", note: "Reppo returned no eval id." };
  }
  return { source: "error", note: outcome.message || "Reppo evaluate failed." };
}
