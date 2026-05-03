import type { ComponentType } from 'react'

export type PopupVariantId = 'crazy-frog' | 'prize-millionth' | 'star-ac' | 'dynamic' | 'bsod'

export type FakeCloseBehavior = 'none' | 'spawn-another' | 'moves-on-hover' | 'double-x'

export interface PopupBehavior {
  fakeClose?: FakeCloseBehavior
  cascadeOnClose?: number
  autoDismissMs?: number
  desktopOnly?: boolean
  once?: boolean
  initialPosition?: { x: number; y: number }
}

export interface DynamicPopupData {
  variant?: string
  title: string
  body: string
  cta: string
  fine_print?: string
  color_scheme?: string
}

export type PopupData = DynamicPopupData

export interface PopupInstance {
  id: string
  variantId: PopupVariantId
  spawnedAt: number
  z: number
  position: { x: number; y: number }
  data?: PopupData
  behavior: PopupBehavior
}

export interface PopupRegistryEntry {
  id: PopupVariantId
  weight: number
  Component: ComponentType<{ instance: PopupInstance }>
  defaultBehavior: PopupBehavior
}
