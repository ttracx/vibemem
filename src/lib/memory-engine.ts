import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  importance?: number
}

interface CompressionResult {
  compressed: string
  originalTokens: number
  compressedTokens: number
  ratio: number
  keyPoints: string[]
}

interface MemoryContext {
  shortTerm: string[]
  longTerm: string[]
  relevanceScores: number[]
}

// Simple token estimation (4 chars ≈ 1 token)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// Compress conversation history while preserving key information
export async function compressConversation(
  messages: Message[],
  targetRatio: number = 0.3 // Target 70% compression
): Promise<CompressionResult> {
  const fullConversation = messages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n\n')
  
  const originalTokens = estimateTokens(fullConversation)
  const targetTokens = Math.ceil(originalTokens * targetRatio)

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a memory compression engine. Compress the following conversation while preserving:
1. Key decisions and outcomes
2. Important facts and data mentioned
3. User preferences and requirements
4. Action items and commitments
5. Emotional context when relevant

Output format:
SUMMARY: [compressed narrative, ~${targetTokens} tokens]
KEY_POINTS:
- [point 1]
- [point 2]
...`
      },
      {
        role: 'user',
        content: fullConversation
      }
    ],
    temperature: 0.3,
    max_tokens: targetTokens + 200
  })

  const result = response.choices[0]?.message?.content || ''
  
  // Parse the response
  const summaryMatch = result.match(/SUMMARY:\s*([\s\S]*?)(?=KEY_POINTS:|$)/i)
  const keyPointsMatch = result.match(/KEY_POINTS:\s*([\s\S]*?)$/i)
  
  const compressed = summaryMatch?.[1]?.trim() || result
  const keyPointsText = keyPointsMatch?.[1]?.trim() || ''
  const keyPoints = keyPointsText
    .split('\n')
    .map(line => line.replace(/^-\s*/, '').trim())
    .filter(Boolean)

  const compressedTokens = estimateTokens(compressed)

  return {
    compressed,
    originalTokens,
    compressedTokens,
    ratio: Math.round((1 - compressedTokens / originalTokens) * 100),
    keyPoints
  }
}

// Score message importance (0-1)
export async function scoreImportance(message: Message): Promise<number> {
  // Quick heuristics for common patterns
  const content = message.content.toLowerCase()
  
  // High importance indicators
  if (content.includes('important') || content.includes('remember')) return 0.9
  if (content.includes('decision') || content.includes('agreed')) return 0.85
  if (content.includes('deadline') || content.includes('must')) return 0.8
  if (content.includes('password') || content.includes('key') || content.includes('secret')) return 0.95
  
  // Low importance indicators
  if (content.length < 20) return 0.3
  if (content.match(/^(ok|yes|no|thanks|sure|got it)$/i)) return 0.2
  
  // Use AI for nuanced scoring
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Rate the importance of this message for long-term memory retention (0.0-1.0). Consider: decisions, facts, preferences, commitments. Respond with only a number.'
      },
      {
        role: 'user',
        content: `Role: ${message.role}\nContent: ${message.content}`
      }
    ],
    temperature: 0,
    max_tokens: 10
  })

  const score = parseFloat(response.choices[0]?.message?.content || '0.5')
  return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score))
}

// Generate embedding for similarity search
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0]?.embedding || []
}

// Calculate cosine similarity between two embeddings
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// Smart context injection - retrieve relevant memories
export async function getRelevantContext(
  query: string,
  shortTermMemories: Array<{ content: string; embedding: number[]; importance: number }>,
  longTermMemories: Array<{ content: string; embedding: number[]; importance: number }>,
  maxTokens: number = 2000
): Promise<MemoryContext> {
  const queryEmbedding = await generateEmbedding(query)
  
  // Score and sort short-term memories
  const scoredShortTerm = shortTermMemories.map(m => ({
    ...m,
    relevance: cosineSimilarity(queryEmbedding, m.embedding) * m.importance
  })).sort((a, b) => b.relevance - a.relevance)
  
  // Score and sort long-term memories
  const scoredLongTerm = longTermMemories.map(m => ({
    ...m,
    relevance: cosineSimilarity(queryEmbedding, m.embedding) * m.importance
  })).sort((a, b) => b.relevance - a.relevance)
  
  // Build context within token budget
  const result: MemoryContext = {
    shortTerm: [],
    longTerm: [],
    relevanceScores: []
  }
  
  let currentTokens = 0
  
  // Prioritize recent short-term with high relevance
  for (const mem of scoredShortTerm) {
    const tokens = estimateTokens(mem.content)
    if (currentTokens + tokens <= maxTokens * 0.4 && mem.relevance > 0.3) {
      result.shortTerm.push(mem.content)
      result.relevanceScores.push(mem.relevance)
      currentTokens += tokens
    }
  }
  
  // Add relevant long-term memories
  for (const mem of scoredLongTerm) {
    const tokens = estimateTokens(mem.content)
    if (currentTokens + tokens <= maxTokens && mem.relevance > 0.2) {
      result.longTerm.push(mem.content)
      result.relevanceScores.push(mem.relevance)
      currentTokens += tokens
    }
  }
  
  return result
}

// Extract facts for long-term storage
export async function extractFacts(
  conversation: string
): Promise<Array<{ category: string; content: string; summary: string }>> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Extract discrete facts from this conversation for long-term memory storage.
Categories: fact, preference, event, relationship, commitment

Output as JSON array:
[{"category": "...", "content": "...", "summary": "..."}]

Only extract clearly stated information, no assumptions.`
      },
      {
        role: 'user',
        content: conversation
      }
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' }
  })

  try {
    const parsed = JSON.parse(response.choices[0]?.message?.content || '{"facts":[]}')
    return parsed.facts || parsed || []
  } catch {
    return []
  }
}

// Plan tiers and limits
export const TIER_LIMITS = {
  free: {
    agents: 1,
    sessionsPerMonth: 100,
    tokensPerMonth: 50000,
    shortTermRetention: 1, // days
    longTermMemories: 50,
  },
  starter: {
    agents: 5,
    sessionsPerMonth: 1000,
    tokensPerMonth: 500000,
    shortTermRetention: 7,
    longTermMemories: 500,
  },
  pro: {
    agents: 25,
    sessionsPerMonth: 10000,
    tokensPerMonth: 5000000,
    shortTermRetention: 30,
    longTermMemories: 5000,
  },
  enterprise: {
    agents: -1, // unlimited
    sessionsPerMonth: -1,
    tokensPerMonth: -1,
    shortTermRetention: 90,
    longTermMemories: -1,
  },
}

export function checkLimits(
  tier: keyof typeof TIER_LIMITS,
  usage: { agents?: number; sessions?: number; tokens?: number; memories?: number }
): { allowed: boolean; reason?: string } {
  const limits = TIER_LIMITS[tier]
  
  if (limits.agents !== -1 && (usage.agents || 0) >= limits.agents) {
    return { allowed: false, reason: `Agent limit reached (${limits.agents})` }
  }
  if (limits.sessionsPerMonth !== -1 && (usage.sessions || 0) >= limits.sessionsPerMonth) {
    return { allowed: false, reason: `Monthly session limit reached (${limits.sessionsPerMonth})` }
  }
  if (limits.tokensPerMonth !== -1 && (usage.tokens || 0) >= limits.tokensPerMonth) {
    return { allowed: false, reason: `Monthly token limit reached (${limits.tokensPerMonth})` }
  }
  if (limits.longTermMemories !== -1 && (usage.memories || 0) >= limits.longTermMemories) {
    return { allowed: false, reason: `Long-term memory limit reached (${limits.longTermMemories})` }
  }
  
  return { allowed: true }
}
