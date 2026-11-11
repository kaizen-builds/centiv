import type { ReactNode } from "react";
import { GITHUB_REPO } from "./StatusStrip";
import { paidCalls } from "@/lib/verified-run";

const a = "font-medium text-cent underline decoration-cent/30 underline-offset-[3px] hover:decoration-cent";
const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

const items: { q: string; a: ReactNode }[] = [
  {
    q: "Is the decline really from Kite Passport?",
    a: (
      <>
        Yes. On the third call, Passport returned <code className="num rounded bg-stop/10 px-1 text-[13px] text-stop">session_total_exceeded</code>{" "}
        because the $0.002 session total was already spent, so Centiv never signed a payment. The record is in the{" "}
        <a className={a} href="/api/evidence">evidence JSON</a>.
      </>
    ),
  },
  {
    q: "Did real money move?",
    a: (
      <>
        Yes, twice: two payments of 0.001 USDC on Base ({paidCalls.map((c, i) => (
          <span key={c.tx_hash}>
            {i > 0 && ", "}
            <a className={a} href={c.basescan_url} {...ext}>tx {c.n}</a>
          </span>
        ))}). The third call moved nothing, and this page never spends.
      </>
    ),
  },
  {
    q: "Did Reppo verify the data Otto AI sold?",
    a: (
      <>
        No. Reppo independently scored the research brief from the verified run: 86/100, accept, routed to review. It did
        not check Otto AI’s raw figures. The result is in the{" "}
        <a className={a} href="#verified-run">proof above</a>. Questions you ask here still use a built-in check, labelled
        Simulated.
      </>
    ),
  },
  {
    q: "What’s simulated?",
    a: (
      <>
        In the public demo, the payments, cap checks, data and pre-written briefs are simulated, and so is the quality gate for
        questions you ask here. See{" "}
        <a className={a} href="#real">What’s real</a>.
      </>
    ),
  },
  {
    q: "Can I run it myself?",
    a: (
      <>
        Yes. The <a className={a} href={`${GITHUB_REPO}#readme`} {...ext}>README on GitHub</a> covers setup, keys and the owner-only live
        mode.
      </>
    ),
  },
];

export default function Faq() {
  return (
    <div className="border-t border-[rgba(201,146,46,0.35)]">
      {items.map((it, i) => (
        <details key={it.q} className="group border-b border-[rgba(201,146,46,0.35)]" open={i === 0}>
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-semibold tracking-[-0.015em] text-bone [&::-webkit-details-marker]:hidden">
            {it.q}
            <span aria-hidden="true" className="text-[22px] font-normal leading-none text-gold-deep group-open:hidden">+</span>
            <span aria-hidden="true" className="hidden text-[22px] font-normal leading-none text-gold-deep group-open:inline">−</span>
          </summary>
          <div className="pb-5 pr-8 text-[14px] leading-[1.75] text-mute">{it.a}</div>
        </details>
      ))}
    </div>
  );
}
