import { NextResponse } from 'next/server'
import { readClientDashboard } from '@/lib/client-dashboard-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await readClientDashboard()
  const now = Date.now()

  const projetosEmAndamento = data.projects.filter(
    (project) => project.status !== 'concluido'
  ).length

  const entregasPendentes = data.deliveries.filter(
    (delivery) =>
      delivery.status === 'pendente_revisao' ||
      delivery.status === 'aguardando_cliente'
  ).length

  const mensagensNaoLidas = data.messages.filter(
    (message) => !message.read
  ).length

  const proximasReunioes = data.meetings.filter((meeting) => {
    const meetingTime = new Date(meeting.scheduledAt).getTime()
    return meeting.status !== 'cancelada' && meetingTime >= now
  }).length

  const agentesDisponiveis = data.agents.filter(
    (agent) => agent.status === 'disponivel'
  ).length

  return NextResponse.json({
    customer: data.customer,
    counts: {
      projetosEmAndamento,
      entregasPendentes,
      mensagensNaoLidas,
      proximasReunioes,
      agentesDisponiveis,
      totalProjetos: data.projects.length,
      totalEntregas: data.deliveries.length,
      totalMensagens: data.messages.length,
    },
    cards: [
      {
        label: 'Projetos em andamento',
        value: projetosEmAndamento,
      },
      {
        label: 'Entrega pendente de revisão',
        value: entregasPendentes,
      },
      {
        label: 'Mensagens aguardando resposta',
        value: mensagensNaoLidas,
      },
    ],
    updatedAt: new Date().toISOString(),
  })
}
