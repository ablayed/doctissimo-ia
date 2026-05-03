import { useEffect } from 'react'

import { usePopupStore } from '../store/popupStore'

export function useCriticalModalPause() {
  const setPaused = usePopupStore((state) => state.setPaused)

  useEffect(() => {
    const check = () => {
      const found = Boolean(document.querySelector('[data-modal="modem"], [data-modal="pseudo"], [data-modal="reveal"]'))
      setPaused(found)
    }
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [setPaused])
}
