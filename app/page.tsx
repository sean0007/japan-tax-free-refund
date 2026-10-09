import type { Metadata } from "next";
import { Checker } from "@/components/checker";
import { FaqSection, type FaqItem } from "@/components/faq-section";
import { EXAMPLE_SHARED, PUBLIC_URL, resultPath } from "@/lib/share";

const title = "How much tax back do you get shopping in Japan after November 2026?";
const description =
  "Free Japan tax-free refund checker for the Nov 1, 2026 change: pay tax-inclusive prices, claim consumption tax back at customs before bag check within 90 days. Per store/day ¥5,000 minimum, 10%/8% tax math, old vs new regime. Free JSON API for AI agents. Not tax advice.";

export const metadata: Metadata = {
  title: { absolute: `${title} · Japan Tax-Free Refund Checker` },
  description,
  alternates: { canonical: "/" },
};

const faq: FaqItem[] = [
  {
    q: "How does tax-free shopping work in Japan after November 2026?",
    a: "From November 1, 2026, Japan switches from tax-off-at-the-till to a refund method. You pay the full tax-inclusive price at a tax-free shop, then get the consumption tax back after Japan Customs confirms on departure that the goods are leaving Japan. Do the tax-free kiosk (or Visit Japan Web at major airports) in the international departure lobby BEFORE checking bags, within 90 days of purchase.",
  },
  {
    q: "What is the minimum purchase for Japan tax-free shopping?",
    a: "¥5,000 or more before tax, per tax-free shop, per day. Receipts from the same store on the same day are added together. From November 2026 there is no separate general-goods vs consumables split and no ¥500,000 consumables cap.",
  },
  {
    q: "How is the Japan consumption tax refund amount calculated?",
    a: "From a tax-inclusive price: floor(amount × rate / (100 + rate)). At 10%, ¥16,500 includes ¥1,500 tax (¥15,000 before tax). At 8%, ¥3,240 includes ¥240 tax. The shop or its refund operator may deduct a handling fee, so you can receive less than that number.",
  },
  {
    q: "When do I claim the Japan tax-free refund at the airport?",
    a: "At your final departure airport or seaport from Japan, before baggage check-in, within 90 days of the purchase date (counted from the day after purchase: bought November 1 → deadline January 30). Green result finishes the procedure; Red means a customs inspection. Checked bags cannot be retrieved for this.",
  },
  {
    q: "Can I use tax-free cosmetics or snacks in Japan before I leave?",
    a: "No. Sealed packaging for consumables is abolished from November 2026, but if you use or consume food, drinks, or cosmetics in Japan, that receipt is not eligible for a refund. Carry every item from each receipt; one missing item voids the whole receipt.",
  },
  {
    q: "What changed from the old Japan tax-free system?",
    a: "Until October 31, 2026, eligible shops sold at the tax-exclusive price (tax-off at the till). From November 1, 2026 you pay tax-inclusive, and the refund comes after customs confirmation. The general/consumables distinction, the ¥500,000 consumables cap, and sealed bags are abolished. The ¥5,000 before-tax minimum per store per day stays.",
  },
  {
    q: "Do refund operators charge a fee on Japan tax-free refunds?",
    a: "Japanese consumption-tax law does not set a fee rule. The shop or a refund operator it hires pays you (card, app, bank transfer, or cash at the port). They may deduct a handling fee; overseas practice often charges the traveler. Ask at the shop when you buy. The government does not charge a refund fee.",
  },
  {
    q: "Who can shop tax-free in Japan?",
    a: "Mainly foreign visitors who have been in Japan for less than six months since entry (and Japanese nationals living abroad for two or more years, with proof such as a residency certificate or My Number Card showing overseas move). Gold and platinum bullion and coins, and items already exempt from consumption tax, are not eligible.",
  },
  {
    q: "Is there a free Japan tax-free refund calculator with an API for AI agents?",
    a: `Yes. This page is free with no login. Agents can call GET ${PUBLIC_URL}/api/refund?amount=16500&rate=10&purchaseDate=2026-11-12&departureDate=2026-11-20 or POST a JSON body with multiple receipts. OpenAPI: ${PUBLIC_URL}/openapi.json. Also available as the japan_tax_free_refund_check tool on https://free-agent-tools.vercel.app/mcp.`,
  },
  {
    q: "Where are the official Japan tax-free refund rules?",
    a: "Japan National Tourism Organization (japan.travel blog on the new system), Japan Tourism Agency traveler page and FAQs (mlit.go.jp/kankocho/tax-free), National Tax Agency refund-method pamphlet (nta.go.jp), and the All Japan Tax-Free Association (zenmenkyo.jp). This tool quotes those sources and stamps rulesAsOf on every response; rules can still change.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <section className="max-w-3xl">
        <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Free · Japan · Nov 1 2026 change</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
          How much tax back do you get shopping in Japan after November 2026?
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          From November 1, 2026, Japan stops removing consumption tax at the till. You pay the tax-inclusive price, then claim the tax back at customs before checking bags, within 90 days of purchase. Enter your receipts below.
        </p>
      </section>

      <section className="mt-8">
        <Checker />
      </section>

      <section className="mt-16 max-w-3xl">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Old tax-off vs new refund method</h2>
        <div className="mt-5 overflow-x-auto rounded-3xl border border-line">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-panel/80 text-muted">
              <tr>
                <th className="px-4 py-3 font-medium"> </th>
                <th className="px-4 py-3 font-medium">Until Oct 31, 2026</th>
                <th className="px-4 py-3 font-medium">From Nov 1, 2026</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-foreground">
              <tr>
                <td className="px-4 py-3 text-muted">At the shop</td>
                <td className="px-4 py-3">Tax-exclusive price (tax off)</td>
                <td className="px-4 py-3">Tax-inclusive price; register refund method</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-muted">Minimum</td>
                <td className="px-4 py-3">¥5,000 before tax / store / day</td>
                <td className="px-4 py-3">Same ¥5,000 before tax / store / day</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-muted">Categories</td>
                <td className="px-4 py-3">General vs consumables; ¥500k cap; sealed bags</td>
                <td className="px-4 py-3">Split, cap, and sealed bags abolished</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-muted">At departure</td>
                <td className="px-4 py-3">Customs after security (restricted area)</td>
                <td className="px-4 py-3">Kiosk before bag check; then refund from shop/operator</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-muted">Deadline</td>
                <td className="px-4 py-3">Leave with the goods</td>
                <td className="px-4 py-3">Customs within 90 days of purchase</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted">
          Example shareable result:{" "}
          <a className="underline underline-offset-2 hover:text-foreground" href={resultPath(EXAMPLE_SHARED)}>
            Bic Camera + Don Quijote → ¥1,940 max
          </a>
          .
        </p>
      </section>

      <section className="mt-16 max-w-3xl">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Agent-callable JSON API</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
          Free, no key, CORS open.{" "}
          <code className="rounded bg-panel px-1.5 py-0.5 font-mono text-xs text-foreground">GET {PUBLIC_URL}/api/refund?amount=16500&amp;rate=10&amp;purchaseDate=2026-11-12&amp;departureDate=2026-11-20</code>
          {" "}or POST a list of receipts. Also{" "}
          <a className="underline underline-offset-2 hover:text-foreground" href="/api/rules">/api/rules</a>,{" "}
          <a className="underline underline-offset-2 hover:text-foreground" href="/openapi.json">/openapi.json</a>,{" "}
          <a className="underline underline-offset-2 hover:text-foreground" href="/llms.txt">/llms.txt</a>, and the MCP tool on{" "}
          <a className="underline underline-offset-2 hover:text-foreground" href="https://free-agent-tools.vercel.app/" target="_blank" rel="noopener noreferrer">
            free-agent-tools
          </a>
          .
        </p>
      </section>

      <FaqSection items={faq} heading="Japan tax-free refund questions" />
    </div>
  );
}
