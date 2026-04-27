import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function emailBoasVindas(nome: string) {
  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Você está na lista</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:30px 0;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;">
            
            <tr>
              <td style="padding:45px 42px 20px 42px;">
                <h1 style="margin:0;color:#6366f1;font-size:48px;line-height:0.95;font-weight:900;letter-spacing:-1px;">
                  SUALUMA<br/>ONLINE
                </h1>
                <p style="margin:12px 0 0 0;color:#111827;font-size:14px;letter-spacing:5px;">
                  ECOSSISTEMA DIGITAL
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:50px 42px 10px 42px;">
                <h2 style="margin:0;font-size:58px;line-height:1.08;color:#1f2937;font-weight:900;">
                  Você<br/>está na<br/>lista. 💜
                </h2>
              </td>
            </tr>

            <tr>
              <td style="padding:25px 42px 10px 42px;">
                <p style="font-size:25px;line-height:1.65;color:#4b5563;margin:0;">
                  Olá ${nome || 'Lead'}, seu cadastro na lista de espera da Sualuma Online foi recebido com sucesso.
                  Você agora está entre as pessoas que receberão em primeira mão as novidades sobre nosso lançamento beta.
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:34px 42px 45px 42px;">
                <a href="https://blog.sualuma.online" 
                   style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-size:22px;font-weight:800;letter-spacing:2px;padding:26px 44px;border-radius:6px;">
                  ACOMPANHAR NOVIDADES
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:0 42px;">
                <hr style="border:none;border-top:1px solid #e5e7eb;" />
              </td>
            </tr>

            <tr>
              <td style="padding:55px 42px 10px 42px;">
                <h2 style="font-size:36px;line-height:1.2;margin:0 0 28px 0;color:#1f2937;">
                  O que estamos preparando
                </h2>

                <p style="font-size:25px;line-height:1.65;color:#4b5563;margin:0 0 30px 0;">
                  A Sualuma Online está sendo criada para reunir agentes de IA, automações, aplicativos de organização,
                  marketplace, cursos e dashboards em um só lugar.
                </p>

                <p style="font-size:24px;line-height:1.8;color:#1f2937;margin:0;font-weight:800;">
                  → Bastidores do lançamento<br/>
                  → Primeiras liberações<br/>
                  → Convites para testes gratuitos<br/>
                  → Atualizações dos sistemas
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:50px 42px 10px 42px;">
                <div style="width:160px;height:7px;background:#6366f1;border-radius:99px;margin-bottom:48px;"></div>

                <h3 style="font-size:30px;margin:0 0 25px 0;color:#1f2937;">
                  Importante:
                </h3>

                <p style="font-size:25px;line-height:1.65;color:#4b5563;margin:0;">
                  Salve este e-mail nos seus favoritos e, se puder, responda com um 
                  <strong style="color:#6366f1;">“quero participar”</strong> para garantir que nossas mensagens cheguem até você.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:50px 42px 20px 42px;">
                <p style="font-size:25px;line-height:1.65;color:#4b5563;margin:0;">
                  Obrigada por entrar nessa fase inicial com a gente. O lançamento está apenas começando —
                  e você vai ver tudo antes de muita gente.
                </p>

                <p style="font-size:25px;line-height:1.65;color:#1f2937;margin:45px 0 0 0;">
                  Com carinho,<br/>
                  <strong>Equipe Sualuma Online</strong>
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:35px 42px 55px 42px;">
                <a href="https://blog.sualuma.online" 
                   style="display:inline-block;border:3px solid #6366f1;color:#6366f1;text-decoration:none;font-size:22px;font-weight:900;letter-spacing:2px;padding:25px 55px;border-radius:6px;">
                  VISITE NOSSO SITE
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:35px 42px;background:#ffffff;border-top:1px solid #e5e7eb;">
                <p style="font-size:18px;line-height:1.5;color:#9ca3af;margin:0;">
                  Sualuma Online<br/>
                  sualuma.online<br/>
                  Você recebeu este e-mail porque se inscreveu em nossa lista de espera.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `
}

async function enviarEmailBoasVindas(email: string, nome: string) {
  const apiKey = process.env.BREVO_API_KEY

  if (!apiKey) {
    console.log('BREVO_API_KEY não encontrada.')
    return
  }

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        name: 'Sualuma Online',
        email: 'noreply@sualuma.online'
      },
      to: [
        {
          email,
          name: nome || 'Lead'
        }
      ],
      subject: 'Você está na lista 💜',
      htmlContent: emailBoasVindas(nome)
    })
  })
}

// GET → BUSCAR LEADS
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

// POST → SALVAR LEAD + PUXAR NOME DO BANCO + ENVIAR EMAIL AUTOMÁTICO
export async function POST(req: Request) {
  try {
    const body = await req.json()

    const email = String(body.email || '').trim().toLowerCase()
    const origem = body.origem || 'Home Sualuma Online'

    if (!email) {
      return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 })
    }

    let nomeFinal = String(body.name || body.nome || '').trim()

    // Se o nome não veio no formulário, tenta buscar pelo e-mail na tabela leads
    if (!nomeFinal) {
      const { data: leadExistente } = await supabase
        .from('leads')
        .select('nome')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (leadExistente?.nome) {
        nomeFinal = leadExistente.nome
      }
    }

    if (!nomeFinal) {
      nomeFinal = 'Lead'
    }

    // Salva o lead e pega o nome exatamente como ficou no banco
    const { data: leadSalvo, error } = await supabase
      .from('leads')
      .insert({
        nome: nomeFinal,
        email,
        origem
      })
      .select('nome, email')
      .single()

    if (error) {
      console.log('ERRO SUPABASE:', error)
      return NextResponse.json({ error }, { status: 500 })
    }

    const nomeDoBanco = leadSalvo?.nome || nomeFinal

    await enviarEmailBoasVindas(email, nomeDoBanco)

    return NextResponse.json({ success: true, nome: nomeDoBanco })
  } catch (err) {
    console.log('ERRO GERAL:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
