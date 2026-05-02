export default function StatsBar({
  counter,
  elapsed,
}: {
  counter: number
  elapsed: number
}) {
  const sujets = 12471 + Math.floor(elapsed / 60)
  const messages = 892341 + elapsed * 7

  return (
    <div className="stats-bar">
      <span>
        Vous êtes le{' '}
        <span className="counter">
          {counter.toLocaleString('fr-FR', { minimumIntegerDigits: 7, useGrouping: false })}
        </span>
        ème visiteur
      </span>
      <span>{sujets.toLocaleString('fr-FR')} sujets</span>
      <span>{messages.toLocaleString('fr-FR')} messages</span>
      <span>1247 membres en ligne</span>
    </div>
  )
}
