"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AuditRow,
  DEFAULT_SESSION,
  Run,
  Session,
  SessionConfig,
  Step,
  resetSeed,
} from "@/lib/centiv";
import { recordedQuestion, REPLAY_BANNER } from "@/lib/recorded-replay";
import { CentivWordmark } from "./Logo";
import { Hero } from "./Hero";
import { SessionPanel } from "./SessionPanel";
import { AskPanel } from "./AskPanel";
import { RunPanel } from "./RunPanel";
import { AuditTrail } from "./AuditTrail";
import { DemoBar, DemoPhase } from "./DemoBar";
import VerifiedRun from "./VerifiedRun";
import { LivePanel } from "./LivePanel";
import { GITHUB_REPO, GitHubMark, StatusStrip } from "./StatusStrip";

class Cancelled extends Error {}

type PublicMode = {
  mode: "simulated" | "hybrid" | "live";
  integrations: {
    serv: string;
    reppo: string;
    passport: string;
    x402: string;
  };
  note: string;
};

export default function CentivApp() {
  const [session, setSession] = useState<Session>({ ...DEFAULT_SESSION, status: "draft", id: "sess_pending" });
  const [runs, setRuns] = useState<Run[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [spent, setSpent] = useState(0);
  const [question, setQuestion] = useState("");
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [engineMode, setEngineMode] = useState<PublicMode | null>(null);

  const token = useRef(0);
  const sessionRef = useRef(session);
  const spentRef = useRef(0);
  const runCount = useRef(0);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const autoStarted = useRef(false);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((m: PublicMode) => setEngineMode(m))
      .catch(() =>
        setEngineMode({
          mode: "simulated",
          integrations: { serv: "simulated", reppo: "simulated", passport: "local-enforced", x402: "local" },
          note: "Status unreachable — assuming simulated mode.",
        }),
      );
  }, []);

  const sleep = useCallback((ms: number) => {
    const t = token.current;
    return new Promise<void>((resolve, reject) =>
      setTimeout(() => (t === token.current ? resolve() : reject(new Cancelled())), ms),
    );
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const configure = (patch: Partial<SessionConfig>) => setSession((s) => ({ ...s, ...patch }));

  const approve = useCallback(async () => {
    setSession((s) => ({ ...s, status: "approving" }));
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget: sessionRef.current.budget,
          perTx: sessionRef.current.perTx,
          windowMin: sessionRef.current.windowMin,
        }),
      });
      if (!res.ok) throw new Error("session approve failed");
      const data = (await res.json()) as {
        session: {
          id: string;
          budget: number;
          perTx: number;
          windowMin: number;
          approvedAt: number;
        };
        mode?: PublicMode;
      };
      await sleep(400);
      const next: Session = {
        budget: data.session.budget,
        perTx: data.session.perTx,
        windowMin: data.session.windowMin,
        status: "active",
        id: data.session.id,
        approvedAt: data.session.approvedAt,
      };
      sessionRef.current = next;
      setSession(next);
      if (data.mode) setEngineMode(data.mode);
    } catch {
      await sleep(800);
      const next: Session = {
        ...sessionRef.current,
        status: "active",
        id: `sess_local_${Date.now().toString(36)}`,
        approvedAt: Date.now(),
      };
      sessionRef.current = next;
      setSession(next);
    }
  }, [sleep]);

  const revoke = () => {
    token.current++;
    setBusy(false);
    setSession((s) => ({ ...s, status: "draft", id: "sess_pending", approvedAt: undefined }));
  };

  const replaySteps = async (runId: string, steps: Step[]) => {
    for (const step of steps) {
      const active: Step = { ...step, status: step.status === "skipped" || step.status === "blocked" ? step.status : "active" };
      setRuns((rs) => rs.map((r) => (r.id === runId ? { ...r, steps: [...r.steps.filter((s) => s.id !== step.id), active] } : r)));
      await sleep(step.kind === "gate" ? 900 : step.kind === "reason" ? 700 : 550);
      setRuns((rs) =>
        rs.map((r) =>
          r.id === runId
            ? { ...r, steps: r.steps.map((s) => (s.id === step.id ? step : s)) }
            : r,
        ),
      );
      if (step.kind === "pay" && step.status === "done" && step.amount) {
        spentRef.current = +(spentRef.current + step.amount).toFixed(6);
        setSpent(spentRef.current);
      }
      await sleep(180);
    }
  };

  const executeRun = useCallback(
    async (q: string) => {
      const runId = `run_${Date.now()}`;
      const label = String.fromCharCode(65 + runCount.current++);
      setBusy(true);
      setSelectedRun(runId);
      // Each public run is a full replay of the recorded session, from a zero spend.
      spentRef.current = 0;
      setSpent(0);
      setRuns((r) => [...r, { id: runId, label, question: q, steps: [], status: "running" }]);

      const s = sessionRef.current;
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          runLabel: label,
          session: {
            id: s.id,
            budget: s.budget,
            perTx: s.perTx,
            windowMin: s.windowMin,
            approvedAt: s.approvedAt,
            spent: spentRef.current,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setRuns((rs) =>
          rs.map((r) =>
            r.id === runId
              ? {
                  ...r,
                  status: "done",
                  steps: [
                    {
                      id: `${runId}_err`,
                      kind: "decline",
                      status: "blocked",
                      title: "Run failed",
                      detail: (err as { error?: string }).error || res.statusText,
                    },
                  ],
                }
              : r,
          ),
        );
        setBusy(false);
        return;
      }

      const data = (await res.json()) as {
        mode?: PublicMode;
        session: { spent: number };
        run: Run;
        audit: Omit<AuditRow, "id" | "at">[];
      };
      if (data.mode) setEngineMode(data.mode);

      // Replay under a stable client run id so selection stays put.
      const serverRun = { ...data.run, id: runId, label };
      await replaySteps(runId, serverRun.steps);

      spentRef.current = data.session.spent;
      setSpent(data.session.spent);

      setAudit((a) => [
        ...a,
        ...data.audit.map((row, i) => ({
          ...row,
          id: `a_${a.length + i}_${Date.now()}`,
          runId,
          runLabel: label,
          at: Date.now() + i,
        })),
      ]);

      setRuns((rs) =>
        rs.map((r) =>
          r.id === runId
            ? { ...serverRun, status: "done", steps: serverRun.steps }
            : r,
        ),
      );
      setBusy(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sleep],
  );

  const ask = async (q: string) => {
    if (!q.trim() || busy || sessionRef.current.status !== "active") return;
    try {
      document.getElementById("run")?.scrollIntoView({ behavior: "smooth", block: "start" });
      await executeRun(q.trim());
    } catch (e) {
      if (!(e instanceof Cancelled)) throw e;
    }
  };

  const hardReset = () => {
    token.current++;
    resetSeed();
    runCount.current = 0;
    spentRef.current = 0;
    const s: Session = { ...DEFAULT_SESSION, status: "draft", id: "sess_pending" };
    sessionRef.current = s;
    setSession(s);
    setRuns([]);
    setAudit([]);
    setSpent(0);
    setQuestion("");
    setTyping(false);
    setBusy(false);
    setSelectedRun(null);
    setPhase("idle");
  };

  const typeOut = async (text: string) => {
    setTyping(true);
    setQuestion("");
    for (let i = 1; i <= text.length; i += 2) {
      setQuestion(text.slice(0, i));
      await sleep(14);
    }
    setQuestion(text);
    setTyping(false);
  };

  const ensureSession = async () => {
    if (sessionRef.current.status === "active") return;
    scrollTo("session");
    await sleep(700);
    await approve();
    await sleep(700);
  };

  const scene = async () => {
    setPhase("A");
    scrollTo("ask");
    await sleep(600);
    await typeOut(recordedQuestion());
    await sleep(500);
    scrollTo("run");
    await executeRun(recordedQuestion());
    await sleep(1400);
  };

  const guard = (fn: () => Promise<void>) => async () => {
    try {
      await fn();
    } catch (e) {
      if (!(e instanceof Cancelled)) throw e;
    }
  };

  // guard() only wraps the handler; refs are read when it runs, not during render.
  // eslint-disable-next-line react-hooks/refs
  const runDemo = guard(async () => {
    hardReset();
    await sleep(200);
    setPhase("setup");
    await ensureSession();
    await scene();
    scrollTo("audit");
    setPhase("done");
  });

  useEffect(() => {
    if (autoStarted.current) return;
    const params = new URLSearchParams(window.location.search);
    // ?ask=1 is the “ask your own question” path; everything else, including bare /app, starts A→B.
    if (params.get("ask") === "1") return;
    autoStarted.current = true;
    if (params.get("demo") === "ab" || params.get("demo") === "1") {
      window.history.replaceState(null, "", window.location.pathname);
    }
    const t = setTimeout(() => runDemo(), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // guard() only wraps the handler; refs are read when it runs, not during render.
  // eslint-disable-next-line react-hooks/refs
  const approveGuarded = guard(approve);

  const current = runs.find((r) => r.id === selectedRun) ?? runs[runs.length - 1];
  const modeLabel =
    engineMode?.mode === "live" ? "Live mode" : engineMode?.mode === "hybrid" ? "Hybrid mode" : REPLAY_BANNER;
  const modeHint =
    engineMode?.mode === "live" || engineMode?.mode === "hybrid"
      ? engineMode?.note || ""
      : "The public demo replays the recorded 12 Nov 19:38 WAT run. Transaction links are real and marked recorded. No money moves.";

  return (
    <div className="min-h-screen bg-ink pb-36">
      <header className="sticky top-0 z-30 bg-ink/80 backdrop-blur-md">
        <div className="relative mx-auto flex h-[68px] max-w-[1240px] items-center justify-between gap-3 px-4 sm:px-5 md:px-8">
          <Link href="/" className="shrink-0 rounded-md" aria-label="Centiv — back to the landing page">
            <CentivWordmark size={21} />
          </Link>
          <nav aria-label="Sections" className="pill-sage absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 rounded-full px-1.5 py-1 text-[13px] font-medium lg:flex">
            {[
              ["session", "Session"],
              ["ask", "Ask"],
              ["run", "Run"],
              ["verified-run", "Verified run"],
              ["audit", "Audit trail"],
            ].map(([id, l]) => (
              <a key={id} href={`#${id}`} className="whitespace-nowrap rounded-full px-3 py-1.5 text-bone transition-colors hover:bg-sage-hover">
                {l}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <a href="#verified-run" className="whitespace-nowrap rounded-full px-2 py-1.5 text-[13.5px] font-medium text-bone transition hover:bg-sage lg:hidden">
              Verified run
            </a>
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Centiv source on GitHub"
              title="Source on GitHub"
              className="hidden h-10 w-10 place-items-center rounded-full text-mute transition hover:bg-sage hover:text-bone sm:grid"
            >
              <GitHubMark size={16} />
            </a>
          </div>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-[1240px] px-5 md:px-8">
        <StatusStrip
          serv={engineMode?.integrations.serv === "live" ? "live" : "simulated"}
          reppo={engineMode?.integrations.reppo === "live" ? "live" : "simulated"}
          align="start"
          className="pt-5"
        />
        <Hero session={session} spent={spent} audit={audit} onRunDemo={runDemo} />

        <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12" aria-label="Agent console">
          <div className="min-w-0 lg:col-span-5">
            <div className="lg:sticky lg:top-20">
              <SessionPanel session={session} spent={spent} onChange={configure} onApprove={approveGuarded} onRevoke={revoke} busy={busy} />
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-5 lg:col-span-7">
            <AskPanel
              value={question}
              onChange={setQuestion}
              onAsk={() => ask(question)}
              disabled={session.status !== "active" || busy}
              locked={session.status !== "active"}
              typing={typing}
              suggestions={[recordedQuestion()]}
            />
            <RunPanel runs={runs} current={current} onSelect={setSelectedRun} onRunDemo={runDemo} spent={spent} cap={session.budget} />
          </div>
        </section>

        <LivePanel onRow={(row) => setAudit((a) => [...a, { ...row, id: `live_${a.length}_${Date.now()}` }])} />

        <div className="mt-16">
          <VerifiedRun compact />
        </div>

        <AuditTrail rows={audit} session={session} spent={spent} />

        <footer className="mt-20 flex flex-col gap-3 border-t hairline pt-8 text-[12px] text-dim md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <CentivWordmark size={20} />
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[13px] text-mute transition hover:text-bone"
            >
              <GitHubMark size={14} />
              Source on GitHub
            </a>
          </div>
          <p className="max-w-xl">
            Built for SERV Hackathon 02 · Kite track. {modeLabel}.{" "}
            {engineMode?.mode === "live" || engineMode?.mode === "hybrid"
              ? modeHint
              : "The public demo replays the recorded run. No money moves."}
          </p>
        </footer>
      </main>

      <DemoBar phase={phase} busy={busy} onRunDemo={runDemo} onReset={hardReset} />
    </div>
  );
}
