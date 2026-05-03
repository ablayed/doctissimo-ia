import { useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { usePopupStore } from '../store/popupStore'
import type { PopupInstance } from '../types'
import { playSound } from '../../utils/sounds'

interface Props {
  instance: PopupInstance
  title: string
  children: ReactNode
  width?: number
  className?: string
}

export function PopupBase({ instance, title, children, width = 420, className = '' }: Props) {
  const close = usePopupStore((state) => state.close)
  const [pos, setPos] = useState(instance.position)
  const [movedX, setMovedX] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const handleClose = () => {
    playSound('error-chime', 0.2)
    close(instance.id)
  }

  const handleXMouseEnter = () => {
    if (instance.behavior.fakeClose !== 'moves-on-hover' || movedX) return
    const nextX = Math.max(20, Math.min(window.innerWidth - width - 20, pos.x + (Math.random() - 0.5) * 400))
    const nextY = Math.max(80, Math.min(window.innerHeight - 340, pos.y + (Math.random() - 0.5) * 300))
    setPos({ x: nextX, y: nextY })
    setMovedX(true)
  }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={title}
      className={`window retro-popup ${className}`}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: instance.z,
        width,
        boxShadow: '2px 2px 0 rgba(0,0,0,0.35)',
        fontFamily: 'Tahoma, Verdana, sans-serif',
        fontSize: '11px',
      }}
    >
      <div className="title-bar">
        <div className="title-bar-text">{title}</div>
        <div className="title-bar-controls">
          <button aria-label="Minimize" tabIndex={-1} type="button" />
          <button aria-label="Maximize" tabIndex={-1} type="button" />
          <button aria-label="Close" onClick={handleClose} onMouseEnter={handleXMouseEnter} type="button" />
        </div>
      </div>
      <div className="window-body" style={{ padding: 12 }}>
        {children}
        {instance.behavior.fakeClose === 'double-x' && (
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <button onClick={handleClose} type="button">
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
