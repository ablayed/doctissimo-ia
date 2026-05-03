import { usePopupStore } from '../../store/popupStore'
import type { PopupInstance } from '../../types'
import '../../styles/bsod.css'

export function BSODPopup({ instance }: { instance: PopupInstance }) {
  const close = usePopupStore((state) => state.close)
  return (
    <div
      className="bsod-popup"
      onClick={() => close(instance.id)}
      onKeyDown={() => close(instance.id)}
      role="button"
      tabIndex={0}
    >
      <h1>Doctissimo</h1>
      <p>
        Une exception 0x80004005 s'est produite dans Internet Explorer 6.0.
        <br />
        L'application doit etre fermee.
      </p>
      <p>
        *** STOP : 0x000000D1 (0x000000FF, 0x00000002, 0x00000000)
        <br />
        DRIVER_IRQL_NOT_LESS_OR_EQUAL
      </p>
      <p>
        Si c'est la premiere fois que vous voyez cet ecran, redemarrez votre ordinateur.
        <br />
        Si cet ecran apparait de nouveau, suivez ces etapes :
      </p>
      <p className="bsod-indent">
        - Verifiez que vos pilotes sont a jour
        <br />
        - Verifiez la compatibilite de votre materiel
        <br />
        - Desinstallez Bonzi Buddy
      </p>
      <p>Demarrage du fichier d'image memoire...</p>
      <p>
        Image memoire physique terminee.
        <br />
        Contactez l'administrateur du systeme ou le webmaster ablaye@hotmail.fr
      </p>
      <p className="bsod-continue">Appuyez sur une touche pour continuer _</p>
    </div>
  )
}
