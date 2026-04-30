import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

function brDay(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function brDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function supabaseGet(path: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase não configurado.");
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    cache: "no-store",
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Erro ao buscar links.");
  }

  return text ? JSON.parse(text) : [];
}

function origemDoLink(row: any) {
  const meta = JSON.stringify(row.metadata || {}).toLowerCase();

  if (
    meta.includes("studio") ||
    meta.includes("admin") ||
    meta.includes("sistema") ||
    meta.includes("manual")
  ) {
    return "sistema";
  }

  if (
    meta.includes("cliente") ||
    meta.includes("dashboard") ||
    meta.includes("dashboardcliente")
  ) {
    return "cliente";
  }

  if (row.referrer_email) return "cliente";

  return "sistema";
}

function statusDoLink(row: any) {
  if (row.active === false) return "Inativo";

  if (!row.code || String(row.code).trim().length < 3) {
    return "Revisar";
  }

  if (!row.full_url && !row.destination_url) {
    return "Revisar";
  }

  return "Tudo certo";
}

function mapLink(row: any) {
  const origem = origemDoLink(row);

  return {
    id: row.id,
    code: row.code || "",
    origem,
    origemLabel: origem === "cliente" ? "Cliente" : "Sistema/Studio",
    nome: row.referrer_name || "Sem nome",
    email: row.referrer_email || "",
    url: row.full_url || row.destination_url || "",
    clicks: Number(row.clicks_count || 0),
    leads: Number(row.leads_count || 0),
    conversions: Number(row.conversions_count || 0),
    status: statusDoLink(row),
    ativo: row.active !== false,
    criadoEm: row.created_at,
    criadoEmFormatado: row.created_at ? brDateTime(row.created_at) : "",
    dia: row.created_at ? brDay(row.created_at) : "",
  };
}

export async function GET() {
  try {
    const rows = await supabaseGet(
      "referral_links?select=*&order=created_at.desc&limit=200"
    );

    const today = brDay(new Date());
    const links = rows.map(mapLink);
    const hoje = links.filter((link: any) => link.dia === today);

    const clientes = hoje
      .filter((link: any) => link.origem === "cliente")
      .slice(0, 5);

    const sistema = hoje
      .filter((link: any) => link.origem === "sistema")
      .slice(0, 5);

    return NextResponse.json({
      ok: true,
      today,
      summary: {
        totalHoje: hoje.length,
        clientesHoje: clientes.length,
        sistemaHoje: sistema.length,
      },
      clientes,
      sistema,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao carregar resumo de links.",
      },
      { status: 500 }
    );
  }
}
