import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync, statSync } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ROOT = process.cwd();
const REPORT = path.join(ROOT, "reports/copilot/launch-auditor.json");

function readReport() {
  if (!existsSync(REPORT)) return null;
  return JSON.parse(readFileSync(REPORT, "utf8"));
}

function writeReport(data: any) {
  writeFileSync(REPORT, JSON.stringify(data, null, 2));
}

function runAuditor() {
  const childProcess = eval("require")("child_process");
  childProcess.execSync("node tools/sualuma-launch-auditor.js", {
    cwd: ROOT,
    stdio: "ignore",
    timeout: 120000,
  });
}

function shouldRefresh() {
  if (!existsSync(REPORT)) return true;
  const ageMs = Date.now() - statSync(REPORT).mtimeMs;
  return ageMs > 5 * 60 * 1000;
}

export async function GET() {
  try {
    if (shouldRefresh()) runAuditor();

    const data = readReport();

    return NextResponse.json(
      data || {
        ok: false,
        error: "Relatório ainda não foi gerado.",
        tasks: [],
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao carregar copiloto.",
        tasks: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const id = body.id;
    const allowed = ["todo", "doing", "ready", "validated"];

    if (action === "refresh") {
      runAuditor();
      return NextResponse.json(readReport());
    }

    const data = readReport() || { tasks: [] };

    if (action === "move") {
      const status = body.status;

      if (!id || !allowed.includes(status)) {
        return NextResponse.json({ ok: false, error: "Status inválido." }, { status: 400 });
      }

      data.tasks = (data.tasks || []).map((task: any) =>
        task.id === id
          ? {
              ...task,
              status,
              updated_at: new Date().toISOString(),
              verification_message:
                status === "ready"
                  ? "Você marcou como finalizado. Agora clique em verificar para eu testar de verdade."
                  : task.verification_message || "",
            }
          : task
      );

      writeReport(data);
      return NextResponse.json(data);
    }

    if (action === "verify") {
      if (!id) {
        return NextResponse.json({ ok: false, error: "ID da tarefa ausente." }, { status: 400 });
      }

      runAuditor();

      const fresh = readReport() || { tasks: [] };

      fresh.tasks = (fresh.tasks || []).map((task: any) => {
        if (task.id !== id) return task;

        if (task.resolved) {
          return {
            ...task,
            status: "validated",
            updated_at: new Date().toISOString(),
            verification_message:
              "✅ Verifiquei de novo e não encontrei mais esse problema. Pode considerar concluído e validado.",
          };
        }

        return {
          ...task,
          status: "doing",
          updated_at: new Date().toISOString(),
          verification_message:
            "❌ Verifiquei de novo e o problema ainda aparece. Voltei a tarefa para Em andamento.",
        };
      });

      writeReport(fresh);
      return NextResponse.json(fresh);
    }

    return NextResponse.json({ ok: false, error: "Ação inválida." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao executar ação.",
      },
      { status: 500 }
    );
  }
}
