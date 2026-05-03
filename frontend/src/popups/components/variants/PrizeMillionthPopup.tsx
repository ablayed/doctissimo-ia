import { useEffect, useState } from 'react'

import { PopupBase } from '../PopupBase'
import type { PopupInstance } from '../../types'

export function PrizeMillionthPopup({ instance }: { instance: PopupInstance }) {
  const [seconds, setSeconds] = useState(29)

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <PopupBase instance={instance} title="FELICITATIONS !" width={420}>
      <div className="popup-prize">
        <div className="popup-prize-title">FELICITATIONS !!!</div>
        <div className="popup-copy">
          Vous etes le <strong>1 000 000eme visiteur</strong> de Doctissimo !
          <br />
          Vous venez de gagner un <strong>iPod Nano* GRATUIT</strong> !
        </div>
        <div className="popup-countdown">00:00:{String(seconds).padStart(2, '0')}</div>
        <button
          className="popup-green-cta"
          type="button"
          onClick={() => alert('Erreur 0x80004005\n\nServeur cadeau injoignable.\nReessayez en 2003.')}
        >
          RECLAMER MON CADEAU
        </button>
        <div className="popup-fine-print">*offre soumise a conditions, timbre non rembourse</div>
      </div>
    </PopupBase>
  )
}
