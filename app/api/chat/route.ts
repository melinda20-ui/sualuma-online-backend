export async function POST(req: Request) {
  try {
    const body = await req.json()
    const message = body.message

    return Response.json({
      reply: `Você disse: ${message}`,
    })
  } catch (error) {
    return Response.json(
      { error: "Erro no backend" },
      { status: 500 }
    )
  }
}
