"use client";

import { useEffect, useState } from "react";

type State = { kind: "loading" } | { kind: "ok"; serv: boolean; replay: boolean } | { kind: "error" };

/** Header pill. Reads /api/status and only says "live" when the server reports it. */
export default function StatusPill({ className = "inline-flex" }: { className?: string }) {
  const [s, setS] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const ctrl = new AbortController();
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      ctrl.abort();
      setS({ kind: "error" });
    }, 4000);
    fetch("/api/status", { signal: ctrl.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        if (settled) return;
        settled = true;
        setS({ kind: "ok", serv: j?.integrations?.serv === "live", replay: Boolean(j?.replay?.available) });
      })
      .catch((e) => {
        if (settled || e?.name === "AbortError") return;
        settled = true;
        setS({ kind: "error" });
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      settled = true;
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, []);

  let dot = "bg-[#b9b0a6]";
  let text = "Checking…";
  let title = "Checking what the server reports";
  if (s.kind === "ok") {
    dot = s.serv ? "bg-live" : "bg-[#b9b0a6]";
    text = `${s.serv ? "SERV live" : "SERV simulated"}${s.replay ? " · Passport replay" : ""}`;
    title = s.serv
      ? "SERV Reasoning is configured on the server. The Passport run is a replay of a real on-chain run; visitor payments are simulated."
      : "SERV Reasoning is not configured, so reasoning is simulated. Visitor payments are simulated.";
  } else if (s.kind === "error") {
    text = "Status unavailable";
    title = "Could not reach /api/status";
  }

  return (
    <a
      href="#real"
      title={title}
      aria-live="polite"
      className={`h-8 items-center gap-2 whitespace-nowrap rounded-full border border-[rgba(201,146,46,0.45)] bg-white/70 px-3 text-[12px] font-medium text-mute transition hover:border-cent/40 hover:text-bone ${className}`}
    >
      <span className={`relative inline-block h-[7px] w-[7px] rounded-full ${dot}`} aria-hidden="true">
        {s.kind === "ok" && s.serv && <span className="absolute inset-0 animate-ping rounded-full bg-live opacity-40 motion-reduce:hidden" />}
      </span>
      <span>{text}</span>
    </a>
  );
}
