import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeadStatus = "novo" | "revisar" | "aprovado" | "contato" | "ganho" | "descartado";

type Lead = {
  id: string;
  company: string;
  niche?: string;
  city?: string;
  status: LeadStatus;
  score?: number;
  fit?: string;
  approach?: string;
  website?: string;
  phone?: string;
  source?: string;
  sourceUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

type AgentState = {
  active: boolean;
  target: number;
  collected: number;
  city: string;
  niche: string;
  batchSize: number;
  nextQueryIndex: number;
  nextCityIndex: number;
  queries: string[];
  lastMessage: string;
  lastRunAt?: string;
  needsConfig?: boolean;
};

const DATA_DIR = path.join(process.cwd(), "data", "leads-prospector");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const STATE_FILE = path.join(DATA_DIR, "agent-state.json");
const LOGS_FILE = path.join(DATA_DIR, "agent-logs.json");

const DEFAULT_QUERIES = [
  "salão de beleza",
  "barbearia",
  "loja de roupas",
  "costureira",
  "clínica de estética",
  "designer de sobrancelhas",
  "manicure",
  "restaurante pequeno",
  "lanchonete",
  "pizzaria",
  "academia",
  "personal trainer",
  "contador",
  "assistência técnica celular",
  "pet shop",
  "loja de variedades",
  "distribuidora",
  "prestador de serviços",
  "empresa de limpeza",
  "fotógrafo profissional"
];

const DEFAULT_CITIES = [
  "São Paulo",
  "Rio de Janeiro",
  "Belo Horizonte",
  "Curitiba",
  "Porto Alegre",
  "Florianópolis",
  "Salvador",
  "Recife",
  "Fortaleza",
  "Brasília",
  "Goiânia",
  "Campinas"
];

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    if (!raw.trim()) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown) {
  await ensureDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

function normalizeLeads(input: any): Lead[] {
  if (Array.isArray(input)) return input;
  if (input && Array.isArray(input.leads)) return input.leads;
  return [];
}

async function readLeads(): Promise<Lead[]> {
  const raw = await readJson<any>(LEADS_FILE, []);
  return normalizeLeads(raw);
}

async function saveLeads(leads: Lead[]) {
  await writeJson(LEADS_FILE, leads);
}

function defaultState(): AgentState {
  return {
    active: true,
    target: 1000,
    collected: 0,
    city: "Brasil",
    niche: "microempreendedores, prestadores e pequenos negócios",
    batchSize: 20,
    nextQueryIndex: 0,
    nextCityIndex: 0,
    queries: DEFAULT_QUERIES,
    needsConfig: false,
    lastMessage: "Agente pronto em modo gratuito: OpenStreetMap/Overpass, sem Google e sem cartão."
  };
}

async function readState(): Promise<AgentState> {
  const saved = await readJson<Partial<AgentState>>(STATE_FILE, {});
  return {
    ...defaultState(),
    ...saved,
    active: saved.active ?? true,
    target: Number(saved.target || 1000),
    collected: Number(saved.collected || 0),
    batchSize: Math.max(1, Math.min(Number(saved.batchSize || 20), 25)),
    nextQueryIndex: Number(saved.nextQueryIndex || 0),
    nextCityIndex: Number(saved.nextCityIndex || 0),
    queries: Array.isArray(saved.queries) && saved.queries.length ? saved.queries : DEFAULT_QUERIES,
    needsConfig: false
  };
}

async function saveState(state: AgentState) {
  state.needsConfig = false;
  await writeJson(STATE_FILE, state);
}

function stats(leads: Lead[]) {
  return {
    total: leads.length,
    revisar: leads.filter((l) => l.status === "revisar").length,
    aprovado: leads.filter((l) => l.status === "aprovado").length,
    contato: leads.filter((l) => l.status === "contato").length,
    ganho: leads.filter((l) => l.status === "ganho").length,
    descartado: leads.filter((l) => l.status === "descartado").length
  };
}

function getTagsForQuery(query: string) {
  const q = query.toLowerCase();

  if (q.includes("barbearia") || q.includes("salão") || q.includes("sobrancelha") || q.includes("manicure")) {
    return [`nwr["shop"="hairdresser"]`, `nwr["shop"="beauty"]`];
  }

  if (q.includes("roupa")) return [`nwr["shop"="clothes"]`];
  if (q.includes("costureira")) return [`nwr["craft"="tailor"]`, `nwr["shop"="tailor"]`];
  if (q.includes("estética")) return [`nwr["shop"="beauty"]`];
  if (q.includes("restaurante")) return [`nwr["amenity"="restaurant"]`];
  if (q.includes("lanchonete")) return [`nwr["amenity"="fast_food"]`, `nwr["amenity"="cafe"]`];
  if (q.includes("pizzaria")) return [`nwr["amenity"="restaurant"]["cuisine"~"pizza",i]`, `nwr["amenity"="fast_food"]["cuisine"~"pizza",i]`];
  if (q.includes("academia") || q.includes("personal")) return [`nwr["leisure"="fitness_centre"]`];
  if (q.includes("contador")) return [`nwr["office"="accountant"]`];
  if (q.includes("celular") || q.includes("assistência")) return [`nwr["shop"="mobile_phone"]`, `nwr["shop"="electronics"]`];
  if (q.includes("pet")) return [`nwr["shop"="pet"]`];
  if (q.includes("variedades")) return [`nwr["shop"="variety_store"]`];
  if (q.includes("fotógrafo") || q.includes("fotografo")) return [`nwr["shop"="photo"]`, `nwr["craft"="photographer"]`];
  if (q.includes("limpeza")) return [`nwr["office"="company"]["name"~"limpeza",i]`];

  return [`nwr["name"~"${escapeRegex(query)}",i]`];
}

function escapeOverpassString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/"/g, '\\"');
}

function chooseCity(state: AgentState) {
  if (state.city && state.city.toLowerCase() !== "brasil") return state.city;
  return DEFAULT_CITIES[state.nextCityIndex % DEFAULT_CITIES.length];
}

function makeOverpassQuery(city: string, query: string, limit: number) {
  const citySafe = escapeOverpassString(city);
  const tags = getTagsForQuery(query);
  const body = tags.map((tag) => `${tag}(area.searchArea);`).join("\n  ");

  return `
[out:json][timeout:25];
area["name"="${citySafe}"]["boundary"="administrative"]->.searchArea;
(
  ${body}
);
out center tags ${Math.max(1, Math.min(limit, 25))};
`;
}

function leadFromElement(element: any, city: string, query: string): Lead | null {
  const tags = element?.tags || {};
  const name = tags.name || tags.brand || tags.operator;

  if (!name || typeof name !== "string" || name.trim().length < 2) return null;

  const website = tags.website || tags["contact:website"] || tags.url || "";
  const phone = tags.phone || tags["contact:phone"] || "";
  const street = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(", ");
  const area = [tags["addr:suburb"], tags["addr:city"]].filter(Boolean).join(" - ");
  const sourceUrl = `https://www.openstreetmap.org/${element.type}/${element.id}`;

  return {
    id: `osm-${element.type}-${element.id}`,
    company: String(name).trim(),
    niche: query,
    city,
    status: "revisar",
    score: website || phone ? 78 : 62,
    fit: "Possível pequeno negócio encontrado em base pública. Revisar manualmente antes de qualquer contato.",
    approach: "Abordagem consultiva e sem spam: observar presença digital, oferecer diagnóstico gratuito e só enviar campanha se houver base legal/consentimento.",
    website: website || undefined,
    phone: phone || undefined,
    source: "OpenStreetMap público via Overpass",
    sourceUrl,
    notes: [street, area].filter(Boolean).join(" | "),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

async function fetchOverpass(city: string, query: string, limit: number): Promise<Lead[]> {
  const overpassQuery = makeOverpassQuery(city, query, limit);
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": "Sualuma-ethical-prospector/1.0"
    },
    body: new URLSearchParams({ data: overpassQuery }).toString()
  });

  if (!res.ok) {
    throw new Error(`Overpass HTTP ${res.status}`);
  }

  const data: any = await res.json().catch(() => ({ elements: [] }));
  const elements = Array.isArray(data.elements) ? data.elements : [];

  return elements
    .map((element: any) => leadFromElement(element, city, query))
    .filter(Boolean) as Lead[];
}

async function addLog(entry: any) {
  const logs = await readJson<any[]>(LOGS_FILE, []);
  logs.unshift({ at: new Date().toISOString(), ...entry });
  await writeJson(LOGS_FILE, logs.slice(0, 80));
}

async function runBatch() {
  const state = await readState();
  const leads = await readLeads();

  if (!state.active) {
    return {
      ok: true,
      added: 0,
      total: leads.length,
      message: "Agente pausado."
    };
  }

  if (leads.length >= state.target) {
    state.active = false;
    state.collected = leads.length;
    state.lastRunAt = new Date().toISOString();
    state.lastMessage = `Meta batida: ${leads.length}/${state.target} leads.`;
    await saveState(state);
    return { ok: true, added: 0, total: leads.length, message: state.lastMessage };
  }

  let added = 0;
  let found = 0;
  let lastError = "";
  let usedCity = "";
  let usedQuery = "";

  const existingIds = new Set(leads.map((l) => l.id));
  const existingNames = new Set(leads.map((l) => `${l.company}|${l.city}`.toLowerCase()));

  for (let attempt = 0; attempt < 5 && added === 0; attempt++) {
    const query = state.queries[state.nextQueryIndex % state.queries.length];
    const city = chooseCity(state);
    usedCity = city;
    usedQuery = query;

    try {
      const results = await fetchOverpass(city, query, state.batchSize);
      found = results.length;

      for (const lead of results) {
        const nameKey = `${lead.company}|${lead.city}`.toLowerCase();
        if (existingIds.has(lead.id) || existingNames.has(nameKey)) continue;
        leads.push(lead);
        existingIds.add(lead.id);
        existingNames.add(nameKey);
        added++;
      }
    } catch (err: any) {
      lastError = err?.message || "Erro desconhecido no Overpass";
    }

    state.nextQueryIndex = (state.nextQueryIndex + 1) % state.queries.length;
    if (state.city.toLowerCase() === "brasil") {
      state.nextCityIndex = (state.nextCityIndex + 1) % DEFAULT_CITIES.length;
    }
  }

  state.collected = leads.length;
  state.lastRunAt = new Date().toISOString();
  state.needsConfig = false;

  if (added > 0) {
    state.lastMessage = `Rodada concluída. ${added} lead(s) novo(s) adicionados como Revisar. Fonte gratuita: OpenStreetMap/Overpass.`;
  } else if (lastError) {
    state.lastMessage = `Rodada sem novos leads. Último erro: ${lastError}. O agente continuará tentando automaticamente.`;
  } else {
    state.lastMessage = "Rodada sem novos leads. O agente continuará alternando nichos e cidades.";
  }

  await saveLeads(leads);
  await saveState(state);
  await addLog({ added, found, total: leads.length, city: usedCity, query: usedQuery, error: lastError || null });

  return {
    ok: true,
    source: "openstreetmap-overpass",
    added,
    found,
    total: leads.length,
    city: usedCity,
    query: usedQuery,
    message: state.lastMessage
  };
}

export async function GET() {
  await ensureDir();
  const state = await readState();
  const leads = await readLeads();
  const logs = await readJson<any[]>(LOGS_FILE, []);

  return NextResponse.json({
    ok: true,
    agent: "ethical-prospector-free",
    mode: "free-openstreetmap-overpass",
    state: {
      ...state,
      collected: leads.length,
      needsConfig: false
    },
    stats: stats(leads),
    logs: logs.slice(0, 10)
  });
}

export async function POST(req: NextRequest) {
  await ensureDir();

  const secret = process.env.LEADS_PROSPECTOR_SECRET;
  const received = req.headers.get("x-leads-prospector-secret");

  if (secret && received !== secret) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action || "run-batch";

  if (action === "start") {
    const state = await readState();
    state.active = true;
    state.target = Number(body.target || state.target || 1000);
    state.city = body.city || state.city || "Brasil";
    state.niche = body.niche || state.niche;
    state.batchSize = Math.max(1, Math.min(Number(body.batchSize || state.batchSize || 20), 25));
    state.needsConfig = false;
    state.lastMessage = "Agente gratuito iniciado. Fonte: OpenStreetMap/Overpass. Leads entram como Revisar.";
    await saveState(state);
    return NextResponse.json({ ok: true, state });
  }

  if (action === "pause") {
    const state = await readState();
    state.active = false;
    state.lastMessage = "Agente pausado.";
    await saveState(state);
    return NextResponse.json({ ok: true, state });
  }

  if (action === "reset-free-mode") {
    const state = defaultState();
    await saveState(state);
    return NextResponse.json({ ok: true, state });
  }

  if (action === "run-batch") {
    const result = await runBatch();
    return NextResponse.json(result);
  }

  return NextResponse.json({ ok: false, error: "Ação inválida." }, { status: 400 });
}
