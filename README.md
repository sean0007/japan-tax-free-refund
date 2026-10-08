# Japan Tax-Free Refund Checker

Free checker for Japan's tax-free shopping change on **2026-11-01**: visitors pay the tax-inclusive price, then claim consumption tax back at customs **before bag check** within **90 days** of purchase.

- Live: https://japan-tax-free-refund.vercel.app
- API: `GET /api/refund`, `POST /api/refund`, `GET /api/rules`
- Agent docs: `/llms.txt`, `/openapi.json`, `/.well-known/ai-plugin.json`
- MCP tool: `japan_tax_free_refund_check` on https://free-agent-tools.vercel.app/mcp

**Educational estimate, not tax advice.** Rules can change. The shop, its refund operator, and Japan Customs decide. Operators may deduct a handling fee.

## Example

```
GET https://japan-tax-free-refund.vercel.app/api/refund?amount=16500&rate=10&purchaseDate=2026-11-12&departureDate=2026-11-20
```

POST with three receipts (Bic Camera + two Don Quijote lines on the same day) returns `maxRefundJPY: 1940`.

Shareable result: `/r?d=2026-11-20&r=Bic%20Camera%20Shinjuku~2026-11-12~16500~10&...`

## Rules implemented (verified 2026-10-09)

| Rule | Implementation |
|---|---|
| Cutover | Purchases `< 2026-11-01` → `regime: "tax_off"`. On/after → `regime: "refund"`. |
| Tax math | `floor(amount * rate / (100 + rate))` whole yen when price includes tax (10 or 8). |
| Minimum | Sum tax-exclusive per `(store, purchaseDate)` ≥ ¥5,000. |
| Deadline | `purchaseDate + 90 days` (NTA: counted from the day after purchase). |
| Fees | Always noted: operators may deduct a handling fee. |
| Exclusions | Optional `category: "bullion" \| "tax_exempt"`. |

### Quotes from official sources this tool relies on

**JNTO (japan.travel), 2026-07-20** — https://www.japan.travel/en/us/blog/everything-you-need-to-know-japans-new-tax-free-shopping-system/

> Beginning November 1, 2026, travelers will pay the full tax-inclusive price when purchasing items at tax-free shops. Before departing Japan, they will present the purchased goods for inspection at customs at the airport or seaport. Once customs confirms the goods are being taken out of Japan, the amount equivalent to the consumption tax will be refunded.

> Within 90 days of your purchase, present your passport at a tax-free procedure terminal … before baggage check-in.

> Minimum purchase amount: Your total purchases per tax-free shop, per day must be 5,000 yen or more (before tax).

> If even one item from a receipt is missing, none of the items associated with that receipt will be eligible for a tax refund.

**Japan Tourism Agency traveler page** — https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00028.html

> for purchases made on or after November 1, 2026, the system will shift to the Refund Method, under which the amount equivalent to consumption tax will be refunded after a customs inspection at the airport or seaport confirms that the goods are being taken out of Japan.

> Purchases totaling 5,000 yen or more (tax excluded) per store per day are eligible.

> Special packaging for consumables will be abolished; however, if consumables such as food, beverages, or cosmetics are consumed in Japan, you will not be eligible for customs inspection (tax refund).

> The refund will be provided by each tax-free shop or by a refund service provider entrusted by the shop.

**JTA Changes to Tax-Free Goods PDF** (`001990234.pdf`)

> Minimum purchase amount: JPY 5,000 or more (tax excluded) — No Change
> Distinction between general products and consumable products / Maximum purchase amount for consumable products (JPY 500,000), and special packaging — Abolished

**National Tax Agency pamphlet** — https://www.nta.go.jp/publication/pamph/shohi/menzei/201805/pdf/0025003-110_01.pdf

> 購入日から90日以内とは、購入日の翌日から計算して90日目までの期間をいいます。例えば、11月１日に購入した物品については、翌年１月30日が税関での確認期限となります。
>
> *(“Within 90 days of the purchase date” means the period through the 90th day counted from the day after purchase. Example: goods bought on November 1 have a customs confirmation deadline of January 30 the following year.)*

**JTA shop FAQ (refund fees)** — https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00024.html 問17

> 返金手続を代行業者に委託する場合に生じるリファンド手数料を旅行者負担とするか、免税店で負担するかについては、特に定めはありません。（諸外国では、旅行者負担とすることが一般的です。）
>
> *(There is no legal rule on whether the traveler or the shop bears the refund-operator fee; overseas it is commonly the traveler.)*

**Zenmenkyo** — https://zenmenkyo.jp/refund-top/refund-system-2026/

> 消費税免税制度は2026年11月1日より「リファンド方式」に変更されます。免税店では税込価格（課税）で販売し、免税購入対象者が出国時に税関でその物品を国外に持ち出すことが確認された後に、消費税相当額が返金（リファンド）される仕組みです。

### Differences vs the original build spec

1. **Regime label:** the research report used `refund_method` / `exemption_at_store`. This API uses shorter `refund` / `tax_off` (same meaning; matches the user brief's `regime:"tax_off"` / `regime:"refund"`).
2. **90-day counting:** the NTA pamphlet explicitly counts from the **day after** purchase (bought 2026-11-01 → deadline 2027-01-30), which is the same calendar result as `purchaseDate + 90 days` in date arithmetic. Documented in `/api/rules` and the README.
3. **Fees:** confirmed with JTA FAQ 問17 — no statutory fee; operators may charge the traveler. Always included in `notes`.
4. **Old consumables cap:** still modelled for `tax_off` groups when `category: "consumable"` is set; from 2026-11-01 the split/cap/sealing are abolished (JTA goods PDF).

## Dev

```bash
npm ci
npm test
npm run dev
```

MIT License. Built for Sean Ryan (`sean0007`).
