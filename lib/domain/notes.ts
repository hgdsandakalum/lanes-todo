/**
 * Notes work like Apple Notes: the first line is the title, the next line with text is the preview, and the list is
 * grouped by how recently each note changed. Pure functions, shared by the server and the browser.
 */
import { addDays } from "./dates";

export const NOTE_MAX = 100_000;
export const TRASH_DAYS = 30;
export const UNTITLED = "New note";

/** Folders that aren't a workspace or project. Workspace and project folders use their ids (ws_…, pr_…). */
export const ALL = "all";
export const UNFILED = "unfiled";
export const DELETED = "deleted";

/** A note's lines as plain words: no heading or list marks, code fences, image links or backticks. */
const lines = (body: string) =>
  body
    .split("\n")
    .filter((l) => !/^\s*```/.test(l))
    .map((l) =>
      l
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/`/g, "")
        .replace(/^\s*(#+\s*|[-*]\s+(\[[ xX]\]\s*)?)/, "")
        .trim(),
    )
    .filter(Boolean);

/** Path of an image stored with a note, as written into the note's text. */
export const imagePath = (id: string) => `/api/notes/images/${id}`;
/** Ids of the stored images a note's text still shows. */
export const imageIds = (body: string) => [...body.matchAll(/\/api\/notes\/images\/(ni_[\w-]+)/g)].map((m) => m[1]);

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"] as const;
/** Vercel caps a request at 4.5 MB; the browser shrinks anything bigger before it uploads. */
export const IMAGE_MAX = 4 * 1024 * 1024;

export const noteTitle = (body: string) => lines(body)[0]?.slice(0, 120) ?? UNTITLED;
export const notePreview = (body: string) => lines(body).slice(1).join(" ").slice(0, 160);

/** Where the list puts a note, from the day it last changed: Today, Yesterday, Previous 7 days, Previous 30 days, then by month. */
export function ageGroup(day: string, today: string): string {
  if (day >= today) return "Today";
  if (day === addDays(today, -1)) return "Yesterday";
  if (day >= addDays(today, -7)) return "Previous 7 days";
  if (day >= addDays(today, -30)) return "Previous 30 days";
  const [y, m] = day.split("-").map(Number);
  const month = new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-GB", { month: "long", timeZone: "UTC" });
  return y === Number(today.slice(0, 4)) ? month : `${month} ${y}`;
}

const zone = () => process.env.APP_TIMEZONE || "Asia/Colombo";

/** The date beside a note in the list: the time today, the weekday this week, else the date. */
export function listStamp(at: Date, day: string, today: string, timeZone = zone()): string {
  if (day >= today) return at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone });
  if (day > addDays(today, -7)) return at.toLocaleDateString("en-GB", { weekday: "long", timeZone });
  return at.toLocaleDateString("en-GB", { day: "numeric", month: "numeric", year: "numeric", timeZone });
}

/** The line above an open note: "18 October 2026 at 11:40". */
export const fullStamp = (at: Date, timeZone = zone()) =>
  `${at.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone })} at ${at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone })}`;
