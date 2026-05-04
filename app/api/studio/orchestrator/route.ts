import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BlueSkill =
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

const skillLabels: Record<BlueSkill, string> = {
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

function pickSkill(text: string, forced?: string): BlueSkill {
  const raw = `${forced || ""} ${text || ""}`.toLowerCase();

  if (raw.includes("vps") || raw.includes("nginx") || raw.includes("pm2") || raw.includes("servidor") || raw.includes("502") || raw.includes("deploy")) return "vps-doctor";
  if (raw.includes("usuário") || raw.includes("usuario") || raw.includes("login") || raw.includes("acesso") || raw.includes("permiss") || raw.includes("auth") || raw.includes("cliente")) return "user-doctor";
  if (raw.includes("ux") || raw.includes("interface") || raw.includes("layout") || raw.includes("design") || raw.includes("botão") || raw.includes("botao")) return "ux-doctor";
  if (raw.includes("lançamento") || raw.includes("lancamento") || raw.includes("lançar") || raw.includes("lancar") || raw.includes("checkout") || raw.includes("conversão") || raw.includes("conversao")) return "launch-doctor";
  if (raw.includes("loja") || raw.includes("stripe") || raw.includes("produto") || raw.includes("plano") || raw.includes("preço") || raw.includes("preco") || raw.includes("agente comprado")) return "store-manager";
  if (raw.includes("google") || raw.includes("seo") || raw.includes("rank") || raw.includes("blog") || raw.includes("ads")) return "google-seo";
  if (raw.includes("cnpj") || raw.includes("mei") || raw.includes("dívida") || raw.includes("divida") || raw.includes("receita federal")) return "cnpj-investigator";
  if (raw.includes("comunidade") || raw.includes("moderação") || raw.includes("moderacao") || raw.includes("denúncia") || raw.includes("denuncia")) return "community-guardian";
  if (raw.includes("n8n") || raw.includes("automação") || raw.includes("automacao") || raw.includes("workflow") || raw.includes("fluxo")) return "n8n-builder";
  if (raw.includes("lead") || raw.includes("prospect") || raw.includes("crm")) return "ethical-prospector";
  if (raw.includes("site") || raw.includes("página") || raw.includes("pagina") || raw.includes("landing")) return "site-builder";
  if (raw.includes("crescimento") || raw.includes("vendas") || raw.includes("marketing") || raw.includes("conteúdo") || raw.includes("conteudo")) return "growth-agent";
  if (raw.includes("email") || raw.includes("campanha") || raw.includes("funil")) return "email-marketing";
  if (raw.includes("repo") || raw.includes("git") || raw.includes("código") || raw.includes("codigo")) return "repo-radar";
  if (raw.includes("mia") || raw.includes("orquestr")) return "mia-trainer";

  return "dashboard-admin";
}

function extractGoal(body: any) {
  return String(
    body?.goal ||
    body?.message ||
    body?.prompt ||
    body?.text ||
    body?.content ||
    body?.question ||
    body?.input ||
    "Analise o Studio Sualuma e diga o próximo passo mais importante."
  ).trim();
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    name: "Mia Studio Orchestrator",
    blue_brain_url: process.env.BLUE_BRAIN_URL || "http://127.0.0.1:4117",
    skills: skillLabels
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const goal = extractGoal(body);

    if (!goal || goal.length < 3) {
      return NextResponse.json(
        { ok: false, error: "Mensagem vazia. Envie goal, message, prompt ou text." },
        { status: 400 }
      );
    }

    const skill = pickSkill(goal, body?.skill || body?.agent || body?.area || body?.tab);
    const blueUrl = (process.env.BLUE_BRAIN_URL || "http://127.0.0.1:4117").replace(/\/$/, "");
    const brainKey = process.env.BRAIN_API_KEY;

    if (!brainKey) {
      return NextResponse.json(
        { ok: false, error: "BRAIN_API_KEY não configurado no .env.local do luma-os." },
        { status: 500 }
      );
    }

    const blueResponse = await fetch(`${blueUrl}/v1/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-brain-key": brainKey
      },
      body: JSON.stringify({
        goal,
        skill,
        mode: body?.mode || "assist"
      }),
      cache: "no-store"
    });

    const text = await blueResponse.text();
    let data: any = null;

    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!blueResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          source: "blue-brain",
          skill,
          skill_label: skillLabels[skill],
          status: blueResponse.status,
          error: data?.error || "Erro no Cérebro Azul.",
          details: data
        },
        { status: blueResponse.status }
      );
    }

    const answer =
      data?.answer ||
      data?.response ||
      data?.result ||
      data?.content ||
      data?.summary ||
      data?.raw ||
      data;

    return NextResponse.json({
      ok: true,
      orchestrator: "Mia",
      source: "blue-brain",
      skill,
      skill_label: skillLabels[skill],
      goal,
      answer,
      data
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Falha na orquestração da Mia.",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
