import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CampaignState = {
  active: boolean;
  offerName: string;
  targetSegment: string;
  target: number;
  lastRunAt?: string;
  lastMessage: string;
};

type QueuedMessage = {
  id: string;
  contactId: string;
  email: string;
  name: string;
  subject: string;
  body: string;
  phase: "vendas-inicial" | "manutencao" | "cheque-mate";
  scheduledAt: string;
  status: "scheduled" | "ready" | "sent" | "error";
  sentAt?: string;
  error?: string;
};

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data", "campaign-agent");
const STATE_FILE = path.join(DATA_DIR, "state.json");
const QUEUE_FILE = path.join(DATA_DIR, "queue.json");
const LOG_FILE = path.join(DATA_DIR, "logs.json");
const FUNIS_FILE = path.join(ROOT, "data", "funis.json");

const defaultState: CampaignState = {
  active: false,
  offerName: "Sualuma Online",
  targetSegment: "microempreendedores, prestadores e pequenos negócios",
  target: 1000,
  lastMessage: "Agente de campanha pronto. Aguardando início.",
};

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown) {
  await ensureDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

type AdminFunilStep = {
  delayDays: number;
  subject: string;
  html: string;
};

type AdminFunil = {
  id: string;
  name: string;
  status: "rascunho" | "ativo";
  steps: AdminFunilStep[];
  createdAt: string;
  updatedAt: string;
  source?: string;
};

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function textToHtml(body: string) {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`)
    .join("\n");
}

function getAdminDraftSteps(): AdminFunilStep[] {
  const name = "{{nome}}";

  const templates = [
    [0, "Você já viu como o Sualuma pode simplificar seu negócio?", `Oi ${name},

Vi que você teve contato com a proposta do Sualuma Online.

A ideia é simples: ajudar pequenos negócios a vender melhor, organizar atendimento, criar presença online e economizar tempo usando automações e IA.

Nos próximos dias vou te mostrar como isso pode funcionar na prática.

Abraços,
Equipe Sualuma`],
    [0, "O maior erro dos pequenos negócios no digital", `Oi ${name},

Muitos negócios perdem clientes não por falta de qualidade, mas por falta de processo: atendimento perdido, catálogo bagunçado, site desatualizado e falta de follow-up.

O Sualuma nasceu para atacar exatamente esse problema.

Se fizer sentido, responda este e-mail com: QUERO ENTENDER.

Equipe Sualuma`],
    [1, "Como transformar atendimento em venda", `Oi ${name},

Um cliente que pergunta preço hoje pode comprar amanhã, mas só se o atendimento não morrer no caminho.

Com agentes, automações e páginas certas, o negócio deixa de depender só da memória do empreendedor.

Esse é o tipo de estrutura que queremos entregar com o Sualuma.

Equipe Sualuma`],
    [1, "Seu negócio precisa parecer maior do que é", `Oi ${name},

Pequenos negócios podem competir melhor quando parecem organizados: página clara, respostas rápidas, proposta bem apresentada e acompanhamento.

O Sualuma ajuda nisso sem exigir uma equipe grande.

Equipe Sualuma`],
    [2, "3 coisas que o Sualuma pode tirar das suas costas", `Oi ${name},

O Sualuma pode ajudar com:
1. Organização do atendimento.
2. Presença digital mais profissional.
3. Automação de tarefas repetitivas.

A meta é simples: você vender mais sem enlouquecer.

Equipe Sualuma`],
    [2, "Você não precisa fazer tudo manualmente", `Oi ${name},

Responder, lembrar, postar, organizar, cobrar, acompanhar cliente... tudo isso consome energia.

A proposta do Sualuma é colocar tecnologia para trabalhar a favor do pequeno negócio.

Equipe Sualuma`],
    [3, "Último dia da sequência inicial", `Oi ${name},

Essa é a reta final da nossa sequência inicial.

Se você quer organizar seu negócio com IA, automação e uma estrutura mais profissional, agora é um bom momento para conhecer o Sualuma.

Equipe Sualuma`],
    [3, "Quer que a gente te mostre o melhor caminho?", `Oi ${name},

Se você ainda está em dúvida, responda este e-mail contando qual é o seu tipo de negócio.

A gente pode te orientar sobre qual estrutura faz mais sentido para começar.

Equipe Sualuma`],
    [5, "Conteúdo: como organizar seu funil simples", `Oi ${name},

Um funil simples tem: atração, conversa, proposta, acompanhamento e fechamento.

A maioria dos pequenos negócios perde dinheiro no acompanhamento.

Equipe Sualuma`],
    [7, "Conteúdo + oferta: automação sem complicar", `Oi ${name},

Automação não precisa ser coisa de empresa grande.

Começa com pequenas tarefas: salvar lead, lembrar retorno, responder dúvidas comuns e organizar pedidos.

O Sualuma quer facilitar isso.

Equipe Sualuma`],
    [10, "Conteúdo: presença digital que passa confiança", `Oi ${name},

Uma página simples, clara e bem escrita já muda a percepção do cliente.

Confiança vende.

Equipe Sualuma`],
    [12, "Conteúdo + oferta: o próximo passo", `Oi ${name},

Se você quer tirar seu negócio do improviso, o próximo passo é criar uma estrutura mínima: página, atendimento e rotina de follow-up.

É nisso que o Sualuma pode ajudar.

Equipe Sualuma`],
    [14, "Oferta especial para começar com o Sualuma", `Oi ${name},

Essa é nossa mensagem de cheque-mate.

Se você quer começar agora, podemos preparar uma condição especial de entrada para estruturar seu negócio com o Sualuma.

Responda este e-mail com: COMEÇAR.

Equipe Sualuma`],
  ] as const;

  return templates.map(([delayDays, subject, body]) => ({
    delayDays,
    subject,
    html: textToHtml(body),
  }));
}

async function syncCampaignDraftToAdminEmails(state: CampaignState) {
  const now = new Date().toISOString();
  const funis = await readJson<AdminFunil[]>(FUNIS_FILE, []);
  const safeFunis = Array.isArray(funis) ? funis : [];

  const id = "campaign-agent-sualuma-online";
  const existing = safeFunis.find((funil) => funil.id === id);

  const draft: AdminFunil = {
    id,
    name: `Agente de Campanha - ${state.offerName || "Sualuma Online"}`,
    status: existing?.status === "ativo" ? "ativo" : "rascunho",
    steps: getAdminDraftSteps(),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    source: "campaign-agent",
  };

  const next = [draft, ...safeFunis.filter((funil) => funil.id !== id)];

  await fs.mkdir(path.dirname(FUNIS_FILE), { recursive: true });
  await fs.writeFile(FUNIS_FILE, JSON.stringify(next, null, 2), "utf8");

  return {
    id: draft.id,
    name: draft.name,
    steps: draft.steps.length,
    status: draft.status,
  };
}

function makeId(input: string) {
  return Buffer.from(input.toLowerCase()).toString("base64url").slice(0, 32);
}

function getLeadEmail(lead: any) {
  return String(lead.email || lead.emailAddress || lead.mail || "").trim().toLowerCase();
}

function getLeadName(lead: any) {
  return String(lead.name || lead.nome || lead.company || lead.empresa || lead.businessName || "empreendedor(a)").trim();
}

function hasMarketingConsent(lead: any) {
  const consentFields = [
    lead.marketingConsent,
    lead.emailOptIn,
    lead.optIn,
    lead.opt_in,
    lead.consent,
    lead.lgpdConsent,
    lead.newsletter,
    lead.acceptedMarketing,
    lead.campaignOptIn,
  ];

  return consentFields.some((v) => v === true || String(v).toLowerCase() === "true" || String(v).toLowerCase() === "sim");
}

function isOptedOut(lead: any) {
  const outFields = [lead.optOut, lead.opt_out, lead.unsubscribed, lead.descadastrado, lead.doNotContact];
  return outFields.some((v) => v === true || String(v).toLowerCase() === "true" || String(v).toLowerCase() === "sim");
}

async function loadLeads() {
  const files = [
    path.join(ROOT, "data", "leads.json"),
    path.join(ROOT, "data", "leads-prospector", "leads.json"),
  ];

  const all: any[] = [];

  for (const file of files) {
    const raw = await readJson<any>(file, null);
    if (!raw) continue;

    if (Array.isArray(raw)) all.push(...raw);
    else if (Array.isArray(raw.leads)) all.push(...raw.leads);
    else if (Array.isArray(raw.items)) all.push(...raw.items);
    else if (Array.isArray(raw.data)) all.push(...raw.data);
  }

  const seen = new Set<string>();
  return all.filter((lead) => {
    const email = getLeadEmail(lead);
    if (!email || seen.has(email)) return false;
    seen.add(email);
    return true;
  });
}

function nextDateFromNow(days: number, hourBrazil: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hourBrazil + 3, 0, 0, 0);
  if (d.getTime() < Date.now()) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

function buildMessages(lead: any, state: CampaignState): QueuedMessage[] {
  const email = getLeadEmail(lead);
  const name = getLeadName(lead);
  const contactId = makeId(email);

  const templates = [
    ["vendas-inicial", 0, 7, "Você já viu como o Sualuma pode simplificar seu negócio?", `Oi ${name},\n\nVi que você teve contato com a proposta do Sualuma Online.\n\nA ideia é simples: ajudar pequenos negócios a vender melhor, organizar atendimento, criar presença online e economizar tempo usando automações e IA.\n\nNos próximos dias vou te mostrar como isso pode funcionar na prática.\n\nAbraços,\nEquipe Sualuma`],
    ["vendas-inicial", 0, 19, "O maior erro dos pequenos negócios no digital", `Oi ${name},\n\nMuitos negócios perdem clientes não por falta de qualidade, mas por falta de processo: atendimento perdido, catálogo bagunçado, site desatualizado e falta de follow-up.\n\nO Sualuma nasceu para atacar exatamente esse problema.\n\nSe fizer sentido, responda este e-mail com: QUERO ENTENDER.\n\nEquipe Sualuma`],
    ["vendas-inicial", 1, 7, "Como transformar atendimento em venda", `Oi ${name},\n\nUm cliente que pergunta preço hoje pode comprar amanhã, mas só se o atendimento não morrer no caminho.\n\nCom agentes, automações e páginas certas, o negócio deixa de depender só da memória do empreendedor.\n\nEsse é o tipo de estrutura que queremos entregar com o Sualuma.\n\nEquipe Sualuma`],
    ["vendas-inicial", 1, 19, "Seu negócio precisa parecer maior do que é", `Oi ${name},\n\nPequenos negócios podem competir melhor quando parecem organizados: página clara, respostas rápidas, proposta bem apresentada e acompanhamento.\n\nO Sualuma ajuda nisso sem exigir uma equipe grande.\n\nEquipe Sualuma`],
    ["vendas-inicial", 2, 7, "3 coisas que o Sualuma pode tirar das suas costas", `Oi ${name},\n\nO Sualuma pode ajudar com:\n1. Organização do atendimento.\n2. Presença digital mais profissional.\n3. Automação de tarefas repetitivas.\n\nA meta é simples: você vender mais sem enlouquecer.\n\nEquipe Sualuma`],
    ["vendas-inicial", 2, 19, "Você não precisa fazer tudo manualmente", `Oi ${name},\n\nResponder, lembrar, postar, organizar, cobrar, acompanhar cliente... tudo isso consome energia.\n\nA proposta do Sualuma é colocar tecnologia para trabalhar a favor do pequeno negócio.\n\nEquipe Sualuma`],
    ["vendas-inicial", 3, 7, "Último dia da sequência inicial", `Oi ${name},\n\nEssa é a reta final da nossa sequência inicial.\n\nSe você quer organizar seu negócio com IA, automação e uma estrutura mais profissional, agora é um bom momento para conhecer o Sualuma.\n\nEquipe Sualuma`],
    ["vendas-inicial", 3, 19, "Quer que a gente te mostre o melhor caminho?", `Oi ${name},\n\nSe você ainda está em dúvida, responda este e-mail contando qual é o seu tipo de negócio.\n\nA gente pode te orientar sobre qual estrutura faz mais sentido para começar.\n\nEquipe Sualuma`],
    ["manutencao", 5, 9, "Conteúdo: como organizar seu funil simples", `Oi ${name},\n\nUm funil simples tem: atração, conversa, proposta, acompanhamento e fechamento.\n\nA maioria dos pequenos negócios perde dinheiro no acompanhamento.\n\nEquipe Sualuma`],
    ["manutencao", 7, 9, "Conteúdo + oferta: automação sem complicar", `Oi ${name},\n\nAutomação não precisa ser coisa de empresa grande.\n\nComeça com pequenas tarefas: salvar lead, lembrar retorno, responder dúvidas comuns e organizar pedidos.\n\nO Sualuma quer facilitar isso.\n\nEquipe Sualuma`],
    ["manutencao", 10, 9, "Conteúdo: presença digital que passa confiança", `Oi ${name},\n\nUma página simples, clara e bem escrita já muda a percepção do cliente.\n\nConfiança vende.\n\nEquipe Sualuma`],
    ["manutencao", 12, 9, "Conteúdo + oferta: o próximo passo", `Oi ${name},\n\nSe você quer tirar seu negócio do improviso, o próximo passo é criar uma estrutura mínima: página, atendimento e rotina de follow-up.\n\nÉ nisso que o Sualuma pode ajudar.\n\nEquipe Sualuma`],
    ["cheque-mate", 14, 19, "Oferta especial para começar com o Sualuma", `Oi ${name},\n\nEssa é nossa mensagem de cheque-mate.\n\nSe você quer começar agora, podemos preparar uma condição especial de entrada para estruturar seu negócio com o Sualuma.\n\nResponda este e-mail com: COMEÇAR.\n\nEquipe Sualuma`],
  ] as const;

  return templates.map(([phase, day, hour, subject, body], index) => ({
    id: `${contactId}-${index + 1}`,
    contactId,
    email,
    name,
    subject,
    body,
    phase,
    scheduledAt: nextDateFromNow(day, hour),
    status: "scheduled",
  }));
}

async function sendWithBrevo(message: QueuedMessage) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.CAMPAIGN_FROM_EMAIL || process.env.BREVO_FROM_EMAIL || process.env.EMAIL_FROM;
  const fromName = process.env.CAMPAIGN_FROM_NAME || "Sualuma Online";

  if (!apiKey || !fromEmail || process.env.CAMPAIGN_AGENT_SEND_ENABLED !== "true") {
    return { sent: false, reason: "Modo seguro ativo: e-mail preparado, mas envio real desativado." };
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      "accept": "application/json",
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: fromName },
      to: [{ email: message.email, name: message.name }],
      subject: message.subject,
      textContent: message.body,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo status ${res.status}: ${text.slice(0, 300)}`);
  }

  return { sent: true };
}

async function runBatch() {
  const state = await readJson<CampaignState>(STATE_FILE, defaultState);
  const queue = await readJson<QueuedMessage[]>(QUEUE_FILE, []);
  const logs = await readJson<any[]>(LOG_FILE, []);

  if (!state.active) {
    return { ok: true, message: "Agente pausado.", added: 0, ready: 0, sent: 0, total: queue.length };
  }

  const leads = await loadLeads();
  const existingContacts = new Set(queue.map((m) => m.contactId));
  let addedContacts = 0;
  let blockedNoConsent = 0;

  for (const lead of leads) {
    const email = getLeadEmail(lead);
    if (!email) continue;

    const contactId = makeId(email);
    if (existingContacts.has(contactId)) continue;

    if (!hasMarketingConsent(lead) || isOptedOut(lead)) {
      blockedNoConsent++;
      continue;
    }

    queue.push(...buildMessages(lead, state));
    existingContacts.add(contactId);
    addedContacts++;
  }

  const now = Date.now();
  let ready = 0;
  let sent = 0;
  let errors = 0;

  for (const msg of queue) {
    if (!["scheduled", "ready", "error"].includes(msg.status)) continue;
    if (new Date(msg.scheduledAt).getTime() > now) continue;

    try {
      const result = await sendWithBrevo(msg);
      if (result.sent) {
        msg.status = "sent";
        msg.sentAt = new Date().toISOString();
        sent++;
      } else {
        msg.status = "ready";
        ready++;
      }
    } catch (err: any) {
      msg.status = "error";
      msg.error = err?.message || "Erro desconhecido";
      errors++;
    }
  }

  state.lastRunAt = new Date().toISOString();
  state.lastMessage = `Rodada concluída. Contatos novos na sequência: ${addedContacts}. E-mails prontos: ${ready}. Enviados: ${sent}. Bloqueados sem opt-in: ${blockedNoConsent}.`;

  logs.unshift({
    at: state.lastRunAt,
    addedContacts,
    ready,
    sent,
    errors,
    blockedNoConsent,
    totalMessages: queue.length,
  });

  await writeJson(STATE_FILE, state);
  await writeJson(QUEUE_FILE, queue);
  await writeJson(LOG_FILE, logs.slice(0, 200));

  const adminEmailDraft = await syncCampaignDraftToAdminEmails(state);

  return { ok: true, added: addedContacts, ready, sent, errors, blockedNoConsent, total: queue.length, state, adminEmailDraft };
}

export async function GET(req: NextRequest) {
  await ensureDir();

  const state = await readJson<CampaignState>(STATE_FILE, defaultState);
  const queue = await readJson<QueuedMessage[]>(QUEUE_FILE, []);
  const logs = await readJson<any[]>(LOG_FILE, []);

  const stats = {
    totalMessages: queue.length,
    scheduled: queue.filter((m) => m.status === "scheduled").length,
    ready: queue.filter((m) => m.status === "ready").length,
    sent: queue.filter((m) => m.status === "sent").length,
    error: queue.filter((m) => m.status === "error").length,
    contacts: new Set(queue.map((m) => m.contactId)).size,
  };

  return NextResponse.json({
    ok: true,
    agent: "ethical-campaign-agent",
    state,
    stats,
    recent: queue.slice(0, 10),
    logs: logs.slice(0, 10),
    adminEmailDraft: {
      connected: true,
      funnelId: "campaign-agent-sualuma-online",
      adminPath: "/admin/emails",
    },
    sendRealEmailsEnabled: process.env.CAMPAIGN_AGENT_SEND_ENABLED === "true",
  });
}

export async function POST(req: NextRequest) {
  await ensureDir();

  const secret = req.headers.get("x-campaign-agent-secret");
  const expected = process.env.CAMPAIGN_AGENT_SECRET;

  if (expected && secret !== expected) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action;

  if (action === "start") {
    const current = await readJson<CampaignState>(STATE_FILE, defaultState);
    const state = {
      ...current,
      active: true,
      offerName: body.offerName || current.offerName || "Sualuma Online",
      targetSegment: body.targetSegment || current.targetSegment,
      target: Number(body.target || current.target || 1000),
      lastMessage: "Agente de campanha iniciado. Sequência ética ativa para leads com opt-in.",
    };

    await writeJson(STATE_FILE, state);
    const adminEmailDraft = await syncCampaignDraftToAdminEmails(state);
    return NextResponse.json({ ok: true, state, adminEmailDraft });
  }

  if (action === "pause") {
    const current = await readJson<CampaignState>(STATE_FILE, defaultState);
    const state = { ...current, active: false, lastMessage: "Agente de campanha pausado." };
    await writeJson(STATE_FILE, state);
    return NextResponse.json({ ok: true, state });
  }

  if (action === "run-batch") {
    return NextResponse.json(await runBatch());
  }

  return NextResponse.json({ ok: false, error: "Ação inválida." }, { status: 400 });
}
