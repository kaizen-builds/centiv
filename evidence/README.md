# Centiv verified live run: evidence

This folder is a public-only backup. It holds no keys, tokens or session secrets.

The featured machine-readable copy is [`verified-run.json`](verified-run.json), which matches `src/data/verified-run.json` and `GET /api/evidence`. That file is the **12 Nov 2026, 19:38 WAT** crypto and ETH ETF run.

Archived earlier runs:

- [`verified-run-2026-11-12-1827.json`](verified-run-2026-11-12-1827.json) — the 12 Nov 18:27 WAT Ethereum ETF run (topic set directly; call 2 paid despite a SERV skip).
- [`verified-run-2026-11-12-0111.json`](verified-run-2026-11-12-0111.json) — the 12 Nov 01:11 WAT Ethereum news run (no SERV or per-call Reppo on those receipts).
- [`verified-run-2026-11-10.json`](verified-run-2026-11-10.json) — the first real run, 10 Nov 2026 (airdrops / stablecoins / ethereum).
- [`reppo-eval.json`](reppo-eval.json) — a Reppo check of a different brief on 11 Nov 2026 (86 / 100). It does not score the featured 19:38 WAT run. Also at `GET /api/reppo-eval`.

## Featured run (12 Nov 2026, 19:38 WAT)

- **Question:** What's moving in the crypto and ETH ETF market this week?
- **Topics:** chosen by SERV for each call — `eth etf`, then `crypto flows`, then `fund flows`.
- **Session:** `agent_session_01a1d108-037e-7c83-aebf-4da7116107eb`
- **Request:** `agent_session_req_01a1d106-5485-78c3-afba-66dc092ddf9a`
- **Approved:** with the owner's passkey on agentpassport.ai.
- **Expired:** 12 Nov 2026, 21:32:05 WAT.
- **Caps:** $0.001 per call, $0.002 in total.
- **Scope:** `GET x402.ottoai.services /filtered-news`, scoped mode.
- **Kite Passport wallet (payer):** `0x1F1Bf1b9de99A8a78a3b0D01C5B49E71f49A815b`
- **Otto AI payTo:** `0x0E84dDEdAaE6A779c462C22a59F301EC31B6b808`
- **Spent at the end:** 0.002 USDC, the full total cap.

### Calls

| # | Topic | SERV | Outcome | USDC | Reppo | Base block | Time (WAT) | Transaction |
|---|---|---|---|---|---|---|---|---|
| 1 | eth etf | spend | Paid | 0.001 | 55 / 100, reject / block, during the request | 56,591,687 | 19:38:33 | [0xabf5b682…e58de3](https://basescan.org/tx/0xabf5b682425978ccd310aefaf2ba921520a215712cfca2242604611e42e58de3) |
| 2 | crypto flows | spend | Paid | 0.001 | 82 / 100, accept / review, low confidence, during the request | 56,592,109 | 19:39:57 | [0xa47fa940…64bc906](https://basescan.org/tx/0xa47fa9409fc19ffc0277f06b2f343526bd2d88aa815988d777abca08064bc906) |
| 3 | fund flows | spend | **Declined by Kite Passport** (retake) | 0 | — | — | 19:46 (from the screen recording) | none. `session_total_exceeded`: "payment amount exceeds max_total_amount" |

Centiv followed SERV on every call (both paid calls were spend).

Reppo scores a paid excerpt after the fact. It does not block or undo a payment.

The featured call 3 refusal is the **retake** in the same fully-spent session. In the first take, call 3 was stopped by Centiv’s own local limit (`centiv_run_total_limit`) before reaching Kite Passport, and SERV was not asked to weigh that first-take call 3. Call 3 was retaken with that local limit off, and Kite Passport declined with `session_total_exceeded`.

### On-chain verification

Both transactions were checked on 12 Nov 2026 against `https://base-rpc.publicnode.com`, using `eth_getTransactionByHash`, `eth_getTransactionReceipt` and `eth_getBlockByNumber`.

- Both have receipt status **1 (success)**.
- Each has a USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`) `Transfer` log: **from** `0x1F1Bf1b9…A815b` (the Kite Passport wallet), **to** `0x0E84dDEd…6b808` (Otto AI), **amount 1000 raw, which is 0.001 USDC** (6 decimals).
- Each also has a USDC `AuthorizationUsed` log. The call is `transferWithAuthorization` (EIP-3009, selector `0xe3ee160e`) on the USDC contract.
- **The transaction `from` is not the payer.** Transaction 1 was sent by `0x59b7ebc67a3d627fabaf06768c818638452ae704`, and transaction 2 by `0x68a96f41ff1e9f2e7b591a931a4ad224e7c07863`. These accounts submitted the transactions and paid the gas. Because the payment is an EIP-3009 signed authorisation, they are best read as x402 facilitator relayers. The USDC itself moved from the Kite Passport wallet.
- Block timestamps: 18:38:33 UTC and 18:39:57 UTC (19:38:33 and 19:39:57 WAT). Checked at 18:52:42 UTC, when the chain head was 56,595,935 (4,248 and 3,826 confirmations).

### Notes

- Kite Passport enforced the caps. Settlement was USDC on **Base mainnet** (`eip155:8453`), not on Kite chain.
- The news replies are excerpts of Otto AI’s paid responses, trimmed at 900 characters as returned by the live call. The claims in them are Otto AI’s and Centiv has not verified them. The two paid calls returned different briefings (152 and 182 sources).
- The public interactive demo on the site is a replay of this run. It is labelled “Replay of a real run · 12 Nov 19:38 WAT · no money moves.”
