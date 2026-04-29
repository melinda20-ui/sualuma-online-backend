create table if not exists studio_stripe_summary (
  id integer primary key default 1,
  connected boolean not null default false,
  mode text not null default 'not_configured',
  title text not null default 'Stripe não conectado',
  monthly_revenue text not null default 'R$ 0,00',
  successful_payments text not null default '0',
  active_subscriptions text not null default '0',
  failed_payments text not null default '0',
  health_score integer not null default 0,
  summary text not null default 'Stripe ainda não conectado. Assim que a chave secreta e o webhook forem configurados, esta aba poderá puxar pagamentos, assinaturas e falhas reais.',
  updated_at timestamptz not null default now(),
  constraint studio_stripe_summary_singleton check (id = 1)
);

create table if not exists studio_stripe_cards (
  id bigserial primary key,
  title text not null,
  value text not null,
  detail text not null,
  tone text not null default 'yellow',
  priority integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists studio_stripe_payment_rows (
  id bigserial primary key,
  title text not null,
  value text not null,
  detail text not null,
  tone text not null default 'yellow',
  priority integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists studio_stripe_subscription_rows (
  id bigserial primary key,
  title text not null,
  value text not null,
  detail text not null,
  tone text not null default 'yellow',
  priority integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists studio_stripe_action_rows (
  id bigserial primary key,
  title text not null,
  value text not null,
  detail text not null,
  tone text not null default 'yellow',
  priority integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists studio_stripe_alert_rows (
  id bigserial primary key,
  title text not null,
  value text not null,
  detail text not null,
  tone text not null default 'yellow',
  priority integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists studio_stripe_revenue_bars (
  id bigserial primary key,
  label text not null,
  value text not null,
  tone text not null default 'blue',
  priority integer not null default 1,
  created_at timestamptz not null default now()
);

insert into studio_stripe_summary (
  id,
  connected,
  mode,
  title,
  monthly_revenue,
  successful_payments,
  active_subscriptions,
  failed_payments,
  health_score,
  summary,
  updated_at
)
values (
  1,
  false,
  'not_configured',
  'Stripe não conectado',
  'R$ 0,00',
  '0',
  '0',
  '0',
  0,
  'Stripe ainda não conectado. Os dados reais só aparecerão depois de configurar STRIPE_SECRET_KEY e webhook seguro no backend.',
  now()
)
on conflict (id) do update set
  connected = excluded.connected,
  mode = excluded.mode,
  title = excluded.title,
  monthly_revenue = excluded.monthly_revenue,
  successful_payments = excluded.successful_payments,
  active_subscriptions = excluded.active_subscriptions,
  failed_payments = excluded.failed_payments,
  health_score = excluded.health_score,
  summary = excluded.summary,
  updated_at = now();

truncate table
  studio_stripe_cards,
  studio_stripe_payment_rows,
  studio_stripe_subscription_rows,
  studio_stripe_action_rows,
  studio_stripe_alert_rows,
  studio_stripe_revenue_bars
restart identity;

insert into studio_stripe_cards (title, value, detail, tone, priority) values
('Receita Stripe', 'R$ 0,00', 'Nenhuma cobrança real conectada ainda.', 'yellow', 1),
('Pagamentos aprovados', '0', 'Aguardando conexão com a API do Stripe.', 'blue', 2),
('Assinaturas ativas', '0', 'Sem leitura real de assinaturas no momento.', 'pink', 3),
('Falhas de pagamento', '0', 'Sem eventos reais de falha recebidos ainda.', 'green', 4);

insert into studio_stripe_payment_rows (title, value, detail, tone, priority) values
('Checkout', 'pendente', 'Criar ou conectar sessões reais de checkout.', 'yellow', 1),
('Pagamentos recentes', '0', 'Aguardando leitura da API do Stripe.', 'blue', 2),
('Reembolsos', '0', 'Sem dados reais de reembolso conectados.', 'green', 3),
('Disputas', '0', 'Sem dados reais de disputa conectados.', 'pink', 4);

insert into studio_stripe_subscription_rows (title, value, detail, tone, priority) values
('Plano Básico', '0 assinantes', 'Aguardando produtos/preços do Stripe.', 'blue', 1),
('Plano Prime', '0 assinantes', 'Aguardando produtos/preços do Stripe.', 'pink', 2),
('Plano Premium', '0 assinantes', 'Aguardando produtos/preços do Stripe.', 'green', 3),
('Cancelamentos', '0', 'Sem eventos reais recebidos.', 'yellow', 4);

insert into studio_stripe_action_rows (title, value, detail, tone, priority) values
('Conectar chave secreta', 'necessário', 'Adicionar STRIPE_SECRET_KEY no .env.local do servidor.', 'yellow', 1),
('Configurar webhook', 'necessário', 'Criar endpoint seguro para eventos de checkout, invoice e subscription.', 'pink', 2),
('Mapear produtos', 'pendente', 'Ligar planos do site aos price_ids do Stripe.', 'blue', 3),
('Sincronizar financeiro', 'pendente', 'Usar pagamentos reais para alimentar a aba Financeiro.', 'green', 4);

insert into studio_stripe_alert_rows (title, value, detail, tone, priority) values
('Stripe não conectado', 'atenção', 'A aba ainda não está puxando dados reais da Stripe.', 'yellow', 1),
('Não inventar receita', 'correto', 'Enquanto não houver chave/API, manter valores zerados ou demonstrativos identificados.', 'green', 2),
('Webhook obrigatório', 'próximo passo', 'Sem webhook, o sistema não recebe confirmações automáticas de pagamento.', 'pink', 3),
('Chaves secretas', 'privado', 'Nunca colar chave secreta no chat. Configurar só dentro do servidor.', 'blue', 4);

insert into studio_stripe_revenue_bars (label, value, tone, priority) values
('Planos', '0%', 'pink', 1),
('Serviços', '0%', 'green', 2),
('Cursos', '0%', 'blue', 3),
('Extras', '0%', 'yellow', 4);
