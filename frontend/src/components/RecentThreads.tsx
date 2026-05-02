import { useEffect, useState } from 'react'

type RecentItem = {
  thread_id: string
  topic: string
  n_replies: number
}

type Props = {
  onSelect: (threadId: string) => void
}

const fallbackTopics = [
  'mal au ventre depui 2 jours c grav ???',
  'vaccins = poison ???? les medecins nou cach...',
  "j ai mal o ventre apre tp jé peur d'etre...",
  'comen prendre du poid svp',
  'ya des vrai diff entre paracetamol et ibupr...',
  'je sui enceinte ?? svp regardé mé tg...',
]

export default function RecentThreads({ onSelect }: Props) {
  const [items, setItems] = useState<RecentItem[]>([])

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const response = await fetch('/api/forum/recent')
        const data = await response.json()
        if (active && Array.isArray(data.items)) {
          setItems(data.items)
        }
      } catch {
        // ignore
      }
    }
    void load()
    const timer = window.setInterval(load, 30000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  return (
    <section>
      <h3>Sujets actifs</h3>
      <ul>
        {(items.length ? items : fallbackTopics.map((topic, index) => ({
          thread_id: `fake-${index}`,
          topic,
          n_replies: 12 + index * 7,
        }))).map((item) => (
          <li key={item.thread_id}>
            <button
              className="sidebar-list-button"
              type="button"
              onClick={() => !item.thread_id.startsWith('fake-') && onSelect(item.thread_id)}
            >
              <span>{item.topic.length > 32 ? `${item.topic.slice(0, 32)}...` : item.topic}</span>
              <span>{item.n_replies} msg</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
