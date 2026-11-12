import { connection, NextResponse } from "next/server";
import {
  LIVE_MERCHANT,
  executeLive,
  isLocalRequest,
  liveGate,
  liveLimits,
  merchantUrl,
  preflightSession,
  probePrice,
  rateLimit,
  runningTotal,
  tokenOk,
  validTopic,
  weighLiveCall,
} from "@/lib/server/live";
import { evaluateLiveExcerpt } from "@/lib/server/reppo";

export const maxDuration = 180;

/** Is owner-gated live mode armed here? Never reveals the token or session id. */
export async function GET() {
  await connection();
  const gate = liveGate();
  const { maxPerCall, maxTotal, maxSessionTotal } = liveLimits();
  return NextResponse.json({
    enabled: gate.enabled,
    reason: gate.reason,
    merchant: `${LIVE_MERCHANT.host}${LIVE_MERCHANT.path}`,
    limits: gate.enabled ? { maxPerCallUsdc: maxPerCall, maxTotalUsdc: maxTotal, maxSessionUsdc: maxSessionTotal, spentThisProcessUsdc: runningTotal() } : undefined,
  });
}

/** One real, Passport-capped x402 call. Local + owner token only. */
export async function POST(req: Request) {
  await connection();
  const gate = liveGate();
  if (!gate.enabled) return NextResponse.json({ enabled: false, error: gate.reason }, { status: 403 });
  if (!isLocalRequest(req)) return NextResponse.json({ enabled: false, error: "Live mode only answers on localhost." }, { status: 403 });
  if (!tokenOk(req)) return NextResponse.json({ error: "Missing or wrong owner token." }, { status: 401 });

  const rl = rateLimit();
  if (!rl.ok) return NextResponse.json({ error: rl.reason }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as { topic?: unknown };
  if (!validTopic(body.topic)) return NextResponse.json({ error: "topic must be one or two plain words." }, { status: 400 });
  const topic = (body.topic as string).trim();
  const url = merchantUrl(topic);

  const { maxPerCall, maxTotal } = liveLimits();
  const quote = await probePrice(url);
  if (!quote.ok || quote.price === undefined) return NextResponse.json({ status: "error", topic, url, error: quote.error }, { status: 502 });
  if (quote.price > maxPerCall)
    return NextResponse.json({ status: "declined", topic, url, price: quote.price, error_code: "centiv_per_call_limit", error: `Quote ${quote.price} USDC is over Centiv's live per-call limit ${maxPerCall}. Nothing signed.` });
  if (runningTotal() + quote.price > maxTotal + 1e-9)
    return NextResponse.json({ status: "declined", topic, url, price: quote.price, error_code: "centiv_run_total_limit", error: `This would take the live run past ${maxTotal} USDC. Nothing signed.` });

  const sessionId = process.env.CENTIV_LIVE_SESSION_ID!.trim();
  const pre = await preflightSession(sessionId);
  if (!pre.ok) return NextResponse.json({ status: "declined", topic, url, price: quote.price, error_code: "centiv_session_preflight", error: pre.reason });

  const session = pre.session!;
  const remaining = Math.max(0, +(session.total - session.spent).toFixed(6));
  const windowMinLeft = session.expiresAt
    ? Math.max(0, Math.ceil((Date.parse(session.expiresAt) - Date.now()) / 60_000))
    : 30;

  // SERV judges value only. Caps are context; a "spend" still goes to Kite Passport,
  // which is what refuses call 3 when the session total is exceeded.
  const serv = await weighLiveCall({
    topic,
    price: quote.price,
    remaining,
    perTx: session.perTx,
    windowMinLeft,
  });
  const sessionMeta = { perTx: session.perTx, total: session.total };
  if (serv.decision !== "spend") {
    return NextResponse.json({
      status: serv.decision === "skip" ? "skipped" : "declined",
      topic,
      url,
      price: quote.price,
      error_code: serv.decision === "skip" ? "serv_skip" : "serv_decline",
      error: serv.rationale,
      serv,
      provenance: "live",
      session: sessionMeta,
    });
  }

  // Passport enforces its own per-call and total caps here — a cap breach comes back as a decline.
  const result = await executeLive(sessionId, topic, url, quote.price);

  // Score only after a paid result with Otto text. Never invents a score; payment already settled.
  if (result.status === "paid" && result.reply?.excerpt) {
    const reppo = await evaluateLiveExcerpt({
      topic,
      excerpt: result.reply.excerpt,
      provider: result.reply.provider,
    });
    return NextResponse.json({ ...result, serv, reppo, provenance: "live", session: sessionMeta });
  }

  return NextResponse.json({ ...result, serv, provenance: "live", session: sessionMeta });
}
