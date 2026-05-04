import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await requireAdmin("/studio/campaign-agent");

  const body = await req.json().catch(() => ({}));
  const secret = process.env.CAMPAIGN_AGENT_SECRET || "";

  const res = await fetch(new URL("/api/campaign-agent", req.url), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(secret ? { "x-campaign-agent-secret": secret } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();

  return new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") || "application/json",
    },
  });
}
