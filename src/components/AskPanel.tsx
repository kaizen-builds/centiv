"use client";

export function AskPanel({
  value,
  onChange,
  onAsk,
  disabled,
  locked,
  typing,
  suggestions,
}: {
  value: string;
  onChange: (v: string) => void;
  onAsk: () => void;
  disabled: boolean;
  locked: boolean;
  typing: boolean;
  suggestions: string[];
}) {
  return (
    <section id="ask" aria-labelledby="ask-title" className="card scroll-mt-24 p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="ask-title" className="eyebrow">Ask Centiv</h2>
        <span className="text-[11.5px] text-dim">Market research · one question per run</span>
      </div>
      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          onAsk();
        }}
      >
        <label htmlFor="question" className="sr-only">
          Research question
        </label>
        <div className="relative rounded-xl border hairline-strong bg-ink transition focus-within:border-gold">
          <textarea
            id="question"
            rows={3}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onAsk();
            }}
            placeholder={locked ? "Approve a session first — Centiv can’t spend without one." : "Ask something that might be worth a call."}
            className="block w-full resize-none bg-transparent px-4 pb-14 pt-3.5 font-display text-[20px] font-medium tracking-[-0.02em] leading-[1.35] text-bone outline-none placeholder:text-[18px] placeholder:text-dim"
          />
          {typing && <span className="caret pointer-events-none absolute right-4 top-4 h-5 w-[2px] bg-pass" aria-hidden="true" />}
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3">
            <span className="hidden text-[11px] text-dim sm:inline">
              <kbd className="num rounded border hairline-strong px-1">Ctrl</kbd> + <kbd className="num rounded border hairline-strong px-1">Enter</kbd>
            </span>
            <button
              type="submit"
              disabled={disabled || !value.trim()}
              className="ml-auto inline-flex h-9 items-center gap-2 rounded-full bg-cent px-4 text-[13px] font-semibold text-white transition hover:bg-[var(--color-cent-hover)] disabled:cursor-not-allowed disabled:opacity-30"
            >
              Research
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M1 6h9M6.5 2.5 10 6 6.5 9.5" stroke="currentColor" strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </form>
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Suggested questions">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className="max-w-full truncate rounded-full border hairline-strong bg-ink-2 px-3 py-1.5 text-left text-[12px] text-mute transition hover:border-[var(--line-strong)] hover:text-bone"
          >
            {s.length > 64 ? s.slice(0, 62) + "…" : s}
          </button>
        ))}
      </div>
    </section>
  );
}
