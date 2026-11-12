/**
 * Choose a short Otto filtered-news topic from a full research question.
 * Tries SERV Reasoning, then a keyword fallback. Never invents an invalid topic.
 */

import { extractTopicFallback, validTopic } from "@/lib/topic";

export type TopicChoice = {
  topic: string;
  source: "serv" | "fallback";
  rationale: string;
};

const BASE = process.env.SERV_BASE_URL?.trim() || "https://inference-api.openserv.ai/v1";
const MODEL = process.env.SERV_MODEL?.trim() || "gpt-5.4-mini";

const SYSTEM = `You pick a short topic for Otto AI's filtered-news API from a research question.
Reply with ONLY compact JSON, no markdown:
{"topic":"one or two plain words","rationale":"one short sentence in British English"}

Rules:
- topic must be one or two words: letters, numbers, spaces or hyphens only, 31 characters or fewer.
- Prefer the specific subject (for example "ethereum etf", not "crypto news").
- Do not invent a subject that is not in the question.
- If the question is already one or two words, you may reuse it, lowercased.`;

function parseTopic(raw: string): string | null {
  const text = raw.trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const slice = start >= 0 && end > start ? text.slice(start, end + 1) : text;
  try {
    const obj = JSON.parse(slice) as { topic?: unknown };
    if (typeof obj.topic !== "string") return null;
    const topic = obj.topic.trim().toLowerCase();
    return validTopic(topic) ? topic : null;
  } catch {
    return null;
  }
}

function parseRationale(raw: string): string | undefined {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return undefined;
  try {
    const obj = JSON.parse(raw.slice(start, end + 1)) as { rationale?: unknown };
    return typeof obj.rationale === "string" ? obj.rationale.trim() : undefined;
  } catch {
    return undefined;
  }
}

/** SERV first; keyword fallback if there is no key, a bad reply, or an invalid topic. */
export async function chooseOttoTopic(question: string): Promise<TopicChoice> {
  const fallback = extractTopicFallback(question);
  const fallbackChoice = (): TopicChoice => ({
    topic: fallback,
    source: "fallback",
    rationale: `Built-in extractor chose “${fallback}” from the question.`,
  });

  const key = process.env.SERV_API_KEY?.trim();
  if (!key) return fallbackChoice();
  const q = question.trim();
  if (!q) return fallbackChoice();

  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.1,
        max_completion_tokens: 120,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: q },
        ],
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error("SERV topic error", res.status, err.slice(0, 300));
      return fallbackChoice();
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content ?? "";
    const topic = parseTopic(content);
    if (!topic) return fallbackChoice();
    const rationale = parseRationale(content);
    return {
      topic,
      source: "serv",
      rationale: rationale || `SERV chose “${topic}” as the Otto topic for this question.`,
    };
  } catch (e) {
    console.error("SERV topic failed", e);
    return fallbackChoice();
  }
}
