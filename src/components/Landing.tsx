import Link from "next/link";
import type { ReactNode } from "react";
import { CentivMark, CentivWordmark, Nib, Stamp } from "./Logo";
import LedgerField from "./LedgerField";
import Reveal from "./Reveal";
import { DecisionTag, GateSourceLabel, ProvenanceBadge, VerdictTag } from "./ui";
import VerifiedRun from "./VerifiedRun";

const Play = () => (
  <svg width="10" height="12" viewBox="0 0 11 12" aria-hidden="true">
    <path d="M1 1l9 5-9 5z" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
  </svg>
);
const NE = () => (
  <svg className="ne" width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
    <path d="M2 8 8 2M3.5 2H8v4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const olive = "pill pill-olive h-11 px-6 text-[14px]";
const oliveLg = "pill pill-olive h-12 px-7 text-[15px]";

function Icon({ kind }: { kind: "search" | "scrape" | "market" | "budget" | "weigh" | "pay" | "stamp" }) {
  const c = { stroke: "currentColor", strokeWidth: 1.25, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      {kind === "search" && (
        <>
          <circle cx="10.5" cy="10.5" r="6" {...c} />
          <path d="M15 15l5 5" {...c} />
        </>
      )}
      {kind === "scrape" && (
        <>
          <rect x="4" y="4" width="16" height="16" rx="2.5" {...c} />
          <path d="M4 9h16M8 13h8M8 16.5h5" {...c} />
        </>
      )}
      {kind === "budget" && (
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
      {kind === "stamp" && (
        <>
          <path d="M9 4h6v5l3 3H6l3-3z" {...c} />
          <path d="M5 15h14v3H5zM8 21h8" {...c} />
        </>
      )}
      {kind === "market" && (
        <>
          <path d="M4 19h16" {...c} />
          <path d="M5 15l4-4 3 3 6-7" {...c} />
          <path d="M15 7h3v3" {...c} />
        </>
      )}
    </svg>
  );
}

const previewRows: {
  d: "spend" | "skip" | "decline";
  kind: string;
  call: string;
  amount: string;
  note: string;
}[] = [
  { d: "spend", kind: "Market data", call: "Perp funding history · 7 days", amount: "−$0.18", note: "Core evidence. Worth it." },
  { d: "skip", kind: "Scrape", call: "Social sentiment · 24 h", amount: "$0.12", note: "Would restate the funding data." },
  { d: "decline", kind: "Market data", call: "Order-book depth · 1-min", amount: "$0.35", note: "Over the $0.20 per-call cap." },
];


function RunPreview() {
  return (
    <div className="card-gold p-5 text-left sm:p-7" aria-label="Example run">
      <div className="flex items-center justify-between">
        <p className="num text-[11px] uppercase tracking-[0.14em] text-gold-deep">Example run</p>
        <ProvenanceBadge p="simulated" />
      </div>
      <p className="print mt-4 text-[19px] font-normal leading-[1.4] tracking-[-0.02em] text-bone" style={{ animationDelay: "500ms" }}>
        “Are ETH perp funding rates turning negative this week? I need a data-backed brief.”
      </p>
      <ul className="mt-5 divide-y divide-[rgba(218,161,57,0.25)] border-y border-[rgba(218,161,57,0.3)]">
        {previewRows.map((r, i) => (
          <li key={r.call} className="print flex items-start gap-3 py-3.5" style={{ animationDelay: `${1000 + i * 650}ms` }}>
            <Stamp
              size={26}
              className={`stamp-in mt-0.5 shrink-0 ${r.d === "spend" ? "text-gold" : r.d === "decline" ? "text-stop" : "text-dim"}`}
              notch={r.d === "spend" ? "var(--color-cent)" : undefined}
            />
            <div className="min-w-0 flex-1">
              <p className="num text-[10px] uppercase tracking-[0.12em] text-dim">{r.kind}</p>
              <p className="truncate text-[14.5px] font-medium tracking-[-0.015em] text-bone">{r.call}</p>
              <p className="text-[12.5px] text-dim">{r.note}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`fig text-[15px] ${r.d === "spend" ? "text-bone" : r.d === "decline" ? "text-stop line-through" : "text-dim line-through"}`}>{r.amount}</span>
              <DecisionTag d={r.d} />
            </div>
          </li>
        ))}
      </ul>
      <div className="print mt-4 flex flex-wrap items-center justify-between gap-3" style={{ animationDelay: "3000ms" }}>
        <div className="flex items-center gap-3">
          <span className="text-[12.5px] text-dim">Built-in check · Simulated</span>
          <VerdictTag v="accept" score={0.86} />
        </div>
        <span className="text-[12.5px] text-dim">
          Remaining <span className="fig text-[15px] text-bone">$0.32</span> of $0.50
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[rgba(72,92,17,0.12)]">
        <div className="h-full w-[36%] rounded-full bg-cent" />
      </div>
    </div>
  );
}

/** Kite-style list card: text, a hairline leader, and a gold line icon in a ring. */
function LeaderList({ rows }: { rows: { k: Parameters<typeof Icon>[0]["kind"]; t: string; s?: string; m?: string }[] }) {
  return (
    <ul className="space-y-1">
      {rows.map((r, i) => (
        <Reveal as="li" key={r.t} delay={i * 90} className="flex items-center gap-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium tracking-[-0.015em] text-bone">{r.t}</p>
            {r.s && <p className="mt-0.5 text-[13.5px] leading-[1.5] text-mute">{r.s}</p>}
            {r.m && <p className="num mt-1.5 text-[11px] uppercase tracking-[0.1em] text-gold-deep">{r.m}</p>}
          </div>
          <span aria-hidden="true" className="hidden h-px w-10 shrink-0 bg-[rgba(201,146,46,0.4)] sm:block" />
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[rgba(72,92,17,0.45)] bg-white text-cent">
            <Icon kind={r.k} />
          </span>
        </Reveal>
      ))}
    </ul>
  );
}

function SectionText({ label, id, title, children }: { label: string; id: string; title: ReactNode; children: ReactNode }) {
  return (
    <Reveal>
      <p className="text-[14px] font-medium text-cent">{label}</p>
      <h2 id={id} className="mt-3 text-[36px] font-normal leading-[1.1] tracking-[-0.035em] text-bone md:text-[46px]">
        {title}
      </h2>
      <div className="mt-5 max-w-[460px] text-[16px] leading-[1.6] text-mute">{children}</div>
    </Reveal>
  );
}

const buys = [
  { k: "search" as const, t: "Search", s: "Web and news queries when the answer needs something recent.", e: "e.g. $0.02 a query" },
  { k: "scrape" as const, t: "Scraping", s: "A page or feed read on demand, only when no cheaper source will do.", e: "e.g. $0.05 a page" },
  { k: "market" as const, t: "Market data", s: "Funding rates, order books and prices — the evidence a trader actually needs.", e: "e.g. $0.18 a dataset" },
];

const steps = [
  ["Find the gap", "Centiv breaks your question into the data it doesn’t have yet — a search, a scrape or a dataset."],
  ["Weigh the call", "SERV Reasoning asks one thing per call: is this worth what’s left of your budget?"],
  ["Pay per call — or don’t", "If it’s worth it, Centiv pays the x402 quote from your Kite Passport session. If not, it skips. If the price breaks your cap, it declines before signing."],
  ["Stamp and check", "Every buy, skip and decline lands in the audit trail. A quality gate (Reppo-ready; built-in check until a Reppo key is connected) scores the brief before it reaches you."],
];

const auditRows = [
  { d: "spend" as const, call: "Perp funding history · 7d", amt: "−$0.18", left: "$0.32", v: "accept" as const, s: 0.86, r: "sim_5709…4f8" },
  { d: "skip" as const, call: "Social sentiment scrape", amt: "$0.12", left: "$0.32", v: "accept" as const, s: 0.86, r: "—" },
  { d: "decline" as const, call: "Order-book depth · 1-min", amt: "$0.35", left: "$0.32", v: "revise" as const, s: 0.64, r: "not signed" },
];


export default function Landing() {
  return (
    <div className="min-h-screen bg-ink">
      {/* Floating nav: wordmark left, sage pill centre, icon pill + olive CTA right */}
      <header className="fixed inset-x-0 top-0 z-40">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between gap-4 px-5 md:px-8">
          <Link href="/" aria-label="Centiv home" className="rounded-lg">
            <CentivWordmark size={22} />
          </Link>
          <nav aria-label="Main" className="pill-sage absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full px-2 py-1.5 text-[13.5px] font-medium md:flex">
            {[
              ["#verified-run", "Verified run"],
              ["#buys", "What it buys"],
              ["#how", "How it works"],
              ["#cap", "Your cap"],
              ["#audit", "Audit trail"],
            ].map(([h, l]) => (
              <a key={h} href={h} className="rounded-full px-3.5 py-1.5 text-bone transition hover:bg-[#DCE4C8]">
                {l}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2.5">
            <div className="pill-sage hidden items-center gap-0.5 rounded-full p-1 sm:flex">
              <Link href="/app?demo=ab" aria-label="Run the demo" title="Run the demo" className="grid h-8 w-8 place-items-center rounded-full text-mute transition hover:bg-[#DCE4C8] hover:text-bone">
                <Play />
              </Link>
              <a href="#audit" aria-label="See the audit trail" title="See the audit trail" className="grid h-8 w-8 place-items-center rounded-full text-mute transition hover:bg-[#DCE4C8] hover:text-bone">
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3 2.5h10v11H3zM5.5 6h5M5.5 8.5h5M5.5 11h3" stroke="currentColor" strokeWidth="1.25" fill="none" strokeLinecap="round" />
                </svg>
              </a>
            </div>
            <Link href="/app" className="pill pill-olive h-10 px-5 text-[13.5px]">
              Open the app <NE />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero — stacked and centred over the ambient ledger lines */}
        <section className="relative overflow-hidden pb-16 pt-[150px] md:pt-[176px]" aria-labelledby="landing-title">
          <LedgerField />
          <div className="relative mx-auto flex max-w-[980px] flex-col items-center px-5 text-center">
            <p className="badge-live rise">
              SERV Hackathon 02 · Kite track <span className="pulse-dot h-2 w-2 rounded-full bg-[var(--color-live)]" />
            </p>
            <h1
              id="landing-title"
              className="rise mt-7 text-[44px] font-normal leading-[1.08] tracking-[-0.04em] text-bone sm:text-[62px] lg:text-[76px]"
              style={{ animationDelay: "90ms" }}
            >
              A research agent that <span className="serif-em">pays per call</span> for the data it needs
            </h1>
            <p className="rise mt-6 max-w-[560px] text-[16.5px] leading-[1.6] text-mute" style={{ animationDelay: "180ms" }}>
              Centiv buys search, scraping and market data one call at a time — only when the call is worth it. You set the cap
              with Kite Passport. When a call would break it, Centiv stops.
            </p>
            <div className="rise mt-10 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "270ms" }}>
              <Link href="/app" className={olive}>
                Open the app <NE />
              </Link>
              <Link href="/app?demo=ab" className={olive}>
                Run the 30-second demo <NE />
              </Link>
            </div>
            <p className="num rise mt-5 text-[11.5px] uppercase tracking-[0.12em] text-dim" style={{ animationDelay: "320ms" }}>
              Two paid calls · one declined at the session total · USDC on Base
            </p>
            <a href="#verified-run" className="rise mt-4 inline-flex items-center gap-2 rounded-full text-[13.5px] text-gold-deep underline decoration-[rgba(201,146,46,0.5)] underline-offset-4 hover:text-bone" style={{ animationDelay: "360ms" }}>
              See the verified run: 2 real Base USDC payments and 1 Passport decline ↓
            </a>
          </div>
          <div className="rise relative mx-auto mt-16 max-w-[720px] px-5" style={{ animationDelay: "420ms" }}>
            <RunPreview />
          </div>
        </section>

        {/* Verified live run — real on-chain proof, replayed */}
        <div className="mx-auto max-w-[1140px] px-5 pb-24 md:px-8">
          <VerifiedRun />
        </div>

        {/* What it buys */}
        <section id="buys" className="scroll-mt-24" aria-labelledby="buys-title">
          <div className="mx-auto grid max-w-[1140px] items-center gap-14 px-5 py-28 md:px-8 lg:grid-cols-[1.05fr_0.95fr]">
            <Reveal className="card-gold order-2 p-6 sm:p-9 lg:order-1">
              <LeaderList
                rows={buys.map((b) => ({ k: b.k, t: b.t, s: b.s, m: `${b.e} · example pricing` }))}
              />
            </Reveal>
            <div className="order-1 lg:order-2">
              <SectionText label="What Centiv pays for" id="buys-title" title={<>The data a good answer needs, bought <span className="serif-em">by the call</span></>}>
                No subscriptions and no API keys handed to the agent. Each call is priced on request with an x402 quote and paid in
                cents from your Passport session.
              </SectionText>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-24" aria-labelledby="how-title">
          <div className="mx-auto grid max-w-[1140px] items-center gap-14 px-5 py-28 md:px-8 lg:grid-cols-[0.95fr_1.05fr]">
            <SectionText label="How a paid call works" id="how-title" title={<>Four steps, every time it <span className="serif-em">reaches for data</span></>}>
              SERV Reasoning weighs each call against what’s left of your budget. Kite Passport holds the line. A quality gate
              (Reppo-ready; built-in check until a Reppo key is connected) scores the answer before it reaches you.
            </SectionText>
            <Reveal className="card-gold p-6 sm:p-9">
              <LeaderList
                rows={steps.map(([t, s], i) => ({ k: (["search", "weigh", "pay", "stamp"] as const)[i], t: `${i + 1}. ${t}`, s }))}
              />
            </Reveal>
          </div>
        </section>

        {/* The cap */}
        <section id="cap" className="scroll-mt-24" aria-labelledby="cap-title">
          <div className="mx-auto grid max-w-[1140px] items-center gap-14 px-5 py-28 md:px-8 lg:grid-cols-[1.05fr_0.95fr]">
            <Reveal className="card-gold order-2 p-6 sm:p-8 lg:order-1">
              <p className="num text-[11px] uppercase tracking-[0.14em] text-gold-deep">Passport check</p>
              <p className="mt-3 text-[22px] font-normal tracking-[-0.025em]">Buy this call for $0.35?</p>
              <p className="mt-1 text-[13px] text-dim">Order-book depth · 1-min · 4 venues</p>
              <ul className="mt-6 grid gap-2 sm:grid-cols-3">
                {[
                  ["Per-call cap", "0.35 > 0.20", false],
                  ["Budget left", "0.35 > 0.32", false],
                  ["Time window", "28 min left", true],
                ].map(([l, d, ok]) => (
                  <li key={l as string} className={`rounded-2xl border bg-white px-3.5 py-2.5 text-[12px] ${ok ? "border-[rgba(218,161,57,0.4)]" : "border-stop/45"}`}>
                    <span className="text-dim">{l}</span>
                    <span className={`num mt-0.5 block ${ok ? "text-bone" : "text-stop"}`}>
                      {ok ? "✓" : "✕"} {d}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center gap-4 rounded-2xl border border-stop/35 bg-white p-4">
                <Nib size={52} mood="stop" />
                <div>
                  <p className="text-[15px] font-semibold text-stop">Declined — over the per-transaction cap.</p>
                  <p className="mt-0.5 text-[13px] text-mute">Nothing was signed. Centiv answers from the data it already bought, and says so.</p>
                </div>
              </div>
            </Reveal>
            <div className="order-1 lg:order-2">
              <SectionText label="And it can stop" id="cap-title" title={<>You hold the cap. Passport <span className="serif-em">enforces it.</span></>}>
                Approve one spending session with your passkey. Centiv can’t go past it — an over-cap call is declined before
                anything is signed, and the answer says what it couldn’t buy.
              </SectionText>
              <Reveal delay={120}>
                <dl className="mt-8 flex flex-wrap gap-2.5">
                  {[
                    ["Budget", "$0.50"],
                    ["Per call", "$0.20"],
                    ["Window", "30 min"],
                  ].map(([k, v]) => (
                    <div key={k} className="pill-chip rounded-full px-4 py-2">
                      <dt className="num inline text-[11px] uppercase tracking-[0.1em] text-dim">{k}</dt>{" "}
                      <dd className="fig inline pl-1 text-[16px] text-bone">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Audit */}
        <section id="audit" className="mx-auto max-w-[1140px] scroll-mt-24 px-5 py-28 md:px-8" aria-labelledby="audit-title">
          <Reveal className="mx-auto max-w-[640px] text-center">
            <p className="text-[14px] font-medium text-cent">The audit trail</p>
            <h2 id="audit-title" className="mt-3 text-[36px] font-normal leading-[1.1] tracking-[-0.035em] md:text-[46px]">
              Every cent, <span className="serif-em">stamped</span>
            </h2>
            <p className="mt-4 text-[16px] leading-[1.6] text-mute">
              The decision, the amount, what was left, the receipt, and how the quality gate scored the answer it fed.
            </p>
            <p className="mt-4 flex justify-center"><ProvenanceBadge p="simulated" /></p>
          </Reveal>
          <Reveal delay={120} className="mt-12 overflow-x-auto rounded-[24px] border border-[rgba(218,161,57,0.55)] bg-white">
            <table className="w-full min-w-[760px] text-left">
              <caption className="sr-only">Example audit trail</caption>
              <thead>
                <tr className="num border-b border-[rgba(218,161,57,0.35)] text-[10.5px] uppercase tracking-[0.12em] text-dim">
                  <th scope="col" className="w-12 py-3.5 pl-6"><span className="sr-only">Stamp</span></th>
                  <th scope="col" className="px-3 py-3.5 font-normal">Call</th>
                  <th scope="col" className="px-3 py-3.5 font-normal">Decision</th>
                  <th scope="col" className="px-3 py-3.5 text-right font-normal">Amount</th>
                  <th scope="col" className="px-3 py-3.5 text-right font-normal">Remaining</th>
                  <th scope="col" className="px-3 py-3.5 font-normal">Quality gate</th>
                  <th scope="col" className="px-6 py-3.5 font-normal">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {auditRows.map((r) => (
                  <tr key={r.call} className="border-b border-[rgba(218,161,57,0.2)] last:border-0">
                    <td className="py-4 pl-6">
                      <Stamp size={28} className={`stamp-in ${r.d === "spend" ? "text-gold" : r.d === "decline" ? "text-stop" : "text-dim"}`} notch={r.d === "spend" ? "var(--color-cent)" : undefined} />
                    </td>
                    <td className="px-3 py-4 text-[15px] font-medium tracking-[-0.015em]">{r.call}</td>
                    <td className="px-3 py-4"><DecisionTag d={r.d} /></td>
                    <td className={`fig px-3 py-4 text-right text-[16px] ${r.d === "spend" ? "" : r.d === "decline" ? "text-stop line-through" : "text-dim line-through"}`}>{r.amt}</td>
                    <td className="fig px-3 py-4 text-right text-[16px]">{r.left}</td>
                    <td className="px-3 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <VerdictTag v={r.v} score={r.s} />
                        <GateSourceLabel source="heuristic" />
                      </div>
                    </td>
                    <td className={`num px-6 py-4 text-[12px] text-dim ${r.r.startsWith("sim_") ? "receipt-sim" : ""}`}>{r.r}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
          <Reveal delay={200} className="mt-8 flex justify-center">
            <Link href="/app?demo=ab" className={olive}>
              Watch it fill in <NE />
            </Link>
          </Reveal>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden py-32" aria-labelledby="cta-title">
          <LedgerField />
          <Reveal className="relative mx-auto flex max-w-[720px] flex-col items-center px-5 text-center">
            <CentivMark size={44} />
            <h2 id="cta-title" className="mt-6 text-[38px] font-normal leading-[1.1] tracking-[-0.035em] md:text-[54px]">
              Ask something that might be <span className="serif-em">worth a call</span>
            </h2>
            <p className="mt-4 text-[16px] text-mute">Approve a cap, ask a question, and watch every cent get accounted for.</p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/app" className={oliveLg}>
                Open the app <NE />
              </Link>
              <Link href="/app?demo=ab" className={oliveLg}>
                Run the demo <NE />
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-[rgba(201,146,46,0.3)]">
        <div className="mx-auto flex max-w-[1140px] flex-col gap-5 px-5 py-10 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CentivWordmark size={18} />
            <a
              href="https://gokite.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-lg text-[13.5px] text-mute transition hover:text-bone"
            >
              <span>Built on</span>
              {/* Official Kite wordmark from https://gokite.ai/images/Kite_Logo.svg — attribution only */}
              <img src="/kite-logo.svg" alt="Kite" width={72} height={28} className="h-5 w-auto" />
              <span className="text-dim">— Passport sessions and x402 payments</span>
            </a>
          </div>
          <p className="num text-[11px] uppercase tracking-[0.08em] text-dim">
            SERV Hackathon 02 · Kite track · Visitors’ questions use live SERV reasoning with Simulated payments · Verified run is a Replay of real Base USDC payments.
          </p>
        </div>
      </footer>
    </div>
  );
}
