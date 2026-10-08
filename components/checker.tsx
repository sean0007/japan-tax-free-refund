"use client";

import { useMemo, useState } from "react";
import { CardDisclaimer } from "@/components/card-disclaimer";
import { ShareBar } from "@/components/share-bar";
import { checkRefund, type Rate, type Receipt } from "@/lib/refund";
import { PUBLIC_URL, resultPath, yen, type Shared } from "@/lib/share";

type Row = { store: string; purchaseDate: string; amount: string; rate: "10" | "8"; priceIncludesTax: boolean };

const emptyRow = (): Row => ({ store: "", purchaseDate: "2026-11-12", amount: "", rate: "10", priceIncludesTax: true });

const EXAMPLE_ROWS: Row[] = [
  { store: "Bic Camera Shinjuku", purchaseDate: "2026-11-12", amount: "16500", rate: "10", priceIncludesTax: true },
  { store: "Don Quijote Dotonbori", purchaseDate: "2026-11-14", amount: "3240", rate: "8", priceIncludesTax: true },
  { store: "Don Quijote Dotonbori", purchaseDate: "2026-11-14", amount: "2200", rate: "10", priceIncludesTax: true },
];

function toReceipts(rows: Row[]): Receipt[] {
  return rows
    .filter((r) => r.store.trim() && r.purchaseDate && Number(r.amount) > 0)
    .map((r) => ({
      store: r.store.trim(),
      purchaseDate: r.purchaseDate,
      amount: Math.floor(Number(String(r.amount).replace(/[,_\s¥]/g, ""))),
      rate: Number(r.rate) as Rate,
      priceIncludesTax: r.priceIncludesTax,
    }));
}

export function Checker({ initial }: { initial?: Shared }) {
  const [departureDate, setDepartureDate] = useState(initial?.departureDate ?? "2026-11-20");
  const [rows, setRows] = useState<Row[]>(
    initial?.receipts?.length
      ? initial.receipts.map((r) => ({
          store: r.store,
          purchaseDate: r.purchaseDate,
          amount: String(r.amount),
          rate: String(r.rate) as "10" | "8",
          priceIncludesTax: r.priceIncludesTax !== false,
        }))
      : EXAMPLE_ROWS,
  );

  const receipts = useMemo(() => toReceipts(rows), [rows]);
  const shared: Shared = useMemo(() => ({ departureDate: departureDate || null, receipts }), [departureDate, receipts]);
  const result = useMemo(() => {
    try {
      return receipts.length ? checkRefund(receipts, departureDate || null) : null;
    } catch {
      return null;
    }
  }, [receipts, departureDate]);
  const shareUrl = `${PUBLIC_URL}${resultPath(shared)}`;

  const setRow = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
      <div className="rounded-3xl border border-line bg-panel/60 p-5 sm:p-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">Your trip</p>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">Final departure from Japan</span>
          <span className="mt-0.5 block text-xs text-muted">The airport or seaport where you leave Japan for good</span>
          <input
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            className="mt-2 w-full max-w-xs rounded-xl border border-line bg-black/40 px-3 py-2 font-mono text-sm text-foreground focus:border-amber"
          />
        </label>

        <div className="mt-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Receipts</p>
            <p className="text-xs text-muted">Grouped by store + day. Same store, same day, any mix of 8% and 10%.</p>
          </div>
          <button
            type="button"
            onClick={() => setRows((rs) => [...rs, emptyRow()])}
            className="rounded-full border border-line px-3 py-1.5 text-sm hover:border-amber/60"
          >
            Add receipt
          </button>
        </div>

        <ul className="mt-3 space-y-3">
          {rows.map((r, i) => (
            <li key={i} className="rounded-2xl border border-line bg-black/30 p-3 sm:p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="text-xs text-muted">Store</span>
                  <input
                    value={r.store}
                    onChange={(e) => setRow(i, { store: e.target.value })}
                    placeholder="Bic Camera Shinjuku"
                    className="mt-1 w-full rounded-xl border border-line bg-black/40 px-3 py-2 text-sm text-foreground focus:border-amber"
                  />
                </label>
                <label>
                  <span className="text-xs text-muted">Purchase date</span>
                  <input
                    type="date"
                    value={r.purchaseDate}
                    onChange={(e) => setRow(i, { purchaseDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-black/40 px-3 py-2 font-mono text-sm text-foreground focus:border-amber"
                  />
                </label>
                <label>
                  <span className="text-xs text-muted">Amount (yen)</span>
                  <input
                    inputMode="numeric"
                    value={r.amount}
                    onChange={(e) => setRow(i, { amount: e.target.value.replace(/[^0-9]/g, "") })}
                    placeholder="16500"
                    className="mt-1 w-full rounded-xl border border-line bg-black/40 px-3 py-2 font-mono text-sm text-foreground focus:border-amber"
                  />
                </label>
                <label>
                  <span className="text-xs text-muted">Tax rate</span>
                  <select
                    value={r.rate}
                    onChange={(e) => setRow(i, { rate: e.target.value as "10" | "8" })}
                    className="mt-1 w-full rounded-xl border border-line bg-black/40 px-3 py-2 text-sm text-foreground focus:border-amber"
                  >
                    <option value="10">10% standard</option>
                    <option value="8">8% reduced (food, drinks)</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 pt-5 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={r.priceIncludesTax}
                    onChange={(e) => setRow(i, { priceIncludesTax: e.target.checked })}
                    className="size-4 accent-amber"
                  />
                  Amount includes tax
                </label>
              </div>
              {rows.length > 1 && (
                <button type="button" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} className="mt-2 text-xs text-muted underline hover:text-foreground">
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          {initial?.receipts?.length ? "Pre-filled from a shared link. Edit any field." : "Pre-filled with a Bic Camera + Don Quijote example. Replace with your receipts."}
        </p>
      </div>

      <article data-testid="result-card" className="relative flex flex-col overflow-hidden rounded-3xl border border-line bg-black/50 lg:sticky lg:top-16 lg:self-start">
        <div className="p-5 sm:p-7">
          <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">Max refund (before fees)</p>
          {result ? (
            <>
              <h2 className="mt-2 font-display text-5xl text-teal-200">{yen(result.maxRefundJPY)}</h2>
              <p className="mt-2 text-sm text-muted">
                Rules as of {result.rulesAsOf}
                {result.departureDate ? ` · depart ${result.departureDate}` : ""}
              </p>
              <ul className="mt-5 space-y-3">
                {result.groups.map((g) => (
                  <li key={`${g.store}-${g.purchaseDate}`} className={`rounded-2xl border p-3 ${g.eligible && g.refundJPY > 0 ? "border-teal-200/30 bg-teal-200/5" : g.eligible && g.regime === "tax_off" ? "border-amber/30 bg-amber/5" : "border-line"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{g.store}</p>
                        <p className="text-xs text-muted">
                          {g.purchaseDate} · {g.regime === "refund" ? "refund method" : "old tax-off"} · {g.receipts} line{g.receipts === 1 ? "" : "s"}
                        </p>
                      </div>
                      <p className="font-mono text-sm text-foreground">{g.refundJPY > 0 ? yen(g.refundJPY) : g.taxWaivedAtTillJPY > 0 ? `${yen(g.taxWaivedAtTillJPY)} off` : "—"}</p>
                    </div>
                    <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <dt className="text-muted">Before tax</dt>
                        <dd className="font-mono">{yen(g.taxExclusive)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Tax</dt>
                        <dd className="font-mono">{yen(g.consumptionTax)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">{g.regime === "refund" ? "Deadline" : "Status"}</dt>
                        <dd className="font-mono">{g.refundDeadline ?? (g.eligible ? "at till" : "n/a")}</dd>
                      </div>
                    </dl>
                    <p className="mt-2 text-xs leading-relaxed text-muted">{g.reason}</p>
                    {g.departureAfterDeadline && <p className="mt-1 text-xs text-rose-300">Departure is after the 90-day customs deadline.</p>}
                  </li>
                ))}
              </ul>
              {result.excluded.length > 0 && (
                <div className="mt-3 rounded-2xl border border-rose-300/20 p-3 text-xs text-muted">
                  Excluded: {result.excluded.map((e) => `${e.store} (${e.category})`).join(", ")}
                </div>
              )}
              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Departure checklist</p>
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted">
                  {result.checklist.slice(0, 6).map((c) => (
                    <li key={c} className="flex gap-2">
                      <span className="text-amber">·</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 border-t border-line pt-4" data-testid="share-result">
                <p className="text-xs text-muted">Share this result. The link carries your receipts; nothing is stored.</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ShareBar url={shareUrl} text={`Japan tax-free shopping: about ${yen(result.maxRefundJPY)} max refund after Nov 2026. Free checker:`} />
                  <a href={resultPath(shared)} className="text-sm text-muted underline underline-offset-2 hover:text-foreground">
                    Open result page
                  </a>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted">Add at least one receipt with a store, date, and amount.</p>
          )}
        </div>
        <CardDisclaimer />
      </article>
    </div>
  );
}
