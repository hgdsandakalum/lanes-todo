import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { backupDir, backupNow, expired } from "./backup";

test("backupDir: beside a local file, none for a remote database", () => {
  assert.equal(backupDir("file:/data/local.db"), "/data/backups");
  assert.equal(backupDir("libsql://lanes-me.turso.io"), null);
  assert.equal(backupDir(undefined), null);
});

test("expired: keeps the last 14 days and ignores other files", () => {
  const names = ["lanes-2026-10-04.db", "lanes-2026-10-05.db", "lanes-2026-10-18.db", "notes.txt", "lanes-2026-10-01.db.tmp"];
  assert.deepEqual(expired(names, "2026-10-18"), ["lanes-2026-10-04.db"]);
});

test("backupNow: one readable copy a day, old ones cleared", async () => {
  const dir = mkdtempSync(join(tmpdir(), "lanes-backup-"));
  const url = `file:${join(dir, "local.db")}`;
  const db = createClient({ url });
  await db.execute("create table t (n integer)");
  await db.execute("insert into t values (42)");
  db.close();
  const old = join(dir, "backups", "lanes-2026-09-01.db");

  const first = await backupNow(url, "2026-10-18");
  assert.ok(first && existsSync(first));
  writeFileSync(old, "");
  assert.equal(await backupNow(url, "2026-10-18"), null, "a second run the same day does nothing");
  await backupNow(url, "2026-10-19");
  assert.deepEqual(readdirSync(join(dir, "backups")).sort(), ["lanes-2026-10-18.db", "lanes-2026-10-19.db"]);

  const copy = createClient({ url: `file:${first}` });
  assert.equal((await copy.execute("select n from t")).rows[0].n, 42);
  copy.close();
});
