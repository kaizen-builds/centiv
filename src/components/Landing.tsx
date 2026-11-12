import Link from "next/link";
import type { ReactNode } from "react";
import { Suspense } from "react";
import AskPreview from "./AskPreview";
import Faq from "./Faq";
import { CentivWordmark } from "./Logo";
import { RealVsSimulated, RealVsSimulatedFallback } from "./RealVsSimulated";
import Reveal from "./Reveal";
import RunTerminal from "./RunTerminal";
import { GITHUB_REPO, GitHubMark } from "./StatusStrip";
import StatusPill, { StatusPillFallback } from "./StatusPill";
import { ProvenanceBadge } from "./ui";
import CapProgress, { recordedCapState } from "./CapProgress";
import VerifiedRun from "./VerifiedRun";
import { declinedCall, paidCalls, VERIFIED_RUN } from "@/lib/verified-run";

const NE = () => (
  <svg className="ne" width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
    <path d="M2 8 8 2M3.5 2H8v4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const primary = "pill pill-cent h-12 px-7 text-[15px]";
const outline = "pill pill-outline h-12 px-7 text-[15px]";
const shell = "mx-auto max-w-[1280px] px-4 sm:px-6 md:px-8";
const chapter = "px-4 py-24 sm:px-6 md:px-8 md:py-36";

function StepIcon({ kind }: { kind: "cap" | "weigh" | "pay" }) {
  const c = { stroke: "currentColor", strokeWidth: 1.25, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      {kind === "cap" && (
        <>
          <circle cx="12" cy="12" r="8" {...c} />
          <path d="M12 4v8l5.5 5.5" {...c} />
        </>
      )}
      {kind === "weigh" && (
        <>
          <path d="M12 4v16M7 20h10M4 8h16" {...c} />
          <path d="M4 8l-2 6a3 3 0 0 0 4 0zM20 8l-2 6a3 3 0 0 0 4 0z" {...c} />
        </>
      )}
      {kind === "pay" && (
        <>
          <rect x="3" y="6" width="18" height="12" rx="2.5" {...c} />
          <circle cx="12" cy="12" r="2.5" {...c} />
        </>
      )}
    </svg>
  );
}

function SectionHead({
  label,
  id,
  title,
  children,
  split = false,
}: {
  label: string;
  id: string;
  title: ReactNode;
  children?: ReactNode;
  split?: boolean;
}) {
  if (split) {
    return (
      <Reveal className="grid items-start gap-6 md:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] md:gap-16 lg:gap-24">
        <div>
          <p className="eyebrow text-cent">{label}</p>
          <h2 id={id} className="mt-5 text-[40px] font-normal leading-[1.02] tracking-[-0.045em] text-bone md:text-[56px] lg:text-[60px]">
            {title}
          </h2>
        </div>
        {children && <div className="max-w-[460px] text-[16px] leading-[1.65] text-mute md:pt-10">{children}</div>}
      </Reveal>
    );
  }
  return (
    <Reveal className="max-w-[780px]">
      <p className="eyebrow text-cent">{label}</p>
      <h2 id={id} className="mt-5 text-[40px] font-normal leading-[1.02] tracking-[-0.045em] text-bone md:text-[56px] lg:text-[60px]">
        {title}
      </h2>
      {children && <div className="mt-6 max-w-[540px] text-[16px] leading-[1.65] text-mute">{children}</div>}
    </Reveal>
  );
}

const steps: { k: "cap" | "weigh" | "pay"; t: string; s: string }[] = [
  {
    k: "cap",
    t: "You set the cap",
    s: "Approve a Kite Passport session with your passkey: a limit per call, a total, and a time window. Centiv can only spend inside it.",
  },
  {
    k: "weigh",
    t: "It weighs each call",
    s: "SERV Reasoning weighs each call before payment: is the data worth what’s left? Then it buys, skips or declines.",
  },
  {
    k: "pay",
    t: "It pays, or it stops",
    s: "Inside the cap, the payment goes through. Over it, Kite Passport refuses: nothing is signed and no money moves. After a payment, Reppo may score what was bought, as a quality record. That score does not decide later calls, and it does not block or undo a payment.",
  },
];

const partners: { name: string; role: string; href: string }[] = [
  {
    name: "Kite Passport",
    role: "The cap you approve with a passkey.",
    href: "https://docs.gokite.ai/passport",
  },
  {
    name: "SERV Reasoning",
    role: "Weighs each call before payment.",
    href: "https://docs.openserv.ai/serv-reasoning/api",
  },
  {
    name: "Reppo",
    role: "A quality record of what was bought.",
    href: "https://eval.reppo.xyz/agents.md",
  },
  {
    name: "Otto AI",
    role: "The news feed the recorded run paid.",
    href: "https://x402.ottoai.services/filtered-news?topic=ethereum%20etf",
  },
];

const audiences: { t: string; s: string }[] = [
  {
    t: "Analysts and researchers",
    s: "You want data-backed answers, but not an agent that buys every dataset it finds.",
  },
  {
    t: "Agent builders",
    s: "Your agent needs to pay for APIs, with a cap it can’t override, enforced outside your own code.",
  },
  {
    t: "Teams",
    s: "You want a research budget with a record: the reason, the amount, and what was left.",
  },
];

const DEMO_VIDEO_URL = "";
const X_POST_URL = "";

const footerLinks: { label: string; href: string }[] = [
  { label: "GitHub", href: GITHUB_REPO },
  ...(DEMO_VIDEO_URL ? [{ label: "Demo video", href: DEMO_VIDEO_URL }] : []),
  ...(X_POST_URL ? [{ label: "X post", href: X_POST_URL }] : []),
];

const resources: { label: string; href: string; external?: boolean; note: string }[] = [
  { label: "Source code", href: GITHUB_REPO, external: true, note: "Public repo on GitHub, MIT licence" },
  { label: "Evidence JSON", href: "/api/evidence", note: "The recorded run, checked against Base" },
];

const nav: [string, string][] = [
  ["#thesis", "How it works"],
  ["#who", "Who it’s for"],
  ["#verified-run", "Proof"],
  ["#ask", "Ask"],
  ["#faq", "FAQ"],
];

function PasskeyCard() {
  const caps = VERIFIED_RUN.passport.caps;
  const scope = VERIFIED_RUN.passport.scope;
  return (
    <aside className="passkey-card w-full max-w-[360px] p-6 text-left" aria-label="Kite Passport session approved for the recorded run">
      <p className="num text-[11px] uppercase tracking-[0.14em] text-cent">Kite Passport</p>
      <h3 className="mt-3 text-[22px] font-medium tracking-[-0.03em] text-bone">Approve with your passkey</h3>
      <dl className="mt-5 space-y-2.5 text-[14px]">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-dim">Per call</dt>
          <dd className="fig text-bone">${caps.max_amount_per_tx}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-dim">Total</dt>
          <dd className="fig text-bone">${caps.max_total_amount}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-dim">Scope</dt>
          <dd className="num text-right text-[12.5px] text-bone">
            {scope.host}
            {scope.path_prefix}
          </dd>
        </div>
      </dl>
      <p className="mt-5 text-[12.5px] leading-[1.55] text-dim">
        These are the caps from the recorded run, already approved. This card does not spend anything.
      </p>
    </aside>
  );
}

export default function Landing() {
  const paid = paidCalls.length;
  const declined = declinedCall ? 1 : 0;
  const spent = VERIFIED_RUN.passport.usage_after.spent_total_usdc;
  const code = declinedCall?.error_code ?? "session_total_exceeded";
  const cap = recordedCapState();

  return (
    <div className="min-h-screen bg-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[rgba(196, 148, 100,0.18)] bg-[rgba(255,249,240,0.88)] backdrop-blur-sm">
        <div className={`flex h-[64px] items-center justify-between gap-3 ${shell}`}>
          <Link href="/" aria-label="Centiv home" className="shrink-0 rounded-lg">
            <CentivWordmark size={22} />
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-0.5 text-[14px] font-medium lg:flex">
            {nav.map(([h, l]) => (
              <a key={h} href={h} className="whitespace-nowrap rounded-full px-3.5 py-2 text-mute transition hover:bg-sage hover:text-bone">
                {l}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Suspense fallback={<StatusPillFallback className="mr-1 hidden md:inline-flex" />}>
              <StatusPill className="mr-1 hidden md:inline-flex" />
            </Suspense>
            <Link href="/app?demo=1" className="pill pill-cent h-11 px-5 text-[14px]">
              Replay the run
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="pt-[64px]">
        {/* 1. Split hero + product log, then 2. partner strip — one opening rhythm */}
        <section id="hero" className="relative" aria-labelledby="landing-title">
          <div className={`grid items-center gap-10 pb-12 pt-10 sm:gap-12 md:pb-14 md:pt-14 lg:grid-cols-2 lg:gap-16 lg:pt-16 ${shell}`}>
            <div className="max-w-[600px]">
              <p className="eyebrow rise text-cent" style={{ animationDelay: "40ms" }}>
                A research agent with a cap
              </p>
              <h1
                id="landing-title"
                className="rise mt-5 text-[44px] font-normal leading-[0.98] tracking-[-0.05em] text-bone sm:text-[60px] lg:text-[72px]"
                style={{ animationDelay: "90ms" }}
              >
                Research that pays in cents, and <span className="serif-em whitespace-nowrap">can stop.</span>
              </h1>
              <p className="rise mt-6 max-w-[480px] text-pretty text-[17px] leading-[1.55] text-mute" style={{ animationDelay: "180ms" }}>
                You approve a spending cap with Kite Passport. Centiv buys data one call at a time, only when it’s worth what’s left.
              </p>
              <p className="rise mt-5 max-w-[520px] text-[15px] leading-[1.6] text-mute" style={{ animationDelay: "220ms" }}>
                Kite Passport sets the cap. SERV decides whether a call is worth it. Reppo scores what you bought.
              </p>
              <p className="rise mt-2 max-w-[520px] text-[14px] leading-[1.6] text-dim" style={{ animationDelay: "250ms" }}>
                x402 is a web standard: an API replies “payment required” with a price, and the agent pays that amount in USDC, one call at a time.
              </p>
              <div className="rise mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "270ms" }}>
                <Link href="/app?demo=1" className={primary}>
                  Replay a recorded run
                </Link>
                <a href="#verified-run" className={outline}>
                  See the receipts
                </a>
              </div>
              <p className="rise mt-5 text-[13px] leading-[1.55] text-dim" style={{ animationDelay: "330ms" }}>
                The demo replays the recorded 12 Nov 19:38 WAT run. No money moves.
              </p>
              <p className="rise mt-1.5 text-[13px] leading-[1.55]" style={{ animationDelay: "360ms" }}>
                <a href="#real" className="font-medium text-cent underline decoration-cent/30 underline-offset-[3px] hover:decoration-cent">
                  What’s real, and what’s simulated
                </a>
              </p>
            </div>
            <div className="rise min-w-0" style={{ animationDelay: "220ms" }}>
              <RunTerminal />
            </div>
          </div>
        </section>

        <section id="built" aria-label="Built with" className="border-y border-[rgba(196, 148, 100,0.25)]">
          <div className={`${shell} py-12 md:py-16`}>
            <p className="eyebrow text-center text-dim">
              Built with Kite Passport, SERV Reasoning, Reppo and Otto AI
            </p>
            <ul className="mt-10 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 sm:gap-12">
              {partners.map((b) => (
                <li key={b.name} className="text-center sm:text-left">
                  <a href={b.href} target="_blank" rel="noopener noreferrer" className="group block">
                    <p className="text-[18px] font-medium tracking-[-0.03em] text-bone transition group-hover:text-cent md:text-[20px]">
                      {b.name}
                    </p>
                    <p className="mt-1.5 text-[13px] leading-[1.45] text-mute">{b.role}</p>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3. Typographic thesis chapter — large type, leftover space, one artefact */}
        <section id="thesis" className="scroll-mt-20" aria-labelledby="thesis-title">
          <div className={`${shell} ${chapter}`}>
            <Reveal>
              <p className="eyebrow text-cent">How it works</p>
              <h2
                id="thesis-title"
                className="mt-5 max-w-[14ch] text-[44px] font-normal leading-[1.02] tracking-[-0.05em] text-bone md:text-[64px] lg:text-[72px]"
              >
                Set a cap. Buy only what’s <span className="serif-em">worth it.</span>
              </h2>
              <p className="mt-7 max-w-[520px] text-[17px] leading-[1.6] text-mute">
                You approve a spending cap with a passkey. SERV Reasoning weighs each call before payment. Kite Passport lets it through inside the cap, and refuses anything over it. After a payment, Reppo may score what was bought, as a quality record — Centiv does not use that score to decide later calls, and it does not block or undo the payment.
              </p>
            </Reveal>
            <Reveal delay={160} className="mt-20 md:mt-28">
              <PasskeyCard />
            </Reveal>
          </div>
        </section>

        {/* 4. Use-case cards */}
        <section id="who" className="scroll-mt-20 border-t border-[rgba(196, 148, 100,0.25)]" aria-labelledby="who-title">
          <div className={`${shell} ${chapter}`}>
            <SectionHead split label="Who it’s for" id="who-title" title={<>Built for people who give agents a <span className="serif-em">budget.</span></>}>
              <p>A cap that sits outside the agent’s own code, so research can pay for data without spending past what you approved.</p>
            </SectionHead>
            <ul className="mt-14 grid gap-5 md:grid-cols-3 md:gap-6">
              {audiences.map((a, i) => (
                <Reveal as="li" key={a.t} delay={i * 80} className="card-gold flex flex-col p-7 md:min-h-[260px] md:p-8">
                  <h3 className="text-[22px] font-medium tracking-[-0.03em] text-bone">{a.t}</h3>
                  <p className="mt-4 flex-1 text-[15.5px] leading-[1.65] text-mute">{a.s}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* 5. Three steps — the session log lives once, collapsed, in the receipts */}
        <section id="how" className="scroll-mt-20 border-t border-[rgba(196, 148, 100,0.25)]" aria-labelledby="how-title">
          <div className={`${shell} ${chapter}`}>
            <SectionHead split label="The steps" id="how-title" title={<>It weighs, pays, or <span className="serif-em">stops.</span></>}>
              <p>
                A short recorded log is in the hero. The full 12 Nov 2026, 19:38 WAT receipts — topics, payments, Basescan links, Reppo scores and the Kite Passport refusal — are in one place below, collapsed.
              </p>
            </SectionHead>
            <ul className="mt-14 grid gap-5 md:grid-cols-3 md:gap-6">
              {steps.map((s, i) => (
                <Reveal as="li" key={s.t} delay={i * 80} className="card-gold flex flex-col p-7 md:min-h-[240px] md:p-8">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-full border border-[rgba(180, 73, 26,0.45)] bg-white text-cent">
                      <StepIcon kind={s.k} />
                    </span>
                    <span className="num text-[12px] text-dim">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-[22px] font-medium tracking-[-0.03em] text-bone">{s.t}</h3>
                  <p className="mt-3 flex-1 text-[15px] leading-[1.65] text-mute">{s.s}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* 6. Ask */}
        <section id="ask" className="scroll-mt-20 border-t border-[rgba(196, 148, 100,0.25)]" aria-labelledby="ask-title">
          <div className={`mx-auto max-w-[800px] ${chapter}`}>
            <SectionHead label="Ask a question" id="ask-title" title={<>Type the full question. A short topic is <span className="serif-em">picked</span> for each call.</>}>
              <p>
                Otto’s news feed takes one or two words, not a sentence. You write the question; SERV picks a short topic for each call. In the recorded run SERV chose “eth etf”, then “crypto flows”, then “fund flows”.
              </p>
            </SectionHead>
            <Reveal delay={80}>
              <AskPreview />
            </Reveal>
          </div>
        </section>

        {/* 7. Proof + 8. stats */}
        <section id="verified-run" className="scroll-mt-20 border-t border-[rgba(196, 148, 100,0.25)]" aria-labelledby="proof-title">
          <div className={`${shell} ${chapter}`}>
            <SectionHead label="The receipts" id="proof-title" title={<>Two paid. Call 3 <span className="serif-em">refused.</span></>}>
              <p>
                12 Nov 2026, 19:38 WAT. SERV chose a topic and said spend on each call. Two payments of 0.001 USDC settled on Base. Kite Passport refused the third call with {code}. The refusal shown is the retake of call 3 in the same fully-spent session; the first take was stopped by Centiv’s own local limit before it reached Kite Passport. Call-by-call receipts are collapsed below.
              </p>
            </SectionHead>
            <Reveal delay={60} className="mx-auto mt-12 max-w-[560px]">
              <CapProgress spent={cap.spent} cap={cap.cap} blocked={cap.blocked} />
            </Reveal>
            <Reveal delay={80} className="stat-grid mt-16 grid-cols-2 md:grid-cols-4">
              <div className="stat-cell">
                <p className="fig text-[40px] leading-none tracking-[-0.05em] text-bone md:text-[52px]">{paid}</p>
                <p className="mt-3 text-[13px] text-mute">paid calls</p>
              </div>
              <div className="stat-cell">
                <p className="fig text-[40px] leading-none tracking-[-0.05em] text-bone md:text-[52px]">${spent}</p>
                <p className="mt-3 text-[13px] text-mute">USDC spent on Base</p>
              </div>
              <div className="stat-cell">
                <p className="fig text-[40px] leading-none tracking-[-0.05em] text-bone md:text-[52px]">{declined}</p>
                <p className="mt-3 text-[13px] text-mute">call refused</p>
              </div>
              <div className="stat-cell">
                <p className="num text-[15px] leading-tight text-stop md:text-[18px]">{code}</p>
                <p className="mt-3 text-[13px] text-mute">nothing signed</p>
              </div>
            </Reveal>
            <Reveal delay={120} className="mt-14">
              <VerifiedRun collapseReplies receipts hideLead />
            </Reveal>
          </div>
        </section>

        {/* 9. Honest labels */}
        <section id="real" className="scroll-mt-20 border-t border-[rgba(196, 148, 100,0.25)]" aria-labelledby="real-title">
          <div className={`${shell} ${chapter}`}>
            <SectionHead label="Honest labels" id="real-title" title={<>What’s real, and what’s <span className="serif-em">simulated</span></>}>
              <p>Every result on this site carries one of three labels.</p>
            </SectionHead>
            <Reveal className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-mute">
              <span className="inline-flex items-center gap-2">
                <ProvenanceBadge p="live" short title="Live · real calls" /> real calls, right now
              </span>
              <span className="inline-flex items-center gap-2">
                <ProvenanceBadge p="replay" short /> a real past run, replayed
              </span>
              <span className="inline-flex items-center gap-2">
                <ProvenanceBadge p="simulated" short /> no real money or service
              </span>
            </Reveal>
            <Reveal delay={100} className="mt-10">
              <Suspense fallback={<RealVsSimulatedFallback />}>
                <RealVsSimulated />
              </Suspense>
            </Reveal>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 border-t border-[rgba(196, 148, 100,0.25)]" aria-labelledby="faq-title">
          <div className={`grid items-start gap-12 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-24 ${shell} ${chapter}`}>
            <SectionHead label="FAQ" id="faq-title" title={<>Questions.</>}>
              <p>What’s real on this page, what the partners did, and how to run it yourself.</p>
            </SectionHead>
            <div>
              <Reveal delay={80}>
                <Faq />
              </Reveal>
              <Reveal delay={140} className="mt-10">
                <ul className="divide-y divide-[rgba(196, 148, 100,0.25)] overflow-hidden rounded-[18px] border border-[rgba(196, 148, 100,0.45)] bg-white">
                  {resources.map((r) => {
                    const inner = (
                      <>
                        <span className="flex items-center gap-2.5 text-[15px] font-medium text-bone">
                          {r.label === "Source code" && <GitHubMark size={16} />}
                          {r.label}
                        </span>
                        <span className="flex items-center gap-3 text-[13.5px] text-dim">
                          <span className="hidden sm:inline">{r.note}</span>
                          <span className="text-cent">
                            <NE />
                          </span>
                        </span>
                      </>
                    );
                    const cls = "flex min-h-14 items-center justify-between gap-4 px-5 py-3 transition hover:bg-[#fffaf0] sm:px-6";
                    return (
                      <li key={r.label}>
                        {r.external ? (
                          <a href={r.href} target="_blank" rel="noopener noreferrer" className={cls}>
                            {inner}
                          </a>
                        ) : (
                          <a href={r.href} className={cls}>
                            {inner}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 10. Closing CTA */}
        <section id="cta" className="border-t border-[rgba(196, 148, 100,0.25)]" aria-labelledby="cta-title">
          <div className={`text-center ${shell} ${chapter}`}>
            <Reveal>
              <p className="eyebrow text-cent">Try it</p>
              <h2 id="cta-title" className="mx-auto mt-5 max-w-[16ch] text-[44px] font-normal leading-[1.02] tracking-[-0.05em] text-bone md:text-[64px]">
                Set a cap. See it <span className="serif-em">hold.</span>
              </h2>
              <p className="mx-auto mt-6 max-w-[460px] text-[16px] leading-[1.65] text-mute">
                The public demo replays the recorded 12 Nov 19:38 WAT run. No money moves. If you type a different question, you still see this recorded example — not a live answer.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Link href="/app?demo=1" className={primary}>
                  Replay a recorded run
                </Link>
                <Link href="/app?ask=1" className={outline}>
                  Type a question first
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-[rgba(196, 148, 100,0.3)]">
        <div className={`grid gap-10 py-16 md:grid-cols-[minmax(0,1.3fr)_repeat(2,minmax(0,0.7fr))] ${shell}`}>
          <div>
            <CentivWordmark size={18} />
            <p className="mt-5 max-w-[360px] text-[13.5px] leading-[1.65] text-dim">
              The recorded run is a replay of real Base payments, with SERV Reasoning before each call. Reppo scores on the two that paid are a quality record — they do not decide later calls, and they do not block or undo a payment. The public demo replays that same run. No money moves.
            </p>
            <p className="mt-3 text-[13px] text-mute">Built on Kite Passport · SERV Reasoning · x402 · Reppo</p>
            <p className="mt-2 text-[13px] text-dim">SERV Hackathon 02 · Kite track</p>
          </div>
          <div>
            <p className="eyebrow text-dim">On this page</p>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              {nav.map(([h, l]) => (
                <li key={h}>
                  <a href={h} className="text-mute transition hover:text-cent">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow text-dim">Links</p>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              {footerLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-cent underline decoration-cent/30 underline-offset-[3px] hover:decoration-cent"
                  >
                    {l.label === "GitHub" && <GitHubMark size={13} />}
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="/api/evidence" className="text-mute transition hover:text-cent">
                  Evidence JSON
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
