# Auditoria Cliente / Dashboard do Cliente

Thu May  7 12:13:28 UTC 2026

## Rotas encontradas
app/api/cliente/agentes/route.ts
app/api/cliente/dashboard/route.ts
app/api/cliente/entregas/route.ts
app/api/cliente/indique/links/route.ts
app/api/cliente/mensagens/route.ts
app/api/cliente/notificacoes/route.ts
app/api/cliente/projetos/route.ts
app/api/cliente/resumo/route.ts
app/api/cliente/reunioes/confirmar/route.ts
app/api/cliente/reunioes/negar/route.ts
app/api/cliente/reunioes/responder-proposta/route.ts
app/api/cliente/reunioes/route.ts
app/api/cliente/reunioes/solicitar/route.ts

## Sinais de isolamento por usuário
app/api/cliente/mensagens/route.ts:12:  const data = await readClientDashboard(auth.tenantId)
app/api/cliente/mensagens/route.ts:49:    const data = await readClientDashboard(auth.tenantId)
app/api/cliente/mensagens/route.ts:53:    await saveClientDashboard(data, auth.tenantId)
app/api/cliente/dashboard/route.ts:12:  const data = await readClientDashboard(auth.tenantId)
app/api/cliente/notificacoes/route.ts:160:    const data = await readClientDashboard(auth.tenantId) as any
app/api/cliente/notificacoes/route.ts:202:    const data = await readClientDashboard(auth.tenantId) as any
app/api/cliente/notificacoes/route.ts:225:    await saveClientDashboard(data, auth.tenantId)
app/api/cliente/entregas/route.ts:12:  const data = await readClientDashboard(auth.tenantId)
app/api/cliente/entregas/route.ts:50:    const data = await readClientDashboard(auth.tenantId)
app/api/cliente/entregas/route.ts:54:    await saveClientDashboard(data, auth.tenantId)
app/api/cliente/resumo/route.ts:12:  const data = await readClientDashboard(auth.tenantId)
app/api/cliente/projetos/route.ts:2:import { createClient } from '@/lib/supabase/server'
app/api/cliente/projetos/route.ts:14:  const supabase = await createClient()
app/api/cliente/projetos/route.ts:19:  } = await supabase.auth.getUser()
app/api/cliente/projetos/route.ts:26:        { status: 401 }
app/api/cliente/projetos/route.ts:34:    tenantId: clientTenantIdFromUserId(user.id),
app/api/cliente/projetos/route.ts:45:  const data = await readClientDashboard(auth.tenantId)
app/api/cliente/projetos/route.ts:81:    const data = await readClientDashboard(auth.tenantId)
app/api/cliente/projetos/route.ts:94:    await saveClientDashboard(data, auth.tenantId)
app/api/cliente/reunioes/confirmar/route.ts:242:    const data = await readClientDashboard(auth.tenantId) as any
app/api/cliente/reunioes/confirmar/route.ts:354:    const data = await readClientDashboard(auth.tenantId) as any
app/api/cliente/reunioes/confirmar/route.ts:374:    await saveClientDashboard(data, auth.tenantId)
app/api/cliente/reunioes/route.ts:12:  const data = await readClientDashboard(auth.tenantId)
app/api/cliente/reunioes/route.ts:52:    const data = await readClientDashboard(auth.tenantId)
app/api/cliente/reunioes/route.ts:56:    await saveClientDashboard(data, auth.tenantId)
app/api/cliente/reunioes/responder-proposta/route.ts:165:    const data = await readClientDashboard(auth.tenantId) as any
app/api/cliente/reunioes/responder-proposta/route.ts:190:      await saveClientDashboard(data, auth.tenantId)
app/api/cliente/reunioes/responder-proposta/route.ts:246:      await saveClientDashboard(data, auth.tenantId)
app/api/cliente/reunioes/solicitar/route.ts:62:    const data = await readClientDashboard(auth.tenantId) as any
app/api/cliente/reunioes/solicitar/route.ts:133:    await saveClientDashboard(data, auth.tenantId)
app/api/cliente/reunioes/negar/route.ts:213:    const data = await readClientDashboard(auth.tenantId) as any
app/api/cliente/reunioes/negar/route.ts:283:    const data = await readClientDashboard(auth.tenantId) as any
app/api/cliente/reunioes/negar/route.ts:300:    await saveClientDashboard(data, auth.tenantId)
app/api/cliente/agentes/route.ts:12:  const data = await readClientDashboard(auth.tenantId)
app/api/cliente/agentes/route.ts:40:    const data = await readClientDashboard(auth.tenantId)
app/api/cliente/agentes/route.ts:44:    await saveClientDashboard(data, auth.tenantId)
lib/client-tenant-auth.ts:2:import { createClient } from '@/lib/supabase/server'
lib/client-tenant-auth.ts:12:  const supabase = await createClient()
lib/client-tenant-auth.ts:17:  } = await supabase.auth.getUser()
lib/client-tenant-auth.ts:24:        { status: 401 }
lib/client-tenant-auth.ts:32:    tenantId: clientTenantIdFromUserId(user.id),
lib/client-tenant-auth.ts:36:export const getClientTenant = getClienteTenant
lib/client-dashboard-store.ts:4:  readTenantJson,
lib/client-dashboard-store.ts:5:  tenantIdFromUserId,
lib/client-dashboard-store.ts:6:  writeTenantJson,
lib/client-dashboard-store.ts:100:const filePath = path.join(process.cwd(), 'data', 'client-dashboard.json')
lib/client-dashboard-store.ts:137:  return tenantIdFromUserId(userId)
lib/client-dashboard-store.ts:140:export async function readClientDashboard(tenantId?: string): Promise<ClientDashboardData> {
lib/client-dashboard-store.ts:141:  if (tenantId) {
lib/client-dashboard-store.ts:142:    const data = readTenantJson<Partial<ClientDashboardData>>(
lib/client-dashboard-store.ts:143:      tenantId,
lib/client-dashboard-store.ts:161:export async function saveClientDashboard(data: ClientDashboardData, tenantId?: string) {
lib/client-dashboard-store.ts:164:  if (tenantId) {
lib/client-dashboard-store.ts:165:    writeTenantJson(tenantId, tenantDashboardFile, normalized)
