create extension if not exists pgcrypto;

create table if not exists public.sualuma_chat_threads (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Novo chat',
  kind text not null default 'chat',
  status text not null default 'active',
  agent_slug text default 'mia-brain',
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sualuma_chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.sualuma_chat_threads(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.sualuma_chat_agents (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  subtitle text,
  badge text not null default 'Criado',
  status text not null default 'active',
  is_active boolean not null default true,
  sort_order int not null default 100,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sualuma_chat_automations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  subtitle text,
  badge text not null default 'Criada',
  status text not null default 'active',
  is_active boolean not null default true,
  sort_order int not null default 100,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_sualuma_chat_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_sualuma_chat_threads_updated_at on public.sualuma_chat_threads;
create trigger set_sualuma_chat_threads_updated_at
before update on public.sualuma_chat_threads
for each row execute function public.set_sualuma_chat_updated_at();

drop trigger if exists set_sualuma_chat_agents_updated_at on public.sualuma_chat_agents;
create trigger set_sualuma_chat_agents_updated_at
before update on public.sualuma_chat_agents
for each row execute function public.set_sualuma_chat_updated_at();

drop trigger if exists set_sualuma_chat_automations_updated_at on public.sualuma_chat_automations;
create trigger set_sualuma_chat_automations_updated_at
before update on public.sualuma_chat_automations
for each row execute function public.set_sualuma_chat_updated_at();

insert into public.sualuma_chat_agents (slug, name, subtitle, badge, status, is_active, sort_order, metadata)
values
('mia-brain', 'Mia Brain', 'Seu assistente principal', 'Comprado', 'active', true, 1, '{"role":"orquestradora principal"}'),
('financeiro', 'Agente Financeiro', 'Análises, custos e relatórios', 'Comprado', 'active', true, 2, '{"role":"financeiro"}'),
('conteudo', 'Agente de Conteúdo', 'Posts, scripts e campanhas', 'Criado', 'active', true, 3, '{"role":"marketing"}'),
('atendimento', 'Agente de Atendimento', 'Suporte e atendimento inteligente', 'Comprado', 'active', true, 4, '{"role":"suporte"}'),
('painel-da-vida', 'Painel da Vida', 'Rotina, tarefas e decisões', 'Criado', 'active', true, 5, '{"role":"produtividade"}')
on conflict (slug) do update set
  name = excluded.name,
  subtitle = excluded.subtitle,
  badge = excluded.badge,
  status = excluded.status,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  metadata = excluded.metadata;

insert into public.sualuma_chat_automations (slug, name, subtitle, badge, status, is_active, sort_order, metadata)
values
('resumo-diario', 'Resumo diário', 'Envia resumo todos os dias', 'Comprada', 'active', true, 1, '{"trigger":"daily"}'),
('postagem-automatica', 'Postagem automática', 'Agenda e publica conteúdos', 'Criada', 'active', true, 2, '{"trigger":"content"}'),
('follow-up-leads', 'Follow-up de leads', 'Acompanha novos leads', 'Comprada', 'paused', false, 3, '{"trigger":"lead"}'),
('organizacao-tarefas', 'Organização de tarefas', 'Prioriza tarefas e próximos passos', 'Criada', 'active', true, 4, '{"trigger":"task"}'),
('alertas-financeiros', 'Alertas financeiros', 'Avisa sobre custos e movimentações', 'Comprada', 'paused', false, 5, '{"trigger":"finance"}')
on conflict (slug) do update set
  name = excluded.name,
  subtitle = excluded.subtitle,
  badge = excluded.badge,
  status = excluded.status,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  metadata = excluded.metadata;

insert into public.sualuma_chat_threads (title, agent_slug, summary, metadata)
select 'Planejamento 12 semanas', 'mia-brain', 'Plano estratégico para lançamento e execução.', '{"seed":true}'
where not exists (
  select 1 from public.sualuma_chat_threads where title = 'Planejamento 12 semanas'
);

insert into public.sualuma_chat_threads (title, agent_slug, summary, metadata)
select 'Campanha de e-mail', 'conteudo', 'Campanhas e relacionamento com leads.', '{"seed":true}'
where not exists (
  select 1 from public.sualuma_chat_threads where title = 'Campanha de e-mail'
);

insert into public.sualuma_chat_threads (title, agent_slug, summary, metadata)
select 'Atendimento clientes', 'atendimento', 'Conversas e suporte comercial.', '{"seed":true}'
where not exists (
  select 1 from public.sualuma_chat_threads where title = 'Atendimento clientes'
);
