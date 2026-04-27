import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { name, email, respostas } = body

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from('leads')
      .insert({
        nome: name,
        email: email,
        origem: JSON.stringify(respostas)
      })

    if (error) {
      console.log("ERRO SUPABASE:", error)
      return new Response(JSON.stringify(error), { status: 500 })
    }

    return new Response(JSON.stringify({ ok: true }))
  } catch (err) {
    console.log("ERRO GERAL:", err)
    return new Response("Erro interno", { status: 500 })
  }
}
