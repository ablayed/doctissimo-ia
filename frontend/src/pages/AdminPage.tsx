import { useEffect, useState } from 'react'

interface Stats {
  tokens_today: number
  llm_calls_today: number
  threads_today: number
  estimated_cost_eur: number
  rag_queries_today: number
  uptime_seconds: number
  personas_loaded: number
}

export function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const key = new URLSearchParams(window.location.search).get('key') || ''

  useEffect(() => {
    if (!key) {
      setError('Missing ?key= parameter')
      return undefined
    }

    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/admin/stats?key=${encodeURIComponent(key)}`)
        if (!response.ok) {
          setError(`HTTP ${response.status}`)
          return
        }
        const json = (await response.json()) as Stats
        setStats(json)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    void fetchStats()
    const timer = window.setInterval(fetchStats, 2000)
    return () => window.clearInterval(timer)
  }, [key])

  if (error) {
    return (
      <div style={{ padding: 40, fontFamily: 'Lucida Console, monospace', background: '#000000', color: '#00FF00', minHeight: '100vh' }}>
        <h1 style={{ color: '#FFFF00' }}>Doctissimo.IA Admin - Access denied</h1>
        <p>Error: {error}</p>
        <p>Use ?key=YOUR_ADMIN_KEY in the URL.</p>
      </div>
    )
  }

  if (!stats) {
    return <div style={{ padding: 40, fontFamily: 'Lucida Console, monospace', background: '#000000', color: '#00FF00', minHeight: '100vh' }}>Loading...</div>
  }

  const formatNum = (value: number) => value.toLocaleString('fr-FR')

  return (
    <div
      style={{
        padding: 24,
        fontFamily: 'Lucida Console, Courier New, monospace',
        background: '#000000',
        color: '#00FF00',
        minHeight: '100vh',
        fontSize: '14px',
      }}
    >
      <div style={{ borderBottom: '1px solid #00FF00', paddingBottom: 12, marginBottom: 24 }}>
        <h1 style={{ color: '#00FF00', fontSize: '22px', margin: 0 }}>DOCTISSIMO.IA - LIVE OPS DASHBOARD</h1>
        <div style={{ color: '#888888', fontSize: '11px', marginTop: 4 }}>Refreshing every 2s - {new Date().toLocaleTimeString('fr-FR')}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <Card label="Azure OpenAI tokens (today)" value={formatNum(stats.tokens_today)} accent="#FFFF00" />
        <Card label="LLM calls (today)" value={formatNum(stats.llm_calls_today)} accent="#00FFFF" />
        <Card label="RAG queries Ameli/HAS" value={formatNum(stats.rag_queries_today)} accent="#FF00FF" />
        <Card label="Threads created" value={formatNum(stats.threads_today)} accent="#FF8800" />
        <Card label="Estimated cost EUR" value={`${stats.estimated_cost_eur.toFixed(4)} EUR`} accent="#FF0000" />
        <Card label="Personas loaded" value={`${stats.personas_loaded} agents`} accent="#FFFFFF" />
        <Card label="Uptime (sec)" value={formatNum(stats.uptime_seconds)} accent="#888888" />
      </div>

      <div style={{ marginTop: 32, padding: 16, border: '1px dashed #00FF00', fontSize: '11px' }}>
        <div style={{ color: '#FFFF00' }}>Stack:</div>
        <div>LangGraph 30-agent fan-out - Azure OpenAI gpt-4o-mini x 27 + gpt-4o x 3 - Upstash Vector (BGE-M3) - Upstash Redis</div>
      </div>

      <div style={{ marginTop: 16, fontSize: '11px', color: '#666666' }}>Press F5 to manually refresh - Auto every 2s - Built for DEFENDHACK 2026</div>
    </div>
  )
}

function Card({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ border: `1px solid ${accent}`, padding: 14, background: 'rgba(0, 30, 0, 0.3)' }}>
      <div style={{ color: '#888888', fontSize: '11px', marginBottom: 6 }}>{label}</div>
      <div style={{ color: accent, fontSize: '28px', fontWeight: 'bold' }}>{value}</div>
    </div>
  )
}
