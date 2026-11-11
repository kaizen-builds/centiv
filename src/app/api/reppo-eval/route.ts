import { NextResponse } from "next/server";
import evidence from "@/data/reppo-eval.json";

/** Public, sanitised evidence of the real Reppo check of the verified-run brief. */
export function GET() {
  return NextResponse.json(evidence, { headers: { "Cache-Control": "public, max-age=300" } });
}
