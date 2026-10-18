/**
 * A dated copy of the local database, made by the app itself once a day while it runs (data only changes while it
 * runs, so that's when a copy is worth making). Copies go to backups/ beside the database file, 14 days kept.
 * Off for a Turso URL, which has its own restore, and when LANES_BACKUP=off (the browser tests).
 * Restore: stop the app, then cp backups/lanes-YYYY-MM-DD.db local.db
 */
import { existsSync } from "node:fs";
import { mkdir, readdir, rename, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { createClient } from "@libsql/client";
import { addDays, ymd } from "../domain/dates";

export const KEEP_DAYS = 14;
const HOUR = 60 * 60 * 1000;
const NAME = /^lanes-(\d{4}-\d{2}-\d{2})\.db$/;

/** The backup folder for a file: database URL, or null when the database isn't a local file. */
export function backupDir(url: string | undefined) {
  if (!url?.startsWith("file:")) return null;
  return join(dirname(resolve(url.slice("file:".length))), "backups");
}

/** Backup file names older than the last `keep` days, oldest first. */
export function expired(names: string[], today: string, keep = KEEP_DAYS) {
  const oldest = addDays(today, -(keep - 1));
  return names.filter((n) => NAME.test(n) && n.match(NAME)![1] < oldest).sort();
}

/** Makes today's copy if there isn't one yet, then clears out old ones. Returns the file it wrote, if any. */
export async function backupNow(url = process.env.DATABASE_URL, today = ymd()) {
  const dir = backupDir(url);
  if (!dir) return null;
  const out = join(dir, `lanes-${today}.db`);
  if (existsSync(out)) return null;
  await mkdir(dir, { recursive: true });

  // VACUUM INTO writes a consistent snapshot even mid-write; going via a temp name means a half-made file never counts as today's
  const tmp = `${out}.tmp`;
  await rm(tmp, { force: true });
  const client = createClient({ url: url! });
  try {
    await client.execute(`VACUUM INTO '${tmp.replaceAll("'", "''")}'`);
  } finally {
    client.close();
  }
  await rename(tmp, out);
  // the folder is only known at runtime; the ignore comments keep the build from bundling the whole project to cover it
  for (const name of expired(await readdir(/*turbopackIgnore: true*/ dir), today)) await rm(join(/*turbopackIgnore: true*/ dir, name));
  return out;
}

/** Checks once at startup and then hourly, so a server left running past midnight still gets the next day's copy. */
export function startDailyBackup() {
  if (process.env.LANES_BACKUP === "off" || !backupDir(process.env.DATABASE_URL)) return;
  const g = globalThis as unknown as { __lanesBackup?: boolean };
  if (g.__lanesBackup) return;
  g.__lanesBackup = true;
  const run = () =>
    backupNow()
      .then((file) => (file ? console.info(`[lanes] backup saved: ${file}`) : null))
      .catch((err) => console.error("[lanes] backup failed:", err));
  void run();
  setInterval(run, HOUR).unref();
}
