import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { sendDiscord } from "@/lib/sualuma-discord";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOARD_FILE = path.join(process.cwd(), "data", "onboarding-board", "board.json");
const TASKS_FILE = path.join(process.cwd(), "data", "agent-tasks", "tasks.json");

type AnyObj = Record<string, any>;

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
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
}

function taskSeeds() {
  const now = new Date().toISOString();

  return [
    {
      title: "Criar página inicial do jogo de opt-in Jornada Sualuma",
      area: "onboarding-optin",
      owner: "Skill de Programação + Agente UX",
      priority: "alta",
      status: "open",
      source: "onboarding-board",
      dueHint: "amanhã",
      description: "Criar a página pública /jornada-sualuma com escolha de caminhos, robô animado, gatilhos mentais e resultado por cor empreendedora.",
      checklist: [
        "Tela inicial com pergunta: Qual caminho vamos seguir hoje?",
        "Cinco caminhos principais",
        "Resultado por cor",
        "Botão de próximo passo por oferta",
        "Experiência boa no celular"
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      title: "Agente Growth gerar ideias para cada cor do opt-in",
      area: "growth",
      owner: "Agente de Growth",
      priority: "alta",
      status: "open",
      source: "onboarding-board",
      dueHint: "durante a madrugada",
      description: "Gerar ideias de copy, ofertas, gatilhos mentais e próximos passos para Dourado, Azul, Roxo, Verde e Laranja.",
      checklist: [
        "Criar promessa por cor",
        "Criar oferta principal por cor",
        "Criar CTA por cor",
        "Evitar confusão entre produtos"
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      title: "Agente UX revisar primeira experiência do usuário",
      area: "ux",
      owner: "Agente de UX",
      priority: "alta",
      status: "open",
      source: "onboarding-board",
      dueHint: "durante a madrugada",
      description: "Revisar clareza, emoção, mobile, microcopy, animações e reduzir fricção na primeira experiência.",
      checklist: [
        "Primeira tela entendível em 5 segundos",
        "Botões grandes no mobile",
        "Robô guia animado",
        "Resultado claro e visual",
        "Sem excesso de produtos na mesma tela"
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      title: "Criar One Board interativo do usuário",
      area: "produto",
      owner: "Programação + UX",
      priority: "alta",
      status: "open",
      source: "onboarding-board",
      dueHint: "amanhã",
      description: "Criar o board que mostra tudo que o usuário mexeu: caminho escolhido, cor, progresso, oferta recomendada e próximos passos.",
      checklist: [
        "Histórico da jornada",
        "Cor descoberta",
        "Próximas ações",
        "Oferta recomendada",
        "Animações leves de robô"
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      title: "Montar página de aprovação dos onboardings no Studio",
      area: "studio",
      owner: "Skill de Programação",
      priority: "alta",
      status: "open",
      source: "onboarding-board",
      dueHint: "amanhã",
      description: "Montar /studio/onboarding-board com várias pastas: página inicial, onboarding por cor, oferta, analytics, CRM e tarefas.",
      checklist: [
        "Pasta Página inicial",
        "Pasta Onboarding por cor",
        "Pasta Oferta recomendada",
        "Pasta Analytics e CRM",
        "Pasta Tarefas para aprovação"
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      title: "Conectar Jornada Sualuma ao Google Analytics e CRM",
      area: "analytics-crm",
      owner: "Growth + Programação",
      priority: "alta",
      status: "open",
      source: "onboarding-board",
      dueHint: "amanhã",
      description: "Registrar eventos da jornada, salvar leads, cor, dor principal, oferta recomendada e origem do opt-in.",
      checklist: [
        "Evento: início do jogo",
        "Evento: caminho escolhido",
        "Evento: resultado exibido",
        "Salvar lead no CRM",
        "Enviar tarefas quando aparecer gargalo"
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      title: "Definir funil de produto por resultado do opt-in",
      area: "funil",
      owner: "Growth + Lançamento",
      priority: "alta",
      status: "open",
      source: "onboarding-board",
      dueHint: "amanhã",
      description: "Garantir que cada resultado leve para uma oferta coerente: site, IA, FlowMind, cursos, prestadores ou SOS Publicidade.",
      checklist: [
        "Dourado leva para site/funil/microSaaS",
        "Azul leva para IA/agentes",
        "Roxo leva para FlowMind/organização",
        "Verde leva para cursos/templates",
        "Laranja leva para prestadores/time sob demanda"
      ],
      createdAt: now,
      updatedAt: now
    }
  ];
}

async function syncTasks() {
  const raw = await readJson<any>(TASKS_FILE, []);
  const isDict = raw && typeof raw === "object" && !Array.isArray(raw);
  const tasks: AnyObj[] = isDict ? (Array.isArray(raw.tasks) ? raw.tasks : []) : (Array.isArray(raw) ? raw : []);

  const existing = new Set(tasks.map((t) => normalize(String(t.title || t.name || ""))));
  const created: AnyObj[] = [];

  for (const seed of taskSeeds()) {
    const key = normalize(seed.title);
    if (existing.has(key)) continue;

    const task = {
      id: `onboarding-${Date.now()}-${created.length}`,
      ...seed
    };

    tasks.push(task);
    created.push(task);
    existing.add(key);
  }

  const output = isDict ? { ...raw, tasks } : tasks;
  await writeJson(TASKS_FILE, output);

  return { created, total: tasks.length };
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const board = await readJson<AnyObj>(BOARD_FILE, {});
  const sync = req.nextUrl.searchParams.get("sync") === "1";
  const notify = req.nextUrl.searchParams.get("notify") === "1";
  let taskSync = { created: [] as AnyObj[], total: 0 };

  if (sync) {
    taskSync = await syncTasks();
  }

  const updatedBoard = {
    ...board,
    lastSupervisorRunAt: new Date().toISOString(),
    taskSync: {
      created: taskSync.created.length,
      total: taskSync.total
    }
  };

  await writeJson(BOARD_FILE, updatedBoard);

  let discord: AnyObj | null = null;

  if (notify) {
    const msg = [
      "🧭 **Squad de Onboarding Sualuma**",
      `Página pública: **${board.publicPage || "/jornada-sualuma"}**`,
      `Board de aprovação: **${board.studioPage || "/studio/onboarding-board"}**`,
      `Tarefas novas criadas: **${taskSync.created.length}**`,
      "",
      "**Foco para amanhã:** aprovar a experiência inicial, escolher o funil por cor e conectar Analytics/CRM."
    ].join("\n");

    try {
      discord = await sendDiscord({ content: msg.slice(0, 1900) });
    } catch (error: any) {
      discord = { ok: false, error: error?.message || "Erro ao avisar Discord" };
    }
  }

  return NextResponse.json({
    ok: true,
    board: updatedBoard,
    taskSync,
    discord
  });
}
