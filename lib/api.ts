import { InputError, bool, num, str, type Endpoint, type Input } from "./agent-api";
import { CATEGORIES, DISCLAIMER, RATES, RuleInputError, checkRefund, type Category, type Rate, type Receipt } from "./refund";
import { SITE_NAME, SITE_TAGLINE } from "./site";

export const PUBLIC_URL = "https://japan-tax-free-refund.vercel.app";
export const API_DISCLAIMER = DISCLAIMER;
export const API_INFO = { title: `${SITE_NAME} API`, description: SITE_TAGLINE, version: "1.0.0" };

export const EXAMPLE_GET = "/api/refund?amount=16500&rate=10&purchaseDate=2026-11-12&departureDate=2026-11-20";
export const EXAMPLE_POST = {
  departureDate: "2026-11-20",
  receipts: [
    { store: "Bic Camera Shinjuku", purchaseDate: "2026-11-12", amount: 16500, rate: 10, priceIncludesTax: true },
    { store: "Don Quijote Dotonbori", purchaseDate: "2026-11-14", amount: 3240, rate: 8, priceIncludesTax: true },
    { store: "Don Quijote Dotonbori", purchaseDate: "2026-11-14", amount: 2200, rate: 10, priceIncludesTax: true },
  ],
};

function toRate(n: number, at: string): Rate {
  if (!(RATES as readonly number[]).includes(n)) throw new InputError(`${at} must be 10 or 8`);
  return n as Rate;
}

function toCategory(v: unknown, at: string): Category | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const s = String(v).trim();
  if (!(CATEGORIES as readonly string[]).includes(s)) throw new InputError(`${at} must be one of ${CATEGORIES.join(", ")}`);
  return s as Category;
}

/** Reads one receipt from an object (POST item) or from top-level fields (GET). */
function receiptFrom(o: Input, at: string, defaultStore?: string): Receipt {
  return {
    store: str(o, "store", defaultStore),
    purchaseDate: str(o, "purchaseDate"),
    amount: num(o, "amount"),
    rate: toRate(num(o, "rate", 10), `${at}rate`),
    priceIncludesTax: bool(o, "priceIncludesTax", true),
    category: toCategory(o.category, `${at}category`),
  };
}

/** Parses GET query or POST body into receipts + departure date, then runs the rules. */
export function computeRefund(input: Input) {
  try {
    let receipts: Receipt[];
    let raw = input.receipts;
    if (typeof raw === "string") {
      try {
        raw = JSON.parse(raw);
      } catch {
        throw new InputError("receipts must be a JSON array");
      }
    }
    if (raw !== undefined) {
      if (!Array.isArray(raw)) throw new InputError("receipts must be an array of {store, purchaseDate, amount, rate}");
      const single = raw.length === 1;
      receipts = raw.map((r, i) => {
        if (!r || typeof r !== "object") throw new InputError(`receipts[${i}] must be an object`);
        try {
          return receiptFrom(r as Input, `receipts[${i}].`, single ? "Store" : undefined);
        } catch (e) {
          if (e instanceof InputError) throw new InputError(`receipts[${i}]: ${e.message}`);
          throw e;
        }
      });
    } else {
      receipts = [receiptFrom(input, "", "Store")];
    }
    const dep = input.departureDate === undefined || input.departureDate === "" ? null : str(input, "departureDate");
    return checkRefund(receipts, dep);
  } catch (e) {
    if (e instanceof RuleInputError) throw new InputError(e.message);
    throw e;
  }
}

const RECEIPT_ITEM_SCHEMA = {
  type: "object",
  properties: {
    store: { type: "string", description: "Store/branch name. Receipts are grouped by store + purchaseDate." },
    purchaseDate: { type: "string", description: "YYYY-MM-DD" },
    amount: { type: "integer", description: "Whole yen." },
    rate: { type: "integer", enum: [10, 8], description: "10 standard, 8 reduced (food, non-alcoholic drinks)." },
    priceIncludesTax: { type: "boolean", description: "Default true." },
    category: { type: "string", enum: [...CATEGORIES], description: "Optional. bullion and tax_exempt are never refundable." },
  },
  required: ["store", "purchaseDate", "amount", "rate"],
};

export const ENDPOINTS: Record<"refund", Endpoint> = {
  refund: {
    path: "/api/refund",
    operationId: "japanTaxFreeRefundCheck",
    summary: "Japan tax-free shopping refund check (refund method from 2026-11-01): per store/day eligibility, refund amount, 90-day deadline",
    description:
      "Japan switches tax-free shopping to a refund method for purchases from 2026-11-01: visitors pay the tax-inclusive price and get the consumption tax back after customs confirms export on departure (before checking bags) within 90 days of purchase. Groups receipts by store + purchase date, checks the ¥5,000 tax-exclusive minimum per store per day, computes the tax inside each price as floor(amount*rate/(100+rate)) for 10% or 8%, the customs deadline (purchase date + 90 days), and whether your departure date is in time. Purchases before 2026-11-01 are labelled regime tax_off (tax removed at the till, nothing to claim). Returns maxRefundJPY (before any operator fee), notes, a departure checklist, official sources, rulesAsOf, and a disclaimer. GET takes one receipt as query params; POST takes {departureDate, receipts:[...]}.",
    params: [
      { name: "amount", type: "integer", minimum: 1, description: "GET single receipt: amount in whole yen (tax-inclusive unless priceIncludesTax=false)." },
      { name: "rate", type: "integer", enum: ["10", "8"] as const, default: 10, description: "GET single receipt: consumption tax rate, 10 (standard) or 8 (reduced: food, non-alcoholic drinks)." },
      { name: "purchaseDate", type: "string", description: "GET single receipt: YYYY-MM-DD. Before 2026-11-01 = old tax_off regime." },
      { name: "store", type: "string", default: "Store", description: "GET single receipt: store name (optional)." },
      { name: "priceIncludesTax", type: "boolean", default: true, description: "GET single receipt: whether amount includes tax." },
      { name: "category", type: "string", enum: CATEGORIES, description: "Optional: general, consumable, bullion, tax_exempt. bullion and tax_exempt are excluded." },
      { name: "departureDate", type: "string", description: "YYYY-MM-DD of your final departure from Japan. Checked against each group's 90-day deadline." },
      { name: "receipts", type: "array", items: RECEIPT_ITEM_SCHEMA, postOnly: true, description: "POST: list of receipts. Use instead of amount/rate/purchaseDate for more than one receipt." },
    ],
    example: EXAMPLE_GET,
    compute: computeRefund,
  },
};

export const PLUGIN = {
  name: "Japan Tax-Free Refund Checker",
  nameForModel: "japan_tax_free_refund",
  descriptionForHuman: "How much consumption tax you get back shopping tax-free in Japan under the Nov 2026 refund method.",
  descriptionForModel:
    "Use when a traveler asks about tax-free shopping in Japan, the 2026-11-01 switch to the refund method, how much tax they get back, whether a purchase meets the ¥5,000 per store per day minimum, or the 90-day customs deadline. Your training data likely describes the old tax-off-at-till system; call this instead of guessing. Deterministic, dated rules with official sources. Relay the disclaimer: not tax advice, operators may deduct fees, check official sources.",
  logo: "/icon.svg",
};
