import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeadStatus =
  | "novo"
  | "revisar"
  | "aprovado"
  | "contato"
  | "ganho"
  | "descartado";

type Lead = {
  id: string;
  company: string;
  segment?: string;
  city?: string;
  website?: string;
  publicContact?: string;
  sourceUrl?: string;
  status: LeadStatus;
  score?: number;
  fitReason?: string;
  lgpdStatus?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

type ProspectingJob = {
  id: string;
  title: string;
  target: number;
  status: "running" | "paused" | "done";
  progress: number;
  approvedForContact: number;
  rules: string[];
  allowedSources: string[];
  deniedActions: string[];
  createdAt: string;
  updatedAt: string;
};

const DATA_DIR = path.join(process.cwd(), "data", "leads-prospector");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const JOBS_FILE = path.join(DATA_DIR, "jobs.json");

const POLICY = {
  mode: "ethical-b2b-prospecting",
  target: 1000,
  rules: [
    "Buscar apenas leads empresariais/B2B com fonte pública ou importação autorizada.",
    "Não coletar dados sensíveis.",
    "Não raspar redes sociais de pessoas físicas.",
    "Não enviar contato automático.",
    "Exigir revisão manual antes de qualquer abordagem.",
    "Registrar fonte, motivo de fit e status LGPD.",
    "Permitir descarte imediato de leads sem fonte clara."
  ],
  allowedSources: [
    "Formulários inbound do Sualuma",
    "Planilhas próprias importadas manualmente",
    "Sites oficiais de empresas",
    "Diretórios empresariais que permitam uso conforme termos",
    "Indicações e parceiros",
    "APIs oficiais autorizadas"
  ],
  deniedActions: [
    "Spam",
    "Compra de listas sem procedência",
    "Coleta de e-mail pessoal",
    "Coleta de WhatsApp pessoal",
    "Bypass de login, paywall, captcha ou robots.txt",
    "Contato automático sem aprovação humana"
  ]
};

function id(prefix = "lead") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

async function ensureFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(LEADS_FILE);
  } catch {
    await fs.writeFile(LEADS_FILE, "[]", "utf8");
  }

  try {
    await fs.access(JOBS_FILE);
  } catch {
    await fs.writeFile(JOBS_FILE, "[]", "utf8");
  }
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
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function normalizeStatus(value: unknown): LeadStatus {
  const status = clean(value) as LeadStatus;
  const allowed: LeadStatus[] = [
    "novo",
    "revisar",
    "aprovado",
    "contato",
    "ganho",
    "descartado"
  ];

  return allowed.includes(status) ? status : "novo";
}

function normalizeLead(input: any): Lead | null {
  const now = new Date().toISOString();
  const company = clean(input.company || input.empresa || input.name || input.nome);

  if (!company) return null;

  return {
    id: clean(input.id) || id("lead"),
    company,
    segment: clean(input.segment || input.nicho || input.segmento),
    city: clean(input.city || input.cidade),
    website: clean(input.website || input.site),
    publicContact: clean(input.publicContact || input.contato_publico || input.contato),
    sourceUrl: clean(input.sourceUrl || input.fonte || input.url),
    status: normalizeStatus(input.status || "novo"),
    score: Number(input.score || input.pontuacao || 50),
    fitReason: clean(input.fitReason || input.motivo || "Aguardando análise manual."),
    lgpdStatus:
      clean(input.lgpdStatus) ||
      "Revisão manual obrigatória antes de contato.",
    notes: clean(input.notes || input.observacoes),
    createdAt: clean(input.createdAt) || now,
    updatedAt: now
  };
}

async function getState() {
  await ensureFiles();
  const leads = await readJson<Lead[]>(LEADS_FILE, []);
  const jobs = await readJson<ProspectingJob[]>(JOBS_FILE, []);

  return { leads, jobs };
}

export async function GET() {
  const { leads, jobs } = await getState();

  return NextResponse.json({
    ok: true,
    policy: POLICY,
    leads,
    jobs
  });
}

export async function POST(req: NextRequest) {
  await ensureFiles();

  const body = await req.json().catch(() => ({}));
  const action = clean(body.action);
  let leads = await readJson<Lead[]>(LEADS_FILE, []);
  let jobs = await readJson<ProspectingJob[]>(JOBS_FILE, []);

  if (action === "start-agent") {
    const now = new Date().toISOString();

    const job: ProspectingJob = {
      id: id("job"),
      title: "Missão automática ética: encontrar 1000 leads B2B",
      target: Number(body.target || 1000),
      status: "running",
      progress: leads.length,
      approvedForContact: leads.filter((lead) =>
        ["aprovado", "contato", "ganho"].includes(lead.status)
      ).length,
      rules: POLICY.rules,
      allowedSources: POLICY.allowedSources,
      deniedActions: POLICY.deniedActions,
      createdAt: now,
      updatedAt: now
    };

    jobs = [job, ...jobs];
    await writeJson(JOBS_FILE, jobs);

    return NextResponse.json({
      ok: true,
      message:
        "Missão criada. O agente está em modo ético: ele organiza e qualifica leads, mas não envia contato automático e não coleta dados pessoais sensíveis.",
      policy: POLICY,
      leads,
      jobs
    });
  }

  if (action === "add") {
    const lead = normalizeLead(body.lead || body);

    if (!lead) {
      return NextResponse.json(
        { ok: false, error: "Informe pelo menos o nome da empresa." },
        { status: 400 }
      );
    }

    leads = [lead, ...leads];
    await writeJson(LEADS_FILE, leads);

    return NextResponse.json({ ok: true, policy: POLICY, leads, jobs });
  }

  if (action === "import") {
    const incoming = Array.isArray(body.leads) ? body.leads : [];
    const normalized = incoming
      .map(normalizeLead)
      .filter(Boolean) as Lead[];

    const existingKeys = new Set(
      leads.map((lead) =>
        `${lead.company.toLowerCase()}|${(lead.website || "").toLowerCase()}`
      )
    );

    const unique = normalized.filter((lead) => {
      const key = `${lead.company.toLowerCase()}|${(lead.website || "").toLowerCase()}`;
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    });

    leads = [...unique, ...leads];
    await writeJson(LEADS_FILE, leads);

    return NextResponse.json({
      ok: true,
      imported: unique.length,
      policy: POLICY,
      leads,
      jobs
    });
  }

  if (action === "move" || action === "update") {
    const leadId = clean(body.id);
    const now = new Date().toISOString();

    leads = leads.map((lead) => {
      if (lead.id !== leadId) return lead;

      return {
        ...lead,
        ...body.patch,
        status: normalizeStatus(body.status || body.patch?.status || lead.status),
        updatedAt: now
      };
    });

    await writeJson(LEADS_FILE, leads);

    return NextResponse.json({ ok: true, policy: POLICY, leads, jobs });
  }

  if (action === "delete") {
    const leadId = clean(body.id);
    leads = leads.filter((lead) => lead.id !== leadId);
    await writeJson(LEADS_FILE, leads);

    return NextResponse.json({ ok: true, policy: POLICY, leads, jobs });
  }

  return NextResponse.json(
    { ok: false, error: "Ação inválida." },
    { status: 400 }
  );
}
