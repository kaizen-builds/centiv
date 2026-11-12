import { ProvenanceBadge, type Provenance } from "./ui";

export type StatusKind = "live" | "simulated";

function Sep() {
  return (
    <span className="text-[rgba(196, 148, 100,0.5)]" aria-hidden="true">
      |
    </span>
  );
}

function Item({ label, detail, p }: { label: string; detail?: string; p: Provenance }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-mute">
        {label}
        {detail ? ` · ${detail}` : ""}
      </span>
      <ProvenanceBadge p={p} short />
    </span>
  );
}

/** Truth strip. SERV is Live only when a key is configured; the public demo is a recorded replay.
 *  `line` is a single typographic sentence for the landing hero; `badges` keeps the detailed legend. */
export function StatusStrip({
  serv,
  reppo,
  className = "",
  align = "center",
  variant = "badges",
}: {
  serv: StatusKind;
  reppo: StatusKind;
  className?: string;
  align?: "center" | "start";
  variant?: "badges" | "line";
}) {
  const servP: Provenance = serv === "live" ? "live" : "simulated";
  const gateP: Provenance = reppo === "live" ? "live" : "simulated";
  if (variant === "line") {
    const reasoning = serv === "live" ? "Live reasoning" : "Simulated reasoning";
    const gate = reppo === "live" ? " · Live quality score" : "";
    return (
      <p
        className={`whitespace-nowrap text-[12px] leading-snug text-dim sm:text-[12.5px] ${align === "center" ? "text-center" : "text-left"} ${className}`}
        aria-label="What's live, simulated, and replayed"
      >
        {reasoning}
        {gate} · Real payments replay · Demo is a recorded replay, no money moves
      </p>
    );
  }
  return (
    <p
      className={`flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[12px] ${align === "center" ? "justify-center" : "justify-start"} ${className}`}
      aria-label="What's live, simulated, and replayed"
    >
      <Item label="SERV Reasoning" p={servP} />
      <Sep />
      <Item label="Quality score" detail={reppo === "live" ? "Reppo" : "Built-in check"} p={gateP} />
      <Sep />
      <Item label="Visitor demo" p="replay" />
      <Sep />
      <span className="inline-flex items-center gap-1.5">
        <span className="text-mute">Verified run</span>
        <ProvenanceBadge p="replay" short />
        <span className="text-dim">(real, Base)</span>
      </span>
    </p>
  );
}

export function GitHubMark({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.68 7.68 0 0 1 8 4.07c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export const GITHUB_REPO = "https://github.com/kaizen-builds/centiv";
