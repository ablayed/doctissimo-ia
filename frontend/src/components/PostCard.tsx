import type { ReactNode } from 'react'

import { renderSmileys } from '../utils/smileys'

export type ForumPost = {
  id: string
  persona_id: string
  pseudo: string
  parent_id: string | null
  text: string
  arrived_at: number
}

const FALLBACK_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23FFCCE5"/><text x="50" y="55" text-anchor="middle" font-family="Verdana" font-size="10" fill="%23CC0066">Docti</text></svg>'

type Props = {
  post: ForumPost
  vote?: (postId: string, value: 'credible' | 'noise') => void
  voteValue?: 'credible' | 'noise' | null
  revealed?: boolean
  isTruthTeller?: boolean
}

export default function PostCard({ post, vote, voteValue, revealed, isTruthTeller }: Props) {
  const seconds = Math.max(0, Math.round(post.arrived_at))
  const avatar = `/avatars/${post.persona_id}.png`
  const quoteRegex = /\[quote=([^\]]+)\]([\s\S]*?)\[\/quote\]/i
  const match = quoteRegex.exec(post.text)
  const quote = match ? { author: match[1], body: match[2].trim() } : null
  const body = match ? post.text.replace(match[0], '').trim() : post.text
  const bodyNodes: ReactNode[] = body.split(/(https?:\/\/[^\s]+)/g).map((part, index) =>
    /^https?:\/\//.test(part) ? (
      <a href={part} key={`${part}-${index}`} target="_blank" rel="noreferrer">
        {part}
      </a>
    ) : (
      <span key={`${part}-${index}`}>{renderSmileys(part)}</span>
    ),
  )

  return (
    <div
      className={`post${post.parent_id ? ' post-reply' : ''}${
        revealed && isTruthTeller ? ' post-truth-revealed' : ''
      }`}
    >
      <div className="post-header">
        <span>
          {post.pseudo}
          {isTruthTeller && <span className="truth-badge">Vérifiée</span>}
        </span>
        <span>Posté il y a {seconds}s</span>
      </div>
      <table className="post-body" cellPadding="0" cellSpacing="0">
        <tbody>
          <tr>
            <td className="post-author">
              <img
                className="avatar"
                src={avatar}
                alt=""
                onError={(event) => {
                  event.currentTarget.src = FALLBACK_AVATAR
                }}
              />
              <b>{post.pseudo}</b>
              <span>Membre depuis 2003</span>
            </td>
            <td className="post-content">
              {quote && (
                <div className="quote-block">
                  Citation : {quote.body}
                </div>
              )}
              <div>{bodyNodes}</div>
              {vote && (
                <div className="vote-bar">
                  <button
                    className={`vote-btn ${voteValue === 'credible' ? 'active' : ''}`}
                    onClick={() => vote(post.id, 'credible')}
                    type="button"
                  >
                    Crédible
                  </button>
                  <button
                    className={`vote-btn ${voteValue === 'noise' ? 'active' : ''}`}
                    onClick={() => vote(post.id, 'noise')}
                    type="button"
                  >
                    N&apos;importe quoi
                  </button>
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
