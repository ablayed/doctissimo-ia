type Props = {
  open: boolean
  onSubmit: (pseudo: string) => void
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

export default function PseudoModal({ open, onSubmit }: Props) {
  if (!open) return null
  const chips = [...suggestions].sort(() => Math.random() - 0.5).slice(0, 6)
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Bienvenue dans la communauté Doctissimo.IA !</h2>
        <p>Choisissez votre pseudo (anonyme, stocké uniquement sur votre navigateur) :</p>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const formData = new FormData(event.currentTarget)
            const value = String(formData.get('pseudo') || '').trim()
            if (value.length >= 3) onSubmit(value)
          }}
        >
          <input name="pseudo" maxLength={30} pattern="[A-Za-z0-9_-]+" />
          <div className="pseudo-suggestions">
            {chips.map((item) => (
              <button
                type="button"
                key={item}
                className="pseudo-chip"
                onClick={(event) => {
                  const input = event.currentTarget.parentElement?.parentElement?.querySelector(
                    'input[name="pseudo"]',
                  ) as HTMLInputElement | null
                  if (input) input.value = item
                }}
              >
                {item}
              </button>
            ))}
          </div>
          <button className="btn-pink" type="submit">
            Entrer dans le forum :bounce:
          </button>
          <div className="smoke-result" style={{ marginTop: '8px' }}>
            Doctissimo.IA est un site parodique. Aucune donnée n'est envoyée à un serveur.
          </div>
        </form>
      </div>
    </div>
  )
}
