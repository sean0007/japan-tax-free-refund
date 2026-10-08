import type { Metadata } from "next";
import { DISCLAIMER_SHORT, HONESTY } from "@/lib/site";
import { SOURCES } from "@/lib/refund";

export const metadata: Metadata = { title: "Disclaimer", description: DISCLAIMER_SHORT };

export default function DisclaimerPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Read this</p>
      <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">Disclaimer</h1>
      <p className="mt-4 text-lg text-foreground">{DISCLAIMER_SHORT}</p>
      <p className="mt-2 text-muted">{HONESTY}</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-semibold text-foreground">What this is</h2>
          <p className="mt-2">
            A free educational checker. Fixed arithmetic and a dated rules table estimate the consumption tax inside your receipts, whether each store/day group meets the ¥5,000 before-tax minimum, and whether your departure is within the 90-day customs window under Japan&apos;s refund method starting 2026-11-01.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">What it is not</h2>
          <p className="mt-2">
            It is not tax, legal, or immigration advice. The tax-free shop, its refund operator, and Japan Customs decide eligibility and the amount you receive. Operators may deduct a handling fee. Rules can change; always check the official sources below before you shop or depart.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">Sources</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {SOURCES.map((s) => (
              <li key={s}>
                <a href={s} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">Your data</h2>
          <p className="mt-2">Amounts and dates you type stay in your browser (or in a share link you create). No login, database, or logging of personal data. Receipts contain no passport numbers here.</p>
        </section>
      </div>
    </div>
  );
}
