/**
 * Telling whether a task someone is about to add is already on the board: by ticket (T-213 = t213 = T 213),
 * or by a title that says the same thing in other words. Used by the assistant's capture command.
 */

/** A ticket in one spelling: upper case, letters and digits only ("t-213" → "T213"). */
export const ticketKey = (ticket: string | null | undefined) => (ticket ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

const STOP = new Set(["the", "and", "for", "with", "from", "into", "that", "this", "its", "it's", "when", "should", "a", "an", "of", "to", "in", "on", "is", "be", "by", "or", "as", "at", "it"]);

/** The meaningful words of a title: quick-add shortcuts and [tags] dropped, lower case, simple plurals folded; CJK runs become bigrams. */
export function titleWords(title: string): Set<string> {
  const text = title
    .replace(/\[[^\]]*\]/g, " ")
    .split(/\s+/)
    .filter((w) => !/^[#@!^*+~]/.test(w))
    .join(" ")
    .toLowerCase()
    .replace(/'s\b/g, "");
  const words = new Set<string>();
  for (const run of text.match(/[\p{L}\p{N}]+/gu) ?? []) {
    if (/[぀-ヿ㐀-鿿]/u.test(run)) {
      if (run.length === 1) words.add(run);
      for (let i = 0; i < run.length - 1; i++) words.add(run.slice(i, i + 2));
      continue;
    }
    if (run.length < 3 || STOP.has(run)) continue;
    words.add(run.length > 4 && run.endsWith("s") && !run.endsWith("ss") ? run.slice(0, -1) : run);
  }
  return words;
}

/** 0–1: how much of the shorter title the longer one covers. */
export function titleSimilarity(a: string, b: string): number {
  const A = titleWords(a);
  const B = titleWords(b);
  if (A.size === 0 || B.size === 0) return 0;
  let common = 0;
  for (const w of A) if (B.has(w)) common++;
  return common / Math.min(A.size, B.size);
}

export type OpenTask = { id: string; title: string; ticket: string | null };

/** Open tasks that look like the new one: same ticket first, then titles at least `threshold` alike (best first). */
export function findDuplicates(candidate: { title: string; ticket?: string | null; description?: string | null }, open: OpenTask[], threshold = 0.6) {
  const key = ticketKey(candidate.ticket);
  const byTicket = key ? open.filter((t) => ticketKey(t.ticket) === key) : [];
  if (byTicket.length) return { reason: "ticket" as const, tasks: byTicket };
  const scored = open
    .filter((t) => !key || !t.ticket || ticketKey(t.ticket) === key) // a task with a different ticket is a different task
    .map((t) => ({ t, score: Math.max(titleSimilarity(candidate.title, t.title), candidate.description ? titleSimilarity(candidate.description.split("\n")[0], t.title) : 0) }))
    .filter((x) => x.score >= threshold && titleWords(x.t.title).size >= 2)
    .sort((a, b) => b.score - a.score);
  return { reason: "title" as const, tasks: scored.map((x) => x.t) };
}
