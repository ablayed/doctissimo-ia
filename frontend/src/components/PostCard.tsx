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

export default function PostCard({ post }: { post: ForumPost }) {
  const seconds = Math.max(0, Math.round(post.arrived_at))
  const avatar = `/avatars/${post.persona_id}.png`

  return (
    <div className="post">
      <div className="post-header">
        <span>{post.pseudo}</span>
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
            <td className="post-content">{renderSmileys(post.text)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
