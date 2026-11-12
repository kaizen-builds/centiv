/**
 * Centiv research run engine.
 * Passport session → SERV weigh quote → x402 pay or skip/decline → draft → quality gate.
 */

import {
  type Answer,
  type AuditRow,
  type Check,
  type Run,
  type SessionConfig,
  type Step,
  pickScenario,
  usdc,
} from "@/lib/centiv";
import { checkLimits, createLocalSession, type PassportSession, recordSpend, remaining } from "./passport";
import { decideSpend } from "./serv";
import { catalogueCandidates, payForData, quoteCandidate } from "./x402";
import { evaluateDraft } from "./reppo";
import { publicStatus } from "./mode";

export type RunRequest = {
  question: string;
  session: SessionConfig & { id: string; approvedAt: number; spent: number };
  runLabel?: string;
};

export type RunResponse = {
  mode: ReturnType<typeof publicStatus>;
  session: { id: string; spent: number; remaining: number };
  run: Run;
  audit: Omit<AuditRow, "id" | "at">[];
};

export async function executeResearchRun(req: RunRequest): Promise<RunResponse> {
  const status = publicStatus();
  const sc = pickScenario(req.question);
  const runId = `run_${Date.now()}`;
  const label = req.runLabel || "R";
  const steps: Step[] = [];
  const audit: Omit<AuditRow, "id" | "at">[] = [];
  let seq = 0;
  const nextId = () => `${runId}_${seq++}`;

  let session: PassportSession = {
    ...createLocalSession({
      budget: req.session.budget,
      perTx: req.session.perTx,
      windowMin: req.session.windowMin,
    }),
    id: req.session.id,
    approvedAt: req.session.approvedAt,
    spent: req.session.spent,
  };

  const left0 = remaining(session);
  steps.push({
    id: nextId(),
    kind: "reason",
    status: "done",
    title: "SERV Reasoning · weighing the calls",
    detail: `Weighing ${sc.candidates.length} candidate ${sc.candidates.length === 1 ? "call" : "calls"} against ${usdc(left0)} USDC remaining · engine ${status.mode}.`,
  });

  const candidates = catalogueCandidates(sc.key);
  let gotAllHigh = true;

  for (const c of candidates) {
    const quote = await quoteCandidate(c);
    steps.push({
      id: nextId(),
      kind: "quote",
      status: "done",
      title: `x402 quote · ${c.service}`,
      detail: `402 Payment Required — ${c.endpoint} · ${quote.source}`,
      amount: quote.price,
    });

    const priced = { ...c, price: quote.price };
    const left = remaining(session);
    const mins = Math.ceil((session.approvedAt + session.windowMin * 60_000 - Date.now()) / 60_000);

    const decision = await decideSpend({
      question: req.question,
      candidate: priced,
      remaining: left,
      perTx: session.perTx,
      windowMinLeft: mins,
    });

    steps.push({
      id: nextId(),
      kind: "reason",
      status: "done",
      title: `Buy this call for $${usdc(quote.price)}?`,
      detail: `${decision.rationale} (${decision.source})`,
    });

    if (decision.decision === "skip") {
      steps.push({
        id: nextId(),
        kind: "skip",
        status: "skipped",
        title: "Skipped — not worth the call.",
        amount: 0,
      });
      audit.push({
        runId,
        runLabel: label,
        service: c.service,
        decision: "skip",
        amount: quote.price,
        charged: 0,
        remaining: left,
        reason: decision.rationale,
        provenance: "simulated",
      });
      continue;
    }

    const { ok, checks, remaining: rem } = checkLimits(session, quote.price);
    steps.push({
      id: nextId(),
      kind: "check",
      status: ok && decision.decision === "spend" ? "done" : "blocked",
      title: "Kite Passport limits",
      checks: checks as Check[],
    });

    if (!ok || decision.decision === "decline") {
      gotAllHigh = false;
      const breaches = checks.filter((x) => !x.ok).map((x) => x.label.toLowerCase());
      const reason =
        decision.decision === "decline" && ok
          ? decision.rationale
          : `${usdc(quote.price)} USDC would breach the ${breaches.join(" and the ") || "session limits"}. Nothing was signed.`;
      steps.push({
        id: nextId(),
        kind: "decline",
        status: "blocked",
        title: quote.price > session.perTx ? "Declined — over the per-transaction cap." : "Declined — over the remaining budget.",
        detail: `${reason} Continuing with data already held.`,
        amount: quote.price,
      });
      audit.push({
        runId,
        runLabel: label,
        service: c.service,
        decision: "decline",
        amount: quote.price,
        charged: 0,
        remaining: rem,
        reason,
        provenance: "simulated",
      });
      continue;
    }

    steps.push({
      id: nextId(),
      kind: "pay",
      status: "active",
      title: `Paying $${usdc(quote.price)} via x402 · Simulated`,
      detail: "Simulated payment — no funds move on public runs…",
      amount: quote.price,
    });

    const paid = await payForData({ candidate: priced, quote, scenarioKey: sc.key });
    if (!paid.ok) {
      gotAllHigh = false;
      steps[steps.length - 1] = {
        ...steps[steps.length - 1],
        status: "blocked",
        detail: paid.error || "Payment failed — nothing settled.",
      };
      steps.push({
        id: nextId(),
        kind: "decline",
        status: "blocked",
        title: "Declined — payment did not settle.",
        detail: paid.error,
        amount: quote.price,
      });
      audit.push({
        runId,
        runLabel: label,
        service: c.service,
        decision: "decline",
        amount: quote.price,
        charged: 0,
        remaining: rem,
        reason: paid.error || "Payment failed",
        provenance: "simulated",
      });
      continue;
    }

    session = recordSpend(session, quote.price);
    steps[steps.length - 1] = {
      ...steps[steps.length - 1],
      status: "done",
      detail: `Simulated settlement · no funds moved · receipt ${paid.receipt || "sim_?"}`,
      receipt: paid.receipt,
    };
    audit.push({
      runId,
      runLabel: label,
      service: c.service,
      decision: "spend",
      amount: quote.price,
      charged: quote.price,
      remaining: remaining(session),
      reason: decision.rationale,
      receipt: paid.receipt,
      provenance: "simulated",
    });

    steps.push({
      id: nextId(),
      kind: "fetch",
      status: "done",
      title: "Data received",
      detail: paid.yields,
    });
  }

  const outcome = gotAllHigh ? sc.outcomes.full : sc.outcomes.partial;
  const answer: Answer = outcome.answer;

  steps.push({
    id: nextId(),
    kind: "draft",
    status: "done",
    title: "Drafting the brief",
    detail: gotAllHigh ? "Built from purchased data only." : "Partial: built from data already held.",
  });

  const gate = await evaluateDraft({
    question: req.question,
    answer,
    gotAllHigh,
  });

  steps.push({
    id: nextId(),
    kind: "gate",
    status: gate.verdict === "reject" ? "blocked" : "done",
    title: `${gate.source === "reppo" ? "Reppo" : "Built-in check"} · ${gate.verdict}${gate.pending ? " (pending)" : ""}`,
    detail: `${gate.note}${gate.evalId ? ` · eval ${gate.evalId}` : ""}`,
  });

  for (const row of audit) {
    row.score = gate.score;
    row.verdict = gate.verdict;
    row.gateSource = gate.source;
  }

  const run: Run = {
    id: runId,
    label,
    question: req.question,
    steps,
    status: "done",
    gate: { verdict: gate.verdict, score: gate.score, note: gate.note, source: gate.source },
    answer,
  };

  return {
    mode: status,
    session: { id: session.id, spent: session.spent, remaining: remaining(session) },
    run,
    audit,
  };
}
