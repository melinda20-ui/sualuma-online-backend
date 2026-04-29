create extension if not exists pgcrypto;

create table if not exists studio_system_tasks (
  id uuid primary key default gen_random_uuid(),
  task_key text unique not null,
  title text not null,
  detail text,
  value text default 'ativo',
  tone text default 'blue',
  tag text default 'Sistema',
  priority integer default 3,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists studio_store_products (
  id uuid primary key default gen_random_uuid(),
  product_key text unique not null,
  title text not null,
  detail text,
  value text default 'ativo',
  tone text default 'green',
  category text default 'Agentes',
  status text default 'ativo',
  priority integer default 3,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists studio_community_reports (
  id uuid primary key default gen_random_uuid(),
  report_key text unique not null,
  title text not null,
  detail text,
  value text default 'analisar',
  tone text default 'yellow',
  reported_user text,
  reporter_user text,
  reason text,
  status text default 'aberto',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists studio_cnpj_notifications (
  id uuid primary key default gen_random_uuid(),
  notification_key text unique not null,
  title text not null,
  detail text,
  value text default 'verificar',
  tone text default 'yellow',
  status text default 'aberto',
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists studio_subdomains (
  id uuid primary key default gen_random_uuid(),
  subdomain_key text unique not null,
  name text not null,
  status text default 'Online',
  tone text default 'green',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists studio_subdomain_links (
  id uuid primary key default gen_random_uuid(),
  subdomain_key text not null references studio_subdomains(subdomain_key) on delete cascade,
  path text not null,
  status text default 'monitorar',
  created_at timestamptz default now(),
  unique(subdomain_key, path)
);

create table if not exists studio_audit_events (
  id uuid primary key default gen_random_uuid(),
  area text not null,
  title text not null,
  detail text,
  level text default 'info',
  created_at timestamptz default now()
);

insert into studio_system_tasks (task_key, title, detail, value, tone, tag, priority)
values
('corrigir-paginas-entrada', 'Corrigir páginas de entrada', 'Home, blog, planos e páginas de captura precisam estar sem erro para receber leads.', 'em risco', 'red', 'Sistema', 1),
('rastreio-subdominio', 'Ativar rastreio por subdomínio', 'Monitorar tráfego e origem dos leads por área do ecossistema.', 'em andamento', 'yellow', 'Marketing', 2),
('finalizar-ux-arvore', 'Finalizar UX da árvore', 'Mapear jornadas principais e transformar em fluxos conectados ao banco.', 'ativo', 'pink', 'UX', 3),
('agente-sitemap', 'Criar Agente Sitemap', 'Detectar páginas quebradas automaticamente e alimentar notificações.', 'em andamento', 'green', 'Agentes', 4)
on conflict (task_key) do nothing;

insert into studio_store_products (product_key, title, detail, value, tone, category, status, priority)
values
('agente-propostas', 'Agente Propostas Comerciais', 'Categoria: Agentes • Status: publicado • Conversão alta', 'ativo', 'green', 'Agentes', 'ativo', 1),
('automacao-followup', 'Automação Follow-up WhatsApp', 'Categoria: Automações • Falta revisar descrição e gatilho', 'revisar', 'yellow', 'Automações', 'revisar', 2),
('skill-seo-blog', 'Skill SEO para Blog', 'Categoria: Skills • Produto novo para marketplace interno', 'novo', 'pink', 'Skills', 'ativo', 3),
('template-vendas', 'Template Página de Vendas', 'Categoria: Templates • Precisa trocar imagem e CTA', 'editar', 'blue', 'Templates', 'editar', 4)
on conflict (product_key) do nothing;

insert into studio_community_reports (report_key, title, detail, value, tone, reported_user, reporter_user, reason, status)
values
('denuncia-marcos-dev', 'Denúncia contra @marcos.dev', 'Motivo: autopromoção repetida em comentários. Denunciado por @ana.paula.', 'enviar aviso', 'yellow', '@marcos.dev', '@ana.paula', 'autopromoção repetida', 'aberto'),
('post-lojaexpress', 'Post removido de @lojaexpress', 'Motivo: link externo sem contexto e possível spam.', 'revisado', 'red', '@lojaexpress', '@sistema', 'spam/link externo', 'revisado'),
('comentario-criadora', 'Comentário sinalizado de @criadora.ai', 'Motivo: linguagem agressiva em debate sobre preços.', 'analisar', 'pink', '@criadora.ai', '@comunidade', 'linguagem agressiva', 'aberto')
on conflict (report_key) do nothing;

insert into studio_cnpj_notifications (notification_key, title, detail, value, tone, status)
values
('declaracao-mensal', 'Declaração mensal', 'Verificar se há pendência ou obrigação recorrente do mês.', 'atenção', 'yellow', 'aberto'),
('comprovantes-notas', 'Comprovantes e notas', 'Organizar documentos enviados e pendentes para não perder histórico.', 'organizar', 'blue', 'aberto'),
('situacao-cadastral', 'Situação cadastral', 'Monitorar se o CNPJ segue regular e sem alerta crítico.', 'ok', 'green', 'ok')
on conflict (notification_key) do nothing;

insert into studio_subdomains (subdomain_key, name, status, tone)
values
('main', 'sualuma.online', 'Online', 'green'),
('blog', 'blog.sualuma.online', 'Online', 'green'),
('studio', 'studio.sualuma.online', 'Ativo', 'pink'),
('trabalhosja', 'trabalhosja.sualuma.online', 'Atenção', 'yellow'),
('sospublicidade', 'sospublicidade.sualuma.online', 'Verificar', 'red')
on conflict (subdomain_key) do nothing;

insert into studio_subdomain_links (subdomain_key, path, status)
values
('main', '/', 'monitorar'),
('main', '/planos', 'monitorar'),
('main', '/login', 'monitorar'),
('main', '/cadastro', 'monitorar'),
('blog', '/', 'monitorar'),
('blog', '/posts', 'monitorar'),
('blog', '/sitemap.xml', 'monitorar'),
('studio', '/studio-lab', 'monitorar'),
('studio', '/studio', 'monitorar'),
('studio', '/admin', 'monitorar'),
('trabalhosja', '/', 'monitorar'),
('trabalhosja', '/comunidade', 'monitorar'),
('sospublicidade', '/', 'monitorar'),
('sospublicidade', '/obrigada', 'verificar')
on conflict (subdomain_key, path) do nothing;
