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

async function makeUniqueSlug(title: string) {
  const base = slugify(title) || `post-${Date.now()}`
  let slug = base
  let count = 1

  while (await prisma.post.findFirst({ where: { slug } })) {
    slug = `${base}-${count}`
    count++
  }

  return slug
}

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Erro ao listar posts:', error)

    return NextResponse.json(
      { error: 'Erro ao listar posts.' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const title = String(body?.title || '').trim()
    const excerpt = String(body?.excerpt || '').trim()
    const content = String(body?.content || '').trim()
    const status = String(body?.status || 'draft').trim()

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

    const slug = body?.slug
      ? slugify(String(body.slug))
      : await makeUniqueSlug(title)

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        status,
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar post:', error)

    return NextResponse.json(
      { error: 'Erro ao criar post.' },
      { status: 500 }
    )
  }
}
