import { useMemo } from 'react'

type Props = {
  open: boolean
  onSubmit: (pseudo: string) => void
  onSkip: () => void
}

const suggestions = [
  'Sophie33',
  'MamanDe2Loulous',
  'Princesse_du_77',
  'tony-le-tigre',
  'BG_du_93',
  'JustineEnEssais',
  'BiscotteDuLot',
  'Karine-Amour-2003',
  'xX-Princess-Du-67-Xx',
  'MichouLaCool',
  'PetiteFleur1985',
  'ZhomEtMoi',
  'Ben2DePuteaux',
  'MaPuceMai05',
]

export default function PseudoModal({ open, onSubmit, onSkip }: Props) {
  const chips = useMemo(() => [...suggestions].sort(() => Math.random() - 0.5).slice(0, 6), [])
  if (!open) return null

  return (
    <div className="pseudo-modal-backdrop" data-modal="pseudo">
      <div className="pseudo-modal">
        <div className="pseudo-modal-titlebar">
          <span>Bienvenue dans la communaute Doctissimo.IA !</span>
          <span>x</span>
        </div>
        <div className="pseudo-modal-body">
          <div style={{ marginBottom: 8, color: '#800040', fontWeight: 'bold' }}>Inscription gratuite - En 1 clic</div>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              const formData = new FormData(event.currentTarget)
              const value = String(formData.get('pseudo') || '').trim()
              if (/^[A-Za-z0-9_-]{3,30}$/.test(value)) {
                onSubmit(value)
              }
            }}
          >
            <label htmlFor="pseudo">Choisissez votre pseudo (anonyme, stocke uniquement sur votre navigateur) :</label>
            <input id="pseudo" name="pseudo" type="text" maxLength={30} pattern="[A-Za-z0-9_-]+" />
            <div className="pseudo-suggestions">
              {chips.map((item) => (
                <button
                  type="button"
                  key={item}
                  className="pseudo-chip"
                  onClick={(event) => {
                    const input = event.currentTarget.form?.elements.namedItem('pseudo') as HTMLInputElement | null
                    if (input) input.value = item
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="pseudo-modal-actions">
              <button
                type="button"
                style={{ marginRight: 8, background: 'none', border: 0, color: '#003366', textDecoration: 'underline', cursor: 'pointer' }}
                onClick={onSkip}
              >
                Continuer en invite
              </button>
              <button className="btn-pink" type="submit">
                Entrer dans le forum :bounce:
              </button>
            </div>
            <div className="pseudo-modal-disclaimer">Doctissimo.IA est un site parodique. Aucune donnee n'est envoyee a un serveur.</div>
          </form>
        </div>
      </div>
    </div>
  )
}
