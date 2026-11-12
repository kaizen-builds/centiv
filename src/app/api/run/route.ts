import { connection, NextResponse } from "next/server";
import { publicStatus } from "@/lib/server/mode";
import { buildRecordedReplay } from "@/lib/recorded-replay";

export const maxDuration = 60;

export async function POST(req: Request) {
  await connection();
  const body = await req.json().catch(() => null);
  if (!body || typeof body.question !== "string" || !body.session) {
    return NextResponse.json({ error: "question and session are required" }, { status: 400 });
  }

  const session = body.session as {
    id?: string;
    approvedAt?: number;
  };

  if (!session.id || !session.approvedAt) {
    return NextResponse.json({ error: "Approve a Passport session first." }, { status: 400 });
  }

  try {
    const runId = `run_${Date.now()}`;
    const runLabel = typeof body.runLabel === "string" ? body.runLabel : "R";
    const built = buildRecordedReplay({
      question: body.question,
      runId,
      runLabel,
    });
    return NextResponse.json({
      mode: publicStatus(),
      session: { id: session.id, spent: built.session.spent, remaining: built.session.remaining },
      run: built.run,
      audit: built.audit,
    });
  } catch (e) {
    console.error("run failed", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Run failed" }, { status: 500 });
  }
}
