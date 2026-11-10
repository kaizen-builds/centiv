# Centiv

A research agent that buys data one call at a time, inside a Kite Passport spending cap the owner approves with a passkey. When the cap is reached, Passport itself refuses the payment and no money moves.

## Track

Kite track, [SERV Hackathon 02](https://www.openserv.ai/hackathon-2).

## The problem

Agents with wallets can spend without a hard stop. A limit that lives only in app code can be bypassed. What is needed is a cap the agent cannot override.

## What Centiv does

The owner approves a Kite Passport session: a limit per call, a total budget and a time window. SERV Reasoning (live) decides whether each paid data call is worth what remains. Payments use x402 (EIP-3009, USDC). Passport pays inside the cap and refuses over it, with nothing signed.

## The proof

On 10 November 2026 the owner approved session `agent_session_01a1c57f-7107-7b6e-92dc-a6313394ee07` with a passkey. Caps: $0.001 per call, $0.002 in total, one hour. Scope: `GET x402.ottoai.services/filtered-news` only. Two Otto AI calls paid in USDC on Base. Passport declined the third with `session_total_exceeded`. No money moved. The refusal came from Passport, not from Centiv's own logic.

| Call | Topic | Outcome | USDC | Transaction |
| --- | --- | --- | --- | --- |
| 1 | airdrops | Paid | 0.001 | [0x869213b1702cc37f3a7c5c3b8a4a5f17c56e5812ba2f414d6939da4e90f25353](https://basescan.org/tx/0x869213b1702cc37f3a7c5c3b8a4a5f17c56e5812ba2f414d6939da4e90f25353) |
| 2 | stablecoins | Paid | 0.001 | [0x2a38b086915d3d7c92ac79ed3e8ce103cf4c7d1d117197f12f6131de9e063b2d](https://basescan.org/tx/0x2a38b086915d3d7c92ac79ed3e8ce103cf4c7d1d117197f12f6131de9e063b2d) |
| 3 | ethereum | Declined by Passport (`session_total_exceeded`) | 0 | none |

Both payments are EIP-3009 `transferWithAuthorization` calls on USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`), checked against Base mainnet. Evidence: [`evidence/`](evidence/) and [`/api/evidence`](https://centiv-gilt.vercel.app/api/evidence).

## How it works

1. **Kite Passport session.** Caps and scope are approved with a passkey. Live payments run `kpass session execute` and never pass `--use-allowance`, so they cannot fall back to the account allowance.
2. **SERV Reasoning.** Before each purchase, SERV decides whether the data is worth the remaining budget: buy, skip or stop.
3. **x402.** Each data call carries its own price. Payment is an EIP-3009 authorisation. In the verified run, settlement was USDC on Base.

## What's real and what's simulated

| Part | Status | Detail |
| --- | --- | --- |
| Passport caps and payments in the verified run | Replay | A real Kite Passport session and two real USDC payments on Base. Passport refused the third call. The page replays it from the evidence file and never spends. |
| SERV Reasoning | Live | Real model calls. SERV decides whether each paid call is worth it for every question asked in the app. |
| Payments in the public demo | Simulated | Visitors never spend money. Receipts start with `sim_` so they cannot pass for on-chain hashes. |
| Cap checks in the public demo | Simulated | Centiv applies the same per-call, total and time limits itself. The real Passport refusal is in the verified run. |
| Quality gate | Simulated | Reppo is not wired in. Until a Reppo key is connected, a built-in check scores each brief, labelled Simulated. |
| Data, prices and briefs in the public demo | Simulated | Example datasets, prices and briefs for illustration. The landing demo is simulated and its briefs are pre-written. The real data and real price ($0.001 a call) are in the verified run. |

Live payments are owner-only and cannot run on the public Vercel site.

## Why Base

The verified run settled on Base (`eip155:8453`), not on Kite chain (`eip155:2366`). A Kite-chain settlement would have needed bridged USDC (USDC.e) on that chain. In the dev environment we tried, the wallet did not hold USDC.e, and the official dev test merchant returned `payment_target_forbidden`.

Passport has supported settlement on Base since the [8 July 2026 release](https://docs.gokite.ai/changelog/2026/2026-07-08-release). No written hackathon rule excludes Base.

## How to run it

Requires Node 20+.

```bash
cp .env.example .env.local   # optional keys
npm install
npm run dev                  # http://localhost:3000
```

Routes: `/` (landing), `/app` (workspace), `/app?demo=ab` (30-second simulated demo). Real Passport payments run only locally, via the owner-gated `/api/live` route, with `kpass` and an approved session. See the README for the live-mode gates.

## What's next

- Record a short demo video of a fresh, small Passport session: two paid calls, then the third declined. Link: [VIDEO LINK].
- Optionally connect Reppo so the quality gate is a live score rather than the built-in check.
- If USDC.e on Kite chain becomes practical for this wallet, repeat the same capped run against a Kite-chain merchant.

## Links

- Live site: https://centiv-gilt.vercel.app
- App: https://centiv-gilt.vercel.app/app
- Evidence: https://centiv-gilt.vercel.app/api/evidence
- Source: https://github.com/kaizen-builds/centiv
- Demo video: [VIDEO LINK]
- X post: [X POST LINK]

---

## Short version

Centiv is a research agent that buys data one call at a time inside a Kite Passport spending cap the owner approves with a passkey. SERV Reasoning (live) decides whether each call is worth the remaining budget. Payments use x402 (EIP-3009, USDC on Base).

On 10 November 2026, session `agent_session_01a1c57f-7107-7b6e-92dc-a6313394ee07` was capped at $0.001 per call and $0.002 in total. Two Otto AI `/filtered-news` calls paid ([tx 1](https://basescan.org/tx/0x869213b1702cc37f3a7c5c3b8a4a5f17c56e5812ba2f414d6939da4e90f25353), [tx 2](https://basescan.org/tx/0x2a38b086915d3d7c92ac79ed3e8ce103cf4c7d1d117197f12f6131de9e063b2d)). Passport declined the third with `session_total_exceeded`; no money moved. The refusal came from Passport, not from app logic.

Settlement is on Base because a Kite-chain payment needed USDC.e, which the dev environment did not have, and the dev test merchant returned `payment_target_forbidden`. Passport has supported Base settlement since [8 July 2026](https://docs.gokite.ai/changelog/2026/2026-07-08-release). The public demo is simulated; Reppo is not wired in.

https://centiv-gilt.vercel.app · https://github.com/kaizen-builds/centiv · Video: [VIDEO LINK] · X: [X POST LINK]
