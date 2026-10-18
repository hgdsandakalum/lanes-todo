import { test } from "node:test";
import assert from "node:assert/strict";
import { balancedWeek, fullStackWeek, inboxZero, paidOnTime, tutorkitSteady } from "./achievements";

test("balancedWeek", () => {
  assert.ok(balancedWeek(["a", "b"], new Set(["a", "b"])));
  assert.ok(!balancedWeek(["a", "b"], new Set(["a"])));
  assert.ok(!balancedWeek([], new Set()));
});

test("tutorkitSteady needs four Sundays in a row", () => {
  const four = new Set(["2026-10-18", "2026-10-11", "2026-10-04", "2026-09-27"]);
  assert.ok(tutorkitSteady("2026-10-18", four));
  four.delete("2026-10-04");
  assert.ok(!tutorkitSteady("2026-10-18", four));
});

test("inboxZero and fullStackWeek", () => {
  assert.ok(inboxZero(true, 0));
  assert.ok(!inboxZero(true, 2));
  assert.ok(!inboxZero(false, 0));
  assert.ok(fullStackWeek(new Set(["dev", "approved", "review"])));
  assert.ok(!fullStackWeek(new Set(["dev", "prod"])));
});

test("paidOnTime", () => {
  assert.ok(paidOnTime("2026-10-11", "2026-10-11"));
  assert.ok(!paidOnTime("2026-10-11", "2026-10-18"));
});
