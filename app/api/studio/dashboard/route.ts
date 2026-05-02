import { NextResponse } from "next/server";
import { getStudioDashboardData } from "@/lib/studio/studio-dashboard-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getStudioDashboardData();

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
