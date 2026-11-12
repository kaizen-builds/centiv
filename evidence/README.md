# Centiv verified live run: evidence

This folder is a public-only backup. It holds no keys, tokens or session secrets.

The featured machine-readable copy is [`verified-run.json`](verified-run.json), which matches `src/data/verified-run.json` and `GET /api/evidence`. That file is the **12 Nov 2026, 18:27 WAT** Ethereum ETF run.

Archived earlier runs:

- [`verified-run-2026-11-12-0111.json`](verified-run-2026-11-12-0111.json) — the 12 Nov 01:11 WAT Ethereum news run (no SERV or per-call Reppo on those receipts).
- [`verified-run-2026-11-10.json`](verified-run-2026-11-10.json) — the first real run, 10 Nov 2026 (airdrops / stablecoins / ethereum).
- [`reppo-eval.json`](reppo-eval.json) — a Reppo check of a different brief on 11 Nov 2026 (86 / 100). It does not score the featured 18:27 WAT run. Also at `GET /api/reppo-eval`.

## Featured run (12 Nov 2026, 18:27 WAT)

- **Question:** Is anything big happening with Ethereum ETFs this week?
- **Topic:** `ethereum etf` — set directly for the three calls, not chosen by SERV. The question sat in the Kite Passport task.
- **Session:** `agent_session_01a1d0c9-a0a7-788c-9e89-58aa4fbcfbf7`
- **Request:** `agent_session_req_01a1d0c6-07aa-78fe-831b-66525e4e62d8`
- **Approved:** with the owner's passkey on agentpassport.ai.
- **Expired:** 12 Nov 2026, 20:23:57 WAT (2 hour TTL).
- **Caps:** $0.001 per call, $0.002 in total.
- **Scope:** `GET x402.ottoai.services /filtered-news`, scoped mode.
- **Kite Passport wallet (payer):** `0x1F1Bf1b9de99A8a78a3b0D01C5B49E71f49A815b`
- **Otto AI payTo:** `0x0E84dDEdAaE6A779c462C22a59F301EC31B6b808`
- **Spent at the end:** 0.002 USDC, the full total cap.

### Calls

| # | Topic | SERV | Outcome | USDC | Reppo | Base block | Time (WAT) | Transaction |
|---|---|---|---|---|---|---|---|---|
| 1 | ethereum etf | spend | Paid | 0.001 | 66 / 100, after the fact (below 70) | 56,570,462 | 18:27:48 | [0xed19ecf0…88bcd7](https://basescan.org/tx/0xed19ecf02c8173bb61397ddd96164a3a209fcb435abae5709d808d635d88bcd7) |
| 2 | ethereum etf | skip | Paid anyway | 0.001 | 60 / 100, settled after the call (below 70) | 56,570,707 | 18:28:37 | [0xde575cb6…a2b06b](https://basescan.org/tx/0xde575cb65587b546d848bf71f7af07425b0681eef4c595f2a4781e8c35a2b06b) |
| 3 | ethereum etf | spend | **Declined by Kite Passport** | 0 | — | — | 18:29:25 (from the screen recording) | none. `session_total_exceeded`: "payment amount exceeds max_total_amount" |

Call 2 was paid despite SERV’s skip so the cap could be shown being enforced: SERV flagged it, the agent paid anyway — Kite Passport is the hard limit.

Reppo scores a paid excerpt after the fact. It does not block or undo a payment. Both paid calls scored below Reppo’s pass mark of 70.

### On-chain verification

Both transactions were checked on 12 Nov 2026 against `https://mainnet.base.org`, using `eth_getTransactionByHash`, `eth_getTransactionReceipt` and `eth_getBlockByNumber`.

- Both have receipt status **1 (success)**.
- Each has a USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`) `Transfer` log: **from** `0x1f1bf1b9…a815b` (the Kite Passport wallet), **to** `0x0e84dded…6b808` (Otto AI), **amount 1000 raw, which is 0.001 USDC** (6 decimals).
- Each also has a USDC `AuthorizationUsed` log. The call is `transferWithAuthorization` (EIP-3009, selector `0xe3ee160e`) on the USDC contract.
- **The transaction `from` is not the payer.** Transaction 1 was sent by `0xe74817f4cdc15844314812b2271276e64e890fae`, and transaction 2 by `0x625d8a65134079f8faaac39a7947c73d93c6ac39`. These accounts submitted the transactions and paid the gas. Because the payment is an EIP-3009 signed authorisation, they are best read as x402 facilitator relayers. The USDC itself moved from the Kite Passport wallet.
- Block timestamps: 17:27:48 UTC and 17:28:37 UTC (18:27:48 and 18:28:37 WAT).

### Notes

- Kite Passport enforced the caps. Settlement was USDC on **Base mainnet** (`eip155:8453`), not on Kite chain.
- The news replies are excerpts of Otto AI’s paid responses, trimmed at 900 characters as returned by the live call. The claims in them are Otto AI’s and Centiv has not verified them. Both paid calls returned the same briefing (180 sources).
