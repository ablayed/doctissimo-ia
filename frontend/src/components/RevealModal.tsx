import { useMemo } from 'react'

import type { ForumPost } from './PostCard'

type Props = {
  open: boolean
  onClose: () => void
  votes: Record<string, 'credible' | 'noise' | null>
  posts: ForumPost[]
  truthTellerId: string
}

export default function RevealModal({ open, onClose, votes, posts, truthTellerId }: Props) {
  const truthPost = posts.find((post) => post.persona_id.toLowerCase() === truthTellerId)
  const noisePosts = posts.filter((post) => post.persona_id.toLowerCase() !== truthTellerId)
  const userVotedCredibleOnTruth = truthPost ? votes[truthPost.id] === 'credible' : false
  const userVotedNoiseOnNoise = noisePosts.filter((post) => votes[post.id] === 'noise').length
  const totalVoted = Object.values(votes).filter(Boolean).length
  const correctVotes = (userVotedCredibleOnTruth ? 1 : 0) + userVotedNoiseOnNoise
  const userScore = totalVoted ? Math.round((correctVotes / totalVoted) * 100) : 0
  const verdict =
    userScore >= 70
      ? "Bravo ! Vous avez l'oeil clinique."
      : userScore >= 30
        ? 'Pas mal, mais le doute persiste comme en 2003.'
        : 'Hmm. Vous auriez tenu 10 minutes sur Doctissimo en 2003.'
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `J'ai vote correctement sur ${userScore}% des messages Doctissimo.IA. L'infirmiere SAMU avait raison. La moyenne est a 23%. Testez ici : https://doctissimo-ia.vercel.app #DEFENDHACK`,
  )}`
  const confetti = useMemo(
    () =>
      Array.from({ length: 30 }, (_, index) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        bg: ['#E5007E', '#FFCC00', '#00CC00', '#0000FF', '#FF6600'][index % 5],
      })),
    [],
  )

  if (!open) return null

  return (
    <>
      <div className="confetti">
        {confetti.map((piece, index) => (
          <div
            key={`${piece.left}-${index}`}
            className="confetti-piece"
            style={{ left: `${piece.left}%`, animationDelay: `${piece.delay}s`, background: piece.bg }}
          />
        ))}
      </div>
      <div className="reveal-backdrop">
        <div className="reveal-modal">
          <div className="reveal-titlebar">LA VERITE EST REVELEE</div>
          <div className="reveal-body">
            <div className="reveal-truth">L'experte du forum, c'est : InfirmiereUrgences42</div>
            <p>
              Sa reponse est sourcee HAS / Ameli. Les 29 autres sont des personas Doctissimo classiques de 2003 :
              homeopathie, complots, remedes de grand-mere et paniques.
            </p>
            <div className="score-big">{userScore}%</div>
            <div className="score-comparison">Moyenne des autres joueurs : 23%</div>
            <div className="score-verdict">{verdict}</div>
            <div style={{ textAlign: 'center' }}>
              <a className="share-link" href={tweetUrl} target="_blank" rel="noreferrer">
                Partager sur X
              </a>
            </div>
            <div className="reveal-footer-warning">Pour de vrais conseils sante : ameli.fr · has-sante.fr · 15 (SAMU)</div>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button className="btn-pink" type="button" onClick={onClose}>
                Continuer a explorer le forum
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
