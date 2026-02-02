import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { compressConversation, estimateTokens, scoreImportance, checkLimits, TIER_LIMITS } from '@/lib/memory-engine'

export async function POST(req: NextRequest) {
  try {
    // Get API key from header
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }

    // Validate API key
    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: {
        user: {
          include: {
            subscription: true,
          },
        },
      },
    })

    if (!keyRecord || keyRecord.revoked) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // Update last used
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsed: new Date() },
    })

    const body = await req.json()
    const { agentId, sessionId, messages, targetRatio = 0.3 } = body

    if (!agentId || !sessionId || !messages?.length) {
      return NextResponse.json(
        { error: 'agentId, sessionId, and messages array required' },
        { status: 400 }
      )
    }

    // Check tier limits
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

    const totalTokens = messages.reduce((sum: number, m: { content: string }) => 
      sum + estimateTokens(m.content), 0)
    
    const limitCheck = checkLimits(tier, {
      tokens: (monthlyUsage._sum.tokensProcessed || 0) + totalTokens,
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

    // Compress the conversation
    const compression = await compressConversation(messages, targetRatio)

    // Find or create session
    let memorySession = await prisma.memorySession.findUnique({
      where: { sessionId },
    })

    if (!memorySession) {
      memorySession = await prisma.memorySession.create({
        data: {
          sessionId,
          agentId,
          rawTokenCount: compression.originalTokens,
          compressedTokenCount: compression.compressedTokens,
          compressionRatio: compression.ratio,
        },
      })
    } else {
      memorySession = await prisma.memorySession.update({
        where: { id: memorySession.id },
        data: {
          rawTokenCount: { increment: compression.originalTokens },
          compressedTokenCount: { increment: compression.compressedTokens },
          compressionRatio: compression.ratio,
          updatedAt: new Date(),
        },
      })
    }

    // Store individual messages with importance scores
    for (const msg of messages) {
      const importance = await scoreImportance(msg)
      await prisma.message.create({
        data: {
          sessionId: memorySession.id,
          role: msg.role,
          content: msg.content,
          compressedContent: null,
          tokenCount: estimateTokens(msg.content),
          importance,
          metadata: msg.metadata || null,
        },
      })
    }

    // Record usage
    await prisma.usageRecord.create({
      data: {
        userId: keyRecord.user.id,
        type: 'compression',
        tokensProcessed: compression.originalTokens,
      },
    })

    return NextResponse.json({
      success: true,
      sessionId,
      compression: {
        originalTokens: compression.originalTokens,
        compressedTokens: compression.compressedTokens,
        ratio: compression.ratio,
        compressed: compression.compressed,
        keyPoints: compression.keyPoints,
      },
    })
  } catch (error) {
    console.error('Compression error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
