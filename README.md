# Centiv

**Research that pays in cents, and can stop.**

Centiv is a pay-per-call research agent built for SERV Hackathon 02 (Kite track). You approve a Kite Passport spending session (budget, per-call cap, time window). The verified live run settled in USDC on Base; visitor payments on the public site are simulated. SERV Reasoning decides whether each paid data call is worth what's left; Centiv pays via x402 or declines before signing when a limit would be breached; and a quality gate accepts, revises or rejects the draft before you see it. In the featured recorded run, SERV Reasoning weighed each call before payment, and Reppo scored the two paid excerpts after the fact (66 and 60, both below 70). Reppo does not block or undo a payment. Public visitor questions use a built-in check, labelled Simulated. Every decision lands in the audit trail, labelled by its source.

Live site: [centiv-gilt.vercel.app](https://centiv-gilt.vercel.app) · [Verified live run](https://centiv-gilt.vercel.app/#verified-run)

## Modes and badges

Every run, receipt and audit row carries exactly one of three badges:

| Badge | What it means | Where |
| --- | --- | --- |
| **Live · real payment** | A real x402 payment through an owner-approved Kite Passport session. | Owner-only, on a local machine (`/api/live`). **Never on the public Vercel site.** |
| **Simulated · no funds move** | Centiv applies the same per-call, total and time limits itself, and settlement is simulated. The real Passport refusal is in the verified run. Receipts are `sim_`-prefixed, set in italics and never linked, so they can't be mistaken for on-chain hashes. | Every visitor's question on the public site. SERV reasoning is live there. |
| **Replay · real on-chain run** | A replay of the real run on 12 Nov 2026, 18:27 WAT. It has real Basescan receipts and spends nothing. | The "Verified live run" section on `/` and `/app`, and the "Verified run" tab in the audit trail. |

`GET /api/status` reports the engine mode, the integrations, `payments.public` (always `simulated`), `replay` (session ID and transaction hashes) and `live_demo.enabled`, which is always `false` on Vercel.

## Verified live run (Replay)

See it on the site: [centiv-gilt.vercel.app/#verified-run](https://centiv-gilt.vercel.app/#verified-run). Payment evidence: [`evidence/verified-run.json`](evidence/verified-run.json) (`GET /api/evidence`). Notes: [`evidence/README.md`](evidence/README.md).

Featured run, 12 Nov 2026, 18:27 WAT. Question: “Is anything big happening with Ethereum ETFs this week?”

- Kite Passport session `agent_session_01a1d0c9-a0a7-788c-9e89-58aa4fbcfbf7` was approved with the owner's passkey. Caps: $0.001 per call, $0.002 in total, 2 hours. Scope: `GET x402.ottoai.services/filtered-news` only.
- Call 1 (`ethereum etf`) — SERV spend — paid 0.001 USDC on Base: [0xed19…bcd7](https://basescan.org/tx/0xed19ecf02c8173bb61397ddd96164a3a209fcb435abae5709d808d635d88bcd7). Reppo 66 / 100 after the fact (below the pass mark of 70).
- Call 2 (`ethereum etf`) — SERV skip, paid anyway so the cap could be shown being enforced — paid 0.001 USDC on Base: [0xde57…b06b](https://basescan.org/tx/0xde575cb65587b546d848bf71f7af07425b0681eef4c595f2a4781e8c35a2b06b). Reppo 60 / 100, settled after the call (below 70).
- Call 3 (`ethereum etf`) — SERV spend, then declined by Kite Passport with `session_total_exceeded`. Nothing was signed and no money moved.
- Reppo does not block or undo a payment. The earlier 01:11 WAT Ethereum news run is archived at [`evidence/verified-run-2026-11-12-0111.json`](evidence/verified-run-2026-11-12-0111.json). The 10 Nov run is at [`evidence/verified-run-2026-11-10.json`](evidence/verified-run-2026-11-10.json). An earlier Reppo check of a different brief (86 / 100, 11 Nov) remains at [`evidence/reppo-eval.json`](evidence/reppo-eval.json).

## Run it

```bash
cp .env.example .env.local   # optional keys
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

Requires Node 20+.

## Live demo for the video (owner-only, local)

Live payments are **off by default** and **cannot run on Vercel**. `/api/live` refuses unless every gate below passes:

1. `process.env.VERCEL` is unset, so this only works on your own machine.
2. `CENTIV_LIVE_TOKEN` is set to 24 characters or more, and the request sends it as `Authorization: Bearer …`. The browser panel asks you to paste it, and it is never stored.
3. `CENTIV_LIVE_SESSION_ID` names a Passport session that you approved with your passkey.
4. The request is addressed to `localhost`.
5. `kpass` is installed at `~/.local/bin/kpass` or `~/.kpass/bin/kpass` (or `KPASS_BIN`).
6. Per-run cap checks:
   - The free 402 quote must be within `CENTIV_LIVE_MAX_PER_CALL_USDC` (default 0.01).
   - This process's running total must stay within `CENTIV_LIVE_MAX_TOTAL_USDC` (default 0.05).
   - The session itself must be active and unexpired, scoped to Otto AI `/filtered-news` only, with caps no higher than `CENTIV_LIVE_MAX_PER_CALL_USDC` per call and `CENTIV_LIVE_MAX_SESSION_USDC` (default 0.10) in total.
7. Rate limit: one call every 3 s, and at most 20 an hour.

After that, Passport enforces its own caps. Centiv runs `kpass session execute --session-id … --no-browser`. It never passes `--use-allowance`, so it can't fall back to your account allowance. Only whitelisted public fields come back: status, transaction hash, Basescan link, error code and a reply excerpt.

### Recording the video

```bash
# 1. Request a small session. You approve it with your passkey on agentpassport.ai.
kpass session create --separate --preview ...   # a few cents in total, e.g. $0.001 per call, $0.002 total, ttl 900 s,
                                                # scoped to GET x402.ottoai.services /filtered-news
kpass session status --request-id <id> --wait --output json

# 2. Arm live mode locally (never set these on Vercel).
export CENTIV_LIVE_TOKEN=$(openssl rand -hex 16)
export CENTIV_LIVE_SESSION_ID=agent_session_…   # the session you just approved
npm run build && npm start                     # http://localhost:3000/app

# 3. In /app, the "Owner live mode" panel appears. Paste the token, pick a topic, then press Pay & fetch.
#    Calls 1 and 2 pay and show Basescan links. Call 3 comes back as "Declined" with session_total_exceeded.
```

Keep the Passport balance small. Live mode only spends from the session you approved.

## Routes

- `/` — landing
- `/app` — workspace; autoplays the short demo (two simulated Otto Ethereum ETF calls, then a refusal)
- `/app?demo=1` or `/app?demo=ab` — same autoplay (used by “Try the demo”)
- `/app?ask=1` — workspace without autoplay, so you can ask your own question
- `GET /api/status` — engine mode, integrations, payments (public = simulated), replay evidence, live_demo gate
- `GET /api/evidence` — sanitised evidence of the verified run (Replay)
- `GET|POST /api/live` — owner-only live payment (disabled on Vercel; see above)
- `POST /api/session` — approve a Passport spending session
- `POST /api/run` — one research run (SERV → Passport check → x402 → quality gate)
- `GET /api/data/funding` — local x402-shaped funding catalogue (402 until paid)

## The demo

The public demo lets you type a full question. SERV (or a built-in extractor) turns it into a one- or two-word Otto topic. The suggested example matches the recorded run: Otto AI Ethereum ETF news at $0.001 a call, with a $0.002 Kite Passport cap. In the recorded run the topic was set directly, not chosen by SERV. It attempts three calls. The first two settle as simulated payments (receipts start with `sim_`; no funds move). The third is refused because the $0.002 total is already spent. In this demo Centiv applies the limits itself; the real Kite Passport refusal is in the recorded run.

The wording shown is from Otto AI’s paid replies in the recorded run of 12 Nov 2026, 18:27 WAT. Claims are Otto AI’s. That run includes SERV Reasoning before each payment and Reppo scores after the two that paid.

## Environment variables

See [`.env.example`](.env.example). Summary:

| Variable | Purpose |
| --- | --- |
| `SERV_API_KEY` | SERV Reasoning at `https://inference-api.openserv.ai` ([docs](https://docs.openserv.ai/serv-reasoning/api), [console](https://console.openserv.ai/)) |
| `SERV_MODEL` | Optional model id (default `gpt-5.4-mini`) |
| `REPPO_API_KEY` | Reppo Evaluation API ([agents.md](https://eval.reppo.xyz/agents.md), [concepts](https://docs.reppo.ai/concepts/evaluation-api)) |
| `CENTIV_LIVE_TOKEN` | Owner token that arms `/api/live` locally (unset on Vercel) |
| `CENTIV_LIVE_SESSION_ID` | Passport session the owner approved for the live demo |
| `CENTIV_LIVE_MAX_PER_CALL_USDC` / `_MAX_TOTAL_USDC` / `_MAX_SESSION_USDC` | Centiv's own live limits (defaults 0.01 / 0.05 / 0.10) |
| `X402_DATA_URL` | Optional upstream that returns HTTP 402 + `PAYMENT-REQUIRED` (e.g. Kite weather test URL) |
| `X402_FUNDING_PRICE_USDC` | Price advertised by `/api/data/funding` |
| `X402_PAY_TO` | Receiving address in the local 402 challenge |
| `KITE_NETWORK` | Label / network hint for Passport + x402 |

**Never commit secrets.** Put keys in `.env.local` or your host's secret store (e.g. Vercel env), not in the repo.

### What you need for a fully live path

1. **OpenServ** — account + API key + credits ([hackathon](https://www.openserv.ai/hackathon-2)).
2. **Kite Passport** — install `kpass`, passkey, fund the Passport wallet with USDC on Base (the verified run used 2.16 USDC sent on Base), approve a capped spending session ([Passport](https://docs.gokite.ai/passport), [CLI](https://docs.gokite.ai/reference/kpass-cli), [payments](https://docs.gokite.ai/passport/payments)). There is no public HTTP Passport API yet, so live payments go through `kpass session execute`, and only via the owner-gated `/api/live` route.
3. **x402 data source** — one research feed. Centiv ships a funding catalogue at `/api/data/funding`. For a real seller, wrap an upstream with [`kite-x402-hono`](https://www.npmjs.com/package/kite-x402-hono) / explorer / axum (hackathon priority repos). Optional test URL: `https://x402.dev.gokite.ai/api/weather?location=San%20Francisco`.
4. **Reppo** — optional for live per-run scoring. API key from [eval.reppo.xyz](https://eval.reppo.xyz); live shape is in [agents.md](https://eval.reppo.xyz/agents.md). Without `REPPO_API_KEY`, visitor briefs use the built-in check, labelled **Built-in check · Simulated**. With a key, live results are labelled **Reppo**. Do not submit private data. The public production site does not set this key, so visitor questions are not sent to Reppo. A recorded Reppo check of an earlier 10 Nov brief (score 86, accept, routed to review) remains at [`/api/reppo-eval`](https://centiv-gilt.vercel.app/api/reppo-eval). It does not score the featured 12 Nov 18:27 WAT Ethereum ETF run, whose per-call scores are 66 and 60. The Evaluation API did not return a public share URL. If a live key is present, the demo polls briefly (~45s) then falls back with the `evalId` if still settling.

## Structure

```
src/lib/centiv.ts              types, catalogue scenarios, helpers
src/lib/server/mode.ts         simulated / hybrid / live detection
src/lib/server/passport.ts     session + mid-task cap enforcement
src/lib/server/live.ts         owner-gated live payments via kpass (local only)
src/lib/verified-run.ts        typed replay evidence (src/data/verified-run.json)
src/lib/server/serv.ts         SERV Reasoning spend/skip/decline
src/lib/server/x402.ts         quote + pay
src/lib/server/reppo.ts        Evaluation API gate (live, only if REPPO_API_KEY is set)
src/lib/reppo-eval.ts         Recorded real Reppo check of the verified-run brief
src/lib/server/engine.ts       orchestrates one run
src/app/api/*/route.ts         status, session, run, funding catalogue
src/components/CentivApp.tsx   workspace UI (calls the API)
```

## Official docs used

- Hackathon: https://www.openserv.ai/hackathon-2
- SERV Reasoning: https://docs.openserv.ai/serv-reasoning/api
- Kite Passport: https://docs.gokite.ai/passport · payments · kpass CLI
- Reppo Evaluation: https://docs.reppo.ai/concepts/evaluation-api · https://eval.reppo.xyz/agents.md

Released under the [MIT License](LICENSE).
