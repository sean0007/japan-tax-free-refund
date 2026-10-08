import { RATES, type Rate, type Receipt } from "./refund";

export const PUBLIC_URL = "https://japan-tax-free-refund.vercel.app";

/** Share links: /r?d=DEPARTURE&r=store~YYYY-MM-DD~amount~rate[~x] (x = amount excludes tax). Repeat r per receipt. */
type Params = URLSearchParams | Record<string, string | string[] | undefined>;

function all(p: Params, key: string): string[] {
  if (p instanceof URLSearchParams) return p.getAll(key);
  const v = p[key];
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
}
const one = (p: Params, key: string) => all(p, key)[0];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_SHARED = 30;

export type Shared = { departureDate: string | null; receipts: Receipt[] };

export const EXAMPLE_SHARED: Shared = {
  departureDate: "2026-11-20",
  receipts: [
    { store: "Bic Camera Shinjuku", purchaseDate: "2026-11-12", amount: 16500, rate: 10, priceIncludesTax: true },
    { store: "Don Quijote Dotonbori", purchaseDate: "2026-11-14", amount: 3240, rate: 8, priceIncludesTax: true },
    { store: "Don Quijote Dotonbori", purchaseDate: "2026-11-14", amount: 2200, rate: 10, priceIncludesTax: true },
  ],
};

const cleanStore = (s: string) => s.replace(/[~\n\r\t]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);

function parseLine(line: string): Receipt | null {
  const [store, date, amount, rate, flag] = line.split("~");
  const a = Number((amount ?? "").replace(/[,_\s¥]/g, ""));
  const r = Number(rate ?? "10") as Rate;
  if (!store?.trim() || !DATE.test(date ?? "") || !Number.isInteger(a) || a <= 0 || a > 1_000_000_000 || !RATES.includes(r)) return null;
  return { store: cleanStore(store), purchaseDate: date, amount: a, rate: r, priceIncludesTax: flag !== "x" };
}

/** Reads a share URL. Also accepts the API's single-receipt params (amount, rate, purchaseDate, store, departureDate). */
export function parseShared(p: Params): Shared {
  const dep = one(p, "d") ?? one(p, "departureDate");
  const departureDate = dep && DATE.test(dep) ? dep : null;
  const receipts = all(p, "r").map(parseLine).filter((x): x is Receipt => x !== null).slice(0, MAX_SHARED);
  if (!receipts.length && one(p, "amount") && one(p, "purchaseDate")) {
    const line = parseLine(`${one(p, "store") ?? "Store"}~${one(p, "purchaseDate")}~${one(p, "amount")}~${one(p, "rate") ?? "10"}${one(p, "priceIncludesTax") === "false" ? "~x" : ""}`);
    if (line) receipts.push(line);
  }
  return { departureDate, receipts };
}

export function sharedQuery(s: Shared): string {
  const q = new URLSearchParams();
  if (s.departureDate) q.set("d", s.departureDate);
  for (const r of s.receipts.slice(0, MAX_SHARED)) {
    q.append("r", `${cleanStore(r.store)}~${r.purchaseDate}~${r.amount}~${r.rate}${r.priceIncludesTax === false ? "~x" : ""}`);
  }
  return q.toString();
}

export const resultPath = (s: Shared) => `/r?${sharedQuery(s)}`;
export const ogPath = (s: Shared) => `/og?${sharedQuery(s)}`;
export const hasResult = (s: Shared) => s.receipts.length > 0;
export const isExample = (s: Shared) => sharedQuery(s) === sharedQuery(EXAMPLE_SHARED);

export const yen = (n: number) => `¥${Math.round(n).toLocaleString("en-US")}`;
