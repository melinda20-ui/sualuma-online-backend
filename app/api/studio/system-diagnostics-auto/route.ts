import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { sendDiscord } from "@/lib/sualuma-discord";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Target = {
  name: string;
  url: string;
  auth?: "secret";
  expectedStatus?: number[];
};

type CheckResult = {
  name: string;
  url: string;
  ok: boolean;
  status: number;
  ms: number;
  error?: string;
  checkedAt: string;
};

type State = {
  lastSummaryAt?: string;
  targets?: Record<string, { ok: boolean; status: number; error?: string }>;
};

const TARGETS_FILE = path.join(process.cwd(), "data", "system-diagnostics", "targets.json");
const STATE_FILE = path.join(process.cwd(), "data", "system-diagnostics", "state.json");

function authorized(req: NextRequest) {
  const secret = process.env.DISCORD_NOTIFY_SECRET || "";
  if (!secret) return true;

  const received =
    req.nextUrl.searchParams.get("secret") ||
    req.headers.get("x-sualuma-secret") ||
    "";

  return received === secret;
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

function hasFatalContent(text: string) {
  const lower = text.toLowerCase();

  const fatalPhrases = [
    "internal server error",
    "application error",
    "runtime error",
    "prismaclientinitializationerror",
    "prismaclientknownrequesterror",
    "can't reach database",
    "could not connect",
    "connection refused",
    "failed to fetch",
    "unexpected token",
    "erro interno"
  ];

  return fatalPhrases.some((phrase) => lower.includes(phrase));
}

async function checkTarget(target: Target): Promise<CheckResult> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);

  try {
    let url = target.url;

    if (target.auth === "secret") {
      const secret = process.env.DISCORD_NOTIFY_SECRET || "";
      if (secret) {
        const separator = url.includes("?") ? "&" : "?";
        url = `${url}${separator}secret=${encodeURIComponent(secret)}`;
      }
    }

    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal
    });

    const ms = Date.now() - started;

    let text = "";
    try {
      text = await res.clone().text();
    } catch {
      text = "";
    }

    const expected = target.expectedStatus || [];
    const statusOk = expected.length ? expected.includes(res.status) : res.status >= 200 && res.status < 400;
    const fatal = hasFatalContent(text);
    const ok = statusOk && !fatal;

    return {
      name: target.name,
      url: target.url,
      ok,
      status: res.status,
      ms,
      error: ok ? undefined : fatal ? "Conteúdo com erro real detectado" : `HTTP ${res.status}`,
      checkedAt: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      name: target.name,
      url: target.url,
      ok: false,
      status: 0,
      ms: Date.now() - started,
      error: error?.name === "AbortError" ? "Timeout" : error?.message || "Erro desconhecido",
      checkedAt: new Date().toISOString()
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const force = req.nextUrl.searchParams.get("force") === "1";
  const targets = await readJson<Target[]>(TARGETS_FILE, []);
  const previous = await readJson<State>(STATE_FILE, { targets: {} });

  const results = await Promise.all(targets.map((target) => checkTarget(target)));
  const down = results.filter((item) => !item.ok);

  const health = targets.length
    ? Math.round(((targets.length - down.length) / targets.length) * 100)
    : 100;

  const messages: string[] = [];

  for (const item of results) {
    const old = previous.targets?.[item.name];

    if (old?.ok && !item.ok) {
      messages.push(`🚨 **Página saiu do ar:** ${item.name} — status ${item.status || item.error}`);
    }

    if (old && !old.ok && item.ok) {
      messages.push(`✅ **Página voltou:** ${item.name} — status ${item.status}`);
    }

    if (!old && !item.ok) {
      messages.push(`🚨 **Problema detectado:** ${item.name} — status ${item.status || item.error}`);
    }
  }

  const now = Date.now();
  const lastSummary = previous.lastSummaryAt ? Date.parse(previous.lastSummaryAt) : 0;
  const shouldSummary = force || !lastSummary || now - lastSummary >= 20 * 60 * 1000;

  if (shouldSummary) {
    const statusLine = down.length
      ? `Atenção: ${down.length} ponto(s) com problema.`
      : "Tudo saudável no monitoramento principal.";

    messages.unshift(
      `🩺 **Diagnóstico Sualuma**\nSaúde do sistema: **${health}%**\n${statusLine}`
    );
  }

  const nextState: State = {
    lastSummaryAt: shouldSummary ? new Date().toISOString() : previous.lastSummaryAt,
    targets: Object.fromEntries(
      results.map((item) => [
        item.name,
        { ok: item.ok, status: item.status, error: item.error }
      ])
    )
  };

  await writeJson(STATE_FILE, nextState);

  if (messages.length) {
    await sendDiscord({
      content: messages.join("\n").slice(0, 1900)
    });
  }

  return NextResponse.json({
    ok: true,
    health,
    total: targets.length,
    down: down.length,
    results
  });
}
