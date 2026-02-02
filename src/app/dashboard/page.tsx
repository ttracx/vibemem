'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, Plus, Key, Bot, Database, Zap, BarChart3, Settings, LogOut, Copy, Check, Trash2 } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { formatNumber } from '@/lib/utils'

interface Agent {
  id: string
  name: string
  description: string | null
  createdAt: string
  _count: {
    memorySessions: number
    shortTermMemory: number
    longTermMemory: number
  }
}

interface ApiKey {
  id: string
  name: string
  key: string
  createdAt: string
  lastUsed: string | null
  revoked: boolean
}

interface UsageData {
  tier: string
  limits: {
    agents: number
    sessionsPerMonth: number
    tokensPerMonth: number
    shortTermRetention: number
    longTermMemories: number
  }
  usage: {
    agents: number
    sessions: number
    tokens: number
    shortTermMemories: number
    longTermMemories: number
  }
  compression: {
    totalRaw: number
    totalCompressed: number
    averageRatio: number
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [newAgentName, setNewAgentName] = useState('')
  const [newKeyName, setNewKeyName] = useState('')
  const [showNewKey, setShowNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'keys'>('overview')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    const [agentsRes, keysRes, usageRes] = await Promise.all([
      fetch('/api/agents'),
      fetch('/api/keys'),
      fetch('/api/usage'),
    ])
    
    const agentsData = await agentsRes.json()
    const keysData = await keysRes.json()
    const usageData = await usageRes.json()

    setAgents(agentsData.agents || [])
    setApiKeys(keysData.keys || [])
    setUsage(usageData)
  }

  const createAgent = async () => {
    if (!newAgentName) return
    await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newAgentName }),
    })
    setNewAgentName('')
    fetchData()
  }

  const deleteAgent = async (id: string) => {
    if (!confirm('Delete this agent and all its memories?')) return
    await fetch(`/api/agents?id=${id}`, { method: 'DELETE' })
    fetchData()
  }

  const createKey = async () => {
    if (!newKeyName) return
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName }),
    })
    const data = await res.json()
    setShowNewKey(data.apiKey.key)
    setNewKeyName('')
    fetchData()
  }

  const revokeKey = async (id: string) => {
    if (!confirm('Revoke this API key?')) return
    await fetch(`/api/keys?id=${id}`, { method: 'DELETE' })
    fetchData()
  }

  const copyKey = () => {
    if (showNewKey) {
      navigator.clipboard.writeText(showNewKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Brain className="h-12 w-12 text-violet-600 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r p-4 hidden md:block">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <Brain className="h-8 w-8 text-violet-600" />
          <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            VibeMem
          </span>
        </Link>
        
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
              activeTab === 'overview' ? 'bg-violet-100 text-violet-700' : 'hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
              activeTab === 'agents' ? 'bg-violet-100 text-violet-700' : 'hover:bg-gray-100'
            }`}
          >
            <Bot className="h-5 w-5" />
            Agents
          </button>
          <button
            onClick={() => setActiveTab('keys')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
              activeTab === 'keys' ? 'bg-violet-100 text-violet-700' : 'hover:bg-gray-100'
            }`}
          >
            <Key className="h-5 w-5" />
            API Keys
          </button>
        </nav>

        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <Link href="/docs" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <Settings className="h-5 w-5" />
            Documentation
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab === 'overview' && 'Dashboard'}
                {activeTab === 'agents' && 'Agents'}
                {activeTab === 'keys' && 'API Keys'}
              </h1>
              <p className="text-gray-500">
                {session?.user?.email}
              </p>
            </div>
            <Badge variant={usage?.tier === 'free' ? 'secondary' : 'default'}>
              {usage?.tier?.toUpperCase() || 'FREE'} Plan
            </Badge>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && usage && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Agents</CardDescription>
                    <CardTitle className="text-3xl">
                      {usage.usage.agents}
                      <span className="text-base font-normal text-gray-400">
                        /{usage.limits.agents === -1 ? '∞' : usage.limits.agents}
                      </span>
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Tokens This Month</CardDescription>
                    <CardTitle className="text-3xl">
                      {formatNumber(usage.usage.tokens)}
                      <span className="text-base font-normal text-gray-400">
                        /{usage.limits.tokensPerMonth === -1 ? '∞' : formatNumber(usage.limits.tokensPerMonth)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Compression Ratio</CardDescription>
                    <CardTitle className="text-3xl text-green-600">
                      {usage.compression.averageRatio}%
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Memories</CardDescription>
                    <CardTitle className="text-3xl">
                      {formatNumber(usage.usage.shortTermMemories + usage.usage.longTermMemories)}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Compression Stats */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-violet-600" />
                    Compression Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Raw Tokens</p>
                      <p className="text-2xl font-bold">{formatNumber(usage.compression.totalRaw)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">After Compression</p>
                      <p className="text-2xl font-bold text-green-600">{formatNumber(usage.compression.totalCompressed)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Tokens Saved</p>
                      <p className="text-2xl font-bold text-violet-600">
                        {formatNumber(usage.compression.totalRaw - usage.compression.totalCompressed)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="cursor-pointer hover:shadow-lg transition" onClick={() => setActiveTab('agents')}>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
                      <Bot className="h-6 w-6 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Create Agent</h3>
                      <p className="text-sm text-gray-500">Add a new AI agent to manage</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-lg transition" onClick={() => setActiveTab('keys')}>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
                      <Key className="h-6 w-6 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Generate API Key</h3>
                      <p className="text-sm text-gray-500">Create keys for your integrations</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Agents Tab */}
          {activeTab === 'agents' && (
            <>
              <Card className="mb-6">
                <CardContent className="flex gap-4 p-4">
                  <input
                    type="text"
                    placeholder="Agent name..."
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    onKeyDown={(e) => e.key === 'Enter' && createAgent()}
                  />
                  <Button onClick={createAgent}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Agent
                  </Button>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {agents.map((agent) => (
                  <Card key={agent.id}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold">{agent.name}</h3>
                          <p className="text-sm text-gray-500">
                            {agent._count.memorySessions} sessions • {agent._count.shortTermMemory + agent._count.longTermMemory} memories
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{agent.id.slice(0, 8)}...</Badge>
                        <Button variant="ghost" size="icon" onClick={() => deleteAgent(agent.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {agents.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Bot className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No agents yet. Create one to get started!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}

          {/* API Keys Tab */}
          {activeTab === 'keys' && (
            <>
              {showNewKey && (
                <Card className="mb-6 border-green-500 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-green-800">API Key Created!</p>
                        <p className="text-sm text-green-700">Copy this key now - it won&apos;t be shown again.</p>
                      </div>
                      <Button variant="outline" onClick={copyKey}>
                        {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        {copied ? 'Copied!' : 'Copy Key'}
                      </Button>
                    </div>
                    <code className="block mt-2 p-3 bg-white rounded border text-sm font-mono break-all">
                      {showNewKey}
                    </code>
                  </CardContent>
                </Card>
              )}

              <Card className="mb-6">
                <CardContent className="flex gap-4 p-4">
                  <input
                    type="text"
                    placeholder="Key name (e.g., Production, Development)..."
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    onKeyDown={(e) => e.key === 'Enter' && createKey()}
                  />
                  <Button onClick={createKey}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Key
                  </Button>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {apiKeys.filter(k => !k.revoked).map((key) => (
                  <Card key={key.id}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div>
                        <h3 className="font-semibold">{key.name}</h3>
                        <p className="text-sm text-gray-500 font-mono">{key.key}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Created {new Date(key.createdAt).toLocaleDateString()}
                          {key.lastUsed && ` • Last used ${new Date(key.lastUsed).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => revokeKey(key.id)}>
                        Revoke
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {apiKeys.filter(k => !k.revoked).length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Key className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No API keys yet. Generate one to integrate VibeMem.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
