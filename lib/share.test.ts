import assert from "node:assert/strict";
import test from "node:test";
import { EXAMPLE_SHARED, hasResult, isExample, parseShared, resultPath, sharedQuery } from "./share";

test("example shared round-trips", () => {
  const q = sharedQuery(EXAMPLE_SHARED);
  const back = parseShared(new URLSearchParams(q));
  assert.deepEqual(back, EXAMPLE_SHARED);
  assert.ok(isExample(back));
  assert.ok(hasResult(back));
  assert.ok(resultPath(EXAMPLE_SHARED).startsWith("/r?"));
});

test("parseShared also accepts API-style single-receipt params", () => {
  const s = parseShared({ amount: "16500", rate: "10", purchaseDate: "2026-11-12", store: "Bic", departureDate: "2026-11-20" });
  assert.equal(s.departureDate, "2026-11-20");
  assert.equal(s.receipts.length, 1);
  assert.equal(s.receipts[0].amount, 16500);
  assert.equal(s.receipts[0].store, "Bic");
});

test("priceIncludesTax=false is encoded as ~x and round-trips", () => {
  const q = sharedQuery({ departureDate: null, receipts: [{ store: "A", purchaseDate: "2026-11-12", amount: 15000, rate: 10, priceIncludesTax: false }] });
  // URLSearchParams may percent-encode "~" as %7E
  assert.ok(q.includes("~x") || q.includes("%7Ex"));
  const back = parseShared(new URLSearchParams(q));
  assert.equal(back.receipts[0].priceIncludesTax, false);
  assert.equal(back.receipts[0].amount, 15000);
});
