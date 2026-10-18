import { test } from "node:test";
import assert from "node:assert/strict";
import { weeklyScore } from "./review";

test("weeklyScore weighs stars 60 and balance 40", () => {
  assert.deepEqual(weeklyScore(0, 3, 0, 4), { score: 0, stars: 0, balance: 0 });
  assert.deepEqual(weeklyScore(3, 3, 4, 4), { score: 100, stars: 60, balance: 40 });
  assert.deepEqual(weeklyScore(2, 3, 3, 4), { score: 70, stars: 40, balance: 30 });
  assert.deepEqual(weeklyScore(1, 3, 0, 4), { score: 20, stars: 20, balance: 0 });
});

test("weeklyScore never exceeds its parts", () => {
  assert.equal(weeklyScore(5, 3, 9, 4).score, 100);
  assert.equal(weeklyScore(0, 0, 0, 0).score, 0);
});
