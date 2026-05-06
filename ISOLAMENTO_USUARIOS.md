# Isolamento de usuários — Sualuma

Objetivo:
Cada usuário precisa ter sua própria "casa" dentro do sistema.

Regra principal:
Nada pode ser salvo ou carregado de forma global sem user_id ou workspace_id.

Modelo simples:
- Usuário comum: casa individual.
- Prestador: casa individual + perfil de prestador.
- Empresa/equipe: workspace compartilhado.
- Admin: pode visualizar todas as casas pelo Studio.

Arquivos JSON:
Antes:
data/projetos.json
data/mensagens.json
data/agentes.json

Depois:
data/tenants/user_xxxxx/projetos.json
data/tenants/user_xxxxx/mensagens.json
data/tenants/user_xxxxx/agentes.json

Regra técnica:
Toda rota precisa descobrir quem é o usuário logado e salvar/ler apenas dentro da casa dele.

Exemplo:
tenantId = tenantIdFromUserId(user.id)

Nunca fazer:
ler todos os projetos globais para usuário comum.

Pode fazer:
Admin/Studio pode ler várias casas, com permissão administrativa.
