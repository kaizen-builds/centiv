"use client";
import type { AuditRow, Session } from "@/lib/centiv";
import { useNow } from "@/lib/hooks";
import { BudgetRing, Count, Money } from "./ui";


export function Hero({
  session,
  spent,
  audit,
  onRunDemo,
}: {
  session: Session;
  spent: number;
  audit: AuditRow[];
  onRunDemo: () => void;
}) {
  const now = useNow();
  const remaining = Math.max(0, session.budget - spent);
  const active = session.status === "active";
  const bought = audit.filter((a) => a.decision === "spend").length;
  const declined = audit.filter((a) => a.decision === "decline").length;
  const left = active ? Math.max(0, (session.approvedAt ?? 0) + session.windowMin * 60_000 - now) : 0;
  const mm = String(Math.floor(left / 60000)).padStart(2, "0");
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");
  const d = (i: number) => ({ animationDelay: `${60 + i * 90}ms` });

  return (
    <section className="pb-8 pt-10 md:pt-14" aria-labelledby="hero-title">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-8">
          <p className="badge-live rise" style={d(0)}>
            Workspace · Passport session <span className="h-2 w-2 rounded-full bg-[var(--color-live)]" />
          </p>
          <h1
            id="hero-title"
            className="rise mt-5 font-display text-[36px] font-normal leading-[1.08] tracking-[-0.035em] text-bone sm:text-[48px]"
            style={d(1)}
          >
            Ask a research question. <span className="text-mute">Centiv <span className="serif-em text-mute">pays per call</span> for the data it needs — and stops at your cap.</span>
          </h1>
          <ol className="rise mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-mute" style={d(2)} aria-label="Steps">
            {["Approve a session", "Ask a question", "Watch it buy, skip or decline", "Check the audit trail"].map((t, i) => (
              <li key={t} className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full border border-[rgba(91,42,78,0.45)] bg-white text-[10.5px] font-semibold text-cent">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
          <div className="rise mt-7 flex flex-wrap items-center gap-4" style={d(3)}>
            <button
              onClick={onRunDemo}
              className="pill pill-cent group h-11 px-6 text-[14px]"
            >
              <svg width="11" height="12" viewBox="0 0 11 12" aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                <path d="M1 1l9 5-9 5z" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
              </svg>
              Run demo A → B
            </button>
            <a href="#session" className="font-medium text-[14px] text-cent underline decoration-cent/30 underline-offset-[6px] transition hover:decoration-cent">
              or set your own session
            </a>
            <span className="text-[12.5px] text-dim">≈ 30 s · one paid call, then one declined</span>
          </div>
        </div>

        <aside className="rise lg:col-span-4" style={d(4)} aria-label="Session at a glance">
          <div className="card relative p-6">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Session</p>
              <span className={`num text-[11px] ${active ? "text-pass" : "text-dim"}`}>
                {active ? `live · ${mm}:${ss}` : session.status === "approving" ? "approving…" : "not approved"}
              </span>
            </div>
            <div className="mt-5 flex items-center gap-6">
              <BudgetRing
                ratio={active ? remaining / session.budget : 0}
                size={124}
                label={
                  <div>
                    <Money value={active ? remaining : 0} unit={false} prefix="$" className="text-[28px] text-bone" />
                    <p className="text-[10.5px] text-dim">remaining</p>
                  </div>
                }
              />
              <dl className="grid gap-3 text-[13px]">
                <div>
                  <dt className="text-dim">Approved</dt>
                  <dd><Money value={active ? session.budget : 0} className="text-[17px] text-bone" /></dd>
                </div>
                <div>
                  <dt className="text-dim">Spent</dt>
                  <dd><Money value={spent} className="text-[17px] text-bone" /></dd>
                </div>
                <div className="flex gap-5">
                  <div>
                    <dt className="text-dim">Bought</dt>
                    <dd><Count value={bought} className="fig text-[17px] text-bone" /></dd>
                  </div>
                  <div>
                    <dt className="text-dim">Declined</dt>
                    <dd><Count value={declined} className={`fig text-[17px] ${declined ? "text-stop" : "text-bone"}`} /></dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>
        </aside>
      </div>

    </section>
  );
}
