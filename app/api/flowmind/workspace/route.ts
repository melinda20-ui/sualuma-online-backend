import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "flowmind-workspaces.json");
    const raw = await fs.readFile(filePath, "utf8");
    const workspaces = JSON.parse(raw);

    return NextResponse.json({
      ok: true,
      workspaces: Array.isArray(workspaces) ? workspaces : [],
    });
  } catch {
    return NextResponse.json({
      ok: true,
      workspaces: [],
    });
  }
}
