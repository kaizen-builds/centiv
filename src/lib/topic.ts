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

/** Last-resort topic from the question. Always returns a validTopic. */
export function extractTopicFallback(question: string): string {
  const words = tokens(question);
  const kept = words.filter((w) => !STOP.has(w) && w.length >= 2).map(normalizeWord);
  const pool = kept.length ? kept : words.map(normalizeWord);
  let topic = pool.slice(0, 2).join(" ").trim();
  if (validTopic(topic)) return topic.trim();
  topic = pool.slice(0, 1).join(" ").trim();
  if (validTopic(topic)) return topic.trim();
  return "ethereum";
}

export function topicLabel(source: "serv" | "fallback" | "direct"): string {
  if (source === "serv") return "SERV";
  if (source === "direct") return "set directly";
  return "built-in";
}
