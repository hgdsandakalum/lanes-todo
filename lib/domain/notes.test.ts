import { test } from "node:test";
import assert from "node:assert/strict";
import { ageGroup, fullStamp, listStamp, notePreview, noteTitle } from "./notes";

test("title is the first line with text, without heading or list marks", () => {
  assert.equal(noteTitle("\n\n# Gaku launch plan\nShip by Friday"), "Gaku launch plan");
  assert.equal(noteTitle("- [ ] call the client\nabout invoices"), "call the client");
  assert.equal(noteTitle("   \n"), "New note");
});

test("preview is the text after the title, on one line", () => {
  assert.equal(notePreview("Plan\n\nShip by Friday\n- tell Olly"), "Ship by Friday tell Olly");
  assert.equal(notePreview("Only a title"), "");
});

test("age groups follow Apple Notes", () => {
  const today = "2026-10-18";
  assert.equal(ageGroup("2026-10-18", today), "Today");
  assert.equal(ageGroup("2026-10-17", today), "Yesterday");
  assert.equal(ageGroup("2026-10-12", today), "Previous 7 days");
  assert.equal(ageGroup("2026-10-11", today), "Previous 7 days");
  assert.equal(ageGroup("2026-10-10", today), "Previous 30 days");
  assert.equal(ageGroup("2026-09-18", today), "Previous 30 days");
  assert.equal(ageGroup("2026-09-17", today), "September");
  assert.equal(ageGroup("2025-12-30", today), "December 2025");
});

test("stamps are in the app's time zone", () => {
  const at = new Date("2026-10-18T06:10:00Z"); // 11:40 in Colombo
  assert.equal(listStamp(at, "2026-10-18", "2026-10-18", "Asia/Colombo"), "11:40");
  assert.equal(listStamp(at, "2026-10-18", "2026-10-20", "Asia/Colombo"), "Sunday");
  assert.equal(listStamp(at, "2026-10-18", "2026-11-30", "Asia/Colombo"), "18/10/2026");
  assert.equal(fullStamp(at, "Asia/Colombo"), "18 October 2026 at 11:40");
});
