export const SITE_NAME = "Japan Tax-Free Refund Checker";

export const SITE_TAGLINE =
  "From November 1, 2026, Japan refunds consumption tax at departure instead of removing it at the till. Check which receipts qualify, how much tax you get back, and your 90-day customs deadline.";

export const DISCLAIMER_SHORT = "Educational estimate, not tax advice. Rules can change; check official sources.";

export const HONESTY =
  "Rules as of 2026-10-09 from the Japan Tourism Agency, National Tax Agency, and JNTO. The shop, its refund operator, and Japan Customs decide; operators may deduct a fee. Not affiliated with any government agency or shop.";

export const SIBLING_TOOLS = [
  { href: "https://japan-luggage.vercel.app", label: "Japan Luggage Check" },
  { href: "https://japan-visa-fee.vercel.app", label: "Japan Visa Fee Calculator" },
  { href: "https://kyushu-travel-discount.vercel.app", label: "Kyushu Travel Discount" },
  { href: "https://japan-customs-allowance.vercel.app", label: "Japan Customs Allowance" },
  { href: "https://japan-tb-screening.vercel.app", label: "Japan TB Screening (JPETS)" },
  { href: "https://japan-dual-pricing.vercel.app", label: "Japan Dual Pricing" },
  { href: "https://japan-alert-decoder.vercel.app", label: "Japan Alert Decoder" },
  { href: "https://japan-pr-check.vercel.app", label: "Japan PR Guideline Check" },
  { href: "https://japan-intl-postage.vercel.app", label: "Japan International Postage 2027" },
  { href: "https://japan-reentry-check.vercel.app", label: "Japan Re-entry Deadline Check" },
  { href: "https://japan-trip-brain.vercel.app", label: "Japan Trip Brain" },
  { href: "https://hotel-ota-calculator.vercel.app", label: "Hotel OTA Calculator" },
  { href: "https://pitch-roast.vercel.app", label: "Pitch Roast" },
  { href: "https://fund-fix-flee.vercel.app", label: "Founder Scorecard" },
  { href: "https://saas-bill-cutter.vercel.app", label: "SaaS Bill Cutter" },
  { href: "https://ads-risk-check.vercel.app", label: "Ads Risk Check" },
  { href: "https://faceless-yt-risk-check.vercel.app", label: "Faceless YT Reality Check" },
  { href: "https://appgate-pack.vercel.app/check", label: "AppGate Pack" },
  { href: "https://ai-bottleneck-map.vercel.app", label: "AI Bottleneck Map" },
  { href: "https://viral-attention-map.vercel.app", label: "Viral Attention Map" },
] as const;

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production.replace(/^https?:\/\//, "")}`;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "https://japan-tax-free-refund.vercel.app";
}
