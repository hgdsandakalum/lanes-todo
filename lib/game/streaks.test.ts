import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, weekday } from "@/lib/domain/dates";
import { streak } from "./streaks";

const TODAY = "2026-10-14"; // Wednesday
const every = () => true;
const weekdays = (d: string) => weekday(d) >= 1 && weekday(d) <= 5;
const days = (...offsets: number[]) => new Set(offsets.map((n) => addDays(TODAY, -n)));
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

test("an unbroken run, today done", () => {
  assert.equal(streak(TODAY, { done: days(0, 1, 2), expected: every }).current, 3);
});

test("today not done yet doesn't break the streak", () => {
  assert.equal(streak(TODAY, { done: days(1, 2), expected: every }).current, 2);
});

test("one missed day a week is forgiven", () => {
  const s = streak(TODAY, { done: days(0, 2, 3), expected: every }); // yesterday missed
  assert.equal(s.current, 3);
  assert.equal(s.restUsedThisWeek, true);
});

test("a second miss in the same week breaks it", () => {
  // Sun 11 Oct to Wed 14 Oct is one week: misses on Tue and Mon
  assert.equal(streak(TODAY, { done: days(0, 3, 4), expected: every }).current, 1);
});

test("the rest day resets each week (weeks start on Sunday)", () => {
  // misses: Tue 13 Oct (this week), Thu 8 Oct (last week)
  const done = new Set(range(0, 20).filter((n) => n !== 1 && n !== 6).map((n) => addDays(TODAY, -n)));
  assert.equal(streak(TODAY, { done, expected: every }).current, 19);
});

test("no rest when restPerWeek is 0", () => {
  assert.equal(streak(TODAY, { done: days(0, 2, 3), expected: every, restPerWeek: 0 }).current, 1);
});

test("days that aren't due are skipped, not missed (morning sweep on weekdays)", () => {
  // Mon 12, Tue 13, Wed 14 done; weekend 10-11 not due; Fri 9, Thu 8 done
  assert.equal(streak(TODAY, { done: days(0, 1, 2, 5, 6), expected: weekdays }).current, 5);
});

test("nothing done", () => {
  const s = streak(TODAY, { done: new Set(), expected: every });
  assert.equal(s.current, 0);
  assert.equal(s.best, 0);
});

test("best remembers a longer run that ended", () => {
  // 10 days in a row three weeks ago, then two misses in one week, then today
  const done = new Set([0, ...range(20, 29)].map((n) => addDays(TODAY, -n)));
  const s = streak(TODAY, { done, expected: every });
  assert.equal(s.current, 1);
  assert.equal(s.best, 10);
});

test("across a year boundary", () => {
  const today = "2026-01-02"; // Friday
  const done = new Set(["2025-12-29", "2025-12-30", "2025-12-31", "2026-01-01", "2026-01-02"]);
  assert.equal(streak(today, { done, expected: every }).current, 5);
});

test("a rest day only counts when it bridges two done days", () => {
  assert.equal(streak(TODAY, { done: days(0), expected: every }).restUsedThisWeek, false);
  assert.equal(streak(TODAY, { done: new Set(), expected: every }).restUsedThisWeek, false);
  assert.equal(streak(TODAY, { done: days(0, 2), expected: every }).restUsedThisWeek, true);
});
