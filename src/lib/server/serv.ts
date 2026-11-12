/**
 * SERV Reasoning — OpenAI-compatible chat completions.
 * Docs: https://docs.openserv.ai/serv-reasoning/api
 * Base: https://inference-api.openserv.ai
 */

import type { Candidate, Decision } from "@/lib/centiv";

const BASE = process.env.SERV_BASE_URL?.trim() || "https://inference-api.openserv.ai/v1";
const MODEL = process.env.SERV_MODEL?.trim() || "gpt-5.4-mini";

export type ServDecision = {
  decision: Decision;
  rationale: string;
  source: "serv" | "heuristic";
};

export type CapsMode = "enforce" | "informational";

const SYSTEM_ENFORCE = `You are SERV Reasoning inside Centiv, a pay-per-call research agent on Kite.
Decide whether to buy one paid data call. Reply with ONLY compact JSON, no markdown:
{"decision":"spend"|"skip"|"decline","rationale":"one or two short sentences in British English"}

Rules:
- "spend" if the call is high-value evidence for the question AND the quoted price fits the remaining budget and the per-call cap.
- "skip" if the call is low value relative to what's left (nice-to-have, redundant with better data).
- "decline" if the price would breach the per-call cap or the remaining budget — never recommend signing past a limit.
- Prefer fresh primary data over sentiment scrapes.
- Be concise. Do not invent prices.`;

// Live payments: SERV judges value only. Kite Passport independently enforces
// per-call and session-total caps, including the demo's call-3 refusal
// (session_total_exceeded). Do not pre-empt that refusal with budget maths.
const SYSTEM_INFORMATIONAL = `You are SERV Reasoning inside Centiv, a pay-per-call research agent on Kite.
Decide whether this paid data call is worth buying on its merits. Reply with ONLY compact JSON, no markdown:
{"decision":"spend"|"skip"|"decline","rationale":"one or two short sentences in British English"}

Rules:
- Judge value, not limits. "spend" if the call is high-value evidence for the question. "skip" if it is low value, nice-to-have, or redundant. "decline" only if the call itself is inappropriate (wrong merchant, clearly junk), not because a budget cap may be tight.
- Kite Passport independently enforces the per-call cap and the session total. If this call would exceed those caps, Passport will refuse the payment. Do not pre-empt that refusal. Do not decline or skip merely because remaining budget may be insufficient.
- The Kite Passport caps in the user message are context only.
- Prefer fresh primary data over sentiment scrapes.
- Be concise. Do not invent prices.`;

function heuristic(c: Candidate, remaining: number, perTx: number, caps: CapsMode): ServDecision {
  // Informational caps: never decline on budget maths — Kite Passport enforces limits.
  if (caps === "informational") {
    if (c.value === "low") {
      return { decision: "skip", rationale: c.rationale, source: "heuristic" };
    }
    return { decision: "spend", rationale: c.rationale, source: "heuristic" };
  }
  if (c.price > perTx || c.price > remaining) {
    return {
      decision: "decline",
      rationale: `${c.price.toFixed(2)} USDC would breach the ${c.price > perTx ? "per-call cap" : "remaining budget"}. Decline before signing.`,
      source: "heuristic",
    };
  }
  if (c.value === "low") {
    return { decision: "skip", rationale: c.rationale, source: "heuristic" };
  }
  return { decision: "spend", rationale: c.rationale, source: "heuristic" };
}

export async function decideSpend(opts: {
  question: string;
  candidate: Candidate;
  remaining: number;
  perTx: number;
  windowMinLeft: number;
  /** Default "enforce" (research engine). Live payments use "informational". */
  caps?: CapsMode;
}): Promise<ServDecision> {
  const caps: CapsMode = opts.caps ?? "enforce";
  const key = process.env.SERV_API_KEY?.trim();
  if (!key) return heuristic(opts.candidate, opts.remaining, opts.perTx, caps);

  const user = JSON.stringify({
    question: opts.question,
    service: opts.candidate.service,
    endpoint: opts.candidate.endpoint,
    priceUsdc: opts.candidate.price,
    catalogueHint: opts.candidate.value,
    remainingUsdc: opts.remaining,
    perCallCapUsdc: opts.perTx,
    minutesLeft: opts.windowMinLeft,
    kitePassportCaps:
      caps === "informational"
        ? "Context only. Kite Passport enforces these independently — do not decline just because remaining budget may be insufficient."
        : "Enforce these limits in your decision.",
  });

  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        max_completion_tokens: 220,
        messages: [
          { role: "system", content: caps === "informational" ? SYSTEM_INFORMATIONAL : SYSTEM_ENFORCE },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error("SERV Reasoning error", res.status, err.slice(0, 300));
      return heuristic(opts.candidate, opts.remaining, opts.perTx, caps);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return heuristic(opts.candidate, opts.remaining, opts.perTx, caps);
    const parsed = JSON.parse(jsonMatch[0]) as { decision?: string; rationale?: string };
    const fallback = heuristic(opts.candidate, opts.remaining, opts.perTx, caps);
    const decision = (["spend", "skip", "decline"] as Decision[]).includes(parsed.decision as Decision)
      ? (parsed.decision as Decision)
      : fallback.decision;

    // Hard safety only when caps are ours to enforce. Live mode leaves refusal to Kite Passport.
    if (
      caps === "enforce" &&
      decision === "spend" &&
      (opts.candidate.price > opts.perTx || opts.candidate.price > opts.remaining)
    ) {
      return {
        decision: "decline",
        rationale: parsed.rationale?.trim() || fallback.rationale,
        source: "serv",
      };
    }

    return {
      decision,
      rationale: (parsed.rationale || "").trim() || fallback.rationale,
      source: "serv",
    };
  } catch (e) {
    console.error("SERV Reasoning failed", e);
    return heuristic(opts.candidate, opts.remaining, opts.perTx, caps);
  }
}
