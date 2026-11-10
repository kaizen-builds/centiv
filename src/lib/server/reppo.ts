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

function mapRoute(route?: string, decision?: string): Verdict {
  if (route === "ship" || decision === "accept") return "accept";
  if (route === "block" || decision === "reject") return "reject";
  return "revise";
}

function heuristic(answer: Answer, gotAllHigh: boolean): ReppoGate {
  if (gotAllHigh) {
    return {
      verdict: "accept",
      score: 0.86,
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

export async function evaluateDraft(opts: {
  question: string;
  answer: Answer;
  gotAllHigh: boolean;
  pollMs?: number;
}): Promise<ReppoGate> {
  const key = process.env.REPPO_API_KEY?.trim();
  if (!key) return heuristic(opts.answer, opts.gotAllHigh);

  const input = [
    `User prompt: ${opts.question}`,
    "",
    `AI response headline: ${opts.answer.headline}`,
    ...opts.answer.points.map((p, i) => `${i + 1}. ${p}`),
    "",
    `Sources: ${opts.answer.sources}`,
    "",
    "Constraints: British English. Do not treat forecasts as facts. Flag unsourced claims. Public research brief only — no private data.",
  ].join("\n");

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
      const h = heuristic(opts.answer, opts.gotAllHigh);
      return { ...h, note: `Reppo submit failed (${submit.status}); using heuristic. ${h.note}` };
    }

    const created = (await submit.json()) as { id?: string; status?: string };
    const evalId = created.id;
    if (!evalId) {
      const h = heuristic(opts.answer, opts.gotAllHigh);
      return { ...h, note: `Reppo returned no id; using heuristic. ${h.note}` };
    }

    const deadline = Date.now() + (opts.pollMs ?? 45_000);
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

      if (body.status === "FAILED") {
        const h = heuristic(opts.answer, opts.gotAllHigh);
        return { ...h, evalId, note: `Reppo FAILED; using heuristic. ${h.note}` };
      }

      if (body.status === "COMPLETED" && body.result) {
        const score100 = body.result.score ?? body.score ?? 0;
        const verdict = mapRoute(body.result.route ?? body.route ?? undefined, body.result.decision);
        return {
          verdict,
          score: +(score100 / 100).toFixed(2),
          note: body.result.reason || `Reppo ${verdict} · confidence ${body.result.confidence ?? "n/a"}.`,
          source: "reppo",
          evalId,
          confidence: body.result.confidence,
          route: body.result.route ?? body.route ?? undefined,
        };
      }
    }

    // Don't block the demo for a slow panel — keep the evalId.
    const h = heuristic(opts.answer, opts.gotAllHigh);
    return {
      ...h,
      evalId,
      pending: true,
      note: `Reppo eval ${evalId} still settling — showing heuristic for the live demo. Poll later.`,
      source: "heuristic",
    };
  } catch (e) {
    console.error("Reppo evaluate failed", e);
    return heuristic(opts.answer, opts.gotAllHigh);
  }
}
