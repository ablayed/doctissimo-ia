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

const fallbackTopics = [
  'mal au ventre depui 2 jours c grav ???',
  'vaccins = poison ???? les médecins nou cach...',
  'j ai mal o ventre apré tp jé peur d\'etre...',
  'comen prendre du poid svp',
  'ya des vrai diff entre paracetamol et ibupr...',
  'je sui enceinte ?? svp regardé mé tg...',
]

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
    <div className="sidebar-box">
      <h3>Sujets actifs</h3>
      {loading && <div className="smoke-result">Chargement...</div>}
      {!loading && items.length === 0 && (
        <div className="smoke-result">
          {fallbackTopics.map((topic) => (
            <div key={topic}>{topic}</div>
          ))}
        </div>
      )}
      <ul className="sidebar-list">
        {items.map((item) => (
          <li key={item.thread_id}>
            <button type="button" onClick={() => onSelect(item.thread_id)}>
              {item.topic.slice(0, 32)}
              {item.topic.length > 32 ? '...' : ''} <span>({item.n_replies} msg)</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
