-- =========================================================
-- Sualuma Online - Serviços + Indique
-- Banco para marketplace estilo Workana/99Freelas
-- =========================================================

create extension if not exists pgcrypto;

-- =========================
-- PLANOS DOS PRESTADORES
-- =========================
create table if not exists public.service_provider_plans (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  type text not null default 'gratuito',
  price_cents integer not null default 0,
  currency text not null default 'BRL',
  proposals_included integer not null default 0,
  priority_level text not null default 'normal',
  platform_fee_percent numeric(5,2) not null default 12,
  stripe_product_id text,
  stripe_price_id text,
  active boolean not null default true,
  features jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- CRÉDITOS DE PROPOSTAS
-- =========================
create table if not exists public.provider_proposal_wallet (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid,
  movement_type text not null,
  quantity integer not null,
  reason text,
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================
-- CONTRATOS DE SERVIÇOS
-- =========================
create table if not exists public.service_contracts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid,
  provider_id uuid,
  title text not null,
  description text,
  status text not null default 'pending',
  amount_cents integer not null default 0,
  currency text not null default 'BRL',
  platform_fee_percent numeric(5,2) not null default 12,
  platform_fee_cents integer not null default 0,
  provider_payout_cents integer not null default 0,
  referral_code text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- CAMPANHAS DE INDICAÇÃO
-- =========================
create table if not exists public.referral_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  reward_type text not null default 'coupon',
  reward_percent numeric(5,2),
  reward_cents integer,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- LINKS DE INDICAÇÃO
-- =========================
create table if not exists public.referral_links (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.referral_campaigns(id) on delete set null,
  referrer_id uuid,
  referrer_name text,
  referrer_email text,
  code text unique not null,
  destination_url text not null,
  full_url text not null,
  clicks_count integer not null default 0,
  leads_count integer not null default 0,
  conversions_count integer not null default 0,
  revenue_cents integer not null default 0,
  payout_cents integer not null default 0,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- EVENTOS DE INDICAÇÃO
-- click, lead, checkout_started, conversion, payout
-- =========================
create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  referral_link_id uuid references public.referral_links(id) on delete cascade,
  code text,
  event_type text not null,
  visitor_id text,
  lead_email text,
  user_id uuid,
  contract_id uuid references public.service_contracts(id) on delete set null,
  amount_cents integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================
-- ENTRADAS E SAÍDAS DE INDICAÇÃO
-- =========================
create table if not exists public.referral_financial_movements (
  id uuid primary key default gen_random_uuid(),
  referral_link_id uuid references public.referral_links(id) on delete set null,
  referrer_id uuid,
  direction text not null,
  movement_type text not null,
  amount_cents integer not null default 0,
  currency text not null default 'BRL',
  status text not null default 'pending',
  description text,
  source_event_id uuid references public.referral_events(id) on delete set null,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================
-- DADOS INICIAIS
-- =========================
insert into public.service_provider_plans
(slug, name, description, type, price_cents, proposals_included, priority_level, platform_fee_percent, features)
values
('gratuito', 'Prestador Gratuito', 'Plano gratuito para entrar no marketplace, montar perfil e enviar algumas propostas por mês.', 'gratuito', 0, 3, 'normal', 12, '["Perfil público", "3 propostas grátis por mês", "Taxa sobre contratos fechados"]'),
('pacote-propostas', 'Pacote de Propostas', 'Pacote avulso para comprar mais propostas sem mensalidade.', 'credito', 1990, 10, 'normal', 12, '["10 propostas extras", "Sem mensalidade", "Pode vender via Stripe"]'),
('prioritario', 'Prestador Prioritário', 'Plano pago para aparecer com mais destaque e enviar mais propostas.', 'assinatura', 4990, 40, 'alta', 10, '["40 propostas por mês", "Prioridade na listagem", "Selo verificado", "Taxa menor"]'),
('agencia-time', 'Agência / Time', 'Plano para equipes e agências operarem volume dentro da plataforma.', 'assinatura', 9700, 120, 'maxima', 8, '["120 propostas por mês", "Prioridade máxima", "Perfil de equipe", "Taxa reduzida"]')
on conflict (slug) do nothing;

insert into public.referral_campaigns
(name, slug, description, reward_type, reward_percent, reward_cents, active)
values
('Indique Sualuma', 'indique-sualuma', 'Campanha geral de indicação da Sualuma Online.', 'coupon', 10, null, true),
('Parceiros Prestadores', 'parceiros-prestadores', 'Campanha para prestadores indicarem clientes e outros prestadores.', 'cash', null, 2000, true)
on conflict (slug) do nothing;
