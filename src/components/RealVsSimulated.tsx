import { connection } from "next/server";
import { publicStatus } from "@/lib/server/mode";
import { ProvenanceBadge, type Provenance } from "./ui";

type Row = { part: string; p: Provenance; detail: string };

function rows(serv: Provenance, gate: Provenance): Row[] {
  return [
    {
      part: "Kite Passport caps and payments in the recorded run",
      p: "replay",
      detail:
        "A real Kite Passport session and two real USDC payments on Base. Kite Passport refused the third call. The page replays it from the evidence file and never spends.",
    },
    {
      part: "Payments and cap checks in the public demo",
      p: "simulated",
      detail:
        "Visitors never spend money. Centiv applies the same $0.001 per-call and $0.002 total limits itself. Receipts start with sim_ so they can’t pass for on-chain hashes. The real Kite Passport refusal is in the recorded run.",
    },
    {
      part: "SERV Reasoning",
      p: serv,
      detail:
        serv === "live"
          ? "Real model calls on the live path, which weighs each call before payment. SERV was not part of the recorded run above."
          : "No SERV key is configured on this deployment, so a built-in planner stands in. SERV was not part of the recorded run above.",
    },
    {
      part: "Reppo",
      p: gate,
      detail:
        gate === "live"
          ? "Each visitor brief can be scored by a live Reppo call. Reppo did not score the recorded run above."
          : "A built-in check stands in for visitor questions, labelled Simulated. Reppo did not score the recorded run above.",
    },
  ];
}

function Table({ list }: { list: Row[] }) {
  return (
    <ul className="divide-y divide-[rgba(201,146,46,0.25)] overflow-hidden rounded-[18px] border border-[rgba(201,146,46,0.45)] bg-white">
      {list.map((r) => (
        <li key={r.part} className="grid gap-x-6 gap-y-2 px-5 py-5 sm:grid-cols-[minmax(0,16rem)_7.5rem_minmax(0,1fr)] sm:items-baseline sm:px-6">
          <div className="flex items-start justify-between gap-3 sm:contents">
            <p className="text-[15px] font-medium tracking-[-0.015em] text-bone">{r.part}</p>
            <p className="shrink-0">
              <ProvenanceBadge p={r.p} short title={r.p === "live" ? "Live · real calls" : undefined} />
            </p>
          </div>
          <p className="text-[14px] leading-[1.6] text-mute">{r.detail}</p>
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
