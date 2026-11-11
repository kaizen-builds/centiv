import { connection } from "next/server";
import { publicStatus } from "@/lib/server/mode";
import { ProvenanceBadge, type Provenance } from "./ui";

type Row = { part: string; p: Provenance; detail: string };

function rows(serv: Provenance, gate: Provenance): Row[] {
  return [
    {
      part: "Passport caps and payments in the verified run",
      p: "replay",
      detail:
        "A real Kite Passport session and two real USDC payments on Base. Passport refused the third call. The page replays it from the evidence file and never spends.",
    },
    {
      part: "SERV Reasoning",
      p: serv,
      detail:
        serv === "live"
          ? "Real model calls. SERV decides whether each paid call is worth it for every question asked in the app."
          : "No SERV key is configured on this deployment, so a built-in planner stands in.",
    },
    {
      part: "Payments in the public demo",
      p: "simulated",
      detail: "Visitors never spend money. Receipts start with sim_ so they can’t pass for on-chain hashes.",
    },
    {
      part: "Cap checks in the public demo",
      p: "simulated",
      detail: "Centiv applies the same per-call, total and time limits itself. The real Passport refusal is in the verified run.",
    },
    {
      part: "Reppo check of the verified-run brief",
      p: "replay",
      detail:
        "A real independent evaluation on 11 Nov 2026. Score 86 / 100, accept, routed to review (medium confidence). Recorded in the evidence file; not a live score of questions visitors ask.",
    },
    {
      part: "Quality gate in the public demo",
      p: gate,
      detail:
        gate === "live"
          ? "Each visitor brief is scored by a live Reppo call before it reaches you. Evaluations should not include private data."
          : "A built-in check scores each visitor brief, labelled Simulated. This deployment does not call Reppo on every question.",
    },
    {
      part: "Data, prices and briefs in the public demo",
      p: "simulated",
      detail: "Example datasets, prices and briefs for illustration. The real data and real price ($0.001 a call) are in the verified run.",
    },
  ];
}

function Table({ list }: { list: Row[] }) {
  return (
    <ul className="divide-y divide-[rgba(201,146,46,0.25)] overflow-hidden rounded-[18px] border border-[rgba(201,146,46,0.45)] bg-white">
      {list.map((r) => (
        <li key={r.part} className="grid gap-x-6 gap-y-2 px-5 py-4 sm:grid-cols-[minmax(0,15rem)_7.5rem_minmax(0,1fr)] sm:items-baseline sm:px-6">
          <div className="flex items-start justify-between gap-3 sm:contents">
            <p className="text-[15px] font-medium tracking-[-0.015em] text-bone">{r.part}</p>
            <p className="shrink-0">
              <ProvenanceBadge p={r.p} short title={r.p === "live" ? "Live · real calls" : undefined} />
            </p>
          </div>
          <p className="text-[14px] leading-[1.55] text-mute">{r.detail}</p>
        </li>
      ))}
    </ul>
  );
}

/** Reads which integrations are configured at request time, so the table never overclaims. */
export async function RealVsSimulated() {
  await connection();
  const status = publicStatus();
  const serv: Provenance = status.integrations.serv === "live" ? "live" : "simulated";
  const gate: Provenance = status.integrations.reppo === "live" ? "live" : "simulated";
  return <Table list={rows(serv, gate)} />;
}

export function RealVsSimulatedFallback() {
  return (
    <div className="rounded-[18px] border border-[rgba(201,146,46,0.45)] bg-white px-6 py-10 text-center text-[14px] text-dim" aria-hidden="true">
      Checking what’s live…
    </div>
  );
}
