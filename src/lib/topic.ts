/**
 * Otto AI filtered-news topics: one or two plain words.
 * Shared by the live route, the public demo, and the keyword fallback.
 */

export function validTopic(t: unknown): t is string {
  return typeof t === "string" && /^[a-z0-9][a-z0-9 -]{0,30}$/i.test(t.trim()) && t.trim().split(/\s+/).length <= 2;
}

const STOP = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "was",
  "were",
  "be",
  "any",
  "anything",
  "something",
  "everything",
  "nothing",
  "what",
  "whats",
  "which",
  "who",
  "big",
  "major",
  "latest",
  "current",
  "new",
  "news",
  "update",
  "updates",
  "happening",
  "going",
  "on",
  "in",
  "at",
  "to",
  "for",
  "of",
  "with",
  "from",
  "by",
  "about",
  "around",
  "this",
  "that",
  "these",
  "those",
  "week",
  "today",
  "now",
  "currently",
  "please",
  "tell",
  "me",
  "us",
  "show",
  "give",
  "and",
  "or",
  "but",
  "if",
  "as",
  "into",
  "over",
  "does",
  "do",
  "did",
  "can",
  "could",
  "should",
  "there",
]);

function tokens(question: string): string[] {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^-+|-+$/g, ""))
    .filter(Boolean);
}

function normalizeWord(w: string): string {
  if (w === "etfs") return "etf";
  if (w === "eth") return "ethereum";
  if (w === "btc") return "bitcoin";
  return w;
}

function usedSet(used?: string[]) {
  return new Set((used || []).map((t) => t.trim().toLowerCase()).filter(Boolean));
}

/** Last-resort topic from the question. Always returns a validTopic. Skips already-used topics when it can. */
export function extractTopicFallback(question: string, used: string[] = []): string {
  const taken = usedSet(used);
  const words = tokens(question);
  const kept = words.filter((w) => !STOP.has(w) && w.length >= 2).map(normalizeWord);
  const pool = kept.length ? kept : words.map(normalizeWord);
  const candidates: string[] = [];
  for (let i = 0; i < pool.length; i++) {
    if (i + 1 < pool.length) candidates.push(`${pool[i]} ${pool[i + 1]}`);
    candidates.push(pool[i]);
  }
  for (const raw of candidates) {
    const topic = raw.trim();
    if (validTopic(topic) && !taken.has(topic.toLowerCase())) return topic;
  }
  if (validTopic("ethereum") && !taken.has("ethereum")) return "ethereum";
  // Last resort: first valid candidate even if used, otherwise a legal default.
  for (const raw of candidates) {
    const topic = raw.trim();
    if (validTopic(topic)) return topic;
  }
  return "ethereum";
}

export function topicLabel(source: "serv" | "fallback" | "direct"): string {
  if (source === "serv") return "SERV";
  if (source === "direct") return "set directly";
  return "built-in";
}
