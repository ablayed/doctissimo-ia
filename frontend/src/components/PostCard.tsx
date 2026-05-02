import { placeholderAvatar, renderSmileysAndQuotes } from '../utils/smileys'

const TRUTH_TELLER_ID = 'infirmiereurgences42'

export type ForumPost = {
  id: string
  persona_id: string
  pseudo: string
  parent_id: string | null
  text: string
  arrived_at: number
}

export default function PostCard({
  post,
  index,
  votes,
  vote,
  revealed,
}: {
  post: ForumPost
  index: number
  votes: Record<string, 'credible' | 'noise' | null>
  vote: (id: string, value: 'credible' | 'noise' | null) => void
  revealed: boolean
}) {
  const isTruth = post.persona_id.toLowerCase() === TRUTH_TELLER_ID
  const isReply = !!post.parent_id
  const isNew = post.arrived_at < 5
  const seconds = Math.max(1, Math.floor(post.arrived_at))
  const timeAgo = seconds < 60 ? `il y a ${seconds}s` : `il y a ${Math.floor(seconds / 60)}min`

  return (
    <div className={`post ${isReply ? 'post-reply' : ''} ${revealed && isTruth ? 'post-truth-revealed' : ''}`}>
      <div className="post-meta">
        <span>
          <span className="post-num">#{String(index + 1).padStart(4, '0')}</span> Poste {timeAgo}
          {isNew && <span className="new-badge">NEW!</span>}
        </span>
        <span className="post-time">
          [<a href="#">Citer</a>] [<a href="#">Editer</a>] [<a href="#">Signaler</a>]
        </span>
      </div>
      <div className="post-author">
        <span className="pseudo">
          {post.pseudo}
          {revealed && isTruth && <span className="truth-badge">VERIFIEE</span>}
        </span>
        <img
          className="avatar"
          src={`https://api.dicebear.com/7.x/pixel-art/png?seed=${post.persona_id}&size=100`}
          onError={(event) => {
            event.currentTarget.src = placeholderAvatar(post.pseudo)
          }}
          alt={post.pseudo}
        />
        <div className="member-status">● en ligne</div>
        <div className="member-stats">
          <span>Inscrit(e) le 12/05/2003</span>
          <span>{Math.floor(Math.random() * 4000) + 200} messages</span>
          <span>France</span>
        </div>
      </div>
      <div className="post-content">
        <div
          dangerouslySetInnerHTML={{
            __html: renderSmileysAndQuotes(post.text, revealed && isTruth),
          }}
        />
        <div className="signature">Signature perso : msn, skyblog, bisous les filles...</div>
        <div className="vote-bar">
          <button
            className={`vote-btn ${votes[post.id] === 'credible' ? 'active' : ''}`}
            onClick={() => vote(post.id, votes[post.id] === 'credible' ? null : 'credible')}
            type="button"
          >
            Credible
          </button>
          <button
            className={`vote-btn ${votes[post.id] === 'noise' ? 'active' : ''}`}
            onClick={() => vote(post.id, votes[post.id] === 'noise' ? null : 'noise')}
            type="button"
          >
            N'importe quoi
          </button>
          {votes[post.id] && <span className="vote-feedback">OK enregistre</span>}
        </div>
      </div>
    </div>
  )
}
