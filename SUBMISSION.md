# Centiv

**Research that pays in cents, and can stop.**

Centiv is a research agent that buys data one call at a time, inside a Kite Passport spending cap the owner approves with a passkey.
In a verified run on Base, Passport paid two calls and declined the third with `session_total_exceeded`, and no money moved.
Built for the Kite track of [SERV Hackathon 02](https://www.openserv.ai/hackathon-2), with live SERV Reasoning and x402 payments.
Everything here was built from scratch during the hackathon (2 to 15 November 2026).

## The problem

Agents with wallets can spend without a hard stop. A limit that lives only in app code can be bypassed. What is needed is a cap the agent cannot override.

## What Centiv does

The owner approves a Kite Passport session: a limit per call, a total budget and a time window. SERV Reasoning (live) decides whether each paid data call is worth what remains. Payments use x402 (EIP-3009, USDC). Passport pays inside the cap and refuses over it, with nothing signed.

## The proof

On 12 November 2026, 19:38 WAT, the owner approved session `agent_session_01a1d108-037e-7c83-aebf-4da7116107eb` (request `agent_session_req_01a1d106-5485-78c3-afba-66dc092ddf9a`) with a passkey. Question: “What's moving in the crypto and ETH ETF market this week?” Caps: $0.001 per call, $0.002 in total. Expires 12 Nov 2026, 21:32:05 WAT. Scope: `GET x402.ottoai.services/filtered-news` only. SERV Reasoning chose a short topic for each call and said spend on all three. Two Otto AI calls paid in USDC on Base. Kite Passport declined the third with `session_total_exceeded`. Nothing was signed. The refusal shown is the retake of call 3 in the same fully-spent session; the first take was stopped by Centiv’s own local limit before it reached Kite Passport.

| Call | Topic (SERV) | SERV | Outcome | USDC | Reppo | Transaction |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | eth etf | spend | Paid | 0.001 | 55 / 100, reject / block | [0xabf5b682…e58de3](https://basescan.org/tx/0xabf5b682425978ccd310aefaf2ba921520a215712cfca2242604611e42e58de3) |
| 2 | crypto flows | spend | Paid | 0.001 | 82 / 100, accept / review, low confidence | [0xa47fa940…4bc906](https://basescan.org/tx/0xa47fa9409fc19ffc0277f06b2f343526bd2d88aa815988d777abca08064bc906) |
| 3 | fund flows | spend | Declined by Kite Passport (`session_total_exceeded`) | 0 | — | none |

Both payments are EIP-3009 `transferWithAuthorization` calls on USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`), checked against Base mainnet. Evidence: [`evidence/`](evidence/) and [`/api/evidence`](https://centiv-gilt.vercel.app/api/evidence). Reppo scored the paid excerpts after the fact and did not block or undo a payment.

An earlier 10 November run, and an 11 November Reppo check of that earlier brief (86 / 100), remain archived in [`evidence/`](evidence/).

## How it works

1. **Kite Passport session.** Caps and scope are approved with a passkey. Live payments run `kpass session execute` and never pass `--use-allowance`, so they cannot fall back to the account allowance.
2. **SERV Reasoning.** Before each purchase, SERV decides whether the data is worth the remaining budget: buy, skip or stop.
3. **x402.** Each data call carries its own price. Payment is an EIP-3009 authorisation. In the verified run, settlement was USDC on Base.

## What's real and what's simulated

| Part | Status | Detail |
| --- | --- | --- |
| Passport caps and payments in the verified run | Replay | A real Kite Passport session and two real USDC payments on Base, 12 Nov 19:38 WAT. Kite Passport refused the third call. The page replays it from the evidence file and never spends. |
| SERV Reasoning in the recorded run and public demo | Replay | SERV chose a topic and weighed each call before payment in the recorded run. The public demo replays those verdicts. |
| Payments and cap checks in the public demo | Replay | The public demo replays the recorded 19:38 WAT run step by step. Real transaction links are marked recorded. No money moves. |
| Reppo scores in the recorded run and public demo | Replay | 55 and 82 after the two paid calls. Reppo does not block or undo a payment. The demo replays those recorded scores. |
| Earlier Reppo check of a 10 Nov brief | Recorded | A real Reppo Evaluation API check on 11 Nov 2026. Score 86 / 100. It does not score the featured 19:38 WAT run. Raw result: [`/api/reppo-eval`](https://centiv-gilt.vercel.app/api/reppo-eval). |

Live payments are owner-only and cannot run on the public Vercel site.

## What's next

- Optionally call Reppo live on owner-gated runs, with a spending cap, now that the recorded check is in place. Visitor questions on the public site should stay on the built-in check unless private data can be kept off the network.

## Disclosure

Disclosure: [kaizen to fill in any Kite affiliation, or 'none']

## Links

- Live site: https://centiv-gilt.vercel.app
- App: https://centiv-gilt.vercel.app/app
- Evidence: https://centiv-gilt.vercel.app/api/evidence
- Reppo result: https://centiv-gilt.vercel.app/api/reppo-eval
- Source: https://github.com/kaizen-builds/centiv (setup steps are in the [README](https://github.com/kaizen-builds/centiv#readme))
