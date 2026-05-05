# Kit — Sistema de planos, acessos e diagnóstico de usuários

Data: 2026-05-05

## O que foi configurado

Foi criada/refeita a Central de Usuários em:

- `/studio/usuarios-diagnostico`
- `/api/studio/usuarios-diagnostico`

A tela passou a funcionar como uma central de diagnóstico real para verificar:

- Supabase configurado
- catálogo de planos
- permissões por plano
- agentes liberados por plano
- comparação entre catálogo pronto e fluxo real de liberação
- pendências de checkout, webhook, platform/me, proteção de Studio/Admin e dashboards

## Planos cadastrados no catálogo

### Cliente IA

- Básico
- Prime
- Premium
- Pro

### Prestadores

- Gratuito Prestador
- Pacote de Propostas
- Prestador Prioritário
- Agência / Time

### Flowmatic

- Flowmatic Começar
- Rotina Pro
- Solo CEO
- Império Solo

### Templates

- Template Saída Financeira
- Template Mãe Empreendedora

### Teste

- Teste grátis de 30 dias

## O que já ficou pronto

- Catálogo de planos no Supabase
- Permissões dos planos
- Agentes vinculados aos planos
- Diagnóstico visual da Central de Usuários
- Diagnóstico separando:
  - catálogo pronto
  - fluxo real ainda em andamento

Resultado confirmado no terminal:

- Score: 84%
- Críticos: 0
- Planos encontrados: todos
- Catálogo dos planos: OK

## O que ainda está em andamento

Mesmo com o catálogo pronto, ainda falta validar/conectar:

1. Webhook Stripe gravar assinatura/acesso real em `user_subscriptions`
2. `/api/platform/me` devolver plano, permissões e agentes reais do usuário
3. Studio/Admin bloquear usuário comum
4. Dashboards do cliente/prestador esconderem ou liberarem recursos conforme o plano

## Estado correto da Central

A Central não deve dizer que o plano está totalmente pronto só porque existe no Supabase.

Status correto:

- Catálogo do plano: OK
- Fluxo de liberação: em andamento
- Bloqueio/liberação real nas telas: em andamento

## Arquivos principais alterados

- `app/api/studio/usuarios-diagnostico/route.ts`
- `app/studio/usuarios-diagnostico/page.tsx`

## Observação de segurança

Não salvar `.env`, `.env.local`, chaves Stripe, chaves Supabase, tokens ou secrets no Git.

## Atualização — /api/platform/me

A rota `/api/platform/me` foi atualizada para funcionar como a carteirinha real do usuário.

Agora ela busca:

- usuário autenticado
- assinatura em `user_subscriptions`
- plano em `plans`
- permissões em `plan_entitlements`
- agentes em `plan_agents`

A Central de Usuários passou a marcar:

- `/api/platform/me devolve plano e permissões reais`: OK

Ainda falta:

- webhook Stripe gravar compra/assinatura em `user_subscriptions`
- Studio/Admin bloquear usuário comum
- dashboards usarem `/api/platform/me` para liberar/bloquear recursos
