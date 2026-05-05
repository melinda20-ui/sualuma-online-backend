import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { sendDiscord } from "@/lib/sualuma-discord";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyObj = Record<string, any>;

const ROOT = process.cwd();
const CANVAS_FILE = path.join(ROOT, "data", "business-canvas", "canvas-empresa.json");
const TASKS_FILE = path.join(ROOT, "data", "agent-tasks", "tasks.json");
const DIAG_STATE_FILE = path.join(ROOT, "data", "system-diagnostics", "state.json");

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

function asArray(value: any): AnyObj[] {
  return Array.isArray(value) ? value : [];
}

function normalizeTaskStore(data: any) {
  const isDict = data && typeof data === "object" && !Array.isArray(data);
  const tasks = isDict ? asArray(data.tasks) : asArray(data);
  return { isDict, tasks };
}

function taskTitle(task: AnyObj) {
  return String(task.title || task.name || task.titulo || "").trim();
}

function slugText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function loadCanvas() {
  return readJson<AnyObj>(CANVAS_FILE, {
    name: "Canvas da Empresa Sualuma",
    productFunnel: [],
    funnelThinking: [],
    decisionRules: [],
    supervisors: []
  });
}

async function loadMetrics() {
  const taskData = await readJson<any>(TASKS_FILE, []);
  const { tasks } = normalizeTaskStore(taskData);
  const openTasks = tasks.filter((task) => {
    const status = String(task.status || task.state || task.stage || "").toLowerCase();
    return !["done", "feito", "concluido", "concluído", "closed", "finalizado"].includes(status);
  });

  const diag = await readJson<AnyObj>(DIAG_STATE_FILE, { targets: {} });
  const targets = Object.values(diag.targets || {}) as AnyObj[];
  const downTargets = targets.filter((item) => item?.ok === false).length;
  const health = targets.length ? Math.round(((targets.length - downTargets) / targets.length) * 100) : 100;

  return {
    totalTasks: tasks.length,
    openTasks: openTasks.length,
    health,
    downTargets,
    diagnosticsKnown: targets.length,
    updatedAt: new Date().toISOString()
  };
}

function buildSwot(canvas: AnyObj, metrics: AnyObj) {
  const products = asArray(canvas.productFunnel);
  const productCount = products.length;

  const strengths = [
    `Ecossistema com ${productCount || "vários"} pilares de produto: sites, IA, agentes, prestadores, templates e SOS Publicidade.`,
    "Oferta de site sob medida pode gerar caixa rápido antes da recorrência ficar perfeita.",
    "Mia pode ser o centro de acesso para agentes comprados, histórico, automações e experiência do usuário.",
    "Studio já tem painéis, tarefas, diagnóstico, lançamento e agentes internos em construção."
  ];

  const weaknesses = [
    "Muitas páginas e produtos podem confundir se cada funil não tiver uma promessa principal.",
    "Mobile precisa virar prioridade para lançamento porque muitos clientes acessarão pelo celular.",
    "Cérebro da Mia e Cérebro Azul ainda precisam de teste, conexão com painéis e explicações mais leigas.",
    "Google Analytics, eventos e métricas precisam deixar o sistema menos estático e mais orientado por dados."
  ];

  if (metrics.openTasks > 25) {
    weaknesses.push(`Há ${metrics.openTasks} tarefas abertas; isso exige priorização rígida para não travar o lançamento.`);
  }

  const opportunities = [
    "Vender sites personalizados como serviço de entrada e depois oferecer Mia, automações e manutenção.",
    "Usar o opt-in interativo para segmentar o cliente e recomendar a oferta certa sem parecer bagunçado.",
    "Transformar SOS Publicidade em vitrine de portfólio e braço comercial para serviços digitais.",
    "Criar upsell natural: site -> automações -> agentes -> plano recorrente -> comunidade/prestador."
  ];

  const threats = [
    "Misturar microSaaS, loja, prestação de serviço e templates na mesma explicação pode reduzir conversão.",
    "Discord pode rate-limitar se vários agentes enviarem alertas ao mesmo tempo.",
    "Rotas protegidas, checkout, auth, LGPD e entrega precisam estar claros antes de tráfego pago.",
    "Se a experiência mobile falhar, a percepção de valor cai antes do cliente entender a proposta."
  ];

  if (metrics.downTargets > 0) {
    threats.push(`Diagnóstico detectou ${metrics.downTargets} ponto(s) com problema; corrigir antes de campanha.`);
  }

  return { strengths, weaknesses, opportunities, threats };
}

function buildExecution(canvas: AnyObj) {
  return [
    {
      title: "Definir funil mestre dos produtos Sualuma",
      what: "Separar oferta de sites, microSaaS, loja de agentes, prestadores, FlowMind e SOS Publicidade.",
      why: "Evitar confusão e aumentar conversão.",
      who: "Agente Growth + Agente de Lançamento",
      where: "/studio/canvas-empresa",
      when: "Agora, antes do lançamento",
      how: "Usar uma promessa principal por página e criar CTA único por etapa.",
      howMuch: "Baixo custo; exige organização e revisão de copy.",
      priority: "alta",
      area: "estratégia"
    },
    {
      title: "Finalizar funil de venda de sites com opt-in interativo",
      what: "Conectar /site-service, /site-demo-request, /site-demo-success e /admin/leads.",
      why: "Gerar caixa rápido vendendo site personalizado.",
      who: "Agente de Lançamento + Agente UX",
      where: "Funil de sites",
      when: "Antes de abrir tráfego ou divulgação forte",
      how: "Testar como cliente, validar texto, briefing, confirmação e resposta comercial.",
      howMuch: "Baixo custo; pode gerar as primeiras vendas.",
      priority: "alta",
      area: "lançamento"
    },
    {
      title: "Otimizar sistema todo para mobile",
      what: "Revisar home, login, cadastro, planos, loja, chat, dashboards e páginas Studio no celular.",
      why: "Grande parte dos clientes acessa pelo celular.",
      who: "Agente UX + Agente User",
      where: "Todas as páginas principais",
      when: "Antes do lançamento público",
      how: "Corrigir tipografia, botões, cards, scroll, menus, formulários e posição da Mia.",
      howMuch: "Médio; alto impacto na conversão.",
      priority: "alta",
      area: "ux-mobile"
    },
    {
      title: "Transformar site em sistema funcional com Google Analytics",
      what: "Adicionar GA4, eventos de funil, cliques em CTA, início de briefing, envio de formulário e checkout.",
      why: "Tomar decisões por dados e não por achismo.",
      who: "Agente Growth + Agente de Tarefas",
      where: "Layout global e páginas principais",
      when: "Antes das campanhas",
      how: "Configurar tag, eventos e painel de leitura no Studio.",
      howMuch: "Baixo custo; exige conta GA4 e implementação.",
      priority: "alta",
      area: "analytics"
    },
    {
      title: "Conectar cérebro da Mia e Cérebro Azul aos painéis do Studio",
      what: "Fazer os cérebros lerem tarefas, diagnóstico, usuários, produtos, funil e erros.",
      why: "A Mia precisa ajudar na decisão real e não só responder texto solto.",
      who: "Mia + Cérebro Azul + Agente de Tarefas",
      where: "/studio, /studio/mia-brain, /studio/agentesadms",
      when: "Durante a preparação do lançamento",
      how: "Criar fontes de dados, rotas seguras e respostas com checklist de ação.",
      howMuch: "Médio/alto; essencial para inteligência operacional.",
      priority: "alta",
      area: "ia-orquestração"
    },
    {
      title: "Melhorar layout da loja de agentes com Claude",
      what: "Organizar agentes, pacotes, sob encomenda, benefícios, CTA e acesso pela Mia.",
      why: "A loja precisa parecer confiável e simples.",
      who: "Agente Growth + Claude + Agente UX",
      where: "/loja-agentes",
      when: "Após validar funil de sites",
      how: "Criar seções por tipo de agente, valor, uso e status de compra.",
      howMuch: "Médio; melhora ticket médio.",
      priority: "média",
      area: "loja"
    },
    {
      title: "Construir portfólio dentro do sospublicidade.online",
      what: "Criar vitrine de serviços, cases, pacotes, criativos e CTA para orçamento.",
      why: "Apoiar a venda de sites e serviços digitais.",
      who: "Agente UX + Agente Growth",
      where: "sospublicidade.online",
      when: "Depois do canvas e antes de divulgação externa forte",
      how: "Criar página de portfólio com serviços, provas, antes/depois e formulário.",
      howMuch: "Médio; pode virar canal comercial.",
      priority: "média",
      area: "sos-publicidade"
    },
    {
      title: "Adicionar sistema SOS Transfer em breve",
      what: "Criar página/painel em breve para transferência, entrega ou organização de materiais dos clientes.",
      why: "Preparar expansão futura sem confundir o lançamento principal.",
      who: "Agente de Lançamento + Agente de Tarefas",
      where: "sospublicidade.online/sos-transfer",
      when: "Após priorizar venda de sites",
      how: "Começar com página em breve, lista de espera e explicação simples.",
      howMuch: "Baixo inicialmente.",
      priority: "média",
      area: "sos-transfer"
    }
  ];
}

async function buildPayload() {
  const canvas = await loadCanvas();
  const metrics = await loadMetrics();
  const swot = buildSwot(canvas, metrics);
  const execution = buildExecution(canvas);

  return {
    canvas,
    metrics,
    swot,
    execution,
    supervisors: asArray(canvas.supervisors),
    updatedAt: new Date().toISOString()
  };
}

function executionToTask(step: AnyObj, index: number) {
  const now = new Date().toISOString();

  return {
    id: `canvas-${Date.now()}-${index}`,
    title: step.title,
    description: `${step.what}\n\nPor quê: ${step.why}\nComo: ${step.how}\nOnde: ${step.where}\nResponsável: ${step.who}\nCusto/Esforço: ${step.howMuch}`,
    status: "open",
    stage: "todo",
    priority: step.priority || "alta",
    area: step.area || "canvas",
    source: "canvas-empresa",
    ownerAgents: ["growth", "launch", "ux", "tasks"],
    createdAt: now,
    updatedAt: now,
    fiveW2H: step
  };
}

async function syncExecutionTasks(execution: AnyObj[]) {
  const data = await readJson<any>(TASKS_FILE, []);
  const store = normalizeTaskStore(data);
  const existing = new Set(store.tasks.map((task) => slugText(taskTitle(task))).filter(Boolean));

  const created: AnyObj[] = [];

  for (let i = 0; i < execution.length; i++) {
    const step = execution[i];
    const key = slugText(step.title);
    if (!key || existing.has(key)) continue;

    const task = executionToTask(step, i);
    store.tasks.push(task);
    existing.add(key);
    created.push(task);
  }

  const nextData = store.isDict ? { ...data, tasks: store.tasks } : store.tasks;
  await writeJson(TASKS_FILE, nextData);

  return { created, total: store.tasks.length };
}

export async function GET(req: NextRequest) {
  const notify = req.nextUrl.searchParams.get("notify") === "1";

  if (notify && !authorized(req)) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const payload = await buildPayload();

  if (notify) {
    const topSteps = payload.execution
      .slice(0, 5)
      .map((item: AnyObj, index: number) => `${index + 1}. ${item.title}`)
      .join("\n");

    await sendDiscord({
      content:
        `🧭 **Canvas da Empresa — Supervisão Growth + Lançamento**\n` +
        `Saúde: **${payload.metrics.health}%** | Tarefas abertas: **${payload.metrics.openTasks}**\n\n` +
        `**Prioridades 5W2H:**\n${topSteps}`.slice(0, 1900)
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, ...payload });
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action || req.nextUrl.searchParams.get("action") || "sync-tasks";

  if (action !== "sync-tasks") {
    return NextResponse.json({ ok: false, error: "Ação inválida." }, { status: 400 });
  }

  const payload = await buildPayload();
  const result = await syncExecutionTasks(payload.execution);

  let discord: any = null;

  if (body.notify !== false) {
    discord = await sendDiscord({
      content:
        `✅ **Canvas da Empresa sincronizado com o Agente de Tarefas**\n` +
        `Novas tarefas criadas: **${result.created.length}**\n` +
        `Total de tarefas: **${result.total}**\n` +
        `Supervisão: Growth + Lançamento + UX + Tarefas`
    }).catch((error: any) => ({ ok: false, error: error?.message || "Falha ao avisar Discord" }));
  }

  return NextResponse.json({
    ok: true,
    created: result.created.length,
    total: result.total,
    createdTasks: result.created.map((task) => ({ id: task.id, title: task.title })),
    discord
  });
}
