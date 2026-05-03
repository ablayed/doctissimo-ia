import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { popupRegistry } from '../config/popupRegistry'
import { useCriticalModalPause } from '../hooks/useCriticalModalPause'
import { useKillSwitch } from '../hooks/useKillSwitch'
import { usePopupSpawner } from '../hooks/usePopupSpawner'
import { usePopupStore } from '../store/popupStore'
import '../styles/retro.css'

interface Props {
  currentSymptom?: string
}

declare global {
  interface Window {
    __doctissimoPopups?: ReturnType<typeof usePopupStore.getState>
    __store?: ReturnType<typeof usePopupStore.getState>
  }
}

export function PopupRoot({ currentSymptom }: Props) {
  const popups = usePopupStore((state) => state.popups)
  const [container, setContainer] = useState<HTMLElement | null>(null)

  useKillSwitch()
  useCriticalModalPause()
  usePopupSpawner({ currentSymptom })

  useEffect(() => {
    let element = document.getElementById('popup-root')
    if (!element) {
      element = document.createElement('div')
      element.id = 'popup-root'
      document.body.appendChild(element)
    }
    setContainer(element)
  }, [])

  useEffect(() => {
    window.__doctissimoPopups = usePopupStore.getState()
    window.__store = usePopupStore.getState()
  }, [popups])

  if (!container) return null

  return createPortal(
    <>
      {popups.map((popup) => {
        const entry = popupRegistry[popup.variantId]
        const Component = entry.Component
        return <Component key={popup.id} instance={popup} />
      })}
    </>,
    container,
  )
}
