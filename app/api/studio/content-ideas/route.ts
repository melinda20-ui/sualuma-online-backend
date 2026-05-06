import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IDEAS_FILE = path.join(process.cwd(), "data", "content-ideas", "ideas.json");

export async function GET() {
  try {
    const data = JSON.parse(await fs.readFile(IDEAS_FILE, "utf8"));
    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json({
      ok: true,
      updatedAt: new Date().toISOString(),
      ideas: []
    });
  }
}
