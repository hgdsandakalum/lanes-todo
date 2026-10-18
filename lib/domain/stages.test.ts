import { test } from "node:test";
import assert from "node:assert/strict";
import { stageDates } from "./stages";

const now = new Date("2026-10-13T10:00:00Z");
const earlier = new Date("2026-10-10T10:00:00Z");
const none = { devReleasedAt: null, closedAt: null };

test("code: dev release stamps once, prod release closes", () => {
  assert.deepEqual(stageDates("code", "in_review", none, now), none);
  assert.deepEqual(stageDates("code", "dev_released", none, now), { devReleasedAt: now, closedAt: null });
  assert.deepEqual(stageDates("code", "prod_released", { devReleasedAt: earlier, closedAt: null }, now), { devReleasedAt: earlier, closedAt: now });
});

test("moving back clears the stamps", () => {
  assert.deepEqual(stageDates("code", "in_progress", { devReleasedAt: earlier, closedAt: earlier }, now), none);
});

test("design and general only close", () => {
  assert.deepEqual(stageDates("design", "approved", none, now), { devReleasedAt: null, closedAt: now });
  assert.deepEqual(stageDates("general", "done", none, now), { devReleasedAt: null, closedAt: now });
  assert.deepEqual(stageDates("design", "feedback", none, now), none);
});
