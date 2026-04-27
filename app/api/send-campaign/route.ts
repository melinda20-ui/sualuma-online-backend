import { createClient } from '@supabase/supabase-js'
import * as SibApiV3Sdk from '@getbrevo/brevo'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { subject, htmlContent } = await req.json()

  const { data: leads, error } = await supabase
    .from('leads')
    .select('email, nome')

  if (error) return Response.json({ error }, { status: 500 })

  const results = []

  for (const lead of leads) {
    try {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY!,
        },
        body: JSON.stringify({
          sender: { name: 'Sualuma Online', email: 'noreply@sualuma.online' },
          to: [{ email: lead.email, name: lead.nome || '' }],
          subject: subject,
          htmlContent: htmlContent.replace('{{name}}', lead.nome || 'você'),
        }),
      })
      results.push({ email: lead.email, status: 'sent' })
    } catch (e) {
      results.push({ email: lead.email, status: 'error' })
    }
    await new Promise(r => setTimeout(r, 200))
  }

  return Response.json({ sent: results.length, results })
}
