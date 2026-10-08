// Japan tax-free shopping: refund-method checker (pure functions, integer yen, no I/O).
// Rules verified 2026-10-09 against the official pages listed in SOURCES. See README for quotes.

export const RULES_AS_OF = "2026-10-09";
/** First purchase date under the refund method. Purchases before this use the old tax-off-at-till method. */
export const REFUND_METHOD_START = "2026-11-01";
/** Minimum per store, per day, tax excluded (both regimes). */
export const MIN_TAX_EXCLUSIVE_JPY = 5000;
/** Customs confirmation must happen on departure within 90 days of purchase, counted from the day after purchase. */
export const DEADLINE_DAYS = 90;
/** Old regime only: consumables cap per store per day (abolished from 2026-11-01). */
export const OLD_CONSUMABLES_CAP_JPY = 500_000;
/** Items at or above this tax-excluded unit price may need a certificate of authenticity or warranty at customs. */
export const HIGH_VALUE_ITEM_JPY = 1_000_000;

export const RATES = [10, 8] as const;
export type Rate = (typeof RATES)[number];
export const CATEGORIES = ["general", "consumable", "bullion", "tax_exempt"] as const;
export type Category = (typeof CATEGORIES)[number];
export type Regime = "tax_off" | "refund";

export type Receipt = {
  store: string;
  purchaseDate: string;
  /** Whole yen. */
  amount: number;
  rate: Rate;
  /** Default true: the amount is the tax-inclusive price you paid or will pay. */
  priceIncludesTax?: boolean;
  /** Optional. "bullion" (gold/platinum bullion or coins) and "tax_exempt" items are never refundable. */
  category?: Category;
};

export const SOURCES = [
  "https://www.japan.travel/en/us/blog/everything-you-need-to-know-japans-new-tax-free-shopping-system/",
  "https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00028.html",
  "https://www.mlit.go.jp/kankocho/tax-free/content/001990233.pdf",
  "https://www.mlit.go.jp/kankocho/tax-free/content/001990234.pdf",
  "https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00023.html",
  "https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00024.html",
  "https://www.nta.go.jp/publication/pamph/shohi/menzei/201805/pdf/0025003-110_01.pdf",
  "https://zenmenkyo.jp/refund-top/refund-system-2026/",
] as const;

export const DISCLAIMER =
  "Educational estimate, not tax advice. Rules can change; check the official sources. The tax-free shop, its refund operator, and Japan Customs decide eligibility and the amount you actually receive.";

export const FEE_NOTE =
  "The refund is paid by the tax-free shop or its refund operator (card, app, bank transfer, or cash at the port), not by customs. Japanese law sets no rule on refund fees, so the shop or operator may deduct a handling fee; you can receive less than maxRefundJPY.";

export const CHECKLIST = [
  "Bring the passport you showed at purchase (cruise passengers and crew: also the landing permit).",
  "Each store's purchases are added up per day: you need ¥5,000+ before tax at one store on one day.",
  "Register your refund method (card, app, etc.) at the shop when you buy; ask how and when they pay.",
  "Depart Japan within 90 days of the purchase date (counted from the day after purchase).",
  "Do the tax-free kiosk (or Visit Japan Web at Narita, Haneda, Kansai, Chubu, New Chitose, Fukuoka, Naha) at your FINAL departure airport or seaport, BEFORE checking bags. Checked bags cannot be retrieved for this.",
  "Carry every item from each receipt. If one item from a receipt is missing, nothing on that receipt is refunded.",
  "Take all tax-free goods, general goods and consumables alike, out of Japan unused. Food, drinks, and cosmetics used in Japan are not refundable; if you used some, skip the kiosk and tell the customs counter.",
  "Green result: done. Red result: take the goods to the customs inspection area before boarding. Leave plenty of time; missing your flight is not compensated.",
  "Items costing ¥1,000,000+ before tax: bring the certificate of authenticity or warranty.",
  "Export the goods without delay after customs confirms them, or the tax is collected back and penalties apply.",
] as const;

export class RuleInputError extends Error {}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Validates a YYYY-MM-DD calendar date. */
export function isIsoDate(s: string): boolean {
  const m = DATE_RE.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

/** Calendar date + n days (UTC math, no time zones involved). */
export function addDays(iso: string, n: number): string {
  const m = DATE_RE.exec(iso);
  if (!m || !isIsoDate(iso)) throw new RuleInputError(`Invalid date: ${iso}`);
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + n)).toISOString().slice(0, 10);
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export const regimeFor = (purchaseDate: string): Regime => (purchaseDate < REFUND_METHOD_START ? "tax_off" : "refund");

/**
 * Last day for the customs confirmation: 90 days counted from the day after purchase.
 * NTA example: bought 2026-11-01 -> deadline 2027-01-30.
 */
export const refundDeadline = (purchaseDate: string) => addDays(purchaseDate, DEADLINE_DAYS);

/** Consumption tax inside a tax-inclusive price: floor(amount * rate / (100 + rate)), whole yen. */
export function taxInsidePrice(amount: number, rate: Rate): number {
  return Math.floor((amount * rate) / (100 + rate));
}

/** Consumption tax on top of a tax-exclusive price: floor(amount * rate / 100), whole yen. */
export function taxOnTop(amount: number, rate: Rate): number {
  return Math.floor((amount * rate) / 100);
}

/** Splits one receipt line into tax-exclusive amount, tax, and tax-inclusive total. */
export function splitReceipt(r: Pick<Receipt, "amount" | "rate" | "priceIncludesTax">) {
  const includes = r.priceIncludesTax !== false;
  const tax = includes ? taxInsidePrice(r.amount, r.rate) : taxOnTop(r.amount, r.rate);
  const taxExclusive = includes ? r.amount - tax : r.amount;
  return { taxExclusive, consumptionTax: tax, taxInclusive: taxExclusive + tax };
}

export type Group = {
  store: string;
  purchaseDate: string;
  regime: Regime;
  receipts: number;
  taxInclusive: number;
  taxExclusive: number;
  consumptionTax: number;
  eligible: boolean;
  reason: string;
  /** Refund method only; null for tax-off purchases. */
  refundDeadline: string | null;
  departureAfterDeadline: boolean | null;
  /** Days between departure and the deadline (positive = spare days). Null without a departure date or for tax-off. */
  daysToSpare: number | null;
  /** Expected consumption-tax refund for this group before any operator fee (0 if not eligible or too late). */
  refundJPY: number;
  /** Tax-off regime only: tax not charged at the till. */
  taxWaivedAtTillJPY: number;
};

export type CheckResult = {
  rulesAsOf: string;
  currency: "JPY";
  departureDate: string | null;
  groups: Group[];
  excluded: { store: string; purchaseDate: string; amount: number; category: Category; reason: string }[];
  maxRefundJPY: number;
  notes: string[];
  checklist: string[];
  sources: string[];
  disclaimer: string;
};

const normStore = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

export function validateReceipt(r: Receipt, i: number): void {
  const at = `receipts[${i}]`;
  if (!r.store || !r.store.trim()) throw new RuleInputError(`${at}.store is required`);
  if (r.store.length > 120) throw new RuleInputError(`${at}.store is too long (max 120 characters)`);
  if (!isIsoDate(r.purchaseDate)) throw new RuleInputError(`${at}.purchaseDate must be YYYY-MM-DD`);
  if (!Number.isInteger(r.amount) || r.amount <= 0) throw new RuleInputError(`${at}.amount must be a positive whole number of yen`);
  if (r.amount > 1_000_000_000) throw new RuleInputError(`${at}.amount is too large (max 1,000,000,000 yen)`);
  if (!RATES.includes(r.rate)) throw new RuleInputError(`${at}.rate must be 10 or 8`);
  if (r.category !== undefined && !CATEGORIES.includes(r.category)) {
    throw new RuleInputError(`${at}.category must be one of ${CATEGORIES.join(", ")}`);
  }
}

/** Main entry: group receipts by store + purchase date, apply the regime for each date, and total the refund. */
export function checkRefund(receipts: Receipt[], departureDate?: string | null): CheckResult {
  if (!Array.isArray(receipts) || receipts.length === 0) throw new RuleInputError("Send at least one receipt");
  if (receipts.length > 200) throw new RuleInputError("Too many receipts (max 200)");
  receipts.forEach(validateReceipt);
  const dep = departureDate ?? null;
  if (dep !== null && !isIsoDate(dep)) throw new RuleInputError("departureDate must be YYYY-MM-DD");

  const notes: string[] = [FEE_NOTE];
  const excluded: CheckResult["excluded"] = [];
  type Acc = { store: string; purchaseDate: string; receipts: number; inc: number; exc: number; tax: number; consumablesExc: number; highValue: boolean };
  const map = new Map<string, Acc>();

  for (const r of receipts) {
    if (r.category === "bullion" || r.category === "tax_exempt") {
      excluded.push({
        store: r.store.trim(),
        purchaseDate: r.purchaseDate,
        amount: r.amount,
        category: r.category,
        reason:
          r.category === "bullion"
            ? "Gold and platinum bullion (and, from 2026-11-01, gold and platinum coins) are not tax-free goods."
            : "Items already exempt from consumption tax have no tax to refund.",
      });
      continue;
    }
    const key = `${normStore(r.store)}|${r.purchaseDate}`;
    const s = splitReceipt(r);
    const acc = map.get(key) ?? { store: r.store.trim().replace(/\s+/g, " "), purchaseDate: r.purchaseDate, receipts: 0, inc: 0, exc: 0, tax: 0, consumablesExc: 0, highValue: false };
    acc.receipts += 1;
    acc.inc += s.taxInclusive;
    acc.exc += s.taxExclusive;
    acc.tax += s.consumptionTax;
    if (r.category === "consumable") acc.consumablesExc += s.taxExclusive;
    if (s.taxExclusive >= HIGH_VALUE_ITEM_JPY) acc.highValue = true;
    map.set(key, acc);
  }

  const groups: Group[] = [];
  let anyTaxOff = false;
  let anyLate = false;
  let anyHighValue = false;
  let anyBeforePurchase = false;

  for (const a of [...map.values()].sort((x, y) => (x.purchaseDate === y.purchaseDate ? x.store.localeCompare(y.store) : x.purchaseDate < y.purchaseDate ? -1 : 1))) {
    const regime = regimeFor(a.purchaseDate);
    const meetsMin = a.exc >= MIN_TAX_EXCLUSIVE_JPY;
    if (a.highValue) anyHighValue = true;

    if (regime === "tax_off") {
      anyTaxOff = true;
      const overCap = a.consumablesExc > OLD_CONSUMABLES_CAP_JPY;
      const eligible = meetsMin && !overCap;
      groups.push({
        store: a.store,
        purchaseDate: a.purchaseDate,
        regime,
        receipts: a.receipts,
        taxInclusive: a.inc,
        taxExclusive: a.exc,
        consumptionTax: a.tax,
        eligible,
        reason: !meetsMin
          ? `Under ¥${MIN_TAX_EXCLUSIVE_JPY.toLocaleString("en-US")} before tax at this store on this day.`
          : overCap
            ? "Old rules cap consumables at ¥500,000 before tax per store per day."
            : "Old tax-off method: the shop removes the tax at the till; there is nothing to claim back later.",
        refundDeadline: null,
        departureAfterDeadline: null,
        daysToSpare: null,
        refundJPY: 0,
        taxWaivedAtTillJPY: eligible ? a.tax : 0,
      });
      continue;
    }

    const deadline = refundDeadline(a.purchaseDate);
    const late = dep !== null && dep > deadline;
    const beforePurchase = dep !== null && dep < a.purchaseDate;
    if (late) anyLate = true;
    if (beforePurchase) anyBeforePurchase = true;
    const refundJPY = meetsMin && !late && !beforePurchase ? a.tax : 0;
    groups.push({
      store: a.store,
      purchaseDate: a.purchaseDate,
      regime,
      receipts: a.receipts,
      taxInclusive: a.inc,
      taxExclusive: a.exc,
      consumptionTax: a.tax,
      eligible: meetsMin,
      reason: !meetsMin
        ? `Under ¥${MIN_TAX_EXCLUSIVE_JPY.toLocaleString("en-US")} before tax at this store on this day (¥${a.exc.toLocaleString("en-US")}). Buying ¥${(MIN_TAX_EXCLUSIVE_JPY - a.exc).toLocaleString("en-US")} more there the same day would qualify.`
        : beforePurchase
          ? "Departure date is before the purchase date; check your dates."
          : late
            ? `Departure is after the customs deadline (${deadline}); no refund for this group.`
            : "Meets ¥5,000 before tax at one store on one day. Refund after customs confirms export.",
      refundDeadline: deadline,
      departureAfterDeadline: dep === null ? null : late,
      daysToSpare: dep === null ? null : daysBetween(dep, deadline),
      refundJPY,
      taxWaivedAtTillJPY: 0,
    });
  }

  if (anyTaxOff) {
    notes.push(
      `Purchases before ${REFUND_METHOD_START} use the old tax-off method: eligible shops charge the tax-exclusive price at the till, so there is no refund to claim. You still show your passport and the goods may be checked at customs when you leave. Old rules also split general goods and consumables (each ¥5,000+ before tax, consumables up to ¥500,000, sealed packaging) unless the shop packs them together.`,
    );
  }
  if (groups.some((g) => g.regime === "refund")) {
    notes.push(
      `From ${REFUND_METHOD_START} you pay the tax-inclusive price, then get the consumption tax back after customs confirms the goods are leaving Japan. No general/consumable split, no ¥500,000 cap, no sealed bags.`,
    );
  }
  if (dep === null) notes.push("No departureDate given, so the 90-day deadline was not checked against your departure.");
  if (anyLate) notes.push("At least one group is past its 90-day customs deadline on your departure date and is excluded from maxRefundJPY.");
  if (anyBeforePurchase) notes.push("At least one purchase date is after your departure date; those groups are excluded.");
  if (anyHighValue) notes.push("A receipt line is ¥1,000,000+ before tax; customs may ask for a certificate of authenticity or warranty for items that expensive.");
  if (excluded.length) notes.push("Some lines were excluded (bullion/coins or tax-exempt items) and do not count toward the ¥5,000 minimum.");
  notes.push("Tax is estimated per line as floor(amount × rate / (100 + rate)). Shops may round per item; the figure on your receipt or refund record wins.");
  notes.push("Eligible purchasers are mainly foreign visitors in Japan for less than six months since entry (and Japanese nationals living abroad 2+ years, with proof).");

  return {
    rulesAsOf: RULES_AS_OF,
    currency: "JPY",
    departureDate: dep,
    groups,
    excluded,
    maxRefundJPY: groups.reduce((s, g) => s + g.refundJPY, 0),
    notes,
    checklist: [...CHECKLIST],
    sources: [...SOURCES],
    disclaimer: DISCLAIMER,
  };
}

/** Plain explanation of both regimes for GET /api/rules. */
export const RULES = {
  rulesAsOf: RULES_AS_OF,
  summary:
    "Japan's tax-free shopping for visitors switches on 2026-11-01 from tax-off-at-the-till to a refund method: pay the tax-inclusive price, get the consumption tax back after customs confirms on departure (before checking bags) within 90 days of purchase.",
  regimes: [
    {
      regime: "tax_off",
      appliesTo: `Purchases on or before 2026-10-31`,
      howItWorks: "Eligible shops sell at the tax-exclusive price after checking your passport. Nothing to claim back later.",
      minimumPerStorePerDay: "¥5,000 before tax",
      categories: "General goods and consumables are separate; each needs ¥5,000+ before tax unless packed together. Consumables capped at ¥500,000 and sealed in special packaging.",
      atDeparture: "Present your passport; customs may inspect the goods (after security, restricted area).",
      deadline: null,
    },
    {
      regime: "refund",
      appliesTo: "Purchases on or after 2026-11-01",
      howItWorks:
        "Pay the tax-inclusive price at a tax-free shop and register a refund method. On departure, scan your passport at a tax-free kiosk (or Visit Japan Web at major airports) BEFORE checking bags. Green = done; Red = customs inspection. After customs confirms, the shop or its refund operator pays back the consumption tax.",
      minimumPerStorePerDay: "¥5,000 before tax (same purchaser, same store, same day)",
      categories: "No general/consumable split, no ¥500,000 cap, no sealed bags. Quantities limited to what you can carry out yourself. Consumables used in Japan are not refundable.",
      atDeparture: "Final departure airport/seaport, international departure lobby, before baggage check-in.",
      deadline: "Customs confirmation on departure within 90 days of purchase, counted from the day after purchase (bought 2026-11-01 -> by 2027-01-30).",
    },
  ],
  taxMath: {
    standardRate: 10,
    reducedRate: 8,
    reducedRateCovers: "Food and non-alcoholic drinks (not restaurant dining).",
    taxInsideTaxInclusivePrice: "floor(amount * rate / (100 + rate))",
    examples: ["¥11,000 at 10% -> ¥1,000 tax", "¥5,400 at 8% -> ¥400 tax", "¥16,500 at 10% -> ¥1,500 tax, ¥15,000 before tax"],
  },
  notEligible: ["Gold and platinum bullion", "Gold and platinum coins (from 2026-11-01)", "Items exempt from consumption tax", "Goods used or consumed in Japan before departure"],
  fees: FEE_NOTE,
  checklist: [...CHECKLIST],
  sources: [...SOURCES],
  disclaimer: DISCLAIMER,
};
