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
    <ul className="divide-y divide-[rgba(201,146,46,0.25)] overflow-hidden rounded-[18px] border border-[rgba(201,146,46,0.45)] bg-white">
      {items.map((it, i) => (
        <li key={it.q}>
          <details className="group" open={i === 0}>
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[16px] font-medium tracking-[-0.015em] text-bone transition hover:bg-[#fffaf0] sm:px-6 [&::-webkit-details-marker]:hidden">
              {it.q}
              <span aria-hidden="true" className="text-[20px] leading-none text-dim transition group-open:rotate-45">+</span>
            </summary>
            <div className="px-5 pb-5 text-[15px] leading-[1.6] text-mute sm:px-6">{it.a}</div>
          </details>
        </li>
      ))}
    </ul>
  );
}
