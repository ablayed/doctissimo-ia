import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'

import AdRotator from './AdRotator'
import ConstructionScroller from './ConstructionScroller'
import DemoToggle from './DemoToggle'
import Footer from './Footer'
import Header from './Header'
import ModemModal from './ModemModal'
import NavTabs from './NavTabs'
import PostCard, { type ForumPost } from './PostCard'
import PseudoModal from './PseudoModal'
import RecentThreads from './RecentThreads'
import RevealModal from './RevealModal'
import SoundToggle from './SoundToggle'
import StatsBar from './StatsBar'
import SubForumSidebar from './SubForumSidebar'
import TopHotTopics from './TopHotTopics'
import UnderConstructionStrip from './UnderConstructionStrip'
import { useSoundPrefs } from '../hooks/useSound'
import { useUser } from '../hooks/useUser'
import { useVisitorCounter } from '../hooks/useVisitorCounter'
import { useVotes } from '../hooks/useVotes'
import { playSound } from '../utils/sounds'

type StartResponse = {
  thread_id: string
}

type ReplayThread = {
  thread_id: string
  topic: string
  seed_post: string
  posts: ForumPost[]
}

const TRUTH_TELLER_ID = 'infirmiereurgences42'
const REVEAL_STORAGE_KEY = 'doctissimo-revealed'
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']

export default function ThreadPage() {
  const [topic, setTopic] = useState('mal au ventre')
  const [seedPost, setSeedPost] = useState('je mal o ventre depui 2j c grav ???')
  const [threadId, setThreadId] = useState<string | null>(null)
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [seed, setSeed] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [streamRetry, setStreamRetry] = useState<{ topic: string; seedPost: string } | null>(null)
  const [showRevealBanner, setShowRevealBanner] = useState(false)
  const [revealOpen, setRevealOpen] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [showPseudoModal, setShowPseudoModal] = useState(false)
  const [nightMode, setNightMode] = useState(false)
  const [modemReady, setModemReady] = useState(false)
  const [slowStreamWarning, setSlowStreamWarning] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const slowTimerRef = useRef<number | null>(null)
  const konamiBuffer = useRef<string[]>([])
  const logoClicks = useRef(0)
  const user = useUser()
  const votesApi = useVotes(threadId || 'none')
  const sound = useSoundPrefs()
  const { counter, elapsed } = useVisitorCounter()

  useEffect(() => {
    fetch('/api/warm').catch(() => {})
    const params = new URLSearchParams(window.location.search)
    const threadQuery = params.get('t')
    if (threadQuery) void loadReplay(threadQuery)
    else setShowPseudoModal(!user.isRegistered)
  }, [])

  useEffect(() => {
    if (!threadId) return
    const key = `${REVEAL_STORAGE_KEY}:${threadId}`
    setRevealed(localStorage.getItem(key) === '1')
    setRevealOpen(false)
  }, [threadId])

  useEffect(() => {
    if (threadId && votesApi.totalVotes >= 10) {
      setShowRevealBanner(true)
    }
  }, [threadId, votesApi.totalVotes])

  useEffect(() => {
    document.body.classList.toggle('night-mode', nightMode)
  }, [nightMode])

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      konamiBuffer.current = [...konamiBuffer.current, event.code].slice(-KONAMI.length)
      if (KONAMI.every((value, index) => konamiBuffer.current[index] === value)) {
        alert('PERLES DE DOCTISSIMO 2003 ACTIVEES')
        void startThread(
          'Perles de Doctissimo',
          "Mon homeopathe m'a dit qu'il faut mettre une gousse d'ail dans le bocal en argent au clair de lune sa marche tro b1 je eu mes regle 1h apres tkt :love:",
        )
      }
    }
    const contextMenu = (event: MouseEvent) => {
      event.preventDefault()
      alert("Erreur 0x80004005\n\nImpossible de copier le contenu protege par Doctissimo.IA.\n\nContactez votre administrateur systeme.")
    }
    document.addEventListener('keydown', keydown)
    document.addEventListener('contextmenu', contextMenu)
    return () => {
      document.removeEventListener('keydown', keydown)
      document.removeEventListener('contextmenu', contextMenu)
    }
  }, [])

  useEffect(() => {
    if (counter === 8000 || counter === 80000) {
      alert(`FELICITATIONS !\n\nVous etes le ${counter}eme visiteur !\n\nVous avez gagne un cadeau !\n\nCliquez sur OK pour le reclamer.`)
      window.location.href = '/cadeau.html'
    }
  }, [counter])

  useEffect(
    () => () => {
      closeStream()
      if (slowTimerRef.current) window.clearTimeout(slowTimerRef.current)
    },
    [],
  )

  const sortedPosts = useMemo(() => posts.slice().sort((a, b) => a.arrived_at - b.arrived_at), [posts])

  function closeStream() {
    eventSourceRef.current?.close()
    eventSourceRef.current = null
    if (slowTimerRef.current) {
      window.clearTimeout(slowTimerRef.current)
      slowTimerRef.current = null
    }
  }

  function hydrateThread(data: ReplayThread) {
    closeStream()
    setError('')
    setLoading(false)
    setSlowStreamWarning(false)
    setTopic(data.topic)
    setSeed(data.seed_post)
    setThreadId(data.thread_id)
    setPosts(data.posts)
    setShowRevealBanner(votesApi.totalVotes >= 10)
    window.history.replaceState(null, '', `?t=${data.thread_id}`)
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
      hydrateThread(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  async function loadDemo(demoNumber: number) {
    setLoading(true)
    setError('')
    setPosts([])
    setThreadId(null)
    try {
      const response = await fetch(`/api/forum/demo/${demoNumber}`)
      if (!response.ok) throw new Error(`Demo ${demoNumber} indisponible`)
      const data = (await response.json()) as ReplayThread
      hydrateThread(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur demo inconnue')
    } finally {
      setLoading(false)
    }
  }

  async function startThread(nextTopic: string, nextSeed: string) {
    closeStream()
    setLoading(true)
    setError('')
    setPosts([])
    setThreadId(null)
    setSeed(nextSeed)
    setShowRevealBanner(false)
    setRevealOpen(false)
    setRevealed(false)
    setStreamRetry(null)
    setSlowStreamWarning(false)
    try {
      const response = await fetch('/api/forum/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: nextTopic, seed_post: nextSeed }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ detail: `Erreur ${response.status}` }))
        if (response.status === 429) {
          throw new Error('Trop de requetes. Patientez 1 minute (Doctissimo en 2003 ramait aussi).')
        }
        throw new Error(String(payload.detail || `Erreur ${response.status}`))
      }
      const data = (await response.json()) as StartResponse
      setThreadId(data.thread_id)
      setTopic(nextTopic)
      const source = new EventSource(`/api/forum/${data.thread_id}/stream`)
      eventSourceRef.current = source
      slowTimerRef.current = window.setTimeout(() => {
        setSlowStreamWarning(true)
      }, 30000)
      source.addEventListener('post', (message) => {
        const post = JSON.parse((message as MessageEvent).data) as ForumPost
        setPosts((current) => (current.some((item) => item.id === post.id) ? current : [...current, post]))
        setSlowStreamWarning(false)
        if (slowTimerRef.current) {
          window.clearTimeout(slowTimerRef.current)
          slowTimerRef.current = null
        }
        playSound('aol-mail', 0.35)
      })
      source.addEventListener('done', () => {
        closeStream()
        setLoading(false)
        window.history.replaceState(null, '', `?t=${data.thread_id}`)
      })
      source.onerror = () => {
        closeStream()
        setError('La connexion a coupe... Cliquez pour reessayer.')
        setStreamRetry({ topic: nextTopic, seedPost: nextSeed })
        setLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setLoading(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await startThread(topic, seedPost)
  }

  function handleSeedChange(value: string) {
    setSeedPost(value)
    if (value === ':bounce:') {
      const img = document.createElement('img')
      img.src =
        'data:image/svg+xml;utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24"%3E%3Crect width="24" height="24" fill="%23FFFF99"/%3E%3Ctext x="12" y="15" text-anchor="middle" font-family="Verdana" font-size="10" fill="%23CC0066"%3E:B%3C/text%3E%3C/svg%3E'
      img.alt = ':bounce:'
      img.style.position = 'fixed'
      img.style.top = '45%'
      img.style.left = '-100px'
      img.style.zIndex = '9999'
      img.style.transition = 'transform 3s linear'
      document.body.appendChild(img)
      requestAnimationFrame(() => {
        img.style.transform = 'translateX(calc(100vw + 160px))'
      })
      window.setTimeout(() => img.remove(), 3200)
      window.setTimeout(() => alert("Easter egg trouve ! +1 point d'originalite"), 50)
      setSeedPost('')
    }
  }

  function handleLogoClick() {
    logoClicks.current += 1
    if (logoClicks.current >= 3) {
      setNightMode(true)
    }
  }

  function handleLogout() {
    user.logout()
    setShowPseudoModal(true)
  }

  function openReveal() {
    setRevealOpen(true)
    setRevealed(true)
    if (threadId) localStorage.setItem(`${REVEAL_STORAGE_KEY}:${threadId}`, '1')
  }

  return (
    <>
      {!modemReady && <ModemModal onComplete={() => setModemReady(true)} onPlayModem={() => playSound('modem', 0.25)} />}
      <SoundToggle muted={sound.muted} onToggle={() => sound.setMuted(!sound.muted)} />
      <ConstructionScroller />
      <DemoToggle onSelect={loadDemo} />
      <PseudoModal
        open={showPseudoModal}
        onSkip={() => setShowPseudoModal(false)}
        onSubmit={(pseudo) => {
          user.register(pseudo)
          setShowPseudoModal(false)
        }}
      />
      <RevealModal open={revealOpen} onClose={() => setRevealOpen(false)} votes={votesApi.votes} posts={sortedPosts} truthTellerId={TRUTH_TELLER_ID} />
      <div className="doctissimo-page">
        {user.pseudo && (
          <div className="connected-banner">
            <div>
              Connecte(e) en tant que <strong>{user.pseudo}</strong>
              <span className="status">● en ligne</span>
            </div>
            <button className="logout-link" onClick={handleLogout} type="button">
              Se deconnecter
            </button>
          </div>
        )}
        <Header onLogoClick={handleLogoClick} />
        <NavTabs />
        <StatsBar counter={counter} elapsed={elapsed} />
        <div className="main-layout">
          <main className="thread-main">
            {error && (
              <div className="error-banner">
                <span>{error}</span>
                {streamRetry && (
                  <button className="btn-pink" type="button" onClick={() => startThread(streamRetry.topic, streamRetry.seedPost)}>
                    Reessayer
                  </button>
                )}
              </div>
            )}
            {slowStreamWarning && threadId && posts.length === 0 && <div className="warning-banner">Le serveur reflechit. Si rien n'arrive, le modem a peut-etre un probleme.</div>}
            {!threadId && (
              <form className="thread-form" onSubmit={submit}>
                <label>
                  Sujet
                  <input value={topic} onChange={(event) => setTopic(event.target.value)} type="text" maxLength={200} />
                </label>
                <label>
                  Message
                  <textarea value={seedPost} onChange={(event) => handleSeedChange(event.target.value)} rows={6} maxLength={1000} />
                </label>
                <button className="btn-pink" type="submit" disabled={loading}>
                  Poster :bounce:
                </button>
              </form>
            )}
            {threadId && (
              <>
                {showRevealBanner && (
                  <div className="thread-title-bar" style={{ marginBottom: 8 }}>
                    <h2>Vous avez vote sur {votesApi.totalVotes} messages.</h2>
                    <div className="thread-actions">
                      <button className="btn-pink" onClick={openReveal} type="button">
                        Voir la verite
                      </button>
                    </div>
                  </div>
                )}
                <div className="thread-title-bar">
                  <h2>{topic}</h2>
                  <div className="thread-actions">
                    <button className="btn-pink" type="button">
                      Repondre
                    </button>
                    <button className="btn-pink" type="button">
                      Surveiller ce sujet
                    </button>
                    <button className="btn-pink" type="button">
                      Imprimer
                    </button>
                  </div>
                </div>
                <div className="post seed-post">
                  <div className="post-meta">
                    <span>
                      <span className="post-num">#0000</span> Poste maintenant
                    </span>
                    <span className="post-time">[Question initiale]</span>
                  </div>
                  <div className="seed-content">{seed}</div>
                </div>
                {sortedPosts.map((post, index) => (
                  <div key={post.id}>
                    <PostCard post={post} index={index} votes={votesApi.votes} vote={votesApi.vote} revealed={revealed} />
                    {(index + 1) % 7 === 0 && <UnderConstructionStrip />}
                  </div>
                ))}
              </>
            )}
          </main>
          <aside className="sidebar">
            <RecentThreads onSelect={loadReplay} />
            <SubForumSidebar />
            <TopHotTopics />
            <section>
              <h3>Publicite</h3>
              <div className="banner-ad-skyscraper">
                <AdRotator slot="skyscraper" />
              </div>
            </section>
            <section>
              <h3>Travaux</h3>
              <UnderConstructionStrip />
            </section>
          </aside>
        </div>
        <Footer counter={counter.toLocaleString('fr-FR', { minimumIntegerDigits: 7, useGrouping: false })} />
      </div>
    </>
  )
}
