import { create } from 'zustand'

import { TIMINGS } from '../config/timings'
import type { PopupBehavior, PopupData, PopupInstance, PopupVariantId } from '../types'
import { playSound } from '../../utils/sounds'

interface PopupState {
  popups: PopupInstance[]
  isPaused: boolean
  isKilled: boolean
  cascadeUsedThisSession: boolean
  spawnedOnce: Set<PopupVariantId>
  spawn: (variantId: PopupVariantId, behaviorOverride?: Partial<PopupBehavior>, data?: PopupData) => string | null
  close: (id: string) => void
  closeAll: () => void
  setPaused: (paused: boolean) => void
  setKilled: (killed: boolean) => void
  markCascadeUsed: () => void
}

const DEFAULT_BEHAVIORS: Record<PopupVariantId, PopupBehavior> = {
  'crazy-frog': { autoDismissMs: TIMINGS.AUTO_DISMISS_MS, fakeClose: 'moves-on-hover' },
  'prize-millionth': { fakeClose: 'spawn-another', cascadeOnClose: 3, once: true, autoDismissMs: 90000 },
  'star-ac': { autoDismissMs: TIMINGS.AUTO_DISMISS_MS },
  dynamic: { autoDismissMs: TIMINGS.AUTO_DISMISS_MS },
  bsod: { once: true, autoDismissMs: 30000 },
}

function randomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function randomPosition(behavior: PopupBehavior) {
  if (behavior.initialPosition) return behavior.initialPosition
  const isMobile = window.innerWidth < 768
  const popupW = isMobile ? Math.min(window.innerWidth - 40, 380) : 420
  const popupH = 320
  const maxX = Math.max(40, window.innerWidth - popupW - 40)
  const maxY = Math.max(120, window.innerHeight - popupH - 60)
  return {
    x: 40 + Math.random() * Math.max(0, maxX - 40),
    y: 80 + Math.random() * Math.max(0, maxY - 120),
  }
}

export const usePopupStore = create<PopupState>((set, get) => ({
  popups: [],
  isPaused: false,
  isKilled: false,
  cascadeUsedThisSession: false,
  spawnedOnce: new Set(),

  spawn: (variantId, behaviorOverride = {}, data) => {
    const state = get()
    if (state.isKilled || state.isPaused) return null

    const isMobile = window.innerWidth < 768
    const cap = isMobile ? TIMINGS.MAX_CONCURRENT_MOBILE : TIMINGS.MAX_CONCURRENT_DESKTOP
    if (state.popups.length >= cap) return null

    const behavior = { ...DEFAULT_BEHAVIORS[variantId], ...behaviorOverride }
    if (behavior.once && state.spawnedOnce.has(variantId)) return null
    if (behavior.desktopOnly && isMobile) return null

    const id = randomId()
    const instance: PopupInstance = {
      id,
      variantId,
      spawnedAt: Date.now(),
      z: 1000 + state.popups.length * 5,
      position: randomPosition(behavior),
      data,
      behavior,
    }

    set({
      popups: [...state.popups, instance],
      spawnedOnce: new Set([...state.spawnedOnce, variantId]),
    })
    playSound('error-chime', 0.3)

    window.setTimeout(() => {
      if (get().popups.some((popup) => popup.id === id)) get().close(id)
    }, behavior.autoDismissMs ?? TIMINGS.AUTO_DISMISS_MS)

    return id
  },

  close: (id) => {
    const state = get()
    const popup = state.popups.find((item) => item.id === id)
    if (!popup) return
    set({ popups: state.popups.filter((item) => item.id !== id) })

    if (popup.behavior.cascadeOnClose && !state.cascadeUsedThisSession) {
      get().markCascadeUsed()
      for (let index = 0; index < popup.behavior.cascadeOnClose; index += 1) {
        window.setTimeout(() => {
          const variants: PopupVariantId[] = ['crazy-frog', 'star-ac']
          get().spawn(variants[Math.floor(Math.random() * variants.length)])
        }, 200 + index * 250)
      }
    }
  },

  closeAll: () => set({ popups: [] }),
  setPaused: (paused) => set({ isPaused: paused }),
  setKilled: (killed) => {
    set({ isKilled: killed })
    if (killed) get().closeAll()
  },
  markCascadeUsed: () => set({ cascadeUsedThisSession: true }),
}))
