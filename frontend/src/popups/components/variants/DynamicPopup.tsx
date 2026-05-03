import { PopupBase } from '../PopupBase'
import type { DynamicPopupData, PopupInstance } from '../../types'

const COLOR_SCHEMES: Record<string, { bg: string; color: string; fine: string }> = {
  rouge: { bg: 'linear-gradient(180deg, #FF0000 0%, #990000 100%)', color: '#FFFFFF', fine: '#FFFF00' },
  bleu: { bg: 'linear-gradient(180deg, #0033CC 0%, #001A66 100%)', color: '#FFFF00', fine: '#FFFFFF' },
  jaune: { bg: 'linear-gradient(180deg, #FFFF00 0%, #FFD700 100%)', color: '#000000', fine: '#333333' },
  rose: { bg: 'linear-gradient(180deg, #FF1493 0%, #CC0066 100%)', color: '#FFFFFF', fine: '#FFFF00' },
}

function isDynamicData(data: PopupInstance['data']): data is DynamicPopupData {
  return Boolean(data && data.title && data.body && data.cta)
}

export function DynamicPopup({ instance }: { instance: PopupInstance }) {
  if (!isDynamicData(instance.data)) return null
  const data = instance.data
  const scheme = COLOR_SCHEMES[data.color_scheme || 'rose'] || COLOR_SCHEMES.rose

  return (
    <PopupBase instance={instance} title="PUBLICITE" width={420}>
      <div className="popup-dynamic" style={{ background: scheme.bg, color: scheme.color }}>
        <div className="popup-dynamic-title">{data.title}</div>
        <div className="popup-dynamic-body">{data.body}</div>
        <button
          className="popup-yellow-cta"
          type="button"
          onClick={() => alert("Cette publicite est generee par IA.\nC'est de la nostalgie 2003.\nNe cliquez pas. C'est faux.")}
        >
          {data.cta}
        </button>
        {data.fine_print && (
          <div className="popup-dynamic-fine" style={{ color: scheme.fine }}>
            {data.fine_print}
          </div>
        )}
        <div className="popup-ai-credit">Publicite generee par IA</div>
      </div>
    </PopupBase>
  )
}
