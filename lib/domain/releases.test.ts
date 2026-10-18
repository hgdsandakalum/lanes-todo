import { test } from "node:test";
import assert from "node:assert/strict";
import { checkReleaseDay, defaultReleaseName } from "./releases";

test("defaultReleaseName", () => {
  assert.equal(defaultReleaseName("2026-10-16"), "Prod release 16 Oct");
  assert.equal(defaultReleaseName("2026-01-02"), "Prod release 2 Jan");
});

test("checkReleaseDay", () => {
  assert.equal(checkReleaseDay("2026-10-14", "2026-10-14", ["2026-10-04", "2026-10-10"]), null);
  assert.equal(checkReleaseDay("2026-10-10", "2026-10-14", ["2026-10-10"]), null);
  assert.match(checkReleaseDay("2026-10-15", "2026-10-14", [])!, /future/);
  assert.match(checkReleaseDay("2026-10-09", "2026-10-14", ["2026-10-04", "2026-10-10"])!, /2026-10-10/);
});
