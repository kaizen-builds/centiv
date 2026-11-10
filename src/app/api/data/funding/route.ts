/**
 * Local research catalogue endpoint shaped like an x402-paid funding feed.
 * Unpaid requests get HTTP 402 + PAYMENT-REQUIRED (x402 v2-ish).
 * A Centiv-Payment: settled header unlocks the demo payload.
 *
 * For a production seller, wrap a real upstream with kite-x402-hono instead:
 * https://github.com/gokite-ai (kite-x402-hono / kite-x402-axum).
 */

import { connection, NextResponse } from "next/server";


function paymentRequiredHeader(priceUsdc: number) {
  const atomic = Math.round(priceUsdc * 1_000_000).toString();
  const body = {
    x402Version: 2,
    error: "Payment required",
    resource: {
      url: "/api/data/funding",
      description: "ETH perpetual funding history · 7d · 4 venues (Centiv research catalogue)",
      mimeType: "application/json",
    },
    accepts: [
      {
        scheme: "exact",
        network: process.env.KITE_NETWORK?.trim() || "kite-testnet",
        amount: atomic,
        asset: "USDC.e",
        payTo: process.env.X402_PAY_TO?.trim() || "0x0000000000000000000000000000000000000000",
        maxTimeoutSeconds: 300,
        extra: { name: "USDC.e", version: "2", resourceUrl: "/api/data/funding" },
      },
    ],
  };
  return Buffer.from(JSON.stringify(body)).toString("base64");
}

export async function GET(req: Request) {
  await connection();
  const paid =
    req.headers.get("Centiv-Payment") === "settled" ||
    req.headers.get("X-Payment") ||
    req.headers.get("PAYMENT-SIGNATURE");

  if (!paid) {
    const price = Number(process.env.X402_FUNDING_PRICE_USDC || "0.18");
    return new NextResponse(JSON.stringify({}), {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        "PAYMENT-REQUIRED": paymentRequiredHeader(price),
      },
    });
  }

  return NextResponse.json({
    asset: "ETH",
    window: "7d",
    venues: ["A", "B", "C", "D"],
    note: "Catalogue payload for Centiv — replace with a kite-x402-hono upstream for live venue data.",
    series: [
      { t: "t-7d", avg: 0.011 },
      { t: "t-3d", avg: 0.006 },
      { t: "t-0", avg: 0.002 },
    ],
    negatives: { B: 3, D: 3 },
  });
}
