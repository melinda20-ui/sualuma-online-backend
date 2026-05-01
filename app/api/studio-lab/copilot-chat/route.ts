import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyObj = Record<string, any>;

function readJsonSafe(filePath: string): AnyObj | null {
  try {
    if (!existsSync(filePath)) return null;
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function loadAudit() {
  const files = [
    path.join(process.cwd(), "reports/copilot/launch-auditor.json"),
    "/root/luma-os/reports/copilot/launch-auditor.json",
    path.join(process.cwd(), "reports/copilot/latest.json"),
    "/root/luma-os/reports/copilot/latest.json",
  ];

  for (const file of files) {
    const json = readJsonSafe(file);
    if (json) return { file, json };
  }

  return {
    file: null,
    json: {
      ok: false,
      score: "--",
      summary: "Ainda não encontrei relatório do Copiloto.",
      counts: { total: 0, open: 0, high: 0, medium: 0, low: 0, validated: 0 },
      tasks: [],
    },
  };
}

function cleanText(value: any) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function taskToText(task: AnyObj, index: number) {
  const title = task.title || task.name || `Tarefa ${index + 1}`;
  const area = task.area || task.category || "Sistema";
  const severity = task.severity || task.priority || "média";
  const status = task.status || "pendente";
  const explanation = task.plain_explanation || task.plainExplanation || task.explanation || task.detail || task.description || "";
  const evidence = task.evidence || task.proof || task.source || "";
  const action = task.what_to_do || task.whatToDo || task.action || task.solution || task.next_step || "";
  const verify = task.how_to_verify || task.howToVerify || task.verify || "";

  return [
    `${index + 1}. ${title}`,
    `Área: ${area}`,
    `Gravidade: ${severity}`,
    `Status: ${status}`,
    explanation ? `Explicação leiga: ${cleanText(explanation)}` : "",
    evidence ? `Prova encontrada: ${cleanText(evidence)}` : "",
    action ? `O que fazer: ${cleanText(action)}` : "",
    verify ? `Como verificar: ${cleanText(verify)}` : "",
  ].filter(Boolean).join("\n");
}

function filterTasks(message: string, tasks: AnyObj[]) {
  const m = message.toLowerCase();

  const keywordGroups: Record<string, string[]> = {
    usuarios: ["usuário", "usuarios", "usuários", "user", "login", "cadastro", "email", "e-mail", "confirmação", "confirmar"],
    banco: ["banco", "supabase", "postgres", "database", "db"],
    cliente: ["cliente", "dashboard cliente", "dashboard do cliente", "member", "portal"],
    studio: ["studio", "estúdio", "estudio", "painel", "dashboard", "visão"],
    seguranca: ["segurança", "seguranca", "ufw", "firewall", "nginx", "apache", "ssl"],
    pagamento: ["stripe", "pagamento", "checkout", "plano", "assinatura"],
    git: ["git", "commit", "alterações", "alteracoes", "pendente"],
    build: ["build", "next", "deploy", "produção", "producao"],
  };

  let selectedKeywords: string[] = [];

  for (const words of Object.values(keywordGroups)) {
    if (words.some((w) => m.includes(w))) {
      selectedKeywords = selectedKeywords.concat(words);
    }
  }

  if (selectedKeywords.length === 0) return tasks;

  return tasks.filter((task) => {
    const blob = JSON.stringify(task).toLowerCase();
    return selectedKeywords.some((word) => blob.includes(word));
  });
}

function fallbackAnswer(message: string, audit: AnyObj) {
  const tasks = Array.isArray(audit.tasks) ? audit.tasks : [];
  const filtered = filterTasks(message, tasks);
  const relevant = filtered.length > 0 ? filtered : tasks;

  const m = message.toLowerCase();
  const score = audit.score ?? "--";
  const counts = audit.counts || {};
  const summary = audit.summary || "Sistema analisado pelo Copiloto.";

  if (m.includes("resumo") || m.includes("lançar") || m.includes("lancar") || m.includes("prioridade")) {
    const top = tasks.slice(0, 5).map(taskToText).join("\n\n");
    return `Resumo leigo do Copiloto:\n\nO sistema está com score ${score}/100.\n${summary}\n\nTarefas abertas: ${counts.open ?? tasks.length}\nTarefas graves: ${counts.high ?? 0}\nTarefas médias: ${counts.medium ?? 0}\n\nO que eu olharia primeiro:\n\n${top || "Nenhuma tarefa encontrada no relatório atual."}`;
  }

  if (relevant.length > 0) {
    return `Encontrei estes pontos relacionados ao que você perguntou:\n\n${relevant.slice(0, 6).map(taskToText).join("\n\n")}\n\nMinha leitura leiga: isso ainda precisa ser revisado antes do lançamento. Depois que você corrigir, marque a tarefa para verificar no Kanban.`;
  }

  return `Eu li o relatório atual, mas não encontrei uma tarefa específica sobre isso.\n\nScore atual: ${score}/100.\nResumo: ${summary}\n\nMe pergunte, por exemplo:\n- o que falta para lançar?\n- explica a parte de usuários\n- o que está errado no Supabase?\n- qual prioridade de hoje?`;
}

async function askOllama(message: string, audit: AnyObj) {
  const tasks = Array.isArray(audit.tasks) ? audit.tasks.slice(0, 12) : [];
  const context = {
    score: audit.score,
    summary: audit.summary,
    counts: audit.counts,
    tasks,
  };

  const prompt = `
Você é o Copiloto de Lançamento da Sualuma.
Responda em português do Brasil, de forma leiga, direta e útil.
A dona do sistema quer saber exatamente o que está acontecendo, por que importa e o que fazer.
Não invente dados. Use somente o relatório abaixo.

RELATÓRIO:
${JSON.stringify(context, null, 2)}

PERGUNTA DA LUMA:
${message}

FORMATO:
1. Resposta direta
2. Explicação leiga
3. O que fazer agora
4. Como verificar se resolveu
`.trim();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);

  try {
    const res = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.COPILOT_CHAT_MODEL || "llama3.2:3b",
        prompt,
        stream: false,
        options: { temperature: 0.2 },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) return null;

    const json = await res.json();
    const answer = json?.response;

    if (!answer || typeof answer !== "string") return null;
    return answer.trim();
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = String(body.message || "").trim();

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "Mensagem vazia." },
        { status: 400 }
      );
    }

    const { file, json: audit } = loadAudit();

    const ollamaAnswer = await askOllama(message, audit);
    const answer = ollamaAnswer || fallbackAnswer(message, audit);

    return NextResponse.json({
      ok: true,
      source: ollamaAnswer ? "ollama-local" : "copilot-rules",
      report_file: file,
      answer,
      score: audit.score ?? null,
      counts: audit.counts ?? null,
      generated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro no chat do Copiloto.",
      },
      { status: 500 }
    );
  }
}
