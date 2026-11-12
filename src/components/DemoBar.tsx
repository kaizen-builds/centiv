"use client";

export type DemoPhase = "idle" | "setup" | "A" | "B" | "done";

const label: Record<DemoPhase, string> = {
  idle: "Ready",
  setup: "Approving session",
  A: "Ethereum news · two paid, one refused",
  B: "Ethereum news · two paid, one refused",
  done: "Demo complete",
};

export function DemoBar({
  phase,
  busy,
  onRunDemo,
  onReset,
}: {
  phase: DemoPhase;
  busy: boolean;
  onRunDemo: () => void;
  onReset: () => void;
}) {
  const btn = "h-8 shrink-0 whitespace-nowrap rounded-full px-3 text-[12px] transition disabled:opacity-35 disabled:cursor-not-allowed";
  return (
    <div className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4" role="region" aria-label="Demo controls">
      <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border hairline-strong bg-ink-2/95 p-1.5 shadow-[0_18px_40px_-18px_rgba(91,42,78,0.35)] backdrop-blur">
        <span className="flex items-center gap-2 whitespace-nowrap px-3 text-[11.5px] text-mute" aria-live="polite">
          <span className={`h-1.5 w-1.5 rounded-full ${busy || phase === "setup" ? "pulse-dot bg-cent" : phase === "done" ? "bg-pass" : "bg-dim"}`} />
          <span className="eyebrow !text-[10px]">Demo</span>
          <span className="hidden sm:inline">{label[phase]}</span>
        </span>
        <button onClick={onRunDemo} className={`${btn} bg-cent font-semibold text-white hover:bg-[var(--color-cent-hover)]`}>
          Run demo · A → B
        </button>
        <button onClick={onReset} className={`${btn} text-dim hover:bg-ink-4 hover:text-bone`}>
          Reset
        </button>
      </div>
    </div>
  );
}
