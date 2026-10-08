import assert from "node:assert/strict";
import test from "node:test";
import {
  MIN_TAX_EXCLUSIVE_JPY,
  REFUND_METHOD_START,
  RuleInputError,
  addDays,
  checkRefund,
  refundDeadline,
  regimeFor,
  splitReceipt,
  taxInsidePrice,
  taxOnTop,
} from "./refund";

test("tax inside tax-inclusive price uses floor(amount * rate / (100 + rate))", () => {
  assert.equal(taxInsidePrice(11000, 10), 1000);
  assert.equal(taxInsidePrice(5400, 8), 400);
  assert.equal(taxInsidePrice(16500, 10), 1500);
  assert.equal(taxInsidePrice(3240, 8), 240);
  assert.equal(taxInsidePrice(2200, 10), 200);
  // floor, not round: 1000 * 10 / 110 = 90.909... -> 90
  assert.equal(taxInsidePrice(1000, 10), 90);
  assert.equal(taxInsidePrice(108, 8), 8);
});

test("tax on top of tax-exclusive price uses floor(amount * rate / 100)", () => {
  assert.equal(taxOnTop(15000, 10), 1500);
  assert.equal(taxOnTop(3000, 8), 240);
});

test("splitReceipt defaults to tax-inclusive", () => {
  assert.deepEqual(splitReceipt({ amount: 16500, rate: 10 }), { taxExclusive: 15000, consumptionTax: 1500, taxInclusive: 16500 });
  assert.deepEqual(splitReceipt({ amount: 15000, rate: 10, priceIncludesTax: false }), { taxExclusive: 15000, consumptionTax: 1500, taxInclusive: 16500 });
});

test("regime cutoff: before 2026-11-01 is tax_off, on/after is refund", () => {
  assert.equal(regimeFor("2026-10-31"), "tax_off");
  assert.equal(regimeFor("2026-11-01"), "refund");
  assert.equal(regimeFor(REFUND_METHOD_START), "refund");
});

test("90-day deadline is purchase date + 90 days (NTA: bought 2026-11-01 -> 2027-01-30)", () => {
  assert.equal(refundDeadline("2026-11-01"), "2027-01-30");
  assert.equal(addDays("2026-11-01", 90), "2027-01-30");
  assert.equal(refundDeadline("2026-11-12"), "2027-02-10");
  assert.equal(refundDeadline("2026-11-14"), "2027-02-12");
});

test("¥5,000 tax-exclusive threshold: under is not eligible", () => {
  // ¥5,499 at 10% inclusive -> tax 499, exclusive 5,000 -> eligible
  const ok = checkRefund([{ store: "A", purchaseDate: "2026-11-12", amount: 5499, rate: 10 }], "2026-11-20");
  assert.equal(ok.groups[0].taxExclusive, 5000);
  assert.equal(ok.groups[0].eligible, true);
  assert.equal(ok.maxRefundJPY, 499);

  // ¥5,498 at 10% -> exclusive 4,999 -> not eligible
  const no = checkRefund([{ store: "A", purchaseDate: "2026-11-12", amount: 5498, rate: 10 }], "2026-11-20");
  assert.equal(no.groups[0].taxExclusive, 4999);
  assert.equal(no.groups[0].eligible, false);
  assert.equal(no.maxRefundJPY, 0);
  assert.ok(no.groups[0].reason.includes(String(MIN_TAX_EXCLUSIVE_JPY.toLocaleString("en-US"))));
});

test("groups receipts by store + purchase date (same store, same day, mixed rates)", () => {
  const r = checkRefund(
    [
      { store: "Don Quijote Dotonbori", purchaseDate: "2026-11-14", amount: 3240, rate: 8 },
      { store: "Don Quijote Dotonbori", purchaseDate: "2026-11-14", amount: 2200, rate: 10 },
      { store: "Bic Camera Shinjuku", purchaseDate: "2026-11-12", amount: 16500, rate: 10 },
    ],
    "2026-11-20",
  );
  assert.equal(r.groups.length, 2);
  const don = r.groups.find((g) => g.store.includes("Don"));
  const bic = r.groups.find((g) => g.store.includes("Bic"));
  assert.ok(don && bic);
  assert.equal(don.taxExclusive, 5000);
  assert.equal(don.consumptionTax, 440);
  assert.equal(don.eligible, true);
  assert.equal(don.refundJPY, 440);
  assert.equal(bic.taxExclusive, 15000);
  assert.equal(bic.consumptionTax, 1500);
  assert.equal(r.maxRefundJPY, 1940);
  assert.equal(r.rulesAsOf, "2026-10-09");
  assert.ok(r.checklist.length >= 8);
  assert.ok(r.sources.length >= 3);
  assert.ok(r.disclaimer.toLowerCase().includes("not tax advice"));
  assert.ok(r.notes.some((n) => /fee|手数料|handling/i.test(n)));
});

test("same store on different days are separate groups", () => {
  const r = checkRefund(
    [
      { store: "Uniqlo", purchaseDate: "2026-11-12", amount: 3300, rate: 10 },
      { store: "Uniqlo", purchaseDate: "2026-11-13", amount: 3300, rate: 10 },
    ],
    "2026-11-20",
  );
  assert.equal(r.groups.length, 2);
  assert.ok(r.groups.every((g) => !g.eligible));
  assert.equal(r.maxRefundJPY, 0);
});

test("store name matching is case/space insensitive for grouping", () => {
  const r = checkRefund(
    [
      { store: "Bic  Camera", purchaseDate: "2026-11-12", amount: 3300, rate: 10 },
      { store: "bic camera", purchaseDate: "2026-11-12", amount: 2200, rate: 10 },
    ],
    "2026-11-20",
  );
  assert.equal(r.groups.length, 1);
  assert.equal(r.groups[0].taxExclusive, 5000);
  assert.equal(r.groups[0].eligible, true);
});

test("departure after 90-day deadline zeroes refundJPY for that group", () => {
  // bought 2026-11-01, deadline 2027-01-30; depart 2027-01-31 = late
  const late = checkRefund([{ store: "A", purchaseDate: "2026-11-01", amount: 11000, rate: 10 }], "2027-01-31");
  assert.equal(late.groups[0].refundDeadline, "2027-01-30");
  assert.equal(late.groups[0].eligible, true);
  assert.equal(late.groups[0].departureAfterDeadline, true);
  assert.equal(late.groups[0].refundJPY, 0);
  assert.equal(late.maxRefundJPY, 0);

  const ok = checkRefund([{ store: "A", purchaseDate: "2026-11-01", amount: 11000, rate: 10 }], "2027-01-30");
  assert.equal(ok.groups[0].departureAfterDeadline, false);
  assert.equal(ok.groups[0].refundJPY, 1000);
  assert.equal(ok.maxRefundJPY, 1000);
});

test("purchases before 2026-11-01 are tax_off with no later refund", () => {
  const r = checkRefund([{ store: "A", purchaseDate: "2026-10-31", amount: 11000, rate: 10 }], "2026-11-05");
  assert.equal(r.groups[0].regime, "tax_off");
  assert.equal(r.groups[0].eligible, true);
  assert.equal(r.groups[0].refundJPY, 0);
  assert.equal(r.groups[0].taxWaivedAtTillJPY, 1000);
  assert.equal(r.groups[0].refundDeadline, null);
  assert.equal(r.maxRefundJPY, 0);
  assert.ok(r.notes.some((n) => /tax-off|tax off|till/i.test(n)));
});

test("bullion and tax_exempt lines are excluded and do not count toward the minimum", () => {
  const r = checkRefund(
    [
      { store: "A", purchaseDate: "2026-11-12", amount: 5500, rate: 10, category: "bullion" },
      { store: "A", purchaseDate: "2026-11-12", amount: 3300, rate: 10 },
    ],
    "2026-11-20",
  );
  assert.equal(r.excluded.length, 1);
  assert.equal(r.excluded[0].category, "bullion");
  assert.equal(r.groups.length, 1);
  assert.equal(r.groups[0].eligible, false);
  assert.equal(r.maxRefundJPY, 0);
});

test("rejects bad input", () => {
  assert.throws(() => checkRefund([]), RuleInputError);
  assert.throws(() => checkRefund([{ store: "A", purchaseDate: "2026-13-01", amount: 1000, rate: 10 }]), RuleInputError);
  assert.throws(() => checkRefund([{ store: "A", purchaseDate: "2026-11-01", amount: 1000, rate: 10 }], "not-a-date"), RuleInputError);
});
