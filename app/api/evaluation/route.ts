import { NextResponse } from "next/server";
import { runEvaluation } from "@/lib/ai/evaluation";
import type { AgentVersion } from "@/lib/ai/types";

export const dynamic = "force-dynamic";

function isAgentVersion(value: unknown): value is AgentVersion {
  return value === "baseline-v1" || value === "guardrailed-v2";
}

export async function GET() {
  return NextResponse.json(await runEvaluation("guardrailed-v2"));
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { version?: unknown };
    if (!isAgentVersion(body.version)) {
      return NextResponse.json({ error: "Version must be baseline-v1 or guardrailed-v2." }, { status: 400 });
    }
    return NextResponse.json(await runEvaluation(body.version));
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
}
