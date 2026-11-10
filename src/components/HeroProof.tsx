import { Stamp } from "./Logo";
import { ProvenanceBadge } from "./ui";
import { VERIFIED_RUN, declinedCall, paidCalls } from "@/lib/verified-run";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** Compact proof beside the hero headline. Every figure comes from src/data/verified-run.json. */
export default function HeroProof({ className = "" }: { className?: string }) {
  const caps = VERIFIED_RUN.passport.caps;
  return (
    <div className={`card-gold p-5 text-left sm:p-6 ${className}`} aria-label="Proof: the verified run, replayed">
      <div className="flex items-center justify-between gap-3">
        <ProvenanceBadge p="replay" />
        <span className="num whitespace-nowrap text-[11px] uppercase tracking-[0.12em] text-dim">Base · USDC</span>
      </div>
      <p className="fig mt-4 text-[14px] text-mute">
        Caps: <span className="text-bone">${caps.max_amount_per_tx} per call · ${caps.max_total_amount} total</span>
      </p>
      <ol className="mt-3 divide-y divide-[rgba(201,146,46,0.25)] rounded-[14px] border border-[rgba(201,146,46,0.45)] bg-white">
        {paidCalls.map((c) => (
          <li key={c.tx_hash} className="flex items-center gap-3 px-4 py-3">
            <Stamp size={24} className="shrink-0 text-gold" notch="var(--color-cent)" label="Paid" />
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-medium tracking-[-0.015em] text-bone">
                Call {c.n} · <span className="text-pass">Paid</span>
              </p>
              <a
                href={c.basescan_url}
                target="_blank"
                rel="noopener noreferrer"
                title={c.tx_hash}
                className="num text-[11.5px] text-cent underline decoration-cent/30 underline-offset-2 hover:decoration-cent"
              >
                {short(c.tx_hash)} on Basescan ↗
              </a>
            </div>
            <span className="fig shrink-0 text-[15px] text-bone">${c.price_usdc}</span>
          </li>
        ))}
        {declinedCall && (
          <li className="flex items-center gap-3 bg-stop/[0.05] px-4 py-3">
            <Stamp size={24} className="shrink-0 text-stop" label="Declined" />
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-medium tracking-[-0.015em] text-stop">Call {declinedCall.n} · Declined <span className="font-normal text-mute">· no money moved</span></p>
              <p className="num text-[11.5px] text-mute">
                <span className="rounded bg-stop/10 px-1 py-px text-stop">{declinedCall.error_code}</span>
              </p>
            </div>
            <span className="fig shrink-0 text-[15px] text-stop line-through">${caps.max_amount_per_tx}</span>
          </li>
        )}
      </ol>
      <div className="mt-4 flex items-center justify-between gap-3 text-[12.5px] text-dim">
        <span>Refused by Kite Passport, not by Centiv.</span>
        <a href="#verified-run" className="inline-flex min-h-9 items-center whitespace-nowrap font-medium text-cent hover:underline">
          Full run ↓
        </a>
      </div>
    </div>
  );
}
