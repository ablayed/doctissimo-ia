import { useEffect, useRef } from 'react'

import { popupRegistry } from '../config/popupRegistry'
import { TIMINGS } from '../config/timings'
import { usePopupStore } from '../store/popupStore'
import type { DynamicPopupData, PopupVariantId } from '../types'

interface SpawnerOpts {
  currentSymptom?: string
}

const POPUP_BLOCK_RE = /suicid|douleur thoracique|avc|convulsion|overdose|anaphylax|saignement.*grossesse|bebe.*fievre/i

function isDynamicPopupData(value: unknown): value is DynamicPopupData {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.title === 'string' && typeof item.body === 'string' && typeof item.cta === 'string'
}

function weightedVariant() {
  const entries = Object.values(popupRegistry).filter((entry) => entry.weight > 0)
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0)
  let cursor = Math.random() * totalWeight
  for (const entry of entries) {
    cursor -= entry.weight
    if (cursor <= 0) return entry.id
  }
  return 'crazy-frog'
}

async function fetchDynamicPopup(symptom: string) {
  const response = await fetch(`/api/popup?symptom=${encodeURIComponent(symptom)}`)
  const json: unknown = await response.json()
  if (!isDynamicPopupData(json)) return null
  return json
}

export function usePopupSpawner({ currentSymptom }: SpawnerOpts = {}) {
  const symptomRef = useRef(currentSymptom)
  const pendingDynamicRef = useRef(false)

  useEffect(() => {
    symptomRef.current = currentSymptom
    pendingDynamicRef.current = Boolean(currentSymptom && !POPUP_BLOCK_RE.test(currentSymptom))
  }, [currentSymptom])

  useEffect(() => {
    let cancelled = false
    let timer: number | null = null

    const schedule = (delay: number) => {
      timer = window.setTimeout(tick, delay)
    }

    const tick = async () => {
      if (cancelled) return
      const state = usePopupStore.getState()
      if (state.isKilled || state.isPaused) {
        schedule(5000)
        return
      }

      const symptom = symptomRef.current?.trim()
      let chosen: PopupVariantId = pendingDynamicRef.current && symptom ? 'dynamic' : weightedVariant()
      let data: DynamicPopupData | undefined

      if (chosen === 'dynamic') {
        if (!symptom || POPUP_BLOCK_RE.test(symptom)) {
          chosen = 'crazy-frog'
          pendingDynamicRef.current = false
        } else {
          try {
            const dynamicData = await fetchDynamicPopup(symptom)
            if (dynamicData) {
              data = dynamicData
              pendingDynamicRef.current = false
            } else {
              chosen = 'crazy-frog'
            }
          } catch {
            chosen = 'crazy-frog'
          }
        }
      }

      usePopupStore.getState().spawn(chosen, undefined, data)
      const delay = TIMINGS.SUBSEQUENT_MIN_MS + Math.random() * (TIMINGS.SUBSEQUENT_MAX_MS - TIMINGS.SUBSEQUENT_MIN_MS)
      schedule(delay)
    }

    schedule(TIMINGS.FIRST_SPAWN_MS)
    return () => {
      cancelled = true
      if (timer !== null) window.clearTimeout(timer)
    }
  }, [])
}
