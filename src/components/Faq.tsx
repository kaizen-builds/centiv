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
        Yes. The refusal shown here is from a retake of call 3 in the same fully-spent session. Kite Passport returned{" "}
        <code className="num rounded bg-stop/10 px-1 text-[13px] text-stop">session_total_exceeded</code> because the
        $0.002 session total was already spent, so Centiv never signed a payment. In the first take, call 3 was stopped
        by Centiv’s own local limit before it reached Kite Passport. The record is in the{" "}
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
    q: "Did SERV or Reppo stop a payment?",
    a: (
      <>
        No. SERV Reasoning chose a short topic and weighed each call before payment (spend, spend, spend). Centiv
        followed SERV on both paid calls. Reppo scored the two paid excerpts after they settled, 55 and 82. Reppo does
        not interrupt, block or undo a payment. Kite Passport is the hard limit that refused call 3.
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
        The public demo is a replay of the recorded 12 Nov 19:38 WAT run, labelled “Replay of a real run · 12 Nov 19:38
        WAT · no money moves.” It walks through the same question, SERV topics, spend verdicts, recorded 0.001 USDC
        payments (with the real transaction links marked recorded) and the Kite Passport refusal. No money moves. If you
        type a different question, the demo still replays this recorded example and says so. See{" "}
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
    <ul className="divide-y divide-[rgba(196, 148, 100,0.25)] overflow-hidden rounded-[18px] border border-[rgba(196, 148, 100,0.45)] bg-white">
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
