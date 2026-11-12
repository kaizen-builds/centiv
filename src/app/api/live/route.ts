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
import { chooseOttoTopic } from "@/lib/server/topic";

export const maxDuration = 180;

/** Topics already chosen in this live process, so each click can pick a new angle. */
const usedTopicsThisProcess: string[] = [];

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

  const body = (await req.json().catch(() => ({}))) as { question?: unknown; topic?: unknown; used_topics?: unknown };
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const fromClient = Array.isArray(body.used_topics)
    ? body.used_topics.filter((t): t is string => typeof t === "string" && validTopic(t))
    : [];
  const usedTopics = [...new Set([...usedTopicsThisProcess, ...fromClient].map((t) => t.trim().toLowerCase()))];
  let topic: string;
  let topic_source: "serv" | "fallback" | "direct";
  let topic_rationale: string | undefined;
  if (question) {
    const chosen = await chooseOttoTopic(question, usedTopics);
    topic = chosen.topic;
    topic_source = chosen.source;
    topic_rationale = chosen.rationale;
  } else if (validTopic(body.topic)) {
    topic = (body.topic as string).trim();
    topic_source = "direct";
  } else {
    return NextResponse.json({ error: "Send a research question, or a one- or two-word topic." }, { status: 400 });
  }
  if (topic && !usedTopicsThisProcess.includes(topic.toLowerCase())) usedTopicsThisProcess.push(topic.toLowerCase());
  const url = merchantUrl(topic);
  const topicMeta = { question: question || undefined, topic, topic_source, topic_rationale };

  const { maxPerCall, maxTotal } = liveLimits();
  const quote = await probePrice(url);
  if (!quote.ok || quote.price === undefined) return NextResponse.json({ status: "error", url, error: quote.error, ...topicMeta }, { status: 502 });
  if (quote.price > maxPerCall)
    return NextResponse.json({ status: "declined", url, price: quote.price, error_code: "centiv_per_call_limit", error: `Quote ${quote.price} USDC is over Centiv's live per-call limit ${maxPerCall}. Nothing signed.`, ...topicMeta });
  if (runningTotal() + quote.price > maxTotal + 1e-9)
    return NextResponse.json({ status: "declined", url, price: quote.price, error_code: "centiv_run_total_limit", error: `This would take the live run past ${maxTotal} USDC. Nothing signed.`, ...topicMeta });

  const sessionId = process.env.CENTIV_LIVE_SESSION_ID!.trim();
  const pre = await preflightSession(sessionId);
  if (!pre.ok) return NextResponse.json({ status: "declined", url, price: quote.price, error_code: "centiv_session_preflight", error: pre.reason, ...topicMeta });

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
    question: question || undefined,
    topicRationale: topic_rationale,
    usedTopics,
  });
  const sessionMeta = { perTx: session.perTx, total: session.total };
  // This run always obeys SERV: a skip or decline means no payment attempt.
  // SERV's real verdict is still returned and shown. Never override it.
  const ATTEMPT_EVEN_IF_SERV_SKIPS = false;
  if (serv.decision !== "spend" && !ATTEMPT_EVEN_IF_SERV_SKIPS) {
    return NextResponse.json({
      status: serv.decision === "skip" ? "skipped" : "declined",
      url,
      price: quote.price,
      error_code: serv.decision === "skip" ? "serv_skip" : "serv_decline",
      error: serv.rationale,
      serv,
      provenance: "live",
      session: sessionMeta,
      ...topicMeta,
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
      pollMs: 60_000,
    });
    return NextResponse.json({ ...result, ...topicMeta, serv, reppo, provenance: "live", session: sessionMeta });
  }

  return NextResponse.json({ ...result, ...topicMeta, serv, provenance: "live", session: sessionMeta });
}
