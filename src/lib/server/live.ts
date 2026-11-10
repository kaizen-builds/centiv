/**
 * Owner-only Live payment mode (judges / video).
 *
 * A real x402 payment through Kite Passport happens ONLY when every gate passes:
 *   1. Not running on Vercel (process.env.VERCEL unset) — the public deployment can never pay.
 *   2. CENTIV_LIVE_TOKEN is set (≥ 24 chars) and the request carries it as a Bearer token.
 *   3. CENTIV_LIVE_SESSION_ID names an owner-approved Passport session (passkey-approved).
 *   4. The request is addressed to localhost.
 *   5. A local kpass binary exists.
 *   6. The 402 quote is within CENTIV_LIVE_MAX_PER_CALL_USDC, this process's running total
 *      stays within CENTIV_LIVE_MAX_TOTAL_USDC, and the Passport session's own caps are small,
 *      active and scoped to the allow-listed merchant.
 *   7. A simple rate limit.
 * Passport then enforces its own caps on top (that is the decline you see on call 3).
 *
 * Never passes --use-allowance, so it cannot fall back to the owner's account allowance.
 * Never returns raw kpass output — only whitelisted public fields.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { timingSafeEqual } from "node:crypto";

export const LIVE_MERCHANT = {
  name: "Otto AI",
  host: "x402.ottoai.services",
  path: "/filtered-news",
  network: "eip155:8453",
  asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
} as const;

const num = (v: string | undefined, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
};

export function liveLimits() {
  return {
    maxPerCall: num(process.env.CENTIV_LIVE_MAX_PER_CALL_USDC, 0.01),
    maxTotal: num(process.env.CENTIV_LIVE_MAX_TOTAL_USDC, 0.05),
    maxSessionTotal: num(process.env.CENTIV_LIVE_MAX_SESSION_USDC, 0.1),
    minIntervalMs: 3_000,
    maxPerHour: 20,
  };
}

export function kpassBinary(): string | null {
  const candidates = [
    process.env.KPASS_BIN?.trim(),
    join(homedir(), ".local/bin/kpass"),
    join(homedir(), ".kpass/bin/kpass"),
  ].filter(Boolean) as string[];
  return candidates.find((p) => existsSync(/*turbopackIgnore: true*/ p)) ?? null;
}

export type Gate = { enabled: boolean; reason: string };

/** Static gate (no request). Used by /api/status and GET /api/live. */
export function liveGate(): Gate {
  if (process.env.VERCEL) return { enabled: false, reason: "Live payments are disabled on Vercel deployments. Public runs are Simulated." };
  const token = process.env.CENTIV_LIVE_TOKEN?.trim() || "";
  if (token.length < 24) return { enabled: false, reason: "CENTIV_LIVE_TOKEN is not set (≥ 24 characters) on this machine." };
  if (!process.env.CENTIV_LIVE_SESSION_ID?.trim()) return { enabled: false, reason: "CENTIV_LIVE_SESSION_ID is not set — approve a small Passport session first." };
  if (!kpassBinary()) return { enabled: false, reason: "kpass is not installed on this machine." };
  return { enabled: true, reason: "Owner-gated live mode is armed on this machine." };
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function isLocalRequest(req: Request): boolean {
  const host = (req.headers.get("host") || "").toLowerCase().replace(/:\d+$/, "");
  const fwd = req.headers.get("x-forwarded-host");
  if (fwd && !LOCAL_HOSTS.has(fwd.toLowerCase().replace(/:\d+$/, ""))) return false;
  return LOCAL_HOSTS.has(host);
}

export function tokenOk(req: Request): boolean {
  const expected = process.env.CENTIV_LIVE_TOKEN?.trim() || "";
  const got = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (expected.length < 24 || !got) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(got);
  return a.length === b.length && timingSafeEqual(a, b);
}

// --- simple in-process rate limit + running total -------------------------
const state = { last: 0, stamps: [] as number[], spent: 0 };

export function rateLimit(now = Date.now()): { ok: boolean; reason?: string } {
  const { minIntervalMs, maxPerHour } = liveLimits();
  state.stamps = state.stamps.filter((t) => now - t < 3_600_000);
  if (now - state.last < minIntervalMs) return { ok: false, reason: `Slow down — one live call every ${minIntervalMs / 1000}s.` };
  if (state.stamps.length >= maxPerHour) return { ok: false, reason: `Hourly limit of ${maxPerHour} live calls reached.` };
  state.last = now;
  state.stamps.push(now);
  return { ok: true };
}

export function runningTotal() {
  return state.spent;
}

export function validTopic(t: unknown): t is string {
  return typeof t === "string" && /^[a-z0-9][a-z0-9 -]{0,30}$/i.test(t.trim()) && t.trim().split(/\s+/).length <= 2;
}

export function merchantUrl(topic: string) {
  return `https://${LIVE_MERCHANT.host}${LIVE_MERCHANT.path}?topic=${encodeURIComponent(topic.trim())}`;
}

/** Free, unpaid probe: read the 402 quote and its price before anything is signed. */
export async function probePrice(url: string): Promise<{ ok: boolean; price?: number; payTo?: string; error?: string }> {
  try {
    const res = await fetch(url, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(12_000) });
    if (res.status !== 402) return { ok: false, error: `Expected HTTP 402 quote, got ${res.status}.` };
    const header = res.headers.get("payment-required");
    if (!header) return { ok: false, error: "No PAYMENT-REQUIRED header." };
    const parsed = JSON.parse(Buffer.from(header, "base64").toString("utf8")) as {
      accepts?: { network?: string; asset?: string; amount?: string; payTo?: string }[];
    };
    const a = parsed.accepts?.find(
      (x) => x.network === LIVE_MERCHANT.network && x.asset?.toLowerCase() === LIVE_MERCHANT.asset.toLowerCase(),
    );
    if (!a?.amount) return { ok: false, error: "No Base USDC offer in the 402 quote." };
    return { ok: true, price: Number(a.amount) / 1e6, payTo: a.payTo };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Quote probe failed." };
  }
}

function runKpass(args: string[], timeoutMs = 60_000): Promise<{ code: number; stdout: string }> {
  const bin = kpassBinary();
  if (!bin) return Promise.resolve({ code: 127, stdout: "" });
  return new Promise((resolve) => {
    // Minimal env: kpass reads its own config from HOME; no app secrets are passed through.
    const child = spawn(/*turbopackIgnore: true*/ bin, args, {
      env: { HOME: homedir(), PATH: process.env.PATH || "/usr/bin:/bin", KPASS_NO_BROWSER: "1", LANG: "C.UTF-8" } as unknown as NodeJS.ProcessEnv,
      cwd: process.env.CENTIV_KPASS_CWD?.trim() || homedir(),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    const timer = setTimeout(() => child.kill("SIGTERM"), timeoutMs);
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", () => {}); // never surfaced: may contain local paths
    child.on("close", (code: number | null) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, stdout });
    });
    child.on("error", () => {
      clearTimeout(timer);
      resolve({ code: 127, stdout: "" });
    });
  });
}

type KpassSession = {
  id: string;
  status: string;
  expires_at?: string;
  delegation?: {
    payment_policy?: { max_amount_per_tx?: string; max_total_amount?: string };
    execution_constraints?: { x402?: { scope_mode?: string; allowed_endpoints?: { host?: string; method?: string; path_prefix?: string }[] } };
  };
  usage?: { spent_total?: string };
};

/** Read-only preflight: the named session must be active, unexpired, small and scoped to the merchant. */
export async function preflightSession(sessionId: string): Promise<{ ok: boolean; reason?: string; session?: { perTx: number; total: number; spent: number; expiresAt?: string } }> {
  const { code, stdout } = await runKpass(["session", "list", "--output", "json", "--no-interactive"], 30_000);
  if (code !== 0) return { ok: false, reason: `kpass session list failed (exit ${code}).` };
  let list: { sessions?: KpassSession[] };
  try {
    list = JSON.parse(stdout);
  } catch {
    return { ok: false, reason: "kpass session list returned non-JSON." };
  }
  const s = list.sessions?.find((x) => x.id === sessionId);
  if (!s) return { ok: false, reason: "Named session not found for this Passport agent." };
  if (s.status !== "active") return { ok: false, reason: `Session is ${s.status}.` };
  if (s.expires_at && Date.parse(s.expires_at) <= Date.now()) return { ok: false, reason: "Session has expired — approve a fresh one." };
  const perTx = Number(s.delegation?.payment_policy?.max_amount_per_tx);
  const total = Number(s.delegation?.payment_policy?.max_total_amount);
  const { maxPerCall, maxSessionTotal } = liveLimits();
  if (!(perTx > 0) || perTx > maxPerCall) return { ok: false, reason: `Session per-call cap ${perTx} exceeds Centiv's live limit ${maxPerCall}.` };
  if (!(total > 0) || total > maxSessionTotal) return { ok: false, reason: `Session total ${total} exceeds Centiv's live limit ${maxSessionTotal}.` };
  const x = s.delegation?.execution_constraints?.x402;
  const scoped =
    x?.scope_mode === "scoped" &&
    (x.allowed_endpoints || []).length > 0 &&
    (x.allowed_endpoints || []).every((e) => e.host === LIVE_MERCHANT.host && (e.path_prefix || "").startsWith(LIVE_MERCHANT.path));
  if (!scoped) return { ok: false, reason: `Session must be scoped to ${LIVE_MERCHANT.host}${LIVE_MERCHANT.path} only.` };
  return { ok: true, session: { perTx, total, spent: Number(s.usage?.spent_total) || 0, expiresAt: s.expires_at } };
}

export type LiveResult = {
  status: "paid" | "declined" | "error";
  topic: string;
  url: string;
  price?: number;
  tx_hash?: string;
  basescan_url?: string;
  payer?: string;
  network?: string;
  spent_total?: string;
  error_code?: string;
  error?: string;
  reply?: { provider: string; excerpt: string; source_count?: number };
};

/** The one call that can move money. Only reached after every gate in /api/live passes. */
export async function executeLive(sessionId: string, topic: string, url: string, price: number): Promise<LiveResult> {
  const args = ["session", "execute", "--url", url, "--method", "GET", "--session-id", sessionId, "--no-browser", "--no-interactive", "--output", "json"];
  const { code, stdout } = await runKpass(args, 90_000);
  let out: Record<string, unknown> = {};
  try {
    out = JSON.parse(stdout);
  } catch {
    return { status: "error", topic, url, error: `kpass returned no JSON (exit ${code}).` };
  }
  const get = (o: unknown, path: string): unknown => path.split(".").reduce<unknown>((a, k) => (a && typeof a === "object" ? (a as Record<string, unknown>)[k] : undefined), o);
  if (out.status === "success") {
    const tx = String(get(out, "payment.transaction_hash") || get(out, "x402.payment_response.transaction") || "");
    const report = String(get(out, "x402.parsed_response_body.data.report") || "");
    if (tx && /^0x[0-9a-f]{64}$/i.test(tx)) state.spent = +(state.spent + price).toFixed(6);
    return {
      status: "paid",
      topic,
      url,
      price,
      tx_hash: tx || undefined,
      basescan_url: tx ? `https://basescan.org/tx/${tx}` : undefined,
      payer: String(get(out, "x402.payment_response.payer") || "") || undefined,
      network: String(get(out, "payment.network") || "") || undefined,
      spent_total: String(get(out, "usage.spent_total") || "") || undefined,
      reply: report
        ? { provider: LIVE_MERCHANT.name, excerpt: report.replace(/\*\*/g, "").slice(0, 900), source_count: Number(get(out, "x402.parsed_response_body.data.source_count")) || undefined }
        : undefined,
    };
  }
  const errorCode = typeof out.error_code === "string" ? out.error_code : undefined;
  const declined = Boolean(errorCode && /exceeded|expired|cap|limit|forbidden|not_in/i.test(errorCode));
  return {
    status: declined ? "declined" : "error",
    topic,
    url,
    price,
    error_code: errorCode,
    error: typeof out.error === "string" ? out.error.slice(0, 300) : `kpass exited ${code}`,
  };
}
