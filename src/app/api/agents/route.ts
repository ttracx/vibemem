import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { checkLimits, TIER_LIMITS } from '@/lib/memory-engine'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agents = await prisma.agent.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: {
          memorySessions: true,
          shortTermMemory: true,
          longTermMemory: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ agents })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, description } = body

  if (!name) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }

  // Check tier limits
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  })
  
  const tier = (subscription?.tier || 'free') as keyof typeof TIER_LIMITS
  const agentCount = await prisma.agent.count({
    where: { userId: session.user.id },
  })

  const limitCheck = checkLimits(tier, { agents: agentCount + 1 })
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: limitCheck.reason }, { status: 429 })
  }

  const agent = await prisma.agent.create({
    data: {
      name,
      description,
      userId: session.user.id,
    },
  })

  return NextResponse.json({ agent })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const agentId = searchParams.get('id')

  if (!agentId) {
    return NextResponse.json({ error: 'Agent ID required' }, { status: 400 })
  }

  await prisma.agent.deleteMany({
    where: { id: agentId, userId: session.user.id },
  })

  return NextResponse.json({ success: true })
}
