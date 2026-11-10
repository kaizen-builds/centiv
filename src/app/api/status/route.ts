import { connection } from "next/server";
import { NextResponse } from "next/server";
import { publicStatus } from "@/lib/server/mode";

export async function GET() {
  await connection(); // read env at request time (Cache Components)
  return NextResponse.json(publicStatus());
}
