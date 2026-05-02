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
const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA',
]

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
  const [nightMode, setNightMode] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const konamiBuffer = useRef<string[]>([])
  const logoClicks = useRef(0)
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

  useEffect(() => {
    document.body.classList.toggle('night-mode', nightMode)
  }, [nightMode])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      konamiBuffer.current = [...konamiBuffer.current, event.code].slice(-KONAMI.length)
      if (KONAMI.every((key, index) => konamiBuffer.current[index] === key)) {
        alert('PERLES DE DOCTISSIMO 2003 ACTIVÉES')
        setTopic('Perles de Doctissimo')
        setSeedPost(
          "Mon homéopathe m'a dit qu'il faut mettre une gousse d'ail dans le bocal en argent au clair de lune sa marche tro b1 jé eu mes regle 1h après tkt :love:",
        )
      }
    }
    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault()
      alert(
        "Erreur 0x80004005\n\nImpossible de copier le contenu protégé par Doctissimo.IA.\n\nContactez votre administrateur système.",
      )
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('contextmenu', onContextMenu)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('contextmenu', onContextMenu)
    }
  }, [])

  function closeStream() {
    eventSourceRef.current?.close()
  }

  function triggerNightMode() {
    logoClicks.current += 1
    if (logoClicks.current >= 3) {
      setNightMode(true)
    }
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

  function handleSeedChange(value: string) {
    setSeedPost(value)
    if (value === ':bounce:') {
      const img = document.createElement('img')
      img.src = '/smileys/bounce.gif'
      img.alt = ':bounce:'
      img.style.position = 'fixed'
      img.style.top = '40%'
      img.style.left = '-100px'
      img.style.zIndex = '9999'
      img.style.transition = 'transform 3s linear'
      document.body.appendChild(img)
      window.setTimeout(() => {
        img.style.transform = 'translateX(calc(100vw + 160px))'
      }, 20)
      window.setTimeout(() => img.remove(), 3200)
      window.setTimeout(() => alert("Easter egg trouvé ! +1 point d'originalité"), 50)
      setSeedPost('')
    }
  }

  const sortedPosts = useMemo(() => posts.slice().sort((a, b) => a.arrived_at - b.arrived_at), [posts])

  return (
    <div className={`doctissimo-page${nightMode ? ' night-mode' : ''}`}>
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
      <div className="header">
        <span className="logo" title="Doctissimo.IA v2.3.7 — propulsé par phpBB (avec un peu d'IA cachée :whistle:)" onClick={triggerNightMode}>
          Doctissimo.IA
        </span>
      </div>
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
                <textarea value={seedPost} onChange={(event) => handleSeedChange(event.target.value)} rows={6} />
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
                  <span>Vous avez voté sur {votesApi.totalVotes} messages.</span>
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
      <footer>
        Site optimisé pour Internet Explorer 5.5+ en 800×600 · © Doctissimo.IA 2026 - Site
        parodique - Tous droits non réservés · Hébergé chez{' '}
        <a href="https://fr.wikipedia.org/wiki/Multimania" target="_blank" rel="noreferrer">
          Multimania.com
        </a>{' '}
        · Webmaster : ablaye@hotmail.fr · Cette page a été créée avec Frontpage 2003 et beaucoup
        d'amour
      </footer>
    </div>
  )
}
