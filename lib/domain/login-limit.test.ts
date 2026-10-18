import { test } from "node:test";
import assert from "node:assert/strict";
import { lockedFor, type Failure } from "./login-limit";

const MIN = 60_000;
const now = 1_800_000_000_000;
const from = (ip: string, ...minutesAgo: number[]): Failure[] => minutesAgo.map((m) => ({ ip, at: now - m * MIN }));

test("four wrong guesses still allow a fifth", () => {
  assert.equal(lockedFor(from("1.1.1.1", 1, 2, 3, 4), "1.1.1.1", now), 0);
});

test("five wrong guesses lock that address until the oldest is 15 minutes old", () => {
  assert.equal(lockedFor(from("1.1.1.1", 1, 2, 3, 4, 5), "1.1.1.1", now), 10);
});

test("guesses older than 15 minutes don't count", () => {
  assert.equal(lockedFor(from("1.1.1.1", 1, 2, 3, 4, 16, 20), "1.1.1.1", now), 0);
});

test("another address isn't locked by someone else's guesses", () => {
  assert.equal(lockedFor(from("1.1.1.1", 1, 2, 3, 4, 5), "2.2.2.2", now), 0);
});

test("30 guesses an hour across all addresses locks everyone", () => {
  const spread = Array.from({ length: 30 }, (_, i) => ({ ip: `10.0.0.${i}`, at: now - (i + 1) * MIN }));
  assert.equal(lockedFor(spread, "2.2.2.2", now), 30);
  assert.equal(lockedFor(spread.slice(1), "2.2.2.2", now), 0);
});
