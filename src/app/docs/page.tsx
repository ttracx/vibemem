import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, ArrowLeft, Code2, Zap, Database, Key } from 'lucide-react'

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-violet-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              VibeMem
            </span>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Documentation</h1>
        <p className="text-xl text-gray-600 mb-12">
          Learn how to integrate VibeMem into your AI agents in under 5 minutes.
        </p>

        {/* Quick Start */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="h-6 w-6 text-violet-600" />
            Quick Start
          </h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">1. Get your API Key</h3>
                  <p className="text-gray-600 mb-2">
                    Go to your <Link href="/dashboard" className="text-violet-600 hover:underline">dashboard</Link> and generate an API key.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">2. Create an Agent</h3>
                  <p className="text-gray-600 mb-2">
                    Create an agent for each AI assistant you want to give memory to.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">3. Integrate</h3>
                  <p className="text-gray-600">Use our simple REST API to compress, store, and inject memories.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* API Reference */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Code2 className="h-6 w-6 text-violet-600" />
            API Reference
          </h2>

          {/* Compress Endpoint */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-mono rounded">POST</span>
                <code className="text-sm">/api/v1/memory/compress</code>
              </div>
              <CardDescription>
                Compress conversation history while preserving key information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`curl -X POST https://vibemem.vercel.app/api/v1/memory/compress \\
  -H "x-api-key: vm_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentId": "your-agent-id",
    "sessionId": "unique-session-123",
    "messages": [
      {"role": "user", "content": "Hello, I need help with my project"},
      {"role": "assistant", "content": "Of course! What kind of project?"},
      {"role": "user", "content": "A React app with authentication"}
    ],
    "targetRatio": 0.3
  }'`}
              </pre>
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Response</h4>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "success": true,
  "sessionId": "unique-session-123",
  "compression": {
    "originalTokens": 150,
    "compressedTokens": 45,
    "ratio": 70,
    "compressed": "User needs help building React app with auth...",
    "keyPoints": ["React project", "Authentication required"]
  }
}`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Inject Endpoint */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-mono rounded">POST</span>
                <code className="text-sm">/api/v1/memory/inject</code>
              </div>
              <CardDescription>
                Retrieve relevant memories based on the current query context.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`curl -X POST https://vibemem.vercel.app/api/v1/memory/inject \\
  -H "x-api-key: vm_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentId": "your-agent-id",
    "query": "What did the user say about their tech stack?",
    "maxTokens": 2000
  }'`}
              </pre>
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Response</h4>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "success": true,
  "context": {
    "shortTerm": ["User is building a React app"],
    "longTerm": ["User prefers TypeScript", "Uses Tailwind CSS"],
    "relevanceScores": [0.92, 0.85, 0.78]
  },
  "injectionPrompt": "## Long-term Memory\\n1. User prefers TypeScript...",
  "tokenCount": 156
}`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Store Endpoint */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-mono rounded">POST</span>
                <code className="text-sm">/api/v1/memory/store</code>
              </div>
              <CardDescription>
                Store memories manually (short-term or long-term).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`// Store a short-term memory
curl -X POST https://vibemem.vercel.app/api/v1/memory/store \\
  -H "x-api-key: vm_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentId": "your-agent-id",
    "content": "User mentioned they have a deadline next Friday",
    "type": "short",
    "ttlHours": 24,
    "importance": 0.8
  }'

// Store a long-term memory
curl -X POST https://vibemem.vercel.app/api/v1/memory/store \\
  -H "x-api-key: vm_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentId": "your-agent-id",
    "content": "User prefers TypeScript over JavaScript",
    "type": "long",
    "category": "preference",
    "importance": 0.9
  }'

// Auto-extract facts from conversation
curl -X POST https://vibemem.vercel.app/api/v1/memory/store \\
  -H "x-api-key: vm_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentId": "your-agent-id",
    "content": "[full conversation here]",
    "type": "extract"
  }'`}
              </pre>
            </CardContent>
          </Card>
        </section>

        {/* Memory Types */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="h-6 w-6 text-violet-600" />
            Memory Tiers
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Short-term Memory</CardTitle>
                <CardDescription>For recent context that expires</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Auto-expires based on your plan tier</li>
                  <li>• Perfect for session-specific context</li>
                  <li>• Higher relevance weight for recent queries</li>
                  <li>• TTL: 1-90 days depending on plan</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Long-term Memory</CardTitle>
                <CardDescription>Persistent facts and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Never expires automatically</li>
                  <li>• Categories: fact, preference, event, relationship</li>
                  <li>• Builds user profile over time</li>
                  <li>• Limit: 50-unlimited based on plan</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SDK Example */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Key className="h-6 w-6 text-violet-600" />
            JavaScript/TypeScript SDK
          </h2>
          <Card>
            <CardContent className="p-6">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`// vibemem.ts - Simple SDK wrapper
class VibeMem {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://vibemem.vercel.app') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async compress(agentId: string, sessionId: string, messages: any[]) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/memory/compress\`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agentId, sessionId, messages }),
    });
    return res.json();
  }

  async inject(agentId: string, query: string, maxTokens = 2000) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/memory/inject\`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agentId, query, maxTokens }),
    });
    return res.json();
  }

  async store(agentId: string, content: string, options = {}) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/memory/store\`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agentId, content, ...options }),
    });
    return res.json();
  }
}

// Usage
const vibemem = new VibeMem('vm_your_api_key');

// Before sending to LLM, inject relevant context
const context = await vibemem.inject('agent-123', userMessage);
const systemPrompt = \`You are a helpful assistant.\\n\\n\${context.injectionPrompt}\`;

// After conversation, compress and store
await vibemem.compress('agent-123', 'session-456', messages);`}
              </pre>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
          <Link href="/dashboard">
            <Button size="lg">
              Go to Dashboard
            </Button>
          </Link>
        </section>
      </div>
    </main>
  )
}
