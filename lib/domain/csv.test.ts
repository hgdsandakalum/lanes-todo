import { test } from "node:test";
import assert from "node:assert/strict";
import { csvRecords, parseCsv, toCsv } from "./csv";

test("round trip with commas, quotes and newlines", () => {
  const rows = [["title", "notes"], ['Fix "login", fast', "line 1\nline 2"], ["plain", ""]];
  assert.deepEqual(parseCsv(toCsv(rows)), rows.slice(0, 2).concat([["plain", ""]]));
});

test("formula-looking cells are kept as text", () => {
  assert.equal(toCsv([["=1+1", "-x", "ok"]]), "'=1+1,'-x,ok\r\n");
});

test("records by header, BOM and CRLF tolerated", () => {
  assert.deepEqual(csvRecords("﻿Title,Project\r\nA,GK\r\n\r\nB,OT"), [
    { title: "A", project: "GK" },
    { title: "B", project: "OT" },
  ]);
});
