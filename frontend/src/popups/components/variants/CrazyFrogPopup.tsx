import { PopupBase } from '../PopupBase'
import type { PopupInstance } from '../../types'

export function CrazyFrogPopup({ instance }: { instance: PopupInstance }) {
  return (
    <PopupBase instance={instance} title="SONNERIES 81212" width={400}>
      <div className="popup-crazy-frog">
        <div className="popup-big-title">CRAZY FROG sur ton portable !</div>
        <div className="popup-copy">
          Telecharge la sonnerie numero 1 en France !
          <br />
          Bingbing... ding ding...
          <br />
          <strong>Envoie CRAZY au 81212</strong>
        </div>
        <button
          className="popup-red-cta"
          type="button"
          onClick={() => alert('Fonctionnalite indisponible.\nLe service 81212 a ferme en 2008.')}
        >
          TELECHARGER
        </button>
        <div className="popup-fine-print">*Service abonnement 4,50 EUR/sem. STOP au 81212.</div>
      </div>
    </PopupBase>
  )
}
