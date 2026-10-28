import { test } from "node:test";
import assert from "node:assert/strict";
import { findDuplicates, ticketKey, titleSimilarity } from "./dupes";

test("tickets match in any spelling", () => {
  assert.equal(ticketKey("T-213"), "T213");
  assert.equal(ticketKey("t213"), "T213");
  assert.equal(ticketKey(" T 213 "), "T213");
  const open = [{ id: "a", title: "Anything", ticket: "T213" }];
  assert.equal(findDuplicates({ title: "Other words", ticket: "T-213" }, open).tasks[0].id, "a");
});

test("same task in other words is a duplicate", () => {
  const open = [
    { id: "a", title: "Show menu items of the category when a plan button is clicked", ticket: null },
    { id: "b", title: "Verify pm2 starts cleanly after the next provider reboot", ticket: null },
  ];
  const r = findDuplicates({ title: "Plan button shows its category's menu items #gk @feature *medium" }, open);
  assert.deepEqual(r.tasks.map((t) => t.id), ["a"]);
});

test("the sheet description counts too", () => {
  const open = [{ id: "a", title: "Keep old plans for offline subscriptions (hidden from menu)", ticket: null }];
  const r = findDuplicates({ title: "[Awaiting confirmation] Legacy plans offline #gk", description: "Keep old plans for offline subscriptions." }, open);
  assert.equal(r.tasks[0]?.id, "a");
});

test("different tasks are not duplicates", () => {
  const open = [{ id: "a", title: "Change referral associations from the admin page", ticket: null }];
  assert.equal(findDuplicates({ title: "Plan button shows its category's menu items" }, open).tasks.length, 0);
  assert.ok(titleSimilarity("Fix login redirect", "Fix signup email") < 0.6);
});

test("a task carrying a different ticket is never a title duplicate", () => {
  const open = [{ id: "a", title: "Plan button shows menu items", ticket: "T-100" }];
  assert.equal(findDuplicates({ title: "Plan button shows menu items", ticket: "T-213" }, open).tasks.length, 0);
});

test("Japanese titles compare by character pairs", () => {
  const open = [{ id: "a", title: "メニュー項目の更新に失敗しました トースト", ticket: null }];
  assert.equal(findDuplicates({ title: "generic メニュー項目の更新に失敗しました toast" }, open).tasks[0]?.id, "a");
});
