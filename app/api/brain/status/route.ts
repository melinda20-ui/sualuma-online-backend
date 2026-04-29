import { NextResponse } from "next/server";
import { getBrainStatus } from "@/lib/brain/mia";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getBrainStatus());
}
