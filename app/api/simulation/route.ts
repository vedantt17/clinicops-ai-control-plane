import { NextResponse } from "next/server";
import { runSimulation } from "@/lib/workflow-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(runSimulation(17));
}

export async function POST(request: Request) {
  let seed = 17;
  try {
    const body = (await request.json()) as { seed?: unknown };
    if (typeof body.seed === "number" && Number.isInteger(body.seed) && body.seed >= 1 && body.seed <= 9_999) {
      seed = body.seed;
    }
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  return NextResponse.json(runSimulation(seed));
}
