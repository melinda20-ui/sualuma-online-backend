import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const posts = await prisma.post.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(posts)
}

export async function POST(req: Request) {
  const { title, slug, excerpt, content, status } = await req.json()
  const post = await prisma.post.create({ data: { title, slug, excerpt, content, status } })
  return NextResponse.json(post)
}
