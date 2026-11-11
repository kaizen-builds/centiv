import Link from "next/link";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { CentivWordmark, Stamp } from "./Logo";
import LedgerField from "./LedgerField";
import { RealVsSimulated, RealVsSimulatedFallback } from "./RealVsSimulated";
import Reveal from "./Reveal";
import { GITHUB_REPO, GitHubMark } from "./StatusStrip";
import { StatusStripFallback, StatusStripServer } from "./StatusStripServer";
import Faq from "./Faq";
import StatusPill, { StatusPillFallback } from "./StatusPill";
import { DecisionTag, ProvenanceBadge } from "./ui";
import VerifiedRun from "./VerifiedRun";
import { DEFAULT_SESSION } from "@/lib/centiv";

const NE = () => (
  <svg className="ne" width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
    <path d="M2 8 8 2M3.5 2H8v4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const primary = "pill pill-cent h-12 px-7 text-[15px]";
const textLink =
  "inline-flex min-h-11 items-center text-[15px] font-medium text-cent underline decoration-cent/30 underline-offset-[6px] transition hover:decoration-cent";

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
  center = false,
  split = false,
}: {
  label: string;
  id: string;
  title: ReactNode;
  children?: ReactNode;
  center?: boolean;
  /** Title on the left, intro on the right — used for How it works and FAQ. */
  split?: boolean;
}) {
  if (split) {
    return (
      <Reveal className="grid items-end gap-5 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.8fr)] md:gap-16">
        <div>
          <p className="text-[14px] font-medium text-cent">{label}</p>
          <h2 id={id} className="mt-3 text-[34px] font-normal leading-[1.1] tracking-[-0.035em] text-bone md:text-[44px]">
            {title}
          </h2>
        </div>
        {children && <div className="max-w-[440px] text-[16px] leading-[1.6] text-mute md:pb-1">{children}</div>}
      </Reveal>
    );
  }
  return (
    <Reveal className={center ? "mx-auto max-w-[680px] text-center" : "max-w-[760px]"}>
      <p className="text-[14px] font-medium text-cent">{label}</p>
      <h2 id={id} className="mt-3 text-[34px] font-normal leading-[1.1] tracking-[-0.035em] text-bone md:text-[44px]">
        {title}
      </h2>
      {children && <div className="mt-4 text-[16px] leading-[1.6] text-mute">{children}</div>}
    </Reveal>
  );
}

const steps: { k: "cap" | "weigh" | "pay"; t: string; s: string }[] = [
  {
    k: "cap",
    t: "You set the cap",
    s: "Approve a spending session with your passkey: a limit per call, a total and a time window. Centiv can only spend inside it.",
  },
  {
    k: "weigh",
    t: "It weighs each call",
    s: "Before it buys anything, it asks whether the data is worth what’s left of the budget. Then it buys, skips or declines.",
  },
  {
    k: "pay",
    t: "It pays, or it stops",
    s: "Inside the cap, the payment goes through. Over it, nothing is signed and no money moves. Every decision is logged.",
  },
];

const exampleRows: { d: "spend" | "skip" | "decline"; call: string; amount: string }[] = [
  { d: "spend", call: "Perp funding · 7 days", amount: "$0.18" },
  { d: "skip", call: "Social sentiment · 24 h", amount: "$0.12" },
  { d: "decline", call: "Order-book depth · 1-min", amount: "$0.35" },
];

/** Hero card: a simulated example of how Centiv decides. The real run lives only in the proof. */
function HowItDecides({ className = "" }: { className?: string }) {
  return (
    <div className={`card-gold w-full p-3.5 text-left sm:p-6 ${className}`} aria-label="How it decides: a simulated example">
      <div className="flex items-center justify-between gap-3">
        <p className="num whitespace-nowrap text-[11px] uppercase tracking-[0.14em] text-gold-deep">How it decides</p>
        <ProvenanceBadge p="simulated" short />
      </div>
      <ul className="mt-3 divide-y divide-[rgba(201,146,46,0.25)] rounded-[14px] border border-[rgba(201,146,46,0.45)] bg-white sm:mt-4">
        {exampleRows.map((r) => (
          <li key={r.call} className="flex items-center gap-2.5 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
            <Stamp
              size={22}
              className={`shrink-0 ${r.d === "spend" ? "text-gold" : r.d === "decline" ? "text-stop" : "text-dim"}`}
              notch={r.d === "spend" ? "var(--color-cent)" : undefined}
            />
            <p className="min-w-0 flex-1 text-[14px] font-medium leading-[1.3] tracking-[-0.015em] text-bone sm:truncate sm:text-[14.5px]">{r.call}</p>
            <span className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
              <span className={`fig text-[14.5px] leading-none sm:text-[15px] ${r.d === "spend" ? "text-bone" : r.d === "decline" ? "text-stop line-through" : "text-dim line-through"}`}>
                {r.amount}
              </span>
              <span className="sm:flex sm:w-[86px] sm:justify-end">
                <DecisionTag d={r.d} />
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Why each simulated row went the way it did. Per-call cap matches the demo default (DEFAULT_SESSION.perTx). */
const weighed: { d: "spend" | "skip" | "decline"; what: string; why: string }[] = [
  { d: "spend", what: "Perp funding history", why: "Core evidence for the question, and affordable within what’s left." },
  { d: "skip", what: "Social sentiment", why: "It would mostly repeat the funding data, so the $0.12 isn’t worth spending." },
  {
    d: "decline",
    what: "Order-book depth",
    why: `$0.35 is over the $${DEFAULT_SESSION.perTx.toFixed(2)} per-call cap, so it never gets that far.`,
  },
];

const decisionWord = { spend: "Bought", skip: "Skipped", decline: "Declined" } as const;

/** Canonical partner lines — this is the one place on the landing that says what each one does. */
const partners: { name: string; role: string; href: string; external?: boolean }[] = [
  {
    name: "Kite Passport",
    role: "Session caps you approve with a passkey. It refuses any payment past them.",
    href: "https://docs.gokite.ai/passport",
    external: true,
  },
  {
    name: "SERV Reasoning",
    role: "Decides, call by call, whether to buy, skip or decline paid data.",
    href: "https://docs.openserv.ai/serv-reasoning/api",
    external: true,
  },
  {
    name: "Reppo",
    role: "Scored the verified run’s brief: 86/100, accepted, sent to review. Visitor questions use a built-in check.",
    href: "#verified-run",
  },
];

const audiences: { t: string; s: string }[] = [
  {
    t: "Analysts and researchers",
    s: "You want data-backed answers, but not an agent that buys every dataset it finds. Centiv pays only for what the question needs.",
  },
  {
    t: "Agent builders",
    s: "Your agent needs to pay for APIs. Centiv shows a cap the agent can’t override, enforced outside your own code.",
  },
  {
    t: "Teams",
    s: "You want a research budget with a record. Every spend is logged with the reason, the amount, and what was left.",
  },
];

/** Fill these in once the video and post are public. Empty means the link is not shown. */
const DEMO_VIDEO_URL = "";
const X_POST_URL = "";

const footerLinks: { label: string; href: string }[] = [
  { label: "GitHub", href: GITHUB_REPO },
  ...(DEMO_VIDEO_URL ? [{ label: "Demo video", href: DEMO_VIDEO_URL }] : []),
  ...(X_POST_URL ? [{ label: "X post", href: X_POST_URL }] : []),
];

const resources: { label: string; href: string; external?: boolean; note: string }[] = [
  { label: "Source code", href: GITHUB_REPO, external: true, note: "Public repo on GitHub, MIT licence" },
  { label: "Evidence JSON", href: "/api/evidence", note: "The verified run, checked against Base" },
];

const nav: [string, string][] = [
  ["#verified-run", "Proof"],
  ["#who", "Who it’s for"],
  ["#how", "How it works"],
  ["#real", "What’s real"],
  ["#faq", "FAQ"],
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <header className="fixed inset-x-0 top-0 z-40 bg-[rgba(255,249,240,0.86)] backdrop-blur-sm">
        <div className="mx-auto flex h-[64px] max-w-[1180px] items-center justify-between gap-3 px-4 sm:px-5 md:px-8">
          <Link href="/" aria-label="Centiv home" className="shrink-0 rounded-lg">
            <CentivWordmark size={22} />
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-1 text-[14px] font-medium lg:flex">
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
            <a href="#verified-run" className="inline-flex h-11 items-center whitespace-nowrap rounded-full px-3 text-[14px] font-medium text-bone transition hover:bg-sage lg:hidden">
              Proof
            </a>
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Centiv source on GitHub"
              title="Source on GitHub"
              className="hidden h-11 w-11 place-items-center rounded-full text-mute transition hover:bg-sage hover:text-bone sm:grid"
            >
              <GitHubMark size={17} />
            </a>
            <Link href="/app" className="pill pill-cent h-10 shrink-0 whitespace-nowrap px-4 text-[14px] sm:px-5">
              Open the app <NE />
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* 1. Hero: the pitch and a simulated example. The real run lives only in the proof. */}
        <section className="relative overflow-hidden pb-12 pt-[96px] md:pb-20 md:pt-[160px]" aria-labelledby="landing-title">
          <LedgerField />
          <div className="relative mx-auto grid max-w-[1180px] grid-cols-[minmax(0,1fr)] items-center gap-12 px-5 md:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14">
            <div className="flex min-w-0 flex-col items-center text-center lg:items-start lg:text-left">
              <p className="badge-live rise">Built on Kite Passport · SERV Hackathon 02</p>
              <h1
                id="landing-title"
                className="rise mt-5 text-[40px] font-normal leading-[1.06] tracking-[-0.04em] text-bone sm:mt-6 sm:text-[60px] lg:text-[60px] xl:text-[66px]"
                style={{ animationDelay: "90ms" }}
              >
                Research that pays in cents, and <span className="serif-em whitespace-nowrap">can stop.</span>
              </h1>
              <p className="rise mt-4 max-w-[540px] text-pretty text-[16.5px] leading-[1.55] text-mute sm:mt-6 md:text-[18px]" style={{ animationDelay: "180ms" }}>
                You approve a spending cap. Centiv buys data one call at a time, only when it’s worth what’s left.
              </p>
              <div className="rise mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:mt-9 lg:justify-start" style={{ animationDelay: "270ms" }}>
                <Link href="/app?demo=ab" className={primary}>
                  Try the demo
                </Link>
                <a href="#verified-run" className={textLink}>
                  See the proof ↓
                </a>
              </div>
              <a href="#real" className="rise mt-5 rounded-lg px-2 py-1 transition hover:opacity-80 sm:mt-6 lg:-ml-2" style={{ animationDelay: "330ms" }}>
                <Suspense fallback={<StatusStripFallback variant="line" />}>
                  <StatusStripServer variant="line" className="lg:text-left" />
                </Suspense>
              </a>
              <div className="rise mt-5 w-full max-w-[460px] sm:mt-8 lg:hidden" style={{ animationDelay: "390ms" }}>
                <HowItDecides />
              </div>
            </div>
            <div className="rise hidden lg:block" style={{ animationDelay: "360ms" }}>
              <HowItDecides />
            </div>
          </div>
        </section>

        {/* 2. Thesis, then what SERV weighed for each simulated row */}
        <section className="border-t border-[rgba(201,146,46,0.25)]" aria-labelledby="thesis">
          <div className="mx-auto max-w-[1080px] px-5 py-16 md:px-8 md:py-20">
            <Reveal className="mx-auto max-w-[820px] text-center">
              <h2 id="thesis" className="text-[30px] font-normal leading-[1.15] tracking-[-0.035em] text-bone md:text-[42px]">
                Kite Passport decides whether the agent <span className="serif-em">can</span> spend. SERV decides whether it{" "}
                <span className="serif-em">should.</span>
              </h2>
            </Reveal>
            <Reveal delay={90} className="mx-auto mt-10 max-w-[820px]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[14px] font-medium text-cent">What SERV weighed</p>
                <ProvenanceBadge p="simulated" short />
              </div>
              <ul className="mt-3 divide-y divide-[rgba(201,146,46,0.25)] overflow-hidden rounded-[18px] border border-[rgba(201,146,46,0.45)] bg-white">
                {weighed.map((w) => (
                  <li key={w.what} className="grid gap-x-5 gap-y-1.5 px-5 py-4 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:items-baseline sm:px-6">
                    <p className="flex items-center gap-2.5 text-[15px] font-medium tracking-[-0.015em] text-bone">
                      <DecisionTag d={w.d} />
                      <span className="sr-only">{decisionWord[w.d]} · </span>
                      {w.what}
                    </p>
                    <p className="text-[14.5px] leading-[1.55] text-mute">{w.why}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[12.5px] leading-[1.55] text-dim">
                In this demo, Centiv applies the limits itself. The real Kite Passport refusal is in the verified run below.
              </p>
            </Reveal>
          </div>
        </section>

        {/* 3. Proof: the verified live run, refusal first */}
        <div className="mx-auto max-w-[1080px] px-4 pb-20 sm:px-5 md:px-8 md:pb-28">
          <VerifiedRun collapseReplies receipts />
        </div>

        {/* 4. Who it’s for */}
        <section id="who" className="scroll-mt-20 border-t border-[rgba(201,146,46,0.25)]" aria-labelledby="who-title">
          <div className="mx-auto max-w-[1080px] px-5 py-20 md:px-8 md:py-28">
            <SectionHead label="Who it’s for" id="who-title" title={<>Built for people who give agents a <span className="serif-em">budget.</span></>} />
            <ul className="mt-10 grid gap-4 md:grid-cols-3">
              {audiences.map((a, i) => (
                <Reveal as="li" key={a.t} delay={i * 80} className="card-gold flex flex-col p-6">
                  <h3 className="text-[19px] font-medium tracking-[-0.02em] text-bone">{a.t}</h3>
                  <p className="mt-2 text-[15px] leading-[1.6] text-mute">{a.s}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* 5. How it works + the one partner strip + the try links */}
        <section id="how" className="scroll-mt-20 border-t border-[rgba(201,146,46,0.25)]" aria-labelledby="how-title">
          <div className="mx-auto max-w-[1080px] px-5 py-20 md:px-8 md:py-28">
            <SectionHead split label="How it works" id="how-title" title={<>Set a cap. Buy only what’s <span className="serif-em">worth it.</span></>}>
              <p>You approve a spending cap with a passkey. Centiv buys data one call at a time, only when it’s worth what’s left, and stops when the cap is reached.</p>
            </SectionHead>
            <ol className="mt-10 grid gap-4 md:grid-cols-3">
              {steps.map((s, i) => (
                <Reveal as="li" key={s.t} delay={i * 90} className="card-gold flex flex-col p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-full border border-[rgba(91,42,78,0.45)] bg-white text-cent">
                      <StepIcon kind={s.k} />
                    </span>
                    <span className="num text-[12px] text-dim">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-[20px] font-medium tracking-[-0.02em] text-bone">{s.t}</h3>
                  <p className="mt-2 flex-1 text-[15px] leading-[1.6] text-mute">{s.s}</p>
                </Reveal>
              ))}
            </ol>
            <div id="built" className="scroll-mt-20">
              <Reveal delay={80} className="mt-14">
                <p className="text-[14px] font-medium text-cent">Built with</p>
                <ul className="mt-6 grid gap-4 md:grid-cols-3">
                  {partners.map((b) => {
                    const body = (
                      <>
                        <span className="flex items-center justify-between text-[16px] font-medium tracking-[-0.015em] text-bone">
                          {b.name}
                          <span className="text-dim transition group-hover:text-cent"><NE /></span>
                        </span>
                        <span className="mt-2 text-[14px] leading-[1.55] text-mute">{b.role}</span>
                      </>
                    );
                    const cls = "group flex h-full flex-col rounded-[18px] border border-[rgba(201,146,46,0.45)] bg-white p-5 transition hover:border-cent/50";
                    return (
                      <li key={b.name}>
                        {b.external ? (
                          <a href={b.href} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>
                        ) : (
                          <a href={b.href} className={cls}>{body}</a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Reveal>
            </div>
            <Reveal delay={120} className="mt-12 flex flex-col items-center gap-3 text-center">
              <p className="text-[15px] text-mute">Payments in the public app are simulated, so visitors never spend anything.</p>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                <Link href="/app?demo=ab" className={primary}>
                  Try the demo
                </Link>
                <Link href="/app?ask=1" className={textLink}>
                  Ask your own question
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* 6. What's real and what's simulated */}
        <section id="real" className="scroll-mt-20 border-t border-[rgba(201,146,46,0.25)]" aria-labelledby="real-title">
          <div className="mx-auto max-w-[1080px] px-5 py-20 md:px-8 md:py-28">
            <SectionHead label="Honest labels" id="real-title" title={<>What’s real, and what’s <span className="serif-em">simulated</span></>}>
              <p>Every result on this site carries one of three labels.</p>
            </SectionHead>
            <Reveal className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-mute">
              <span className="inline-flex items-center gap-2"><ProvenanceBadge p="live" short title="Live · real calls" /> real calls, right now</span>
              <span className="inline-flex items-center gap-2"><ProvenanceBadge p="replay" short /> a real past run, replayed</span>
              <span className="inline-flex items-center gap-2"><ProvenanceBadge p="simulated" short /> no real money or service</span>
            </Reveal>
            <Reveal delay={100} className="mt-8">
              <Suspense fallback={<RealVsSimulatedFallback />}>
                <RealVsSimulated />
              </Suspense>
            </Reveal>
          </div>
        </section>

        {/* 7. Questions, with source and evidence nearby */}
        <section id="faq" className="scroll-mt-20 border-t border-[rgba(201,146,46,0.25)]" aria-labelledby="faq-title">
          <div className="mx-auto grid max-w-[1080px] items-start gap-10 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-16">
            <SectionHead label="FAQ" id="faq-title" title={<>Questions.</>}>
              <p>What’s real on this page, what the partners did, and how to run it yourself.</p>
            </SectionHead>
            <div>
              <Reveal delay={80}>
                <Faq />
              </Reveal>
              <Reveal delay={140} className="mt-8">
                <ul className="divide-y divide-[rgba(201,146,46,0.25)] overflow-hidden rounded-[18px] border border-[rgba(201,146,46,0.45)] bg-white">
                  {resources.map((r) => {
                    const inner = (
                      <>
                        <span className="flex items-center gap-2.5 text-[15px] font-medium text-bone">
                          {r.label === "Source code" && <GitHubMark size={16} />}
                          {r.label}
                        </span>
                        <span className="flex items-center gap-3 text-[13.5px] text-dim">
                          <span className="hidden sm:inline">{r.note}</span>
                          <span className="text-cent"><NE /></span>
                        </span>
                      </>
                    );
                    const cls = "flex min-h-14 items-center justify-between gap-4 px-5 py-3 transition hover:bg-[#fffaf0] sm:px-6";
                    return (
                      <li key={r.label}>
                        {r.external ? (
                          <a href={r.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
                        ) : (
                          <a href={r.href} className={cls}>{inner}</a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[rgba(201,146,46,0.3)]">
        <div className="mx-auto grid max-w-[1080px] gap-6 px-5 py-10 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-start md:gap-10 md:px-8">
          <CentivWordmark size={18} />
          <div className="space-y-2 text-[13px] leading-[1.6] text-dim">
            <p>
              The verified run is a replay of real Base payments. Demo payments are simulated. Reppo checked the verified-run
              brief; visitor questions use a built-in check.
            </p>
            <p className="text-mute">Built on Kite Passport · SERV Reasoning · x402 · Reppo</p>
          </div>
          <div className="flex flex-col gap-2 text-[13px] md:items-end">
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {footerLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-cent underline decoration-cent/30 underline-offset-[3px] hover:decoration-cent">
                    {l.label === "GitHub" && <GitHubMark size={13} />}
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-dim">SERV Hackathon 02 · Kite track</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
