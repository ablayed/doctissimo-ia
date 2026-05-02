import { useEffect, useState } from 'react'

export default function StatsBar() {
  const [counter, setCounter] = useState(347847)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCounter((value) => {
        const next = value + 1 + Math.floor(Math.random() * 3)
        if (next === 8000 || next === 80000) {
          alert(
            `FÉLICITATIONS !\n\nVous êtes le ${next}ème visiteur !\n\nVous avez gagné un cadeau !\n\nCliquez sur OK pour le réclamer.`,
          )
          window.location.href = '/cadeau.html'
        }
        return next
      })
      setElapsed((value) => value + 4)
    }, 4000)
    return () => window.clearInterval(timer)
  }, [])

  const sujets = 12471 + Math.floor(elapsed / 60)
  const messages = 892341 + elapsed * 7

  return (
    <div className="stats-bar">
      <span>
        Vous êtes le <span className="counter">{String(counter).padStart(7, '0')}</span>ème
        visiteur
      </span>
      <span>{sujets.toLocaleString('fr-FR')} sujets</span>
      <span>{messages.toLocaleString('fr-FR')} messages</span>
      <span>1247 membres en ligne</span>
    </div>
  )
}
