import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function moneyFromCents(cents: number | null | undefined) {
  const value = Number(cents || 0) / 100;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return [];
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          source: "missing-env",
          message: "Variáveis do Supabase não encontradas no servidor.",
        },
        { status: 500 }
      );
    }

    const [
      plansResult,
      campaignsResult,
      linksResult,
      contractsResult,
      movementsResult,
    ] = await Promise.all([
      supabase
        .from("service_provider_plans")
        .select("*")
        .order("price_cents", { ascending: true }),

      supabase
        .from("referral_campaigns")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("referral_links")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("service_contracts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30),

      supabase
        .from("referral_financial_movements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const errors = [
      plansResult.error,
      campaignsResult.error,
      linksResult.error,
      contractsResult.error,
      movementsResult.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          source: "supabase",
          message: "Erro ao consultar tabelas de Serviços + Indique.",
          errors: errors.map((error) => error?.message),
        },
        { status: 500 }
      );
    }

    const rawPlans = plansResult.data || [];
    const rawCampaigns = campaignsResult.data || [];
    const rawLinks = linksResult.data || [];
    const rawContracts = contractsResult.data || [];
    const rawMovements = movementsResult.data || [];

    const servicePlans = rawPlans.map((plan: any) => ({
      id: plan.slug || plan.id,
      databaseId: plan.id,
      name: plan.name,
      description: plan.description,
      type: plan.type,
      priceCents: plan.price_cents,
      price: Number(plan.price_cents || 0) / 100,
      priceFormatted: moneyFromCents(plan.price_cents),
      currency: plan.currency || "BRL",
      proposalsIncluded: plan.proposals_included || 0,
      priority: plan.priority_level || "normal",
      platformFeePercent: Number(plan.platform_fee_percent || 0),
      stripeProductId: plan.stripe_product_id,
      stripePriceId: plan.stripe_price_id,
      active: Boolean(plan.active),
      features: asArray(plan.features),
      createdAt: plan.created_at,
    }));

    const referralCampaigns = rawCampaigns.map((campaign: any) => ({
      id: campaign.id,
      name: campaign.name,
      slug: campaign.slug,
      description: campaign.description,
      rewardType: campaign.reward_type,
      rewardPercent: campaign.reward_percent,
      rewardCents: campaign.reward_cents,
      reward:
        campaign.reward_type === "cash"
          ? moneyFromCents(campaign.reward_cents)
          : `${Number(campaign.reward_percent || 0)}%`,
      active: Boolean(campaign.active),
      startsAt: campaign.starts_at,
      endsAt: campaign.ends_at,
      createdAt: campaign.created_at,
    }));

    const referrals = rawLinks.map((link: any) => ({
      id: link.id,
      campaignId: link.campaign_id,
      referrerId: link.referrer_id,
      name: link.referrer_name || link.code,
      email: link.referrer_email,
      code: link.code,
      link: link.full_url,
      destinationUrl: link.destination_url,
      clicks: link.clicks_count || 0,
      leads: link.leads_count || 0,
      conversions: link.conversions_count || 0,
      revenueGenerated: moneyFromCents(link.revenue_cents),
      payoutGenerated: moneyFromCents(link.payout_cents),
      active: Boolean(link.active),
      createdAt: link.created_at,
    }));

    const contracts = rawContracts.map((contract: any) => ({
      id: contract.id,
      title: contract.title,
      description: contract.description,
      status: contract.status,
      amountCents: contract.amount_cents,
      amount: moneyFromCents(contract.amount_cents),
      platformFeePercent: Number(contract.platform_fee_percent || 0),
      platformFee: moneyFromCents(contract.platform_fee_cents),
      providerPayout: moneyFromCents(contract.provider_payout_cents),
      referralCode: contract.referral_code,
      paidAt: contract.paid_at,
      createdAt: contract.created_at,
    }));

    const financialMovements = rawMovements.map((movement: any) => ({
      id: movement.id,
      referralLinkId: movement.referral_link_id,
      direction: movement.direction,
      movementType: movement.movement_type,
      amountCents: movement.amount_cents,
      amount: moneyFromCents(movement.amount_cents),
      status: movement.status,
      description: movement.description,
      paidAt: movement.paid_at,
      createdAt: movement.created_at,
    }));

    const totalReferralRevenueCents = rawLinks.reduce(
      (sum: number, item: any) => sum + Number(item.revenue_cents || 0),
      0
    );

    const totalReferralPayoutCents = rawLinks.reduce(
      (sum: number, item: any) => sum + Number(item.payout_cents || 0),
      0
    );

    const totalContractsCents = rawContracts.reduce(
      (sum: number, item: any) => sum + Number(item.amount_cents || 0),
      0
    );

    const totalPlatformFeeCents = rawContracts.reduce(
      (sum: number, item: any) => sum + Number(item.platform_fee_cents || 0),
      0
    );

    return NextResponse.json({
      ok: true,
      source: "supabase",
      updatedAt: new Date().toISOString(),
      summary: {
        servicePlans: servicePlans.length,
        referralCampaigns: referralCampaigns.length,
        referralLinks: referrals.length,
        serviceContracts: contracts.length,
        financialMovements: financialMovements.length,
        totalReferralRevenue: moneyFromCents(totalReferralRevenueCents),
        totalReferralPayout: moneyFromCents(totalReferralPayoutCents),
        totalContracts: moneyFromCents(totalContractsCents),
        totalPlatformFee: moneyFromCents(totalPlatformFeeCents),
      },
      servicePlans,
      referralCampaigns,
      referrals,
      contracts,
      financialMovements,
      commissionRules: [
        {
          id: "service-contract",
          name: "Comissão por contrato fechado",
          percent: 12,
          appliesTo: "contratos de serviços",
          description:
            "Quando cliente e prestador fecham um serviço pela plataforma, a Sualuma cobra uma porcentagem sobre o valor contratado.",
        },
        {
          id: "priority-discount",
          name: "Taxa menor para prestador pago",
          percent: 10,
          appliesTo: "prestadores prioritários",
          description:
            "Prestadores com plano pago podem ter taxa menor para incentivar recorrência e volume.",
        },
        {
          id: "agency-discount",
          name: "Taxa menor para agência/time",
          percent: 8,
          appliesTo: "agências e times",
          description:
            "Plano maior com comissão menor para clientes que movimentam mais contratos.",
        },
      ],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        source: "api-error",
        message: error?.message || "Erro inesperado na API Serviços + Indique.",
      },
      { status: 500 }
    );
  }
}
