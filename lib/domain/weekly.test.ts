import { test } from "node:test";
import assert from "node:assert/strict";
import { starWeek } from "./weekly";
import { daysBetween } from "./dates";

test("starWeek starts on Sunday", () => {
  assert.equal(starWeek("2026-10-11"), "2026-10-11"); // Sunday
  assert.equal(starWeek("2026-10-13"), "2026-10-11"); // Tuesday
  assert.equal(starWeek("2026-10-17"), "2026-10-11"); // Saturday
  assert.equal(starWeek("2026-10-18"), "2026-10-18");
  assert.equal(starWeek("2026-01-01"), "2025-12-28"); // across a year
});

test("daysBetween", () => {
  assert.equal(daysBetween("2026-10-13", "2026-10-13"), 0);
  assert.equal(daysBetween("2026-10-04", "2026-10-13"), 9);
  assert.equal(daysBetween("2026-10-13", "2026-10-12"), -1);
  assert.equal(daysBetween("2026-03-28", "2026-03-30"), 2);
});
