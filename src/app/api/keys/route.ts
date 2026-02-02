import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateApiKey } from '@/lib/utils'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      key: true,
      createdAt: true,
      lastUsed: true,
      revoked: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Mask keys for display
  const maskedKeys = keys.map(k => ({
    ...k,
    key: k.key.substring(0, 7) + '...' + k.key.substring(k.key.length - 4),
  }))

  return NextResponse.json({ keys: maskedKeys })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name } = body

  if (!name) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }

  const key = generateApiKey()
  
  const apiKey = await prisma.apiKey.create({
    data: {
      name,
      key,
      userId: session.user.id,
    },
  })

  // Return full key only on creation
  return NextResponse.json({
    apiKey: {
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.key, // Full key shown only once
      createdAt: apiKey.createdAt,
    },
  })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const keyId = searchParams.get('id')

  if (!keyId) {
    return NextResponse.json({ error: 'Key ID required' }, { status: 400 })
  }

  // Revoke instead of delete for audit trail
  await prisma.apiKey.updateMany({
    where: { id: keyId, userId: session.user.id },
    data: { revoked: true },
  })

  return NextResponse.json({ success: true })
}
