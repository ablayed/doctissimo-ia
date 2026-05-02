import { useEffect, useState } from 'react'

import { placeholderAd } from '../utils/smileys'

const ADS = [
  { src: placeholderAd('Perdez 5kg en 2 semaines IA', '#FFF799', '#CC0066'), alt: 'Perdez 5kg en 2 semaines' },
  { src: placeholderAd("LLMeetic - Rencontrez l'ame soeur", '#CCE6FF', '#003366'), alt: "Rencontrez l'ame soeur" },
  { src: placeholderAd('Test de QI gratuit', '#FFFFFF', '#000080'), alt: 'Test de QI gratuit' },
  { src: placeholderAd('Madame GPT predit votre avenir', '#FFE0F0', '#800040'), alt: 'Madame GPT predit' },
  { src: placeholderAd('Sonneries 3 euros', '#FFF0CC', '#CC6600'), alt: 'Sonneries 3E' },
  { src: placeholderAd('VOUS AVEZ GAGNE', '#FFDDDD', '#FF0000'), alt: 'Cadeau' },
]

export default function AdRotator({ slot }: { slot: 'leaderboard' | 'skyscraper' }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => setIdx((value) => (value + 1) % ADS.length), 8000)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <a
      href="#"
      onClick={(event) => {
        event.preventDefault()
        alert("Erreur 0x80004005\n\nUne autre fenêtre s'est ouverte.\nVeuillez désactiver votre bloqueur de pop-ups.")
      }}
    >
      <img src={ADS[idx].src} alt={ADS[idx].alt} className={`banner-ad-${slot}`} />
    </a>
  )
}
