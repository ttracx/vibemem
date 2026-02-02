# VibeMem 🧠

**AI Agent Memory Compression** - Give your AI agents persistent memory that actually works.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ttracx/vibemem)

## 🚀 Live Demo

**Production URL:** https://vibemem-app.vercel.app

## Features

- **70% Compression** - Intelligent summarization preserves key facts while dramatically reducing token count
- **Memory Tiers** - Short-term for recent context, long-term for persistent facts with auto-managed lifecycle
- **Smart Injection** - Semantic search retrieves only relevant memories based on current query context
- **Simple API** - Three endpoints: compress, inject, store. Integrate in under 5 minutes
- **Usage Dashboard** - Monitor compression ratios, memory usage, and token spend in real-time

## Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Auth:** NextAuth.js
- **Payments:** Stripe
- **AI:** OpenAI (embeddings + compression)
- **Styling:** Tailwind CSS

## API Endpoints

### Compress Conversation
```bash
POST /api/v1/memory/compress
{
  "agentId": "your-agent-id",
  "sessionId": "session-123",
  "messages": [...],
  "targetRatio": 0.3
}
```

### Inject Context
```bash
POST /api/v1/memory/inject
{
  "agentId": "your-agent-id",
  "query": "What did the user say about pricing?",
  "maxTokens": 2000
}
```

### Store Memory
```bash
POST /api/v1/memory/store
{
  "agentId": "your-agent-id",
  "content": "User prefers TypeScript",
  "type": "long",
  "category": "preference"
}
```

## Pricing

| Plan | Price | Features |
|------|-------|----------|
| **Starter** | $19/mo | 5 agents, 500K tokens, 7-day retention |
| **Pro** | $49/mo | 25 agents, 5M tokens, 30-day retention |
| **Enterprise** | $99/mo | Unlimited everything, 90-day retention |

## Getting Started

1. Sign up at https://vibemem-app.vercel.app
2. Create an agent in the dashboard
3. Generate an API key
4. Integrate using the simple REST API

## Local Development

```bash
# Clone
git clone https://github.com/ttracx/vibemem.git
cd vibemem

# Install
pnpm install

# Setup env
cp .env.example .env
# Edit .env with your values

# Push database
pnpm db:push

# Run dev
pnpm dev
```

## Environment Variables

```env
DATABASE_URL=           # Neon PostgreSQL
NEXTAUTH_SECRET=        # Random string
NEXTAUTH_URL=           # http://localhost:3000
STRIPE_SECRET_KEY=      # From Stripe dashboard
STRIPE_PUBLISHABLE_KEY= # From Stripe dashboard
OPENAI_API_KEY=         # From OpenAI
```

## License

MIT © 2025 VibeCaaS

---

Built with ❤️ by [ttracx](https://github.com/ttracx)
