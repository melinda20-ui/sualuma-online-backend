import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Skill =
  | "vps-doctor"
  | "business-agent"
  | "ux-doctor"
  | "launch-doctor"
  | "user-doctor"
  | "growth-agent"
  | "agent-builder"
  | "store-manager"
  | "ethical-prospector"
  | "facebook-groups-finder"
  | "site-builder"
  | "n8n-builder"
  | "social-growth"
  | "google-seo"
  | "email-marketing"
  | "repo-radar"
  | "mia-trainer"
  | "dashboard-admin"
  | "onboarding-builder"
  | "community-guardian"
  | "cnpj-investigator"
  | "demand-radar"
  | "workana-closer";

const SKILL_LABELS: Record<Skill, string> = {
  "vps-doctor": "Diagnóstico de VPS, Nginx, PM2 e estabilidade",
  "business-agent": "Diagnóstico de negócio",
  "ux-doctor": "Diagnóstico de UX e interface",
  "launch-doctor": "Lançamento e prontidão para venda",
  "user-doctor": "Usuários, login, acesso e permissões",
  "growth-agent": "Crescimento, vendas e aquisição",
  "agent-builder": "Criação de agentes",
  "store-manager": "Loja, produtos, Stripe e ofertas",
  "ethical-prospector": "Prospecção ética e leads",
  "facebook-groups-finder": "Pesquisa de grupos e comunidades",
  "site-builder": "Criação e diagnóstico de sites",
  "n8n-builder": "Automações e fluxos n8n",
  "social-growth": "Crescimento em redes sociais",
  "google-seo": "Google, SEO, busca e posicionamento",
  "email-marketing": "E-mail marketing e campanhas",
  "repo-radar": "Repositório, código e riscos técnicos",
  "mia-trainer": "Treinamento da Mia",
  "dashboard-admin": "Administração do Studio",
  "onboarding-builder": "Onboarding e jornada do usuário",
  "community-guardian": "Comunidade, moderação e regras",
  "cnpj-investigator": "CNPJ, MEI, obrigações e alertas",
  "demand-radar": "Radar de demanda e oportunidades",
  "workana-closer": "Propostas e fechamento de serviços"
};

function normalize(input: unknown) {
  return String(input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function pickSkill(areaRaw: unknown, messageRaw: unknown, explicitSkill?: unknown): Skill {
  const explicit = String(explicitSkill || "") as Skill;
  if (explicit && SKILL_LABELS[explicit]) return explicit;

  const area = normalize(areaRaw);
  const text = normalize(messageRaw);
  const combined = `${area} ${text}`;

  const areaMap: Record<string, Skill> = {
    usuarios: "user-doctor",
    usuario: "user-doctor",
    users: "user-doctor",
    login: "user-doctor",
    permissoes: "user-doctor",

    google: "google-seo",
    seo: "google-seo",
    trafego: "google-seo",

    cnpj: "cnpj-investigator",
    mei: "cnpj-investigator",
    fiscal: "cnpj-investigator",

    loja: "store-manager",
    store: "store-manager",
    stripe: "store-manager",
    checkout: "store-manager",
    produtos: "store-manager",
    ofertas: "store-manager",

    saude: "vps-doctor",
    vps: "vps-doctor",
    nginx: "vps-doctor",
    pm2: "vps-doctor",
    servidor: "vps-doctor",

    crescimento: "growth-agent",
    vendas: "growth-agent",
    lancamento: "growth-agent",
    aquisicao: "growth-agent",
    clientes: "growth-agent",

    comunidade: "community-guardian",
    moderacao: "community-guardian",

    automacoes: "n8n-builder",
    automacao: "n8n-builder",
    n8n: "n8n-builder",

    codigo: "repo-radar",
    repo: "repo-radar",
    github: "repo-radar",

    mia: "mia-trainer",
    treinamento: "mia-trainer",

    dashboard: "dashboard-admin",
    studio: "dashboard-admin"
  };

  if (area && areaMap[area]) return areaMap[area];

  if (combined.includes("loja") || combined.includes("stripe") || combined.includes("checkout") || combined.includes("produto") || combined.includes("oferta")) return "store-manager";
  if (combined.includes("crescimento") || combined.includes("venda") || combined.includes("lancamento") || combined.includes("aquisicao") || combined.includes("cliente")) return "growth-agent";
  if (combined.includes("google") || combined.includes("seo") || combined.includes("ranking") || combined.includes("trafego")) return "google-seo";
  if (combined.includes("cnpj") || combined.includes("mei") || combined.includes("fiscal") || combined.includes("receita")) return "cnpj-investigator";
  if (combined.includes("usuario") || combined.includes("login") || combined.includes("permiss")) return "user-doctor";
  if (combined.includes("vps") || combined.includes("nginx") || combined.includes("pm2") || combined.includes("servidor") || combined.includes("saude")) return "vps-doctor";

  return "dashboard-admin";
}

function extractAnswer(data: any) {
  return String(
    data?.answer ||
    data?.content ||
    data?.summary ||
    data?.message ||
    data?.result ||
    "A Mia recebeu a resposta do Cérebro Azul, mas não encontrou um resumo textual claro."
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    name: "Mia Studio Orchestrator",
    blue_brain_url: process.env.BLUE_BRAIN_URL || "http://127.0.0.1:4117",
    skills: SKILL_LABELS
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  const message = String(body.message || body.goal || "").trim();
  const area = body.area;
  const skill = pickSkill(area, message, body.skill);
  const goal = message || `Analise a área ${String(area || "Studio")} e gere um diagnóstico prático.`;

  const blueUrl = String(process.env.BLUE_BRAIN_URL || "http://127.0.0.1:4117").replace(/\/$/, "");
  const brainKey = process.env.BRAIN_API_KEY || "";

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (brainKey) {
    headers["x-brain-key"] = brainKey;
    headers["x-api-key"] = brainKey;
    headers["Authorization"] = `Bearer ${brainKey}`;
  }

  try {
    const response = await fetch(`${blueUrl}/v1/panel/task`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        goal,
        skill,
        mode: body.mode || "assist"
      })
    });

    const data = await response.json().catch(async () => ({
      raw: await response.text().catch(() => "")
    }));

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          orchestrator: "Mia",
          source: "blue-brain",
          skill,
          skill_label: SKILL_LABELS[skill],
          goal,
          error: "Cérebro Azul não conseguiu executar a skill.",
          details: data
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      orchestrator: "Mia",
      source: "blue-brain",
      skill,
      skill_label: SKILL_LABELS[skill],
      goal,
      answer: extractAnswer(data),
      data
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        orchestrator: "Mia",
        source: "studio-fallback",
        skill,
        skill_label: SKILL_LABELS[skill],
        goal,
        error: error instanceof Error ? error.message : "Erro desconhecido ao conectar no Cérebro Azul."
      },
      { status: 500 }
    );
  }
}
