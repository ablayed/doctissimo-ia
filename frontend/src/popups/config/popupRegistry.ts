import { BSODPopup } from '../components/variants/BSODPopup'
import { CrazyFrogPopup } from '../components/variants/CrazyFrogPopup'
import { DynamicPopup } from '../components/variants/DynamicPopup'
import { PrizeMillionthPopup } from '../components/variants/PrizeMillionthPopup'
import { StarAcPopup } from '../components/variants/StarAcPopup'
import type { PopupRegistryEntry, PopupVariantId } from '../types'

export const popupRegistry: Record<PopupVariantId, PopupRegistryEntry> = {
  'crazy-frog': {
    id: 'crazy-frog',
    weight: 3,
    Component: CrazyFrogPopup,
    defaultBehavior: { autoDismissMs: 75000, fakeClose: 'moves-on-hover' },
  },
  'prize-millionth': {
    id: 'prize-millionth',
    weight: 2,
    Component: PrizeMillionthPopup,
    defaultBehavior: { fakeClose: 'spawn-another', cascadeOnClose: 3, once: true, autoDismissMs: 90000 },
  },
  'star-ac': {
    id: 'star-ac',
    weight: 2,
    Component: StarAcPopup,
    defaultBehavior: { autoDismissMs: 75000 },
  },
  dynamic: {
    id: 'dynamic',
    weight: 4,
    Component: DynamicPopup,
    defaultBehavior: { autoDismissMs: 75000 },
  },
  bsod: {
    id: 'bsod',
    weight: 0,
    Component: BSODPopup,
    defaultBehavior: { once: true, autoDismissMs: 30000 },
  },
}
