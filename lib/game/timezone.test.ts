import { test } from "node:test";
import assert from "node:assert/strict";
import { ymd } from "@/lib/domain/dates";
import { starWeek } from "@/lib/domain/weekly";

// Asia/Colombo is UTC+5:30 with no daylight saving: a local day starts at 18:30 UTC the day before.
const TZ = "Asia/Colombo";

test("a finish just before local midnight counts for that day", () => {
  assert.equal(ymd(new Date("2026-10-14T18:29:59Z"), TZ), "2026-10-14"); // 23:59:59 local
});

test("a finish just after local midnight counts for the next day", () => {
  assert.equal(ymd(new Date("2026-10-14T18:30:00Z"), TZ), "2026-10-15"); // 00:00 local
});

test("the UTC date and the local date differ for late-evening work", () => {
  const lateEvening = new Date("2026-10-14T19:00:00Z"); // 00:30 local on the 15th
  assert.equal(lateEvening.toISOString().slice(0, 10), "2026-10-14");
  assert.equal(ymd(lateEvening, TZ), "2026-10-15");
});

test("Saturday night local work belongs to the old week; just after midnight, the new one", () => {
  assert.equal(starWeek(ymd(new Date("2026-10-17T18:29:00Z"), TZ)), "2026-10-11"); // Sat 23:59
  assert.equal(starWeek(ymd(new Date("2026-10-17T18:31:00Z"), TZ)), "2026-10-18"); // Sun 00:01
});

test("year end in the app timezone", () => {
  assert.equal(ymd(new Date("2025-12-31T18:30:00Z"), TZ), "2026-01-01");
  assert.equal(ymd(new Date("2025-12-31T18:29:00Z"), TZ), "2025-12-31");
});

test("another timezone keeps working (daylight saving)", () => {
  // London: BST (UTC+1) until 25 Oct 2026, then GMT
  assert.equal(ymd(new Date("2026-10-24T23:30:00Z"), "Europe/London"), "2026-10-25");
  assert.equal(ymd(new Date("2026-10-25T23:30:00Z"), "Europe/London"), "2026-10-25");
});
