create table if not exists public.studio_finance_summary (
  id text primary key default 'main',
  operating_balance numeric default 36320,
  revenue numeric default 48750,
  costs numeric default 12430,
  reinvestment numeric default 8600,
  profit_label text default 'Lucro líquido após custos principais do mês',
  revenue_growth text default '+18,6%',
  costs_growth text default 'controlado',
  reinvestment_growth text default '+12%',
  health_score integer default 82,
  mia_summary text default 'O financeiro está saudável, mas precisa separar origem da receita, custos fixos, custos variáveis e ROI dos agentes antes de escalar.',
  updated_at timestamptz default now()
);

create table if not exists public.studio_finance_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  value text not null,
  detail text not null,
  tone text default 'blue',
  priority integer default 100,
  updated_at timestamptz default now()
);

create table if not exists public.studio_finance_revenue_rows (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text not null,
  value text not null,
  tone text default 'green',
  priority integer default 100,
  updated_at timestamptz default now()
);

create table if not exists public.studio_finance_bars (
  id uuid primary key default gen_random_uuid(),
  group_key text not null default 'revenue',
  label text not null,
  value text not null,
  percent integer default 50,
  tone text default 'blue',
  priority integer default 100,
  updated_at timestamptz default now()
);

create table if not exists public.studio_finance_cost_rows (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text not null,
  value text not null,
  tone text default 'yellow',
  priority integer default 100,
  updated_at timestamptz default now()
);

create table if not exists public.studio_finance_projection_rows (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text not null,
  value text not null,
  tone text default 'pink',
  priority integer default 100,
  updated_at timestamptz default now()
);

create table if not exists public.studio_finance_mia_rows (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text not null,
  value text not null,
  tone text default 'blue',
  priority integer default 100,
  updated_at timestamptz default now()
);

insert into public.studio_finance_summary (
  id,
  operating_balance,
  revenue,
  costs,
  reinvestment,
  profit_label,
  revenue_growth,
  costs_growth,
  reinvestment_growth,
  health_score,
  mia_summary
)
values (
  'main',
  36320,
  48750,
  12430,
  8600,
  'Lucro líquido após custos principais do mês',
  '+18,6%',
  'controlado',
  '+12%',
  82,
  'O financeiro está saudável, mas precisa separar origem da receita, custos fixos, custos variáveis e ROI dos agentes antes de escalar.'
)
on conflict (id) do update set
  operating_balance = excluded.operating_balance,
  revenue = excluded.revenue,
  costs = excluded.costs,
  reinvestment = excluded.reinvestment,
  profit_label = excluded.profit_label,
  revenue_growth = excluded.revenue_growth,
  costs_growth = excluded.costs_growth,
  reinvestment_growth = excluded.reinvestment_growth,
  health_score = excluded.health_score,
  mia_summary = excluded.mia_summary,
  updated_at = now();

truncate table public.studio_finance_cards restart identity;
truncate table public.studio_finance_revenue_rows restart identity;
truncate table public.studio_finance_bars restart identity;
truncate table public.studio_finance_cost_rows restart identity;
truncate table public.studio_finance_projection_rows restart identity;
truncate table public.studio_finance_mia_rows restart identity;

insert into public.studio_finance_cards (title, value, detail, tone, priority) values
('Receita total', 'R$ 48.750', 'Entradas estimadas do mês atual', 'green', 1),
('Custos principais', 'R$ 12.430', 'Infraestrutura, ferramentas e operação', 'yellow', 2),
('Saldo operacional', 'R$ 36.320', 'Valor livre depois dos custos principais', 'pink', 3),
('Reinvestimento', 'R$ 8.600', 'Valor reservado para crescimento e aquisição', 'blue', 4);

insert into public.studio_finance_revenue_rows (title, detail, value, tone, priority) values
('Serviços contratados', 'Sites, páginas, automações e entregas personalizadas', 'R$ 22.500', 'green', 1),
('Planos recorrentes', 'Assinaturas, membros e acesso ao ecossistema', 'R$ 14.800', 'pink', 2),
('Produtos digitais', 'Templates, agentes, skills e cursos', 'R$ 7.950', 'blue', 3),
('Comissões e afiliados', 'Indicações, cupons e parcerias comerciais', 'R$ 3.500', 'yellow', 4);

insert into public.studio_finance_bars (group_key, label, value, percent, tone, priority) values
('revenue', 'Serviços', '46%', 46, 'green', 1),
('revenue', 'Recorrência', '30%', 30, 'pink', 2),
('revenue', 'Produtos', '16%', 16, 'blue', 3),
('revenue', 'Afiliados', '8%', 8, 'yellow', 4),
('cost', 'Infraestrutura', '35%', 35, 'blue', 1),
('cost', 'Ferramentas IA', '28%', 28, 'pink', 2),
('cost', 'Operação', '22%', 22, 'yellow', 3),
('cost', 'Marketing', '15%', 15, 'green', 4);

insert into public.studio_finance_cost_rows (title, detail, value, tone, priority) values
('Servidor e infraestrutura', 'VPS, banco, domínios, storage e serviços técnicos', 'R$ 3.980', 'blue', 1),
('Ferramentas e APIs', 'IA, e-mail, automações e integrações externas', 'R$ 3.420', 'pink', 2),
('Operação e freelancers', 'Apoio em design, edição, manutenção e entregas', 'R$ 3.210', 'yellow', 3),
('Marketing e aquisição', 'Tráfego, criativos, conteúdo e campanhas', 'R$ 1.820', 'green', 4);

insert into public.studio_finance_projection_rows (title, detail, value, tone, priority) values
('Cenário conservador', 'Mantendo ritmo atual sem novas campanhas fortes', 'R$ 42k', 'yellow', 1),
('Cenário provável', 'Com conversão normal dos leads e ofertas ativas', 'R$ 58k', 'blue', 2),
('Cenário agressivo', 'Com campanha, parceria e vendas recorrentes', 'R$ 80k+', 'pink', 3);

insert into public.studio_finance_mia_rows (title, detail, value, tone, priority) values
('Separar origem da receita', 'Diferenciar serviço, assinatura, produto digital e comissão', 'prioridade', 'pink', 1),
('Controlar custo por entrega', 'Cada serviço precisa mostrar margem real antes de escalar', 'urgente', 'yellow', 2),
('Criar caixa de reinvestimento', 'Reservar percentual fixo para tráfego, automação e produto', 'crescimento', 'green', 3),
('Medir ROI dos agentes', 'Comparar economia de tempo com custo de IA e operação', 'inteligência', 'blue', 4);
