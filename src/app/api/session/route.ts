import { connection } from "next/server";
import { NextResponse } from "next/server";
import { createLocalSession } from "@/lib/server/passport";
import { publicStatus } from "@/lib/server/mode";
import type { SessionConfig } from "@/lib/centiv";

export async function POST(req: Request) {
  await connection();
  const body = (await req.json().catch(() => ({}))) as Partial<SessionConfig>;
  const cfg: SessionConfig = {
    budget: typeof body.budget === "number" ? body.budget : 0.5,
    perTx: typeof body.perTx === "number" ? body.perTx : 0.2,
    windowMin: typeof body.windowMin === "number" ? body.windowMin : 30,
  };
  const session = createLocalSession(cfg);
  return NextResponse.json({
    session: {
      id: session.id,
      budget: session.budget,
      perTx: session.perTx,
      windowMin: session.windowMin,
      status: "active" as const,
      approvedAt: session.approvedAt,
      asset: session.asset,
      network: session.network,
      backend: session.backend,
    },
    mode: publicStatus(),
  });
}
