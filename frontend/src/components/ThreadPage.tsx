import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'

import FakeAds from './FakeAds'
import PostCard, { type ForumPost } from './PostCard'
import PseudoModal from './PseudoModal'
import RecentThreads from './RecentThreads'
import RevealModal from './RevealModal'
import StatsBar from './StatsBar'
import SubForumSidebar from './SubForumSidebar'
import { useUser } from '../hooks/useUser'
import { useVotes } from '../hooks/useVotes'

type StartResponse = {
  thread_id: string
  n_personas: number
}

type ReplayThread = {
  thread_id: string
  topic: string
  seed_post: string
  posts: ForumPost[]
}

const TRUTH_TELLER_ID = 'infirmiereurgences42'

export default function ThreadPage() {
  const [topic, setTopic] = useState('mal au ventre')
  const [seedPost, setSeedPost] = useState('jé mal o ventre depui 2j c grav ???')
  const [threadId, setThreadId] = useState<string | null>(null)
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [seed, setSeed] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRevealBanner, setShowRevealBanner] = useState(false)
  const [revealOpen, setRevealOpen] = useState(false)
  const [showPseudoModal, setShowPseudoModal] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const user = useUser()
  const votesApi = useVotes(threadId || 'none')
  const votes = votesApi.votes

  useEffect(() => {
    fetch('/api/warm').catch(() => {})
    const params = new URLSearchParams(window.location.search)
    const threadQuery = params.get('t')
    if (threadQuery) void loadReplay(threadQuery)
    else setShowPseudoModal(!user.isRegistered)
  }, [])

  useEffect(() => {
    if (votesApi.totalVotes >= 10) setShowRevealBanner(true)
  }, [votesApi.totalVotes])

  function closeStream() {
    eventSourceRef.current?.close()
  }

  async function loadReplay(selectedThreadId: string) {
    closeStream()
    setLoading(true)
    setError('')
    setPosts([])
    setThreadId(null)
    try {
      const response = await fetch(`/api/forum/${selectedThreadId}/replay`)
      if (!response.ok) throw new Error(`Erreur ${response.status}`)
      const data = (await response.json()) as ReplayThread
      setTopic(data.topic)
      setSeed(data.seed_post)
      setThreadId(data.thread_id)
      setPosts(data.posts)
      window.history.replaceState(null, '', `?t=${data.thread_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    closeStream()
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
      if (!response.ok) throw new Error(`Erreur ${response.status}`)
      const data = (await response.json()) as StartResponse
      setThreadId(data.thread_id)
      const source = new EventSource(`/api/forum/${data.thread_id}/stream`)
      eventSourceRef.current = source
      source.addEventListener('post', (message) => {
        const post = JSON.parse((message as MessageEvent).data) as ForumPost
        setPosts((current) => (current.some((item) => item.id === post.id) ? current : [...current, post]))
      })
      source.addEventListener('done', () => {
        source.close()
        setLoading(false)
        window.history.replaceState(null, '', `?t=${data.thread_id}`)
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

  const sortedPosts = useMemo(() => posts.slice().sort((a, b) => a.arrived_at - b.arrived_at), [posts])

  return (
    <div className="doctissimo-page">
      <PseudoModal
        open={showPseudoModal}
        onSubmit={(pseudo) => {
          user.register(pseudo)
          setShowPseudoModal(false)
        }}
      />
      <RevealModal
        open={revealOpen}
        onClose={() => setRevealOpen(false)}
        votes={votes}
        posts={sortedPosts}
        truthTellerId={TRUTH_TELLER_ID}
      />
      {user.pseudo && (
        <div className="connected-banner">
          Connecté(e) en tant que <strong>{user.pseudo}</strong>
          <button className="logout-link" type="button" onClick={user.logout}>
            Se déconnecter
          </button>
        </div>
      )}
      <div className="header">Doctissimo.IA</div>
      <StatsBar />
      <div className="main-layout">
        <main className="thread-main">
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
              {showRevealBanner && (
                <div className="reveal-banner">
                  Vous avez voté sur {votesApi.totalVotes} messages.
                  <button className="btn-pink" type="button" onClick={() => setRevealOpen(true)}>
                    Voulez-vous voir la vérité ?
                  </button>
                </div>
              )}
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
              {sortedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  vote={votesApi.vote}
                  voteValue={votes[post.id] || null}
                  revealed={revealOpen}
                  isTruthTeller={post.persona_id.toLowerCase() === TRUTH_TELLER_ID}
                />
              ))}
            </>
          )}

          <RecentThreads onSelect={loadReplay} />
          {error && <div className="smoke-result smoke-result-error">{error}</div>}
        </main>
        <aside className="sidebar-column">
          <SubForumSidebar />
          <FakeAds variant="skyscraper" />
        </aside>
      </div>
      <footer>© Doctissimo.IA 2026 — site parodique pour DEFENDHACK</footer>
    </div>
  )
}
