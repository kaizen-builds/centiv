import { connection } from "next/server";
import { publicStatus } from "@/lib/server/mode";
import { StatusStrip, type StatusKind } from "./StatusStrip";

export async function StatusStripServer({
  className = "",
  variant = "badges",
  align = "center",
}: {
  className?: string;
  variant?: "badges" | "line";
  align?: "center" | "start";
}) {
  await connection();
  const status = publicStatus();
  const serv: StatusKind = status.integrations.serv === "live" ? "live" : "simulated";
  const reppo: StatusKind = status.integrations.reppo === "live" ? "live" : "simulated";
  return <StatusStrip serv={serv} reppo={reppo} className={className} variant={variant} align={align} />;
}

/** Reserved shell so the prerender never claims Live or Simulated for keys it hasn't read yet. */
export function StatusStripFallback({
  className = "",
  variant = "badges",
}: {
  className?: string;
  variant?: "badges" | "line";
}) {
  if (variant === "line") {
    return (
      <p className={`text-[12px] leading-snug text-dim sm:text-[12.5px] ${className}`} aria-hidden="true">
        &nbsp;
      </p>
    );
  }
  return (
    <p
      className={`flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 text-[12px] text-dim ${className}`}
      aria-hidden="true"
    >
      Checking what’s live…
    </p>
  );
}
