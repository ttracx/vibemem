import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TIER_LIMITS } from '@/lib/memory-engine'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  // Get subscription
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  })
  const tier = (subscription?.tier || 'free') as keyof typeof TIER_LIMITS
  const limits = TIER_LIMITS[tier]

  // Get agent count
  const agentCount = await prisma.agent.count({
    where: { userId: session.user.id },
  })

  // Get session count this month
  const sessionCount = await prisma.memorySession.count({
    where: {
      agent: { userId: session.user.id },
      createdAt: { gte: monthStart },
    },
  })

  // Get token usage
  const usageStats = await prisma.usageRecord.groupBy({
    by: ['type'],
    where: {
      userId: session.user.id,
      timestamp: { gte: monthStart },
    },
    _sum: { tokensProcessed: true },
  })

  const tokenUsage = usageStats.reduce((sum, u) => sum + (u._sum.tokensProcessed || 0), 0)

  // Get memory counts
  const memoryStats = await prisma.agent.findMany({
    where: { userId: session.user.id },
    select: {
      _count: {
        select: {
          shortTermMemory: true,
          longTermMemory: true,
        },
      },
    },
  })

  const shortTermCount = memoryStats.reduce((sum, a) => sum + a._count.shortTermMemory, 0)
  const longTermCount = memoryStats.reduce((sum, a) => sum + a._count.longTermMemory, 0)

  // Get compression stats
  const compressionStats = await prisma.memorySession.aggregate({
    where: {
      agent: { userId: session.user.id },
    },
    _sum: {
      rawTokenCount: true,
      compressedTokenCount: true,
    },
    _avg: {
      compressionRatio: true,
    },
  })

  // Daily usage for chart
  const dailyUsage = await prisma.usageRecord.groupBy({
    by: ['timestamp'],
    where: {
      userId: session.user.id,
      timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    _sum: { tokensProcessed: true },
  })

  return NextResponse.json({
    tier,
    limits,
    usage: {
      agents: agentCount,
      sessions: sessionCount,
      tokens: tokenUsage,
      shortTermMemories: shortTermCount,
      longTermMemories: longTermCount,
    },
    compression: {
      totalRaw: compressionStats._sum.rawTokenCount || 0,
      totalCompressed: compressionStats._sum.compressedTokenCount || 0,
      averageRatio: Math.round(compressionStats._avg.compressionRatio || 0),
    },
    dailyUsage: dailyUsage.map(d => ({
      date: d.timestamp,
      tokens: d._sum.tokensProcessed || 0,
    })),
  })
}
