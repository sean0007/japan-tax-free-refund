import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Checker } from "@/components/checker";
import { checkRefund } from "@/lib/refund";
import { EXAMPLE_SHARED, PUBLIC_URL, hasResult, isExample, ogPath, parseShared, resultPath, yen } from "@/lib/share";
import { DISCLAIMER_SHORT, HONESTY } from "@/lib/site";

type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const shared = parseShared(await searchParams);
  if (!hasResult(shared)) return { title: "Your result", robots: { index: false, follow: true } };
  const r = checkRefund(shared.receipts, shared.departureDate);
  const title = `${yen(r.maxRefundJPY)} max Japan tax-free refund`;
  const description = `${shared.receipts.length} receipt${shared.receipts.length === 1 ? "" : "s"} · ${r.groups.filter((g) => g.eligible).length} eligible group${r.groups.filter((g) => g.eligible).length === 1 ? "" : "s"} · rules as of ${r.rulesAsOf}. Estimate only; operators may deduct a fee. Free checker, no login.`;
  const url = `${PUBLIC_URL}${resultPath(shared)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: isExample(shared) ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: `Japan Tax-Free Refund Checker · ${title}`,
      description,
      type: "website",
      url,
      images: [{ url: ogPath(shared), width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title: `Japan Tax-Free Refund Checker · ${title}`, description, images: [ogPath(shared)] },
  };
}

export default async function ResultPage({ searchParams }: { searchParams: SP }) {
  const shared = parseShared(await searchParams);
  if (!hasResult(shared)) redirect("/");
  const r = checkRefund(shared.receipts, shared.departureDate);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <section className="max-w-3xl">
        <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Shared result · Japan Tax-Free Refund</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">
          <span className="text-teal-200">{yen(r.maxRefundJPY)}</span> max refund before fees
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          {r.groups.length} store/day group{r.groups.length === 1 ? "" : "s"} · {shared.receipts.length} receipt{shared.receipts.length === 1 ? "" : "s"}
          {shared.departureDate ? ` · depart ${shared.departureDate}` : ""} · rules as of {r.rulesAsOf}
        </p>
        <p className="mt-3 text-sm text-muted">Estimate from the receipts in this link. The shop or refund operator may deduct a fee; customs decides.</p>
        <p className="mt-4 text-sm">
          <Link href="/" className="text-muted underline underline-offset-2 hover:text-foreground">
            ← Start over with your own receipts
          </Link>
          {isExample(shared) ? null : (
            <>
              {" · "}
              <Link href={resultPath(EXAMPLE_SHARED)} className="text-muted underline underline-offset-2 hover:text-foreground">
                Open the example
              </Link>
            </>
          )}
        </p>
      </section>
      <section className="mt-8">
        <Checker initial={shared} />
      </section>
      <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted">
        {DISCLAIMER_SHORT} {HONESTY}
      </p>
    </div>
  );
}
