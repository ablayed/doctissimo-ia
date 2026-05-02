import { FormEvent, useRef, useState } from 'react'

import PostCard from './PostCard'
import type { ForumPost } from './PostCard'

type StartResponse = {
  thread_id: string
  n_personas: number
}

export default function ThreadPage() {
  const [topic, setTopic] = useState('mal au ventre')
  const [seedPost, setSeedPost] = useState('jé mal o ventre depui 2j c grav ???')
  const [threadId, setThreadId] = useState<string | null>(null)
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [seed, setSeed] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const eventSourceRef = useRef<EventSource | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    eventSourceRef.current?.close()
    setLoading(true)
    setError('')
    setPosts([])
    setThreadId(null)
    setSeed(seedPost)

    try {
      const response = await fetch('/api/forum/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, seed_post: seedPost }),
      })
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`)
      }
      const data = (await response.json()) as StartResponse
      setThreadId(data.thread_id)

      const source = new EventSource(`/api/forum/${data.thread_id}/stream`)
      eventSourceRef.current = source
      source.addEventListener('post', (message) => {
        const post = JSON.parse(message.data) as ForumPost
        setPosts((current) =>
          current.some((item) => item.id === post.id) ? current : [...current, post],
        )
      })
      source.addEventListener('done', () => {
        source.close()
        setLoading(false)
      })
      source.onerror = () => {
        setError('Connexion interrompue.')
        source.close()
        setLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setLoading(false)
    }
  }

  return (
    <div className="doctissimo-page">
      <div className="header">Doctissimo.IA</div>
      <table className="layout-table" cellPadding="0" cellSpacing="0">
        <tbody>
          <tr>
            <td className="main-cell">
              {!threadId && (
                <form className="thread-form" onSubmit={submit}>
                  <label>
                    Sujet
                    <input value={topic} onChange={(event) => setTopic(event.target.value)} />
                  </label>
                  <label>
                    Message
                    <textarea
                      value={seedPost}
                      onChange={(event) => setSeedPost(event.target.value)}
                      rows={6}
                    />
                  </label>
                  <button className="btn-pink" type="submit" disabled={loading}>
                    Poster :bounce:
                  </button>
                </form>
              )}

              {threadId && (
                <>
                  <div className="thread-title">Sujet : {topic}</div>
                  <div className="post seed-post">
                    <div className="post-header">
                      <span>Vous</span>
                      <span>Posté maintenant</span>
                    </div>
                    <div className="seed-content">{seed}</div>
                  </div>
                  <div className="thread-status">
                    Thread #{threadId} · {posts.length} réponse(s)
                    {loading ? ' · connexion en cours...' : ''}
                  </div>
                  {posts
                    .slice()
                    .sort((a, b) => a.arrived_at - b.arrived_at)
                    .map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                </>
              )}

              {error && <div className="smoke-result smoke-result-error">{error}</div>}
            </td>
          </tr>
        </tbody>
      </table>
      <footer>© Doctissimo.IA 2026 — site parodique pour DEFENDHACK</footer>
    </div>
  )
}
