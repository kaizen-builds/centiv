import { NextResponse } from "next/server";
import evidence from "@/data/verified-run.json";

/** Public, sanitised evidence of the real Passport-capped run (Replay). */
export function GET() {
  return NextResponse.json(evidence, { headers: { "Cache-Control": "public, max-age=300" } });
}
