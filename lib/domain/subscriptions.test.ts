import { test } from "node:test";
import assert from "node:assert/strict";
import { formatMoney, monthlyCents, nextRenewal, parseAmount, parseCurrency, totalsByCurrency } from "./subscriptions";

test("amounts parse to cents", () => {
  assert.equal(parseAmount("12.99"), 1299);
  assert.equal(parseAmount("1,200"), 120000);
  assert.equal(parseAmount(" 5 "), 500);
  assert.equal(parseAmount("0"), null);
  assert.equal(parseAmount("-3"), null);
  assert.equal(parseAmount("1.234"), null);
  assert.equal(parseAmount("abc"), null);
});

test("currencies are ISO codes", () => {
  assert.equal(parseCurrency("usd"), "USD");
  assert.equal(parseCurrency("LKR"), "LKR");
  assert.equal(parseCurrency("dollars"), null);
});

test("renewals keep the billing day", () => {
  assert.equal(nextRenewal("2026-01-31", "monthly"), "2026-02-28");
  assert.equal(nextRenewal("2026-02-28", "monthly", 31), "2026-03-31");
  assert.equal(nextRenewal("2026-11-15", "quarterly"), "2027-02-15");
  assert.equal(nextRenewal("2028-02-29", "yearly"), "2029-02-28");
  assert.equal(nextRenewal("2026-12-29", "weekly"), "2027-01-05");
  assert.equal(nextRenewal("2026-12-10", "monthly"), "2027-01-10");
});

test("totals per currency, active only", () => {
  assert.equal(monthlyCents(12000, "yearly"), 1000);
  const totals = totalsByCurrency([
    { amount: 2000, currency: "USD", cycle: "monthly", status: "active" },
    { amount: 12000, currency: "USD", cycle: "yearly", status: "active" },
    { amount: 9900, currency: "USD", cycle: "monthly", status: "cancelled" },
    { amount: 150000, currency: "LKR", cycle: "monthly", status: "active" },
  ]);
  assert.deepEqual(totals, [
    { currency: "LKR", month: 150000, year: 1800000 },
    { currency: "USD", month: 3000, year: 36000 },
  ]);
  assert.equal(formatMoney(1299, "USD"), "$12.99");
});
