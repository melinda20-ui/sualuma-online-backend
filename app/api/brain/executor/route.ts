import { NextRequest, NextResponse } from "next/server";
import {
  addTask,
  findTask,
  publicAllowedCommands,
  readTasks,
  runAllowedCommand,
  updateTask,
} from "@/lib/brain/executor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Executor protegido. Envie x-brain-key com a BRAIN_EXECUTOR_KEY do servidor.",
    },
    { status: 401 }
  );
}

function isAuthorized(req: NextRequest) {
  const expected = process.env.BRAIN_EXECUTOR_KEY;
  const received =
    req.headers.get("x-brain-key") ||
    new URL(req.url).searchParams.get("key") ||
    "";

  return Boolean(expected && received && expected === received);
}

async function readBody(req: NextRequest) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();

  const tasks = await readTasks();

  return NextResponse.json({
    ok: true,
    mode: "controlled-executor",
    message:
      "Mia Executor ativo. Ele cria plano, espera aprovação e só executa comandos permitidos.",
    allowedCommands: publicAllowedCommands(),
    count: tasks.length,
    tasks: tasks.slice(-20).reverse(),
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();

  const body = await readBody(req);
  const action = String(body.action || "create");

  if (action === "create") {
    const goal = String(body.goal || "").trim();

    if (!goal) {
      return NextResponse.json(
        { ok: false, error: "Envie goal para criar a tarefa." },
        { status: 400 }
      );
    }

    const task = await addTask(goal);

    return NextResponse.json({
      ok: true,
      message:
        "Tarefa criada. Nada foi executado ainda. Aprove antes de rodar comandos.",
      task,
    });
  }

  const id = String(body.id || "").trim();

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Envie id da tarefa." },
      { status: 400 }
    );
  }

  const task = await findTask(id);

  if (!task) {
    return NextResponse.json(
      { ok: false, error: "Tarefa não encontrada." },
      { status: 404 }
    );
  }

  if (action === "approve") {
    if (task.status === "rejected" || task.status === "completed") {
      return NextResponse.json(
        { ok: false, error: `Tarefa já está como ${task.status}.`, task },
        { status: 409 }
      );
    }

    task.status = "approved";
    task.logs.push({
      at: new Date().toISOString(),
      type: "approved",
      message: "Execução aprovada por chave protegida.",
    });

    await updateTask(task);

    return NextResponse.json({
      ok: true,
      message: "Tarefa aprovada. Agora você pode rodar um comando permitido.",
      task,
    });
  }

  if (action === "reject") {
    task.status = "rejected";
    task.logs.push({
      at: new Date().toISOString(),
      type: "rejected",
      message: "Tarefa rejeitada.",
    });

    await updateTask(task);

    return NextResponse.json({
      ok: true,
      message: "Tarefa rejeitada.",
      task,
    });
  }

  if (action === "complete") {
    task.status = "completed";
    task.logs.push({
      at: new Date().toISOString(),
      type: "completed",
      message: "Tarefa marcada como concluída.",
    });

    await updateTask(task);

    return NextResponse.json({
      ok: true,
      message: "Tarefa concluída.",
      task,
    });
  }

  if (action === "run") {
    if (task.status !== "approved" && task.status !== "failed") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "A tarefa precisa estar aprovada antes de executar comandos.",
          task,
        },
        { status: 409 }
      );
    }

    const commandId = String(body.commandId || "").trim();

    if (!commandId) {
      return NextResponse.json(
        { ok: false, error: "Envie commandId." },
        { status: 400 }
      );
    }

    if (!task.suggestedCommands.includes(commandId)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Esse comando não está na lista sugerida para esta tarefa.",
          suggestedCommands: task.suggestedCommands,
        },
        { status: 403 }
      );
    }

    task.status = "running";
    task.logs.push({
      at: new Date().toISOString(),
      type: "command_started",
      message: `Rodando comando permitido: ${commandId}`,
    });

    await updateTask(task);

    const result = await runAllowedCommand(commandId);

    task.status = result.exitCode === 0 ? "approved" : "failed";
    task.logs.push({
      at: new Date().toISOString(),
      type: "command_finished",
      message: `Comando finalizado: ${commandId}. Exit code: ${result.exitCode}`,
      output:
        `STDOUT:\n${result.stdout || "(vazio)"}\n\nSTDERR:\n${
          result.stderr || "(vazio)"
        }`,
    });

    await updateTask(task);

    return NextResponse.json({
      ok: result.exitCode === 0,
      message:
        result.exitCode === 0
          ? "Comando executado com sucesso."
          : "Comando executado, mas retornou erro.",
      result,
      task,
    });
  }

  return NextResponse.json(
    { ok: false, error: `Ação inválida: ${action}` },
    { status: 400 }
  );
}
