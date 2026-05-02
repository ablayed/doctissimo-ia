import { useEffect, useState } from 'react'

import UnderConstructionStrip from './UnderConstructionStrip'

const STORAGE_KEY = 'doctissimo-modem-seen'
const TTL_MS = 24 * 60 * 60 * 1000

export default function ModemModal({
  onComplete,
  onPlayModem,
}: {
  onComplete: () => void
  onPlayModem: () => void
}) {
  const [stage, setStage] = useState<'init' | 'dialing' | 'connecting' | 'connected'>('init')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const last = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10)
    if (Date.now() - last < TTL_MS) {
      onComplete()
    }
  }, [onComplete])

  function startConnection() {
    setStage('dialing')
    onPlayModem()
    let value = 0
    const interval = window.setInterval(() => {
      value += Math.random() * 8 + 2
      setProgress(Math.min(value, 100))
      if (value >= 30 && value < 35) setStage('connecting')
      if (value >= 100) {
        window.clearInterval(interval)
        setStage('connected')
        window.setTimeout(() => {
          localStorage.setItem(STORAGE_KEY, Date.now().toString())
          onComplete()
        }, 1200)
      }
    }, 200)
  }

  return (
    <div className="modem-backdrop">
      <div className="modem-window">
        <div className="modem-titlebar">
          <span>Connexion à Internet - Doctissimo.IA</span>
          <span className="modem-close">x</span>
        </div>
        <div className="modem-body">
          {stage === 'init' && (
            <>
              <p>
                Bienvenue sur <strong>Doctissimo.IA</strong> !
              </p>
              <p style={{ margin: '8px 0' }}>
                Cliquez sur "Connexion" pour accéder au forum communautaire.
              </p>
              <p className="retro-window-text">Tarif : 0,15 F la minute - Ne convient pas aux mineurs non accompagnés</p>
              <UnderConstructionStrip />
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button className="btn-pink" onClick={startConnection} type="button">
                  Connexion
                </button>
              </div>
            </>
          )}
          {(stage === 'dialing' || stage === 'connecting') && (
            <>
              <p>{stage === 'dialing' ? 'Numérotation...' : 'Négociation modem...'}</p>
              <div className="modem-progress">
                <div className="modem-progress-bar" style={{ width: `${progress}%` }} />
              </div>
              <p className="retro-window-text" style={{ marginTop: 4 }}>
                {stage === 'dialing' ? '0892 700 100' : 'V.92 - 56 000 bps'}
              </p>
              <UnderConstructionStrip />
            </>
          )}
          {stage === 'connected' && (
            <p style={{ color: '#00AA00', textAlign: 'center', padding: '12px' }}>
              [OK] Connexion établie ! Chargement du forum...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
