import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanRoutine, SWEEP_ITEMS, toItems } from "./routines";

test("plain-text items from older rows read as items", () => {
  assert.deepEqual(toItems(["a", { text: "b", signal: "due" }]), [{ text: "a" }, { text: "b", signal: "due" }]);
});

test("an edited routine is trimmed and checked", () => {
  const ok = cleanRoutine({ title: " Sweep ", note: "", weekdays: [5, 1, 1, 9], items: [{ text: " a " }, { text: "" }, { text: "b", signal: "bogus" as never }] });
  assert.deepEqual(ok, { ok: true, value: { title: "Sweep", note: null, weekdays: [1, 5], items: [{ text: "a" }, { text: "b" }] } });
  assert.equal(cleanRoutine({ title: "x", note: "", weekdays: [], items: [{ text: "a" }] }).ok, false);
  assert.equal(cleanRoutine({ title: "x", note: "", weekdays: [1], items: [{ text: "  " }] }).ok, false);
  assert.equal(cleanRoutine({ title: "x", note: "", weekdays: [1], items: [{ text: "a", signal: "deep" }, { text: "b", signal: "deep" }] }).ok, false);
});

test("the shipped sweep is valid and has one self-ticking item", () => {
  assert.equal(cleanRoutine({ title: "Morning sweep", note: "", weekdays: [1, 2, 3, 4, 5], items: SWEEP_ITEMS }).ok, true);
  assert.equal(SWEEP_ITEMS.filter((i) => i.signal === "deep").length, 1);
});
