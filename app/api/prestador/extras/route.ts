import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_FILE = path.join(process.cwd(), "data", "provider-dashboard.json");

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function json(payload: any, status = 200) {
  return NextResponse.json(payload, { status, headers: corsHeaders() });
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultData() {
  const now = new Date().toISOString();

  return {
    updatedAt: now,
    providerProfile: {
      name: "--- ilustrativo: substitua pelo seu nome ---",
      title: "--- ilustrativo: substitua pela sua especialidade ---",
      email: "",
      phone: "",
      city: "",
      bio: "Configure seu perfil para começar a receber propostas.",
      avatarInitial: "?",
      onboardingComplete: false,
    },
    setup: [
      { id: "perfil", title: "Configurar perfil", description: "Dados, especialidade, bio e contato.", done: false },
      { id: "recebimento", title: "Dados de recebimento", description: "Chave Pix, banco ou conta para saque.", done: false },
      { id: "portfolio", title: "Adicionar portfólio", description: "Mostre trabalhos para aumentar conversão.", done: false },
      { id: "whatsapp", title: "Conectar WhatsApp", description: "Receba avisos de proposta, pagamento e mensagens.", done: false },
      { id: "github", title: "Vincular GitHub", description: "Salve versões dos projetos e recupere quando precisar.", done: false },
    ],
    stats: {
      earningsMonth: 0,
      availableBalance: 0,
      activeClients: 0,
      sentProposals: 0,
      acceptedProposals: 0,
      rejectedProposals: 0,
      pendingProposals: 0,
      referralEarnings: 0,
    },
    payout: {
      status: "pending",
      pixKey: "",
      bankName: "",
      holderName: "",
      document: "",
      updatedAt: "",
    },
    payoutRequests: [],
    proposals: [],
    projects: [],
    portfolio: [],
    referrals: {
      summary: {
        totalClicks: 0,
        totalLeads: 0,
        totalConversions: 0,
        totalEarned: 0,
      },
      programs: [],
      items: [],
    },
    github: {
      status: "pending",
      username: "",
      repoUrl: "",
      lastSavedAt: "",
      lastRestoreAt: "",
    },
    whatsapp: {
      status: "pending",
      phone: "",
      qrCodeHint: "QR Code aparecerá quando o WhatsApp for conectado.",
      connectedAt: "",
    },
    aiAgents: [],
    notifications: [],
  };
}

async function readData() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const data = JSON.parse(raw);
    return { ...defaultData(), ...data };
  } catch {
    return defaultData();
  }
}

async function saveData(data: any) {
  data.updatedAt = new Date().toISOString();
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

function markSetupDone(data: any, id: string) {
  if (!Array.isArray(data.setup)) data.setup = [];
  data.setup = data.setup.map((item: any) =>
    item.id === id ? { ...item, done: true } : item
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET() {
  const data = await readData();
  return json({ ok: true, data });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body.action || "");
    const data = await readData();
    const now = new Date().toISOString();

    data.stats = data.stats || {};
    data.projects = Array.isArray(data.projects) ? data.projects : [];
    data.portfolio = Array.isArray(data.portfolio) ? data.portfolio : [];
    data.referrals = data.referrals || { summary: {}, programs: [], items: [] };
    data.referrals.summary = data.referrals.summary || {};
    data.referrals.items = Array.isArray(data.referrals.items) ? data.referrals.items : [];
    data.payoutRequests = Array.isArray(data.payoutRequests) ? data.payoutRequests : [];

    if (action === "update_payout") {
      data.payout = {
        ...(data.payout || {}),
        status: "ready",
        pixKey: body.pixKey || "",
        bankName: body.bankName || "",
        holderName: body.holderName || "",
        document: body.document || "",
        updatedAt: now,
      };
      markSetupDone(data, "recebimento");
    }

    if (action === "request_withdrawal") {
      const amount = Number(body.amount || data.stats.availableBalance || 0);
      data.payoutRequests.unshift({
        id: makeId("saque"),
        amount,
        status: "solicitado",
        createdAt: now,
      });
      data.payout = {
        ...(data.payout || {}),
        status: "withdrawal_requested",
        updatedAt: now,
      };
    }

    if (action === "add_portfolio") {
      data.portfolio.unshift({
        id: makeId("portfolio"),
        title: body.title || "Novo projeto",
        category: body.category || "Sites",
        url: body.url || "",
        imageUrl: body.imageUrl || "",
        description: body.description || "",
        createdAt: now,
      });
      markSetupDone(data, "portfolio");
    }

    if (action === "update_github") {
      data.github = {
        ...(data.github || {}),
        status: "connected",
        username: body.username || "",
        repoUrl: body.repoUrl || "",
        updatedAt: now,
      };
      markSetupDone(data, "github");
    }

    if (action === "save_snapshot") {
      const projectId = body.projectId || data.projects[0]?.id;
      const project = data.projects.find((item: any) => item.id === projectId) || data.projects[0];

      if (project) {
        project.repoUrl = body.repoUrl || project.repoUrl || data.github?.repoUrl || "";
        project.snapshots = Array.isArray(project.snapshots) ? project.snapshots : [];
        project.snapshots.unshift({
          id: makeId("snapshot"),
          label: body.label || "Versão salva pelo painel",
          repoUrl: project.repoUrl,
          createdAt: now,
        });
      }

      data.github = {
        ...(data.github || {}),
        lastSavedAt: now,
      };
    }

    if (action === "restore_snapshot") {
      data.github = {
        ...(data.github || {}),
        lastRestoreAt: now,
      };
    }

    if (action === "update_whatsapp") {
      data.whatsapp = {
        ...(data.whatsapp || {}),
        phone: body.phone || "",
        status: body.status || "qr_ready",
        qrCodeHint: body.qrCodeHint || "QRCode pronto para pareamento do WhatsApp.",
        updatedAt: now,
      };
      markSetupDone(data, "whatsapp");
    }

    if (action === "connect_whatsapp") {
      data.whatsapp = {
        ...(data.whatsapp || {}),
        phone: body.phone || data.whatsapp?.phone || "",
        status: "connected",
        connectedAt: now,
        qrCodeHint: "WhatsApp conectado para receber notificações.",
      };
      markSetupDone(data, "whatsapp");
    }

    if (action === "add_referral") {
      const type = body.type || "site";
      const amount =
        Number(body.amount || 0) ||
        (type === "site" ? 300 : type === "assinatura" ? 0 : 0);

      data.referrals.items.unshift({
        id: makeId("indicacao"),
        name: body.name || "Indicação",
        contact: body.contact || "",
        type,
        status: body.status || "lead",
        amount,
        createdAt: now,
      });

      data.referrals.summary.totalLeads = Number(data.referrals.summary.totalLeads || 0) + 1;
      data.referrals.summary.totalEarned = Number(data.referrals.summary.totalEarned || 0) + amount;
      data.stats.referralEarnings = Number(data.stats.referralEarnings || 0) + amount;
    }

    await saveData(data);
    return json({ ok: true, action, data });
  } catch (error: any) {
    return json({ ok: false, error: error?.message || "Erro ao salvar dados do prestador." }, 500);
  }
}
