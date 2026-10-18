import { PALETTE, type PaletteKey } from "./palette";

export const NAME_MAX = 60;
export const WAIT_DAYS_MAX = 90;

/** Quick-add handle: 2–5 letters or digits, starting with a letter, stored upper-case. */
export function normalizeCode(input: string): string | null {
  const code = input.trim().replace(/^#/, "").toUpperCase();
  return /^[A-Z][A-Z0-9]{1,4}$/.test(code) ? code : null;
}

export type ProjectInput = { name: string; code: string; color: PaletteKey };

/** Checks the fields every project needs. Uniqueness of the code is the database's job (see the actions). */
export function checkProject(raw: { name: string; code: string; color: string }): { ok: true; value: ProjectInput } | { ok: false; error: string } {
  const name = raw.name.trim();
  if (!name) return { ok: false, error: "Give the project a name." };
  if (name.length > NAME_MAX) return { ok: false, error: `Keep the name under ${NAME_MAX} characters.` };
  const code = normalizeCode(raw.code);
  if (!code) return { ok: false, error: "The code needs 2 to 5 letters or digits, starting with a letter, like GK." };
  if (!(PALETTE as readonly string[]).includes(raw.color)) return { ok: false, error: "Pick one of the colours." };
  return { ok: true, value: { name, code, color: raw.color as PaletteKey } };
}

/** The order after moving one id up or down a place; unchanged at either end. */
export function moved<T>(ids: T[], id: T, dir: "up" | "down"): T[] {
  const i = ids.indexOf(id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return ids;
  const next = [...ids];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
