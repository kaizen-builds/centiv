import type { ReactNode } from "react";
import { GITHUB_REPO } from "./StatusStrip";
import { paidCalls } from "@/lib/verified-run";

const a = "font-medium text-cent underline decoration-cent/30 underline-offset-[3px] hover:decoration-cent";
const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

const items: { q: string; a: ReactNode }[] = [
  {
    q: "Is the refusal really from Kite Passport?",
    a: (
      <>
        Yes. On the third call, Kite Passport returned{" "}
        <code className="num rounded bg-stop/10 px-1 text-[13px] text-stop">session_total_exceeded</code> because the
        $0.002 session total was already spent, so Centiv never signed a payment. The record is in the{" "}
        <a className={a} href="/api/evidence">
          evidence JSON
        </a>
        .
      </>
    ),
  },
  {
    q: "Did real money move?",
    a: (
      <>
        Yes, twice: two payments of 0.001 USDC on Base (
        {paidCalls.map((c, i) => (
          <span key={c.tx_hash}>
            {i > 0 && ", "}
            <a className={a} href={c.basescan_url} {...ext}>
              tx {c.n}
            </a>
          </span>
        ))}
        ). The third call moved nothing, and this page never spends.
      </>
    ),
  },
  {
    q: "Did SERV or Reppo score this run?",
    a: (
      <>
        No. The recorded run happened before SERV gating and per-call Reppo scoring were added, so neither is claimed
        for those receipts. On the live path now, SERV Reasoning can weigh each call before payment, and Reppo can
        independently score research that was bought.
      </>
    ),
  },
  {
    q: "Why Base and not Kite’s own chain?",
    a: (
      <>
        Otto AI, the data seller in the recorded run, takes x402 payment in USDC on Base or Solana, not on Kite’s chain.
        So the run settled in USDC on Base, with Kite Passport setting the caps and refusing the call that broke them.
      </>
    ),
  },
  {
    q: "What’s simulated?",
    a: (
      <>
        In the public demo, payments and cap checks are simulated. The demo uses the same Otto Ethereum news example and
        the same $0.001 / $0.002 caps as the recorded run; receipts start with sim_ so they can’t pass for on-chain
        hashes. See{" "}
        <a className={a} href="#real">
          What’s real
        </a>
        .
      </>
    ),
  },
  {
    q: "Can I run it myself?",
    a: (
      <>
        Yes. The{" "}
        <a className={a} href={`${GITHUB_REPO}#readme`} {...ext}>
          README on GitHub
        </a>{" "}
        covers setup, keys and the owner-only live mode.
      </>
    ),
  },
];

export default function Faq() {
  return (
    <ul className="divide-y divide-[rgba(201,146,46,0.25)] overflow-hidden rounded-[18px] border border-[rgba(201,146,46,0.45)] bg-white">
      {items.map((it, i) => (
        <li key={it.q}>
          <details className="group" open={i === 0}>
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[16px] font-medium tracking-[-0.015em] text-bone transition hover:bg-[#fffaf0] sm:px-6 [&::-webkit-details-marker]:hidden">
              {it.q}
              <span aria-hidden="true" className="text-[20px] leading-none text-dim transition group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="px-5 pb-5 text-[15px] leading-[1.65] text-mute sm:px-6">{it.a}</div>
          </details>
        </li>
      ))}
    </ul>
  );
}
