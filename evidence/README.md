# Centiv verified live run: evidence

This folder is a public-only backup. It holds no keys, tokens or session secrets. The machine-readable copy is [`verified-run.json`](verified-run.json), which matches `src/data/verified-run.json` and `GET /api/evidence`.

## Passport session (Kite Passport, production)

- **Session:** `agent_session_01a1c57f-7107-7b6e-92dc-a6313394ee07`
- **Request:** `agent_session_req_01a1c57e-aa78-70e5-8272-cf428f026490`
- **Approved:** 10 Nov 2026, 13:47:05 WAT, with the owner's passkey on agentpassport.ai. This time is the session's `expires_at` minus its 3600 s TTL.
- **Expired:** 10 Nov 2026, 14:47:05 WAT.
- **Caps:** $0.001 per call, $0.002 in total, 1 hour.
- **Scope:** `GET x402.ottoai.services /filtered-news`, scoped mode.
- **Passport wallet (payer):** `0x1F1Bf1b9de99A8a78a3b0D01C5B49E71f49A815b`
- **Otto AI payTo:** `0x0E84dDEdAaE6A779c462C22a59F301EC31B6b808`
- **Spent at the end:** 0.002 USDC, which is the full total cap.

## Calls

| # | Topic | Outcome | USDC | Base block | Time (WAT) | Transaction |
|---|---|---|---|---|---|---|
| 1 | airdrops | Paid | 0.001 | 55,622,556 | 13:48:06 | [0x869213b1…0f25353](https://basescan.org/tx/0x869213b1702cc37f3a7c5c3b8a4a5f17c56e5812ba2f414d6939da4e90f25353) |
| 2 | stablecoins | Paid | 0.001 | 55,622,640 | 13:48:23 | [0x2a38b086…e063b2d](https://basescan.org/tx/0x2a38b086915d3d7c92ac79ed3e8ce103cf4c7d1d117197f12f6131de9e063b2d) |
| 3 | ethereum | **Declined by Passport** | 0 | — | just after 13:48:23 | none. `session_total_exceeded`: "payment amount exceeds max_total_amount" |

## On-chain verification

I checked both transactions on 10 Nov 2026 against `https://mainnet.base.org`, using `eth_getTransactionByHash`, `eth_getTransactionReceipt` and `eth_getBlockByNumber`.

- Both have receipt status **1 (success)**.
- Each has exactly one USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`) `Transfer` log: **from** `0x1f1bf1b9…a815b` (the Passport wallet), **to** `0x0e84dded…6b808` (Otto AI), **amount 1000 raw, which is 0.001 USDC** (6 decimals).
- Each also has a USDC `AuthorizationUsed` log with the Passport wallet as authoriser. The call is `transferWithAuthorization` (EIP-3009, selector `0xe3ee160e`) on the USDC contract.
- **The transaction `from` is not the payer.** Transaction 1 was sent by `0x8cda367232d78c067116e3260da881d2da8ffa39`, and transaction 2 by `0x4c934c63c786157fefd990945b25ea60a0fb0205`. These accounts submitted the transactions and paid the gas. Because the payment is an EIP-3009 signed authorisation, they are best read as x402 facilitator relayers. The USDC itself moved from the Passport wallet.
- The block timestamps match the merchant's `X-Payment-Receipt` timestamps (12:48:06.940Z and 12:48:23.667Z, which is 13:48:06 and 13:48:23 WAT).

## Notes

- Kite Passport enforced the caps. Settlement was USDC on **Base mainnet** (`eip155:8453`), not on Kite chain. It is worth confirming with the Kite and OpenServ teams that Base settlement counts for the track.
- The news replies are excerpts of Otto AI's paid responses ("[Powered by $OTTO AI | @useOttoAI]"), trimmed by Centiv. The claims in them are Otto AI's and Centiv has not verified them.
