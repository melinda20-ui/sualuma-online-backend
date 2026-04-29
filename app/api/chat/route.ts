import { NextRequest, NextResponse } from "next/server";
import { getBrainStatus, runMiaBrain } from "@/lib/brain/mia";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getBrainStatus());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await runMiaBrain(body);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        provider: "server-error",
        agent: "Mia",
        reply: "Tive um erro interno no cérebro da Mia. Verifique os logs do servidor.",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
