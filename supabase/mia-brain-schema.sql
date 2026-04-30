create extension if not exists pgcrypto;

create table if not exists public.mia_brain_providers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null default 'llm',
  status text not null default 'paused' check (status in ('active','paused','error','missing_key')),
  base_url text,
  model_default text,
  is_free boolean not null default false,
  priority integer not null default 100,
  today_cost numeric(12,4) not null default 0,
  monthly_budget numeric(12,4) not null default 0,
  total_requests integer not null default 0,
  total_errors integer not null default 0,
  avg_latency_ms integer not null default 0,
  last_checked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mia_brain_models (
  id uuid primary key default gen_random_uuid(),
  provider_slug text not null references public.mia_brain_providers(slug) on delete cascade,
  model_slug text not null,
  name text not null,
  type text not null default 'chat',
  status text not null default 'active' check (status in ('active','paused','error')),
  context_window integer,
  cost_input_1k numeric(12,6) not null default 0,
  cost_output_1k numeric(12,6) not null default 0,
  avg_latency_ms integer not null default 0,
  quality_score numeric(5,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider_slug, model_slug)
);

create table if not exists public.mia_brain_skills (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  category text not null default 'general',
  status text not null default 'active' check (status in ('active','paused','draft','error')),
  usage_count integer not null default 0,
  success_rate numeric(5,2) not null default 0,
  avg_latency_ms integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mia_brain_prompts (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  type text not null default 'system',
  version text not null default 'v1',
  content text not null,
  is_active boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mia_brain_voices (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  provider text not null default 'edge-tts',
  language text not null default 'pt-BR',
  gender text,
  status text not null default 'active' check (status in ('active','paused','error')),
  sample_url text,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mia_brain_transcriptions (
  id uuid primary key default gen_random_uuid(),
  source_name text,
  source_url text,
  provider text not null default 'whisper',
  status text not null default 'done' check (status in ('queued','processing','done','error')),
  language text not null default 'pt-BR',
  duration_seconds integer,
  transcript text,
  summary text,
  cost numeric(12,4) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.mia_brain_usage_logs (
  id uuid primary key default gen_random_uuid(),
  provider_slug text,
  model_slug text,
  skill_slug text,
  event_type text not null default 'request',
  status text not null default 'ok' check (status in ('ok','warn','error')),
  message text not null,
  latency_ms integer,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost numeric(12,4) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.mia_brain_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_mia_brain_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_mia_brain_providers_updated_at on public.mia_brain_providers;
create trigger set_mia_brain_providers_updated_at
before update on public.mia_brain_providers
for each row execute function public.set_mia_brain_updated_at();

drop trigger if exists set_mia_brain_models_updated_at on public.mia_brain_models;
create trigger set_mia_brain_models_updated_at
before update on public.mia_brain_models
for each row execute function public.set_mia_brain_updated_at();

drop trigger if exists set_mia_brain_skills_updated_at on public.mia_brain_skills;
create trigger set_mia_brain_skills_updated_at
before update on public.mia_brain_skills
for each row execute function public.set_mia_brain_updated_at();

drop trigger if exists set_mia_brain_prompts_updated_at on public.mia_brain_prompts;
create trigger set_mia_brain_prompts_updated_at
before update on public.mia_brain_prompts
for each row execute function public.set_mia_brain_updated_at();

drop trigger if exists set_mia_brain_voices_updated_at on public.mia_brain_voices;
create trigger set_mia_brain_voices_updated_at
before update on public.mia_brain_voices
for each row execute function public.set_mia_brain_updated_at();

insert into public.mia_brain_providers
(slug, name, category, status, base_url, model_default, is_free, priority, today_cost, monthly_budget, total_requests, total_errors, avg_latency_ms, metadata)
values
('gemini', 'Gemini', 'llm', 'active', 'https://generativelanguage.googleapis.com', 'gemini-2.5-flash', true, 20, 0, 0, 0, 0, 1200, '{"role":"fallback inteligente gratuito"}'),
('ollama', 'Ollama Local', 'llm', 'active', 'http://127.0.0.1:11434', 'llama3.2:3b', true, 10, 0, 0, 0, 0, 850, '{"role":"modelo local gratuito"}'),
('openrouter', 'OpenRouter', 'llm-router', 'paused', 'https://openrouter.ai/api/v1', 'auto', false, 30, 0, 0, 0, 0, 1500, '{"role":"roteador de modelos"}'),
('grok-xai', 'Grok / xAI', 'llm', 'paused', 'https://api.x.ai/v1', 'grok-beta', false, 80, 0, 0, 0, 0, 0, '{"note":"sem créditos/licença no momento"}'),
('whisper', 'Whisper', 'transcription', 'active', null, 'whisper-local', true, 40, 0, 0, 0, 0, 900, '{"role":"transcrição de áudio"}'),
('edge-tts', 'Edge TTS', 'voice', 'active', null, 'pt-BR-FranciscaNeural', true, 50, 0, 0, 0, 0, 500, '{"role":"voz gratuita"}'),
('whatsapp', 'WhatsApp Cloud API', 'notification', 'active', 'https://graph.facebook.com', 'v25.0', false, 60, 0, 0, 0, 0, 700, '{"role":"notificações"}'),
('supabase', 'Supabase', 'database', 'active', null, 'postgres', false, 5, 0, 0, 0, 0, 180, '{"role":"banco principal"}')
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  base_url = excluded.base_url,
  model_default = excluded.model_default,
  is_free = excluded.is_free,
  priority = excluded.priority,
  metadata = public.mia_brain_providers.metadata || excluded.metadata;

insert into public.mia_brain_models
(provider_slug, model_slug, name, type, status, context_window, cost_input_1k, cost_output_1k, avg_latency_ms, quality_score)
values
('ollama', 'llama3.2:3b', 'Llama 3.2 3B Local', 'chat', 'active', 8192, 0, 0, 850, 93.10),
('gemini', 'gemini-2.5-flash', 'Gemini 2.5 Flash', 'chat', 'active', 1000000, 0, 0, 1200, 96.40),
('openrouter', 'auto', 'OpenRouter Auto', 'router', 'paused', null, 0, 0, 1500, 91.70),
('whisper', 'whisper-local', 'Whisper Local', 'audio', 'active', null, 0, 0, 900, 89.30),
('edge-tts', 'pt-BR-FranciscaNeural', 'Francisca Neural PT-BR', 'voice', 'active', null, 0, 0, 500, 88.20)
on conflict (provider_slug, model_slug) do update set
  name = excluded.name,
  type = excluded.type,
  status = excluded.status,
  avg_latency_ms = excluded.avg_latency_ms,
  quality_score = excluded.quality_score;

insert into public.mia_brain_skills
(slug, name, description, category, status, usage_count, success_rate, avg_latency_ms, config)
values
('atendimento-ia', 'Atendimento IA', 'Responder clientes e visitantes no tom da Sualuma.', 'chat', 'active', 24, 94.50, 1200, '{}'),
('transcricao-audio', 'Transcrição', 'Transcrever áudios para texto em português.', 'audio', 'active', 32, 91.00, 900, '{}'),
('resumo-audio', 'Resumo de Áudio', 'Transformar áudio transcrito em resumo acionável.', 'audio', 'active', 18, 89.00, 1100, '{}'),
('geracao-conteudo', 'Geração de Conteúdo', 'Criar posts, scripts e copies.', 'marketing', 'active', 14, 92.00, 1300, '{}'),
('analise-dados', 'Análise de Dados', 'Analisar métricas, logs e comportamento do sistema.', 'data', 'active', 12, 87.00, 1500, '{}')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  status = excluded.status;

insert into public.mia_brain_prompts
(slug, name, type, version, content, is_active, notes)
values
('mia-atendimento', 'Atendimento IA', 'system', 'v1.0', 'Você é a Mia, assistente inteligente da Sualuma. Responda em português brasileiro, com clareza, objetividade e foco em ajudar empreendedores.', true, 'Prompt inicial da Mia.'),
('mia-transcricao', 'Resumidor de Áudio', 'audio', 'v1.0', 'Transcreva, organize e resuma o áudio em tópicos claros, ações e próximos passos.', true, 'Prompt inicial de áudio.'),
('mia-conteudo', 'Gerador de Conteúdo', 'marketing', 'v1.0', 'Crie conteúdo estratégico para atrair microempreendedores, autônomos e prestadores de serviço.', true, 'Prompt inicial de marketing.')
on conflict do nothing;

insert into public.mia_brain_voices
(slug, name, provider, language, gender, status, config)
values
('pt-br-francisca', 'Francisca Neural', 'edge-tts', 'pt-BR', 'feminina', 'active', '{"voice":"pt-BR-FranciscaNeural"}'),
('pt-br-antonio', 'Antonio Neural', 'edge-tts', 'pt-BR', 'masculina', 'active', '{"voice":"pt-BR-AntonioNeural"}')
on conflict (slug) do update set
  name = excluded.name,
  provider = excluded.provider,
  language = excluded.language,
  gender = excluded.gender,
  status = excluded.status,
  config = excluded.config;

insert into public.mia_brain_usage_logs
(provider_slug, model_slug, skill_slug, event_type, status, message, latency_ms, input_tokens, output_tokens, cost, metadata)
values
('supabase', 'postgres', 'analise-dados', 'system', 'ok', 'Banco da Mia Brain inicializado.', 180, 0, 0, 0, '{}'),
('ollama', 'llama3.2:3b', 'atendimento-ia', 'request', 'ok', 'Modelo local disponível para MVP.', 850, 0, 0, 0, '{}'),
('gemini', 'gemini-2.5-flash', 'atendimento-ia', 'fallback', 'ok', 'Gemini configurado como fallback inteligente.', 1200, 0, 0, 0, '{}'),
('grok-xai', 'grok-beta', null, 'provider', 'warn', 'Grok/xAI cadastrado, mas depende de crédito/licença.', null, 0, 0, 0, '{}')
on conflict do nothing;

insert into public.mia_brain_settings(key, value)
values
('routing', '{"primary":"ollama","fallbacks":["gemini","openrouter"],"cost_mode":"mvp_free_first"}'),
('dashboard', '{"theme":"red_pink_holographic","version":"v1"}')
on conflict (key) do update set value = excluded.value, updated_at = now();
