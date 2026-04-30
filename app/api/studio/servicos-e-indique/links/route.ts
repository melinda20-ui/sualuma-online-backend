import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error("Variáveis Supabase não encontradas no servidor.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function formatMoneyFromCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((cents || 0) / 100);
}

function cleanCode(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 24);
}

function makeCode(name: string) {
  const base = cleanCode(name || "INDIQUE").slice(0, 12) || "INDIQUE";
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${base}${suffix}`;
}

function buildTrackedUrl(destinationUrl: string, code: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://sualuma.online";

  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBaseUrl}/r/${encodeURIComponent(code)}`;
}

function mapLink(row: any) {
  return {
    id: row.id,
    code: row.code,
    link: row.full_url,
    fullUrl: row.full_url,
    destinationUrl: row.destination_url,
    referrerName: row.referrer_name,
    referrerEmail: row.referrer_email,
    clicks: row.clicks_count || 0,
    leads: row.leads_count || 0,
    conversions: row.conversions_count || 0,
    revenueCents: row.revenue_cents || 0,
    payoutCents: row.payout_cents || 0,
    revenueFormatted: formatMoneyFromCents(row.revenue_cents || 0),
    payoutFormatted: formatMoneyFromCents(row.payout_cents || 0),
    active: row.active,
    createdAt: row.created_at,
  };
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data: links, error: linksError } = await supabase
      .from("referral_links")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (linksError) throw linksError;

    const { data: campaigns, error: campaignsError } = await supabase
      .from("referral_campaigns")
      .select("id,name,slug,reward_type,reward_percent,reward_cents,active")
      .eq("active", true)
      .order("created_at", { ascending: true });

    if (campaignsError) throw campaignsError;

    const mappedLinks = (links || []).map(mapLink);

    const totalRevenue = mappedLinks.reduce((sum, item) => sum + item.revenueCents, 0);
    const totalPayout = mappedLinks.reduce((sum, item) => sum + item.payoutCents, 0);

    return NextResponse.json({
      ok: true,
      source: "supabase",
      count: mappedLinks.length,
      summary: {
        links: mappedLinks.length,
        clicks: mappedLinks.reduce((sum, item) => sum + item.clicks, 0),
        leads: mappedLinks.reduce((sum, item) => sum + item.leads, 0),
        conversions: mappedLinks.reduce((sum, item) => sum + item.conversions, 0),
        revenueFormatted: formatMoneyFromCents(totalRevenue),
        payoutFormatted: formatMoneyFromCents(totalPayout),
      },
      campaigns: campaigns || [],
      links: mappedLinks,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao listar links de indicação.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await req.json().catch(() => ({}));

    const referrerName = String(body.referrerName || body.name || "Parceiro Sualuma").trim();
    const referrerEmail = String(body.referrerEmail || body.email || "").trim() || null;
    const campaignSlug = String(body.campaignSlug || "indique-sualuma").trim();
    const destinationUrl = String(body.destinationUrl || "https://sualuma.online/cadastro").trim();

    let code = cleanCode(String(body.code || ""));

    if (!code) {
      code = makeCode(referrerName);
    }

    const { data: existingCode } = await supabase
      .from("referral_links")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (existingCode) {
      return NextResponse.json(
        {
          ok: false,
          error: "Esse código já existe. Tente outro código.",
        },
        { status: 409 }
      );
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("referral_campaigns")
      .select("id,slug,name")
      .eq("slug", campaignSlug)
      .maybeSingle();

    if (campaignError) throw campaignError;

    const fullUrl = buildTrackedUrl(destinationUrl, code);

    const { data, error } = await supabase
      .from("referral_links")
      .insert({
        campaign_id: campaign?.id || null,
        referrer_name: referrerName,
        referrer_email: referrerEmail,
        code,
        destination_url: destinationUrl,
        full_url: fullUrl,
        active: true,
        metadata: {
          created_from: "studio-indique",
        },
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      message: "Link de indicação criado com sucesso.",
      link: mapLink(data),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao criar link de indicação.",
      },
      { status: 500 }
    );
  }
}
