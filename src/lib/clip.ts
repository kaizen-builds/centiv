/** Trim long public excerpts at a sentence end. Never invents words. */
export function clipAtSentence(text: string, max = 320): { preview: string; clipped: boolean } {
  const trimmed = text.trim();
  if (trimmed.length <= max) return { preview: trimmed, clipped: false };

  const slice = trimmed.slice(0, max);
  const ends = [...slice.matchAll(/[.!?](?=\s|$|["”')\]])/g)];
  const last = ends.at(-1);
  if (last?.index != null && last.index >= Math.floor(max * 0.4)) {
    return { preview: `${slice.slice(0, last.index + 1)}…`, clipped: true };
  }

  const word = slice.replace(/\s+\S*$/, "").trimEnd();
  return { preview: `${word || slice.trimEnd()}…`, clipped: true };
}
