# Centiv

Centiv is a research agent that buys data one call at a time, inside a Kite Passport spending cap the owner approves with a passkey.
In a verified run on Base, Passport paid two calls and declined the third with `session_total_exceeded`, and no money moved.
Built for the Kite track of [SERV Hackathon 02](https://www.openserv.ai/hackathon-2), with live SERV Reasoning and x402 payments.

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

## What's next

- Connect Reppo so the quality gate is a live score rather than the built-in check.

## Links

- Live site: https://centiv-gilt.vercel.app
- App: https://centiv-gilt.vercel.app/app
- Evidence: https://centiv-gilt.vercel.app/api/evidence
- Source: https://github.com/kaizen-builds/centiv (setup steps are in the [README](https://github.com/kaizen-builds/centiv#readme))
