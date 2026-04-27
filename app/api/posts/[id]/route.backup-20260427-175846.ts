import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await req.json()
  const post = await prisma.post.update({ where: { id: Number(id) }, data })
  return NextResponse.json(post)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.post.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
