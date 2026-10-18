import { test } from "node:test";
import assert from "node:assert/strict";
import { describeRecur, nextDate, parseRecur, ruleFrom } from "./recur";
import { formatMinutes, parseDuration } from "./estimate";

test("ruleFrom reads everyday phrasing", () => {
  assert.equal(ruleFrom("every day"), "daily");
  assert.equal(ruleFrom("weekdays"), "weekdays");
  assert.equal(ruleFrom("every fri"), "weekly:5");
  assert.equal(ruleFrom("mon, Thursday"), "weekly:1,4");
  assert.equal(ruleFrom("monthly 15th"), "monthly:15");
  assert.equal(ruleFrom("monthly 32"), null);
  assert.equal(ruleFrom("sometimes"), null);
});

test("nextDate per rule", () => {
  const tue = "2026-10-13";
  assert.equal(nextDate(parseRecur("daily")!, tue), "2026-10-14");
  assert.equal(nextDate(parseRecur("weekdays")!, "2026-10-16"), "2026-10-19"); // Fri → Mon
  assert.equal(nextDate(parseRecur("weekly:1,4")!, tue), "2026-10-15"); // → Thu
  assert.equal(nextDate(parseRecur("weekly:2")!, tue), "2026-10-20"); // same weekday → next week
  assert.equal(nextDate(parseRecur("monthly:31")!, "2026-10-31"), "2026-11-30"); // short month
  assert.equal(nextDate(parseRecur("monthly:5")!, tue), "2026-11-05");
});

test("describeRecur", () => {
  assert.equal(describeRecur("weekly:1,4"), "Every Mon, Thu");
  assert.equal(describeRecur("monthly:22"), "Monthly on the 22nd");
  assert.equal(describeRecur("bogus"), null);
});

test("durations", () => {
  assert.equal(parseDuration("1h30m"), 90);
  assert.equal(parseDuration("1.5h"), 90);
  assert.equal(parseDuration("45"), 45);
  assert.equal(parseDuration("0m"), null);
  assert.equal(formatMinutes(90), "1h 30m");
  assert.equal(formatMinutes(120), "2h");
});
