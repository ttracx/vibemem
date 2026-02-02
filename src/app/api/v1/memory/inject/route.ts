import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRelevantContext, generateEmbedding, estimateTokens, checkLimits, TIER_LIMITS } from '@/lib/memory-engine'

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }

    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: {
        user: {
          include: { subscription: true },
        },
      },
    })

    if (!keyRecord || keyRecord.revoked) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsed: new Date() },
    })

    const body = await req.json()
    const { agentId, query, maxTokens = 2000 } = body

    if (!agentId || !query) {
      return NextResponse.json(
        { error: 'agentId and query required' },
        { status: 400 }
      )
    }

    // Check limits
    const tier = (keyRecord.user.subscription?.tier || 'free') as keyof typeof TIER_LIMITS
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const monthlyUsage = await prisma.usageRecord.aggregate({
      where: {
        userId: keyRecord.user.id,
        timestamp: { gte: monthStart },
      },
      _sum: { tokensProcessed: true },
    })

    const queryTokens = estimateTokens(query)
    const limitCheck = checkLimits(tier, {
      tokens: (monthlyUsage._sum.tokensProcessed || 0) + queryTokens,
    })

    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.reason }, { status: 429 })
    }

    // Verify agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: keyRecord.user.id },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Get short-term memories
    const shortTermMemories = await prisma.shortTermMemory.findMany({
      where: {
        agentId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastAccessed: 'desc' },
      take: 50,
    })

    // Get long-term memories
    const longTermMemories = await prisma.longTermMemory.findMany({
      where: { agentId },
      orderBy: { lastAccessed: 'desc' },
      take: 100,
    })

    // Get relevant context
    const context = await getRelevantContext(
      query,
      shortTermMemories.map(m => ({
        content: m.content,
        embedding: m.embedding,
        importance: m.importance,
      })),
      longTermMemories.map(m => ({
        content: m.content,
        embedding: m.embedding,
        importance: m.importance,
      })),
      maxTokens
    )

    // Update access counts for retrieved memories
    const usedMemoryIds = [
      ...shortTermMemories.filter(m => context.shortTerm.includes(m.content)).map(m => m.id),
    ]
    
    if (usedMemoryIds.length > 0) {
      await prisma.shortTermMemory.updateMany({
        where: { id: { in: usedMemoryIds } },
        data: {
          accessCount: { increment: 1 },
          lastAccessed: new Date(),
        },
      })
    }

    // Record usage
    await prisma.usageRecord.create({
      data: {
        userId: keyRecord.user.id,
        type: 'retrieval',
        tokensProcessed: queryTokens,
      },
    })

    // Build injection prompt
    const injectionPrompt = buildInjectionPrompt(context)

    return NextResponse.json({
      success: true,
      context: {
        shortTerm: context.shortTerm,
        longTerm: context.longTerm,
        relevanceScores: context.relevanceScores,
      },
      injectionPrompt,
      tokenCount: estimateTokens(injectionPrompt),
    })
  } catch (error) {
    console.error('Injection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function buildInjectionPrompt(context: {
  shortTerm: string[]
  longTerm: string[]
}): string {
  const parts: string[] = []

  if (context.longTerm.length > 0) {
    parts.push('## Long-term Memory (Established Facts)')
    parts.push(context.longTerm.map((m, i) => `${i + 1}. ${m}`).join('\n'))
  }

  if (context.shortTerm.length > 0) {
    parts.push('\n## Recent Context')
    parts.push(context.shortTerm.map((m, i) => `${i + 1}. ${m}`).join('\n'))
  }

  if (parts.length === 0) {
    return '(No relevant memories found)'
  }

  return parts.join('\n')
}
