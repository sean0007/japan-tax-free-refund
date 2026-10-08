import { ImageResponse } from "next/og";

export const alt = "Japan Tax-Free Refund Checker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#07080c",
          color: "#f3efe4",
          padding: "64px",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 22, letterSpacing: "0.28em", textTransform: "uppercase", color: "#f0b429" }}>
          Free · Japan · Nov 1 2026
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 64, lineHeight: 1.05, letterSpacing: "-0.03em", maxWidth: 1000 }}>
            How much tax back do you get shopping in Japan after November 2026?
          </div>
          <div style={{ fontSize: 28, color: "#9b9588", maxWidth: 900, lineHeight: 1.35 }}>
            Pay tax-inclusive. Claim at customs before bag check within 90 days. ¥5,000 per store per day.
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, fontSize: 22, color: "#9b9588" }}>
          <span style={{ color: "#99f6e4" }}>Refund method</span>
          <span>10% / 8%</span>
          <span>Free JSON API · no login</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
