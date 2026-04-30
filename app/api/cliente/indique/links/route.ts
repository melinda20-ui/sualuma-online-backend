import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "";

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "";

const REF_BASE_URL = (
  process.env.PUBLIC_REFERRAL_BASE_URL ||
  "https://sualuma.online"
).replace(/\/$/, "");

const DEFAULT_DESTINATION_URL = (
  process.env.PUBLIC_REFERRAL_DESTINATION_URL ||
  "https://sualuma.online/cadastro"
).replace(/\/$/, "");

function moneyFromCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((cents || 0) / 100);
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 18);
}

function makeCode(name: string, email: string) {
  const baseName = slugify(name || email.split("@")[0] || "cliente");
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${baseName || "cliente"}-${suffix}`.toUpperCase();
}

async function supabaseFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Variáveis Supabase ausentes.");
  }

  const headers = new Headers(options.headers);
  headers.set("apikey", SUPABASE_KEY);
  headers.set("Authorization", `Bearer ${SUPABASE_KEY}`);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Erro Supabase ${res.status}`);
  }

  if (res.status === 204) return null as T;

  return (await res.json()) as T;
}

function mapLink(row: any) {
  return {
    id: row.id,
    code: row.code,
    link: row.full_url,
    fullUrl: row.full_url,
    destinationUrl: row.destination_url,
    clicks: row.clicks_count || 0,
    leads: row.leads_count || 0,
    conversions: row.conversions_count || 0,
    revenueCents: row.revenue_cents || 0,
    payoutCents: row.payout_cents || 0,
    revenueFormatted: moneyFromCents(row.revenue_cents || 0),
    payoutFormatted: moneyFromCents(row.payout_cents || 0),
    active: row.active,
    createdAt: row.created_at,
    referrerName: row.referrer_name,
    referrerEmail: row.referrer_email,
  };
}

async function getDefaultCampaignId() {
  const campaigns = await supabaseFetch<any[]>(
    "referral_campaigns?slug=eq.indique-sualuma&active=eq.true&select=id,name,slug&limit=1"
  );

  return campaigns?.[0]?.id || null;
}

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({
        ok: true,
        source: "supabase",
        message: "Informe um email para listar os links do cliente.",
        links: [],
        summary: {
          links: 0,
          clicks: 0,
          leads: 0,
          conversions: 0,
          revenueFormatted: moneyFromCents(0),
          payoutFormatted: moneyFromCents(0),
        },
      });
    }

    const links = await supabaseFetch<any[]>(
      `referral_links?referrer_email=eq.${encodeURIComponent(email)}&select=*&order=created_at.desc&limit=50`
    );

    const mapped = (links || []).map(mapLink);

    const summary = mapped.reduce(
      (acc, link) => {
        acc.links += 1;
        acc.clicks += link.clicks;
        acc.leads += link.leads;
        acc.conversions += link.conversions;
        acc.revenueCents += link.revenueCents;
        acc.payoutCents += link.payoutCents;
        return acc;
      },
      {
        links: 0,
        clicks: 0,
        leads: 0,
        conversions: 0,
        revenueCents: 0,
        payoutCents: 0,
      }
    );

    return NextResponse.json({
      ok: true,
      source: "supabase",
      links: mapped,
      summary: {
        ...summary,
        revenueFormatted: moneyFromCents(summary.revenueCents),
        payoutFormatted: moneyFromCents(summary.payoutCents),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao listar links.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const referrerName = String(body.referrerName || body.name || "").trim();
    const referrerEmail = String(body.referrerEmail || body.email || "").trim().toLowerCase();
    const destinationUrl = String(body.destinationUrl || DEFAULT_DESTINATION_URL).trim();

    if (!referrerEmail || !referrerEmail.includes("@")) {
      return NextResponse.json(
        {
          ok: false,
          error: "Informe um email válido para gerar o link.",
        },
        { status: 400 }
      );
    }

    const campaignId = await getDefaultCampaignId();
    const code = makeCode(referrerName, referrerEmail);
    const fullUrl = `${REF_BASE_URL}/r/${encodeURIComponent(code)}`;

    const inserted = await supabaseFetch<any[]>("referral_links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        campaign_id: campaignId,
        referrer_name: referrerName || referrerEmail.split("@")[0],
        referrer_email: referrerEmail,
        code,
        destination_url: destinationUrl || DEFAULT_DESTINATION_URL,
        full_url: fullUrl,
        active: true,
        metadata: {
          source: "dashboardcliente",
          created_by: "client_self_service",
        },
      }),
    });

    return NextResponse.json({
      ok: true,
      source: "supabase",
      link: mapLink(inserted?.[0]),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao gerar link.",
      },
      { status: 500 }
    );
  }
}
