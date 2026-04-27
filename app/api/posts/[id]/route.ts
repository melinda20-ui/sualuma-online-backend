import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function getId(value: string) {
  const id = Number(value)

  if (!Number.isFinite(id)) {
    return null
  }

  return id
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const id = getId(rawId)

    if (!id) {
      return NextResponse.json(
        { error: 'ID inválido.' },
        { status: 400 }
      )
    }

    const body = await req.json()

    const title = String(body?.title || '').trim()
    const excerpt = String(body?.excerpt || '').trim()
    const content = String(body?.content || '').trim()
    const status = String(body?.status || 'draft').trim()
    const slug = body?.slug ? slugify(String(body.slug)) : undefined

    if (!title) {
      return NextResponse.json(
        { error: 'Título é obrigatório.' },
        { status: 400 }
      )
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Conteúdo é obrigatório.' },
        { status: 400 }
      )
    }

    const post = await prisma.post.update({
      where: {
        id,
      },
      data: {
        title,
        ...(slug ? { slug } : {}),
        excerpt,
        content,
        status,
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Erro ao atualizar post:', error)

    return NextResponse.json(
      { error: 'Erro ao atualizar post.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const id = getId(rawId)

    if (!id) {
      return NextResponse.json(
        { error: 'ID inválido.' },
        { status: 400 }
      )
    }

    await prisma.post.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({
      ok: true,
      deletedId: id,
    })
  } catch (error) {
    console.error('Erro ao deletar post:', error)

    return NextResponse.json(
      { error: 'Erro ao deletar post.' },
      { status: 500 }
    )
  }
}
