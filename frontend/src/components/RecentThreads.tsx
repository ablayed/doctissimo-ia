import { useEffect, useState } from 'react'

type RecentItem = {
  thread_id: string
  topic: string
  n_replies: number
  completed_at: number
}

type Props = {
  onSelect: (threadId: string) => void
}

export default function RecentThreads({ onSelect }: Props) {
  const [items, setItems] = useState<RecentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const response = await fetch('/api/forum/recent')
        const data = await response.json()
        if (mounted && Array.isArray(data.items)) {
          setItems(data.items)
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    const timer = window.setInterval(load, 30000)
    return () => {
      mounted = false
      window.clearInterval(timer)
    }
  }, [])

  return (
    <div className="sidebar">
      <div className="thread-status">Sujets récents</div>
      {loading && <div className="smoke-result">Chargement...</div>}
      {!loading && items.length === 0 && (
        <div className="smoke-result">Aucun thread récent disponible.</div>
      )}
      <ul>
        {items.map((item) => (
          <li key={item.thread_id}>
            <button type="button" onClick={() => onSelect(item.thread_id)}>
              {item.topic} <span>({item.n_replies} msg)</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
