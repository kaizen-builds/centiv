import { connection, NextResponse } from "next/server";
import { executeResearchRun } from "@/lib/server/engine";

export const maxDuration = 60;

export async function POST(req: Request) {
  await connection();
  const body = await req.json().catch(() => null);
  if (!body || typeof body.question !== "string" || !body.session) {
    return NextResponse.json({ error: "question and session are required" }, { status: 400 });
  }

  const session = body.session as {
    id?: string;
    budget?: number;
    perTx?: number;
    windowMin?: number;
    approvedAt?: number;
    spent?: number;
  };

  if (!session.id || !session.approvedAt) {
    return NextResponse.json({ error: "Approve a Passport session first." }, { status: 400 });
  }

  try {
    const result = await executeResearchRun({
      question: body.question,
      runLabel: typeof body.runLabel === "string" ? body.runLabel : undefined,
      session: {
        id: session.id,
        budget: Number(session.budget) || 0.5,
        perTx: Number(session.perTx) || 0.2,
        windowMin: Number(session.windowMin) || 30,
        approvedAt: Number(session.approvedAt),
        spent: Number(session.spent) || 0,
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error("run failed", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Run failed" }, { status: 500 });
  }
}
