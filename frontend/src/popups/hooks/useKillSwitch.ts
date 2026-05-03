import { useEffect } from 'react'

import { usePopupStore } from '../store/popupStore'

const KILL_KEY = 'doctissimo_ia_nopopups'

export function useKillSwitch() {
  const setKilled = usePopupStore((state) => state.setKilled)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('nopopups') || params.get('demo') === 'clean' || params.has('jury')) {
      try {
        localStorage.setItem(KILL_KEY, '1')
      } catch {
        // ignore private browsing storage failures
      }
      setKilled(true)
      return undefined
    }
    if (params.has('popups')) {
      try {
        localStorage.removeItem(KILL_KEY)
      } catch {
        // ignore private browsing storage failures
      }
      setKilled(false)
    } else {
      try {
        if (localStorage.getItem(KILL_KEY) === '1') {
          setKilled(true)
          return undefined
        }
      } catch {
        // ignore private browsing storage failures
      }
    }

    let lastEsc = 0
    let escCount = 0
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const now = Date.now()
      if (now - lastEsc < 800) {
        escCount += 1
        if (escCount >= 2) {
          try {
            localStorage.setItem(KILL_KEY, '1')
          } catch {
            // ignore private browsing storage failures
          }
          setKilled(true)
          escCount = 0
        }
      } else {
        escCount = 0
      }
      lastEsc = now
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setKilled])
}
