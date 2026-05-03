import { useEffect, useState } from 'react'

const STORAGE_KEY = 'doctissimo-mode56k'

type ModemAudioHandle = {
  stop: () => void
}

declare global {
  interface Window {
    __modem56kAudio?: ModemAudioHandle
  }
}

function soundsMuted() {
  try {
    return localStorage.getItem('doctissimo-muted') !== 'false'
  } catch {
    return true
  }
}

function startSyntheticHum(): ModemAudioHandle | null {
  if (soundsMuted()) return null
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextCtor) return null

  const context = new AudioContextCtor()
  const low = context.createOscillator()
  const high = context.createOscillator()
  const gain = context.createGain()

  low.type = 'sawtooth'
  low.frequency.value = 180
  high.type = 'square'
  high.frequency.value = 820
  gain.gain.value = 0.012
  low.connect(gain)
  high.connect(gain)
  gain.connect(context.destination)
  low.start()
  high.start()

  const wobble = window.setInterval(() => {
    const now = context.currentTime
    high.frequency.linearRampToValueAtTime(620 + Math.random() * 340, now + 0.15)
    low.frequency.linearRampToValueAtTime(160 + Math.random() * 70, now + 0.2)
  }, 260)

  return {
    stop: () => {
      window.clearInterval(wobble)
      low.stop()
      high.stop()
      void context.close()
    },
  }
}

function stopHum() {
  window.__modem56kAudio?.stop()
  delete window.__modem56kAudio
}

export function Mode56KToggle() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (enabled) {
      document.body.classList.add('mode-56k')
      try {
        localStorage.setItem(STORAGE_KEY, '1')
      } catch {
        // ignore private browsing storage failures
      }
      stopHum()
      const handle = startSyntheticHum()
      if (handle) window.__modem56kAudio = handle
    } else {
      document.body.classList.remove('mode-56k')
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore private browsing storage failures
      }
      stopHum()
    }

    return () => {
      if (!enabled) return
      document.body.classList.remove('mode-56k')
      stopHum()
    }
  }, [enabled])

  return (
    <button className={`mode-56k-toggle${enabled ? ' is-on' : ''}`} onClick={() => setEnabled((value) => !value)} type="button" title="Simule une connexion modem 56K">
      Mode 56K {enabled ? 'ON' : 'OFF'}
    </button>
  )
}
