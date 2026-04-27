import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email, name, subject, htmlContent } = await req.json()

    // ⚠️ USA O MESMO MÉTODO QUE VOCÊ JÁ TEM DE ENVIO
    // Aqui você adapta pro seu sendEmail atual

    await fetch('http://localhost:3000/api/send-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject,
        htmlContent: htmlContent.replace(/{{name}}/g, name),
        only: email // 👈 importante (vamos usar isso)
      })
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao enviar' }, { status: 500 })
  }
}
