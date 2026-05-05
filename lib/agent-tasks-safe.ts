import { promises as fs } from "fs";
import path from "path";

const ROOT = process.cwd();
export const AGENT_TASKS_FILE = path.join(ROOT, "data", "agent-tasks", "tasks.json");
const BACKUP_DIR = path.join(ROOT, "_backups", "agent-tasks");

type AnyTask = Record<string, any>;

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeTasks(raw: any): AnyTask[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.tasks)) return raw.tasks;
  return [];
}

function keyOf(task: AnyTask): string {
  const value = String(task.id || task.title || "").trim().toLowerCase();
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function mergeTaskLists(...lists: AnyTask[][]): AnyTask[] {
  const map = new Map<string, AnyTask>();

  for (const list of lists) {
    for (const task of list) {
      const key = keyOf(task);
      if (!key) continue;

      const old = map.get(key);
      if (!old) {
        map.set(key, task);
        continue;
      }

      map.set(key, {
        ...old,
        ...task,
        createdAt: old.createdAt || task.createdAt,
        status: task.status || old.status || "open",
      });
    }
  }

  return Array.from(map.values());
}

async function readBestBackupTasks(): Promise<AnyTask[]> {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const candidates: { file: string; total: number; mtime: number; tasks: AnyTask[] }[] = [];

    for (const name of files) {
      if (!name.endsWith(".json.bak")) continue;

      const file = path.join(BACKUP_DIR, name);
      const raw = await readJson<any>(file, null);
      const tasks = normalizeTasks(raw);
      if (!tasks.length) continue;

      const stat = await fs.stat(file);
      candidates.push({
        file,
        total: tasks.length,
        mtime: stat.mtimeMs,
        tasks,
      });
    }

    candidates.sort((a, b) => b.total - a.total || b.mtime - a.mtime);
    return candidates[0]?.tasks || [];
  } catch {
    return [];
  }
}

async function backupCurrentTasks(reason: string) {
  try {
    const raw = await fs.readFile(AGENT_TASKS_FILE, "utf8");
    if (!raw.trim()) return;

    await fs.mkdir(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const file = path.join(BACKUP_DIR, `tasks-autobackup-${reason}-${stamp}.json.bak`);
    await fs.writeFile(file, raw, "utf8");
  } catch {
    // Não quebra o fluxo se o backup falhar.
  }
}

export async function safeUpsertAgentTask(input: AnyTask) {
  const now = new Date().toISOString();

  await fs.mkdir(path.dirname(AGENT_TASKS_FILE), { recursive: true });

  const raw = await readJson<any>(AGENT_TASKS_FILE, []);
  const currentTasks = normalizeTasks(raw);

  // Proteção anti-apagão:
  // se o arquivo atual aparecer pequeno demais, recupera a base do maior backup recente.
  const backupTasks = currentTasks.length < 10 ? await readBestBackupTasks() : [];
  const baseTasks = mergeTaskLists(backupTasks, currentTasks);

  const id = String(input.id || input.title || `task-${Date.now()}`);
  const title = String(input.title || id);
  const targetKey = keyOf({ id, title });

  let found = false;

  const nextTasks = baseTasks.map((task) => {
    if (keyOf(task) !== targetKey) return task;

    found = true;

    return {
      ...task,
      ...input,
      id: task.id || id,
      title,
      createdAt: task.createdAt || input.createdAt || now,
      updatedAt: now,
      status: task.status || input.status || "open",
    };
  });

  if (!found) {
    nextTasks.unshift({
      ...input,
      id,
      title,
      status: input.status || "open",
      createdAt: input.createdAt || now,
      updatedAt: now,
    });
  }

  await backupCurrentTasks("safe-upsert");
  await fs.writeFile(AGENT_TASKS_FILE, JSON.stringify(nextTasks, null, 2), "utf8");

  return {
    ok: true,
    total: nextTasks.length,
    restoredFromBackup: backupTasks.length > 0,
  };
}
