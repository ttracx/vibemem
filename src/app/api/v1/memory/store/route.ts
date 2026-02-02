import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateEmbedding, estimateTokens, extractFacts, checkLimits, TIER_LIMITS } from '@/lib/memory-engine'

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
    const { agentId, content, type = 'short', category = 'fact', importance = 0.5, ttlHours = 24 } = body

    if (!agentId || !content) {
      return NextResponse.json(
        { error: 'agentId and content required' },
        { status: 400 }
      )
    }

    // Check limits
    const tier = (keyRecord.user.subscription?.tier || 'free') as keyof typeof TIER_LIMITS
    const tierLimits = TIER_LIMITS[tier]

    // Verify agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: keyRecord.user.id },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Generate embedding
    const embedding = await generateEmbedding(content)
    const tokenCount = estimateTokens(content)

    if (type === 'short') {
      // Check short-term memory expiration based on tier
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + Math.min(ttlHours, tierLimits.shortTermRetention * 24))

      const memory = await prisma.shortTermMemory.create({
        data: {
          agentId,
          content,
          embedding,
          importance,
          expiresAt,
        },
      })

      return NextResponse.json({
        success: true,
        memory: {
          id: memory.id,
          type: 'short',
          expiresAt: memory.expiresAt,
        },
      })
    } else if (type === 'long') {
      // Check long-term memory limit
      const currentCount = await prisma.longTermMemory.count({
        where: { agentId },
      })

      if (tierLimits.longTermMemories !== -1 && currentCount >= tierLimits.longTermMemories) {
        return NextResponse.json(
          { error: `Long-term memory limit reached (${tierLimits.longTermMemories})` },
          { status: 429 }
        )
      }

      // Generate summary
      const summary = content.length > 100 ? content.substring(0, 100) + '...' : content

      const memory = await prisma.longTermMemory.create({
        data: {
          agentId,
          category,
          content,
          summary,
          embedding,
          importance,
        },
      })

      return NextResponse.json({
        success: true,
        memory: {
          id: memory.id,
          type: 'long',
          category: memory.category,
        },
      })
    } else if (type === 'extract') {
      // Auto-extract facts from conversation
      const facts = await extractFacts(content)
      const stored: string[] = []

      for (const fact of facts) {
        const factEmbedding = await generateEmbedding(fact.content)
        await prisma.longTermMemory.create({
          data: {
            agentId,
            category: fact.category,
            content: fact.content,
            summary: fact.summary,
            embedding: factEmbedding,
            importance: 0.7,
            source: 'auto-extracted',
          },
        })
        stored.push(fact.summary)
      }

      return NextResponse.json({
        success: true,
        extracted: facts.length,
        facts: stored,
      })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Store error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete memories
export async function DELETE(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }

    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: true },
    })

    if (!keyRecord || keyRecord.revoked) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const memoryId = searchParams.get('id')
    const agentId = searchParams.get('agentId')
    const type = searchParams.get('type') || 'all'

    if (!agentId) {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 })
    }

    // Verify agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: keyRecord.user.id },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    if (memoryId) {
      // Delete specific memory
      if (type === 'short') {
        await prisma.shortTermMemory.deleteMany({
          where: { id: memoryId, agentId },
        })
      } else {
        await prisma.longTermMemory.deleteMany({
          where: { id: memoryId, agentId },
        })
      }
      return NextResponse.json({ success: true, deleted: 1 })
    }

    // Bulk delete
    let deleted = 0
    if (type === 'short' || type === 'all') {
      const result = await prisma.shortTermMemory.deleteMany({
        where: { agentId },
      })
      deleted += result.count
    }
    if (type === 'long' || type === 'all') {
      const result = await prisma.longTermMemory.deleteMany({
        where: { agentId },
      })
      deleted += result.count
    }

    return NextResponse.json({ success: true, deleted })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
