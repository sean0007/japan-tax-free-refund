import { ImageResponse } from "next/og";
import { checkRefund } from "@/lib/refund";
import { EXAMPLE_SHARED, hasResult, parseShared, yen } from "@/lib/share";

export async function GET(req: Request) {
  const parsed = parseShared(new URL(req.url).searchParams);
  const shared = hasResult(parsed) ? parsed : EXAMPLE_SHARED;
  const r = checkRefund(shared.receipts, shared.departureDate);
  const eligible = r.groups.filter((g) => g.eligible).length;
  const stats = [
    { label: "eligible groups", value: String(eligible) },
    { label: "receipts", value: String(shared.receipts.length) },
    { label: "rules as of", value: r.rulesAsOf },
  ];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#07080c", color: "#f3efe4", padding: "56px 64px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: "0.24em", textTransform: "uppercase", color: "#f0b429" }}>Japan Tax-Free Refund</div>
          <div style={{ display: "flex", fontSize: 22, color: "#9b9588" }}>from Nov 1, 2026</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 30, color: "#c9c3b6" }}>Max refund before fees</div>
          <div style={{ display: "flex", alignItems: "baseline", marginTop: 6 }}>
            <span style={{ fontSize: 120, fontWeight: 800, letterSpacing: "-0.04em", color: "#99f6e4", lineHeight: 1 }}>{yen(r.maxRefundJPY)}</span>
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#9b9588", marginTop: 14 }}>
            {shared.departureDate ? `Depart ${shared.departureDate} · ` : ""}
            {r.groups.length} store/day group{r.groups.length === 1 ? "" : "s"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column", flex: 1, border: "2px solid #23252c", borderRadius: 24, padding: "14px 20px", background: "#101218" }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: "#f3efe4" }}>{s.value}</span>
              <span style={{ fontSize: 20, color: "#9b9588" }}>{s.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#6f6a60" }}>
          <span>japan-tax-free-refund.vercel.app · free, no login</span>
          <span>Not tax advice. Operators may deduct a fee.</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable" } },
  );
}
