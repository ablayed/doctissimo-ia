import { PopupBase } from '../PopupBase'
import type { PopupInstance } from '../../types'

export function StarAcPopup({ instance }: { instance: PopupInstance }) {
  return (
    <PopupBase instance={instance} title="STAR ACADEMY" width={440}>
      <div className="popup-starac">
        <div className="popup-big-title">STAR ACADEMY</div>
        <div className="popup-starac-subtitle">SAUVEZ VOTRE CHOUCHOU !</div>
        <div className="popup-starac-votes">
          Cette semaine, 3 academiciens sont nomines.
          <br />
          C'est a VOUS de voter !
          <br />
          <br />
          Pour <strong>Jenifer</strong>, envoyez <strong>1</strong>
          <br />
          Pour <strong>Mario</strong>, envoyez <strong>2</strong>
          <br />
          Pour <strong>Houcine</strong>, envoyez <strong>3</strong>
        </div>
        <div className="popup-sms">PAR SMS AU 71500</div>
        <div className="popup-fine-print">(0,99 EUR + prix SMS)</div>
      </div>
    </PopupBase>
  )
}
