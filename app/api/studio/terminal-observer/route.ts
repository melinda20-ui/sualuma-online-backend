import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROOT = process.cwd();
const OBSERVER_DIR = path.join(ROOT, "data", "terminal-observer");
const SUMMARY_FILE = path.join(OBSERVER_DIR, "summary.json");
const EVENTS_FILE = path.join(OBSERVER_DIR, "events.jsonl");

function isAuthorized(request: NextRequest) {
  const expected = process.env.TERMINAL_OBSERVER_KEY || process.env.BRAIN_API_KEY || "";
  const direct =
    request.headers.get("x-terminal-observer-key") ||
    request.headers.get("x-brain-key") ||
    request.headers.get("x-api-key") ||
    "";

  const auth = request.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";

  return Boolean(expected && (direct === expected || bearer === expected));
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function readEvents(limit = 80) {
  try {
    const raw = fs.readFileSync(EVENTS_FILE, "utf8").trim();
    if (!raw) return [];

    return raw
      .split("\n")
      .slice(-limit)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return { raw: line };
        }
      });
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Acesso restrito ao admin/token interno.",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    observer: readJson(SUMMARY_FILE, {
      ok: false,
      message: "Resumo ainda não gerado.",
    }),
    events: readEvents(80),
  });
}
