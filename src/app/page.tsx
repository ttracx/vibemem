import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, Zap, Database, Lock, BarChart3, Code2, Sparkles, ArrowRight, Check } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-violet-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                VibeMem
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition">Features</Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition">Pricing</Link>
              <Link href="/docs" className="text-gray-600 hover:text-gray-900 transition">Docs</Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/login">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="h-3 w-3 mr-1" /> Backed by AI-native compression
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            Memory for your{' '}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              AI agents
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Compress conversation history by 70%, inject smart context, and give your agents 
            persistent memory that actually works. The missing piece for production AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="xl">
                Start Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="xl" variant="outline">
                View Documentation
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Free tier includes 50K tokens/month • No credit card required
          </p>
        </div>
      </section>

      {/* Code Preview */}
      <section className="pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl bg-gray-900 p-6 shadow-2xl shadow-violet-500/10">
            <div className="flex gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <pre className="text-sm text-gray-300 overflow-x-auto">
              <code>{`// Compress 10K tokens → 3K tokens
const result = await vibemem.compress({
  agentId: "my-agent",
  sessionId: "session-123",
  messages: conversationHistory,
});
console.log(result.ratio); // 70% compression

// Smart context injection
const context = await vibemem.inject({
  agentId: "my-agent", 
  query: "What did the user say about pricing?"
});
// Returns relevant memories ranked by importance`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything your agents need to remember
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Built for production AI workflows. Reduce token costs, improve context quality, 
              and ship agents that actually remember.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0">
              <CardHeader>
                <Zap className="h-10 w-10 text-violet-600 mb-2" />
                <CardTitle>70% Compression</CardTitle>
                <CardDescription>
                  Intelligent summarization preserves key facts while dramatically reducing token count
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0">
              <CardHeader>
                <Database className="h-10 w-10 text-violet-600 mb-2" />
                <CardTitle>Memory Tiers</CardTitle>
                <CardDescription>
                  Short-term for recent context, long-term for persistent facts. Auto-managed lifecycle
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0">
              <CardHeader>
                <Brain className="h-10 w-10 text-violet-600 mb-2" />
                <CardTitle>Smart Injection</CardTitle>
                <CardDescription>
                  Semantic search retrieves only relevant memories based on current query context
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0">
              <CardHeader>
                <Code2 className="h-10 w-10 text-violet-600 mb-2" />
                <CardTitle>Simple API</CardTitle>
                <CardDescription>
                  Three endpoints: compress, inject, store. Integrate in under 5 minutes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0">
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-violet-600 mb-2" />
                <CardTitle>Usage Dashboard</CardTitle>
                <CardDescription>
                  Monitor compression ratios, memory usage, and token spend in real-time
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0">
              <CardHeader>
                <Lock className="h-10 w-10 text-violet-600 mb-2" />
                <CardTitle>Enterprise Ready</CardTitle>
                <CardDescription>
                  SOC2 compliant infrastructure, data encryption, and dedicated support
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-gray-600">
              Start free, scale as you grow. All plans include core features.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <Card className="relative">
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>For individual developers</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$19</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    '5 agents',
                    '500K tokens/month',
                    '1,000 sessions/month',
                    '7-day short-term memory',
                    '500 long-term memories',
                    'Email support',
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/login?plan=starter" className="block mt-6">
                  <Button className="w-full" variant="outline">Get Started</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className="relative border-violet-600 border-2 shadow-xl shadow-violet-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge>Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <CardDescription>For growing teams</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$49</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    '25 agents',
                    '5M tokens/month',
                    '10,000 sessions/month',
                    '30-day short-term memory',
                    '5,000 long-term memories',
                    'Priority support',
                    'Analytics dashboard',
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/login?plan=pro" className="block mt-6">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card className="relative">
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>For large organizations</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$99</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    'Unlimited agents',
                    'Unlimited tokens',
                    'Unlimited sessions',
                    '90-day short-term memory',
                    'Unlimited long-term memories',
                    'Dedicated support',
                    'Custom integrations',
                    'SLA guarantee',
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/login?plan=enterprise" className="block mt-6">
                  <Button className="w-full" variant="outline">Contact Sales</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-violet-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Give your agents memory superpowers
          </h2>
          <p className="text-violet-100 mb-8 text-lg">
            Join developers building the next generation of AI applications
          </p>
          <Link href="/login">
            <Button size="xl" className="bg-white text-violet-600 hover:bg-gray-100">
              Start Building Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-violet-500" />
            <span className="text-white font-semibold">VibeMem</span>
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/docs" className="hover:text-white transition">Documentation</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
          </div>
          <p className="text-sm">© 2025 VibeMem. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
