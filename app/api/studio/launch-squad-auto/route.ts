import { NextRequest, NextResponse } from "next/server";
import { sendDiscordMessage } from "@/lib/discord-notify";
import { buildLiveAgentReport } from "@/lib/sualuma/live-agent-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isLocalRequest(req: NextRequest) {
  const host = req.nextUrl.hostname;
  return host === "127.0.0.1" || host === "localhost";
}

function authorized(req: NextRequest) {
  if (isLocalRequest(req)) return true;

  const secret = process.env.DISCORD_NOTIFY_SECRET?.trim();
  if (!secret) return true;

  const received =
    req.headers.get("x-sualuma-secret") ||
    req.nextUrl.searchParams.get("secret");

  return Boolean(received && received === secret);
}

async function handler(req: NextRequest) {
  const report = buildLiveAgentReport();
  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      summary: report.summary,
      content: report.discordContent
    });
  }

  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const result = await sendDiscordMessage({
    content: report.discordContent
  });

  return NextResponse.json({
    ok: result.ok,
    sent: result.ok,
    summary: report.summary,
    content: report.discordContent,
    discord: result
  });
}

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
