# Relatório manual — Isolamento de usuários / Casinha Sualuma

## Status geral

O isolamento por usuário já avançou bastante, mas ainda não está 100% concluído em toda a plataforma.

## Já feito / evidências

### 1. Cliente / Dashboard do cliente
Status: CONCLUÍDO PARCIALMENTE / EM VALIDAÇÃO

Evidências:
- APIs principais do cliente foram ajustadas para usar tenantId / casinha.
- API principal sem login retorna 401 corretamente.
- Leitura global antiga do dashboard do cliente foi removida das rotas principais.
- Helper `lib/client-tenant-auth.ts` existe.
- Store `lib/client-dashboard-store.ts` já aceita tenantId.
- Tenant store existe em `lib/tenant/tenant-store.ts`.

Pendente:
- Testar com duas contas reais: Conta A e Conta B.
- Confirmar que uma conta não vê projetos, reuniões, mensagens, notificações ou agentes da outra.

### 2. FlowMind / Flowmatic
Status: CONCLUÍDO PARCIALMENTE / EM VALIDAÇÃO

Evidências:
- API `/api/flowmind/workspace` passou a exigir login.
- Sem login retorna 401.
- Página `/flowmind/meus-templates` sem login redireciona para login.
- Helper `lib/flowmind-tenant-auth.ts` existe.
- Templates/workspaces passaram a usar tenant store por usuário.
- Build passou depois das correções.

Pendente:
- Testar com duas contas reais.
- Confirmar que cada conta vê apenas seus próprios templates/workspaces.

### 3. Chat / Mia
Status: BOM SINAL / PRECISA TESTE REAL

Evidências:
- Rotas `/api/sualuma-chat/conversations` e `/api/sualuma-chat/messages` usam `supabase.auth.getUser()`.
- Consultas filtram por `user_id`.
- Mensagens são gravadas com `user_id`.

Pendente:
- Testar histórico da Mia com duas contas diferentes.
- Confirmar que uma conta não vê conversas da outra.

### 4. Comunidade
Status: PARCIAL / PRECISA AUDITORIA

Evidências:
- Posts, comentários, compartilhamentos e pedidos de contato usam campos como `author_user_id` e `requester_user_id`.
- Perfil usa usuário autenticado.

Risco:
- Ainda existem fallbacks em JSON local para comunidade.
- Precisa separar claramente o que é público do que é privado.

Pendente:
- Confirmar edição/deleção apenas pelo dono.
- Confirmar que mensagens, pedidos, denúncias e permissões são por usuário.

### 5. Loja de agentes
Status: NÃO CONCLUÍDO

Evidências:
- Catálogo é global, o que está correto.
- Produtos e reviews ficam em JSON global.

Pendente:
- Isolar compras por usuário.
- Isolar agentes comprados.
- Isolar créditos.
- Isolar favoritos, avaliações e permissões.
- Garantir que o acesso aos agentes comprados venha da conta logada.

### 6. Prestador de serviços
Status: NÃO CONCLUÍDO / PRIORIDADE ALTA

Evidências:
- Algumas rotas usam autenticação, como `portfolio-sync`.

Pendente:
- Auditar dashboard do prestador.
- Auditar kanban.
- Auditar oportunidades.
- Auditar reuniões.
- Auditar chat.
- Garantir que prestador A não veja dados do prestador B.

### 7. Studio / Admin
Status: EM ANDAMENTO

Evidências:
- Páginas do Studio redirecionam usuário sem admin/login.
- Área administrativa está protegida em várias rotas.

Pendente:
- Garantir que usuário comum nunca acesse Studio.
- Separar dados administrativos globais dos dados privados de usuários.

## Resumo para o Gestor de Tarefas

Marcar como concluído ou quase concluído:
- Cliente / Dashboard do cliente: isolamento implementado, falta teste com duas contas.
- FlowMind / Flowmatic: isolamento implementado, falta teste com duas contas.
- Chat / Mia: usa user_id, falta teste real com duas contas.

Manter em andamento:
- Comunidade.
- Studio/Admin.
- Auditoria geral de acesso por plano.

Manter como pendente/urgente:
- Loja de agentes: compras, créditos e agentes comprados por usuário.
- Prestador de serviços: dashboard, kanban, reuniões, oportunidades e chat.

Regra:
Não criar tarefas novas automaticamente. Apenas atualizar a tarefa existente de isolamento por usuário com este relatório.
