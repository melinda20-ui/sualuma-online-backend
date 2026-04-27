import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ✅ GET → BUSCAR LEADS (admin usa isso)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.log('ERRO GET:', error)
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Erro geral' }, { status: 500 })
  }
}


// ✅ POST → SALVAR LEAD
export async function POST(req: Request) {
  try {
    const { name, email } = await req.json()

    const { error } = await supabase
      .from('leads')
      .insert({
        nome: name || 'Lead',
        email: email
      })

    if (error) {
      console.log('ERRO SUPABASE:', error)
      return NextResponse.json({ error }, { status: 500 })
    }

    // 🚀 email automático
    await fetch('http://localhost:3000/api/send-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'Bem-vindo 🎁',
        htmlContent: `<h1>Olá ${name}</h1><p>Você entrou na lista 🚀</p>`
      })
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.log('ERRO GERAL:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
