"use client";
import { AGENT, Session, SessionConfig, usdc } from "@/lib/centiv";
import { useNow } from "@/lib/hooks";
import { Money } from "./ui";
import { Stamp } from "./Logo";

function Field({
  id,
  label,
  hint,
  value,
  step,
  min,
  max,
  suffix,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: number;
  step: number;
  min: number;
  max: number;
  suffix: string;
  disabled: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 py-3.5">
      <label htmlFor={id} className="text-[13.5px] text-bone">
        {label}
        <span className="block text-[12px] text-dim">{hint}</span>
      </label>
      <div className={`flex items-center rounded-lg border hairline-strong bg-ink px-3 py-1.5 ${disabled ? "opacity-70" : "focus-within:border-cent/60"}`}>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={disabled && step < 1 ? (step < 0.01 || value < 0.01 ? value.toFixed(3) : value.toFixed(2)) : value}
          step={step}
          min={min}
          max={max}
          disabled={disabled}
          onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
          className="fig w-16 bg-transparent text-right text-[17px] text-bone outline-none disabled:cursor-not-allowed"
        />
        <span className="num ml-2 text-[11px] text-dim">{suffix}</span>
      </div>
      <input
        aria-label={`${label} slider`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="col-span-2 h-1 w-full cursor-pointer accent-cent disabled:cursor-not-allowed disabled:opacity-40"
      />
    </div>
  );
}

export function SessionPanel({
  session,
  spent,
  onChange,
  onApprove,
  onRevoke,
  busy,
}: {
  session: Session;
  spent: number;
  onChange: (p: Partial<SessionConfig>) => void;
  onApprove: () => void;
  onRevoke: () => void;
  busy: boolean;
}) {
  const now = useNow();
  const locked = session.status !== "draft";
  const active = session.status === "active";
  const endsAt = (session.approvedAt ?? 0) + session.windowMin * 60_000;
  const left = Math.max(0, endsAt - now);
  const mm = String(Math.floor(left / 60000)).padStart(2, "0");
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");

  return (
    <section id="session" aria-labelledby="session-title" className="card scroll-mt-24 overflow-hidden">
      {/* Passport identity */}
      <div className="relative border-b hairline p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Kite Passport</p>
            <h2 id="session-title" className="mt-2 font-display text-[24px] tracking-[-0.01em]">
              {AGENT.name}
            </h2>
          </div>
          <Seal verified={active} />
        </div>
        <dl className="mt-5 grid grid-cols-[96px_1fr] gap-y-2 text-[12.5px]">
          <dt className="text-dim">Identity</dt>
          <dd className="text-mute">Simulated — the public app has no real wallet or DID</dd>
          <dt className="text-dim">Approver</dt>
          <dd className="text-mute">{AGENT.owner}</dd>
          <dt className="text-dim">Network</dt>
          <dd className="text-mute">{AGENT.network}</dd>
          <dt className="text-dim">Session</dt>
          <dd className="num text-mute">{active ? session.id : "—"}</dd>
        </dl>
      </div>

      {/* Limits */}
      <div className="px-6 pt-3">
        <div className="flex items-center justify-between pt-2">
          <p className="eyebrow">Spending limits</p>
          {locked && <span className="text-[11px] text-dim">Locked while the session is live</span>}
        </div>
        <div className="divide-y divide-[var(--line)]">
          <Field id="budget" label="Session budget" hint="Total Centiv may spend" value={session.budget} step={0.001} min={0.001} max={5} suffix="USDC" disabled={locked} onChange={(v) => onChange({ budget: +v.toFixed(3) })} />
          <Field id="pertx" label="Per-call cap" hint="Ceiling for any single payment" value={session.perTx} step={0.001} min={0.001} max={2} suffix="USDC" disabled={locked} onChange={(v) => onChange({ perTx: +v.toFixed(3) })} />
          <Field id="window" label="Time window" hint="Session expires after" value={session.windowMin} step={5} min={5} max={240} suffix="min" disabled={locked} onChange={(v) => onChange({ windowMin: Math.round(v) })} />
        </div>
      </div>

      <div className="p-6 pt-4">
        {session.status === "draft" && (
          <button
            onClick={onApprove}
            className="group flex w-full items-center justify-center gap-2.5 rounded-full bg-cent px-4 py-3.5 text-[14px] font-semibold text-white transition hover:bg-[var(--color-cent-hover)] active:translate-y-px"
          >
            <KeyGlyph />
            Approve ${usdc(session.budget)} with passkey
          </button>
        )}
        {session.status === "approving" && (
          <div role="status" className="flex w-full items-center justify-center gap-3 rounded-full border border-gold/60 bg-gold/10 px-4 py-3.5 text-[14px] text-bone">
            <Stamp size={20} className="stamp-in text-gold" />
            Waiting for passkey…
          </div>
        )}
        {active && (
          <div className="grid gap-3">
            <div className="flex items-center justify-between rounded-xl border border-cent/30 bg-cent/[0.06] px-4 py-3">
              <span className="flex items-center gap-2 text-[13.5px] text-bone">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-pass" /> Session live
              </span>
              <span className="fig text-[18px] text-bone" aria-label="Time left in session">
                {mm}:{ss}<span className="num ml-1.5 text-[10px] tracking-[0.06em] text-dim">LEFT</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-[12.5px] text-dim">
              <span>
                Spent <Money value={spent} className="text-[15px] text-bone" /> of ${usdc(session.budget)}
              </span>
              <button onClick={onRevoke} disabled={busy} className="rounded px-1 underline-offset-4 hover:text-bone hover:underline disabled:opacity-40">
                Revoke session
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function KeyGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="5.5" cy="8" r="3" stroke="currentColor" strokeWidth="1.25" />
      <path d="M8.5 8H15M12.5 8v2.5M14.5 8v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

/** Identity stamp: the Centiv stamp, pressed when the session is approved. */
function Seal({ verified }: { verified: boolean }) {
  return (
    <div className="grid h-14 w-14 place-items-center" role="img" aria-label={verified ? "Identity verified for this session" : "Not yet approved"}>
      {verified ? (
        <Stamp size={54} className="stamp-in text-gold" notch="var(--color-cent)" />
      ) : (
        <Stamp size={54} className="text-dim opacity-40" />
      )}
    </div>
  );
}
