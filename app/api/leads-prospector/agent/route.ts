import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeadStatus = "novo" | "revisar" | "aprovado" | "contato" | "ganho" | "descartado";

type Lead = {
  id: string;
  company: string;
  segment: string;
  source: string;
  sourceUrl?: string;
  website?: string;
  contactPhone?: string;
  city?: string;
  score: number;
  status: LeadStatus;
  fitReason: string;
  approach: string;
  lgpdBasis: string;
  createdAt: string;
  updatedAt: string;
  placeId?: string;
};

type AgentState = {
  active: boolean;
  target: number;
  collected: number;
  city: string;
  niche: string;
  batchSize: number;
  nextQueryIndex: number;
  queries: string[];
  lastRunAt?: string;
  lastMessage?: string;
  lastAgentAnswer?: string;
  needsConfig?: boolean;
};

const DATA_DIR = path.join(process.cwd(), "data", "leads-prospector");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const STATE_FILE = path.join(DATA_DIR, "agent-state.json");

const DEFAULT_QUERIES = [
  "salão de beleza MEI",
  "barbearia",
  "loja de roupas",
  "costureira",
  "clínica de estética",
  "designer de sobrancelhas",
  "manicure",
  "restaurante pequeno",
  "lanchonete",
  "pizzaria pequena",
  "academia pequena",
  "personal trainer",
  "contador para MEI",
  "assistência técnica celular",
  "pet shop pequeno",
  "loja de variedades",
  "distribuidora pequena",
  "prestador de serviços",
  "empresa de limpeza",
  "fotógrafo profissional"
];

function defaultState(): AgentState {
  return {
    active: false,
    target: 1000,
    collected: 0,
    city: "Brasil",
    niche: "microempreendedores, prestadores e pequenos negócios",
    batchSize: 20,
    nextQueryIndex: 0,
    queries: DEFAULT_QUERIES,
    lastMessage: "Agente pronto, aguardando início."
  };
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
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
  await ensureDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

async function readLeads(): Promise<Lead[]> {
  const raw = await readJson<any>(LEADS_FILE, []);
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.leads)) return raw.leads;
  return [];
}

async function writeLeads(leads: Lead[]) {
  await writeJson(LEADS_FILE, leads);
}

async function readState(): Promise<AgentState> {
  const state = await readJson<AgentState>(STATE_FILE, defaultState());
  return { ...defaultState(), ...state };
}

async function writeState(state: AgentState) {
  await writeJson(STATE_FILE, state);
}

function requireSecret(req: NextRequest) {
  const expected = process.env.LEADS_PROSPECTOR_SECRET;
  const got = req.headers.get("x-leads-prospector-secret");
  return Boolean(expected && got && got === expected);
}

function normalizeKey(lead: Partial<Lead>) {
  return String(lead.placeId || lead.website || `${lead.company}-${lead.city}`)
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

function scoreLead(details: any) {
  let score = 50;
  if (details.website) score += 15;
  if (details.formatted_phone_number) score += 10;
  if ((details.rating || 0) >= 4) score += 10;
  if ((details.user_ratings_total || 0) >= 20) score += 10;
  if (details.business_status === "OPERATIONAL") score += 5;
  return Math.min(score, 100);
}

function extractCity(address?: string) {
  if (!address) return "";
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.slice(-3).join(", ");
}

async function fetchPlaceDetails(placeId: string, apiKey: string) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("fields", "name,formatted_address,formatted_phone_number,website,types,rating,user_ratings_total,business_status,url,place_id");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url);
  const data = await res.json();
  return data?.result || null;
}

async function searchPlaces(query: string, city: string, limit: number) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      needsConfig: true,
      leads: [] as Lead[],
      message: "Falta GOOGLE_MAPS_API_KEY ou GOOGLE_PLACES_API_KEY no .env.local."
    };
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", `${query} ${city}`.trim());
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url);
  const data = await res.json();

  if (!["OK", "ZERO_RESULTS"].includes(data?.status)) {
    return {
      ok: false,
      needsConfig: false,
      leads: [] as Lead[],
      message: `Google Places retornou status: ${data?.status || "desconhecido"}`
    };
  }

  const results = Array.isArray(data?.results) ? data.results.slice(0, limit) : [];
  const leads: Lead[] = [];

  for (const item of results) {
    if (!item?.place_id) continue;

    const details = await fetchPlaceDetails(item.place_id, apiKey);
    if (!details?.name) continue;

    const now = new Date().toISOString();

    leads.push({
      id: `lead_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      company: details.name,
      segment: query,
      source: "Google Places - dado público empresarial",
      sourceUrl: details.url || details.website || "",
      website: details.website || "",
      contactPhone: details.formatted_phone_number || "",
      city: extractCity(details.formatted_address),
      score: scoreLead(details),
      status: "revisar",
      fitReason:
        "Empresa encontrada em fonte pública empresarial. Precisa de revisão humana antes de qualquer contato.",
      approach:
        "Abordagem manual, personalizada e sem spam. Primeiro validar se o negócio tem perfil para Sualuma e oferecer ajuda clara.",
      lgpdBasis:
        "Prospecção B2B com interesse legítimo, revisão humana, contato individual e opção clara de não receber novos contatos.",
      createdAt: now,
      updatedAt: now,
      placeId: details.place_id || item.place_id
    });
  }

  return {
    ok: true,
    needsConfig: false,
    leads,
    message: `${leads.length} leads candidatos encontrados.`
  };
}

async function askEthicalProspectorSummary(added: number, query: string) {
  try {
    const res = await fetch("http://127.0.0.1:3000/api/studio/orchestrator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        area: "prospeccao",
        message:
          `Agente ético de prospecção: foram adicionados ${added} leads candidatos no CRM para a busca "${query}". ` +
          "Gere uma recomendação curta de abordagem ética, revisão humana e próximos passos sem spam."
      })
    });

    const data = await res.json();
    return data?.answer || data?.data?.content || "";
  } catch {
    return "";
  }
}

export async function GET() {
  const [state, leads] = await Promise.all([readState(), readLeads()]);
  return NextResponse.json({
    ok: true,
    agent: "ethical-prospector",
    state: { ...state, collected: leads.length },
    stats: {
      total: leads.length,
      revisar: leads.filter((l) => l.status === "revisar").length,
      aprovado: leads.filter((l) => l.status === "aprovado").length,
      contato: leads.filter((l) => l.status === "contato").length,
      ganho: leads.filter((l) => l.status === "ganho").length,
      descartado: leads.filter((l) => l.status === "descartado").length
    }
  });
}

export async function POST(req: NextRequest) {
  if (!requireSecret(req)) {
    return NextResponse.json(
      { ok: false, error: "Acesso negado. Secret ausente ou inválido." },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "run-batch");
  const state = await readState();
  const leads = await readLeads();

  if (action === "start") {
    const next: AgentState = {
      ...state,
      active: true,
      target: Number(body.target || state.target || 1000),
      city: String(body.city || state.city || "Brasil"),
      niche: String(body.niche || state.niche || "microempreendedores e pequenos negócios"),
      batchSize: Math.min(Number(body.batchSize || state.batchSize || 20), 25),
      collected: leads.length,
      lastMessage: "Agente automático iniciado. Ele vai buscar leads em lotes e salvar como Revisar."
    };

    await writeState(next);
    return NextResponse.json({ ok: true, state: next });
  }

  if (action === "stop") {
    const next = {
      ...state,
      active: false,
      collected: leads.length,
      lastMessage: "Agente pausado."
    };

    await writeState(next);
    return NextResponse.json({ ok: true, state: next });
  }

  if (action !== "run-batch") {
    return NextResponse.json({ ok: false, error: "Ação inválida." }, { status: 400 });
  }

  if (!state.active) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      message: "Agente pausado.",
      state: { ...state, collected: leads.length }
    });
  }

  if (leads.length >= state.target) {
    const next = {
      ...state,
      active: false,
      collected: leads.length,
      lastRunAt: new Date().toISOString(),
      lastMessage: `Meta de ${state.target} leads atingida. Agente pausado automaticamente.`
    };
    await writeState(next);
    return NextResponse.json({ ok: true, done: true, state: next });
  }

  const queries = state.queries?.length ? state.queries : DEFAULT_QUERIES;
  const query = queries[state.nextQueryIndex % queries.length];
  const result = await searchPlaces(query, state.city, state.batchSize);

  const existingKeys = new Set(leads.map(normalizeKey));
  const fresh = result.leads.filter((lead) => !existingKeys.has(normalizeKey(lead)));
  const merged = [...fresh, ...leads].slice(0, Math.max(state.target, leads.length));

  await writeLeads(merged);

  const agentAnswer = fresh.length
    ? await askEthicalProspectorSummary(fresh.length, query)
    : "";

  const nextState: AgentState = {
    ...state,
    collected: merged.length,
    nextQueryIndex: state.nextQueryIndex + 1,
    lastRunAt: new Date().toISOString(),
    needsConfig: result.needsConfig,
    lastAgentAnswer: agentAnswer || state.lastAgentAnswer,
    lastMessage: result.needsConfig
      ? result.message
      : `Busca "${query}" finalizada. Novos leads adicionados: ${fresh.length}. Total: ${merged.length}/${state.target}.`
  };

  await writeState(nextState);

  return NextResponse.json({
    ok: !result.needsConfig,
    added: fresh.length,
    total: merged.length,
    query,
    message: nextState.lastMessage,
    state: nextState,
    agentAnswer
  });
}
