import type { ForumPost } from './PostCard'

type Props = {
  open: boolean
  onClose: () => void
  votes: Record<string, 'credible' | 'noise' | null>
  posts: ForumPost[]
  truthTellerId: string
}

export default function RevealModal({ open, onClose, votes, posts, truthTellerId }: Props) {
  if (!open) return null
  const truthPost = posts.find((post) => post.persona_id === truthTellerId)
  const userScore = truthPost && votes[truthPost.id] === 'credible' ? 100 : 42
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `J'ai voté correctement sur ${userScore}% des messages Doctissimo.IA.`,
  )}`

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>LA VÉRITÉ EST AILLEURS</h2>
        <p>L'experte du forum, c'est : InfirmièreUrgences42</p>
        <div className="score-big">{userScore}%</div>
        <p>Sa réponse est sourcée HAS / Ameli.</p>
        <p>Vous avez voté correctement sur {userScore}% des messages.</p>
        <p>Moyenne des autres joueurs : 23%</p>
        <p>Pour de vrais conseils santé : ameli.fr · has-sante.fr · 15 (SAMU)</p>
        <p>
          <a href={tweetUrl} target="_blank" rel="noreferrer">
            Partager mon score sur X
          </a>
        </p>
        <button className="btn-pink" onClick={onClose}>
          Continuer à explorer le forum
        </button>
      </div>
    </div>
  )
}
