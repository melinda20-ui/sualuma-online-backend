create extension if not exists pgcrypto;

create table if not exists public.studio_dashboard_cards (
  id text primary key,
  title text not null,
  value text not null default '',
  subtitle text not null default '',
  status text not null default 'neutral',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_tasks (
  id text primary key,
  title text not null,
  area text not null default 'Studio',
  priority text not null default 'media',
  status text not null default 'todo',
  lane_id text not null default 'wait',
  plain_explanation text not null default '',
  source text not null default 'studio',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_events (
  id text primary key,
  title text not null,
  description text not null default '',
  type text not null default 'info',
  source text not null default 'studio',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.studio_dashboard_cards
  (id, title, value, subtitle, status, sort_order, metadata)
values
  ('launch-readiness', 'Prontidão de lançamento', 'Em preparação', 'Painel conectado ao banco com fallback seguro.', 'warning', 1, '{"area":"launch"}'),
  ('agents-admin', 'Agentes ADMs', 'Ativos', 'Central de agentes com voz, skills e cérebro configurável.', 'success', 2, '{"area":"agents"}'),
  ('database-status', 'Banco de dados', 'Conectado', 'Studio Luma lendo dados do Postgres/Supabase.', 'success', 3, '{"area":"database"}'),
  ('voice-system', 'Voz dos agentes', 'Piper local', 'Cadu, Jeff e voz do navegador disponíveis.', 'success', 4, '{"area":"voice"}')
on conflict (id) do update set
  title = excluded.title,
  value = excluded.value,
  subtitle = excluded.subtitle,
  status = excluded.status,
  sort_order = excluded.sort_order,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.studio_tasks
  (id, title, area, priority, status, lane_id, plain_explanation, source, metadata)
values
  ('validar-fluxo-lancamento', 'Validar fluxo principal antes do lançamento', 'Lançamento', 'alta', 'todo', 'urgent', 'Antes de divulgar, testar cadastro, login, painel, checkout e mensagens principais.', 'studio-luma-db', '{"checklist":["cadastro","login","studio","checkout"]}'),
  ('revisar-agentes-adms', 'Revisar respostas dos Agentes ADMs', 'Agentes', 'media', 'todo', 'review', 'Conversar com Atlas, Copiloto, Orion e Nova para confirmar se estão respondendo de forma humana e útil.', 'studio-luma-db', '{"agents":["atlas","copiloto","orion","nova"]}'),
  ('monitorar-banco-studio', 'Monitorar conexão do banco no Studio', 'Banco de dados', 'media', 'todo', 'wait', 'Confirmar se o painel está usando source database e não apenas fallback local.', 'studio-luma-db', '{"api":"/api/studio/dashboard"}')
on conflict (id) do update set
  title = excluded.title,
  area = excluded.area,
  priority = excluded.priority,
  status = excluded.status,
  lane_id = excluded.lane_id,
  plain_explanation = excluded.plain_explanation,
  source = excluded.source,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.studio_events
  (id, title, description, type, source, metadata)
values
  ('studio-db-connected', 'Banco conectado ao Studio Luma', 'API do painel preparada para buscar cards, tarefas e eventos no banco com fallback seguro.', 'success', 'studio-luma-db', '{"route":"/api/studio/dashboard"}')
on conflict (id) do nothing;
