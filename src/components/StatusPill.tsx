import { connection } from "next/server";
import { publicStatus } from "@/lib/server/mode";

const base =
  "h-8 items-center gap-2 whitespace-nowrap rounded-full border border-[rgba(201,146,46,0.45)] bg-white/70 px-3 text-[12px] font-medium text-mute transition hover:border-cent/40 hover:text-bone";

/** Header pill. Rendered on the server from the same flags as /api/status, so it never sits on "Checking…". */
export default async function StatusPill({ className = "inline-flex" }: { className?: string }) {
  await connection();
  let serv: boolean | null = null;
  try {
    serv = publicStatus().integrations.serv === "live";
  } catch {
    serv = null;
  }
  const text = serv === null ? "Status unavailable" : serv ? "SERV live · Passport replay" : "SERV simulated · Passport replay";
  const title =
    serv === null
      ? "Could not read the server status"
      : serv
        ? "SERV Reasoning is configured on the server. The Passport run is a replay of a real on-chain run; visitor payments are simulated."
        : "SERV Reasoning is not configured, so reasoning is simulated. Visitor payments are simulated.";
  return (
    <a href="#real" title={title} className={`${base} ${className}`}>
      <span className={`relative inline-block h-[7px] w-[7px] rounded-full ${serv ? "bg-live" : "bg-[#b9b0a6]"}`} aria-hidden="true">
        {serv && <span className="absolute inset-0 animate-ping rounded-full bg-live opacity-40 motion-reduce:hidden" />}
      </span>
      <span>{text}</span>
    </a>
  );
}

/** Empty, same-size shell while the server reads its flags. Shows no state it hasn't read. */
export function StatusPillFallback({ className = "inline-flex" }: { className?: string }) {
  return <span aria-hidden="true" className={`${base} ${className} invisible w-[214px]`} />;
}
