import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type BrainTaskStatus =
  | "needs_approval"
  | "approved"
  | "running"
  | "completed"
  | "failed"
  | "rejected";

export type BrainTaskLog = {
  at: string;
  type: string;
  message: string;
  output?: string;
};

export type BrainTask = {
  id: string;
  goal: string;
  status: BrainTaskStatus;
  createdAt: string;
  updatedAt: string;
  plan: string[];
  suggestedCommands: string[];
  logs: BrainTaskLog[];
};

type AllowedCommand = {
  id: string;
  title: string;
  description: string;
  cmd: string;
  args: string[];
  timeoutMs: number;
};

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, "data", "brain-executor-tasks.json");

export const ALLOWED_COMMANDS: Record<string, AllowedCommand> = {
  "git-status": {
    id: "git-status",
    title: "Ver status do Git",
    description: "Mostra arquivos modificados sem alterar nada.",
    cmd: "git",
    args: ["status", "--short"],
    timeoutMs: 20000,
  },
  "build": {
    id: "build",
    title: "Rodar build seguro",
    description: "Executa npm run build para validar se o projeto compila.",
    cmd: "npm",
    args: ["run", "build"],
    timeoutMs: 180000,
  },
  "pm2-status": {
    id: "pm2-status",
    title: "Ver status PM2",
    description: "Mostra processos PM2 sem reiniciar nada.",
    cmd: "pm2",
    args: ["status"],
    timeoutMs: 20000,
  },
  "test-brain-status": {
    id: "test-brain-status",
    title: "Testar status do cérebro",
    description: "Consulta /api/brain/status.",
    cmd: "bash",
    args: [
      "-lc",
      "curl -sS https://sualuma.online/api/brain/status | python3 -m json.tool | head -120",
    ],
    timeoutMs: 30000,
  },
  "test-chat-api": {
    id: "test-chat-api",
    title: "Testar API do chat",
    description: "Envia uma pergunta curta para a Mia.",
    cmd: "bash",
    args: [
      "-lc",
      "curl -sS -X POST https://sualuma.online/api/chat -H 'Content-Type: application/json' -d '{\"message\":\"Mia, responda em 2 linhas como você está funcionando.\"}' | python3 -m json.tool | head -120",
    ],
    timeoutMs: 60000,
  },
  "restart-luma-os": {
    id: "restart-luma-os",
    title: "Reiniciar Luma OS",
    description: "Reinicia o PM2 do luma-os com variáveis atualizadas. Use só quando necessário.",
    cmd: "bash",
    args: ["-lc", "pm2 restart luma-os --update-env && pm2 save"],
    timeoutMs: 60000,
  },
};

function now() {
  return new Date().toISOString();
}

function cut(text: string, max = 12000) {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n\n...[saída cortada para segurança]...";
}

export function publicAllowedCommands() {
  return Object.values(ALLOWED_COMMANDS).map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
  }));
}

export async function readTasks(): Promise<BrainTask[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveTasks(tasks: BrainTask[]) {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(tasks, null, 2), "utf8");
}

export function createControlledPlan(goal: string): BrainTask {
  const cleanGoal = String(goal || "").trim();

  const suggestedCommands = [
    "git-status",
    "test-brain-status",
    "test-chat-api",
    "build",
    "pm2-status",
  ];

  return {
    id: randomUUID(),
    goal: cleanGoal,
    status: "needs_approval",
    createdAt: now(),
    updatedAt: now(),
    suggestedCommands,
    logs: [
      {
        at: now(),
        type: "created",
        message: "Tarefa criada. A Mia ainda não executou nada.",
      },
    ],
    plan: [
      "Entender exatamente o objetivo pedido.",
      "Listar quais partes do Luma OS podem ser afetadas.",
      "Sugerir apenas comandos seguros e permitidos.",
      "Esperar aprovação humana antes de executar qualquer ação.",
      "Executar uma ação por vez, registrar saída e permitir rollback manual se necessário.",
    ],
  };
}

export async function addTask(goal: string) {
  const tasks = await readTasks();
  const task = createControlledPlan(goal);
  tasks.push(task);
  await saveTasks(tasks);
  return task;
}

export async function updateTask(task: BrainTask) {
  const tasks = await readTasks();
  const idx = tasks.findIndex((t) => t.id === task.id);

  task.updatedAt = now();

  if (idx >= 0) {
    tasks[idx] = task;
  } else {
    tasks.push(task);
  }

  await saveTasks(tasks);
  return task;
}

export async function findTask(id: string) {
  const tasks = await readTasks();
  return tasks.find((t) => t.id === id) || null;
}

export async function runAllowedCommand(commandId: string) {
  const spec = ALLOWED_COMMANDS[commandId];

  if (!spec) {
    throw new Error(`Comando não permitido: ${commandId}`);
  }

  return await new Promise<{
    commandId: string;
    title: string;
    exitCode: number | null;
    stdout: string;
    stderr: string;
    timedOut: boolean;
  }>((resolve) => {
    let finished = false;
    let stdout = "";
    let stderr = "";

    const child = spawn(spec.cmd, spec.args, {
      cwd: ROOT,
      env: process.env,
      shell: false,
    });

    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      child.kill("SIGTERM");
      resolve({
        commandId,
        title: spec.title,
        exitCode: null,
        stdout: cut(stdout),
        stderr: cut(stderr || "Tempo limite atingido. Processo encerrado."),
        timedOut: true,
      });
    }, spec.timeoutMs);

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve({
        commandId,
        title: spec.title,
        exitCode: 1,
        stdout: cut(stdout),
        stderr: cut(stderr + "\n" + err.message),
        timedOut: false,
      });
    });

    child.on("close", (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve({
        commandId,
        title: spec.title,
        exitCode: code,
        stdout: cut(stdout),
        stderr: cut(stderr),
        timedOut: false,
      });
    });
  });
}
