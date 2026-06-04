import { create } from 'zustand'
import Purchases, { LOG_LEVEL, type PurchasesPackage } from 'react-native-purchases'
import { useSettingsStore } from '../settings/store'
import { setPremium } from '../../shared/storage/sharedStorage'

const REVENUECAT_API_KEY = 'appl_uesZfCuFvseRYpwJqpMMcFrDRfc'
const ENTITLEMENT_ID = 'Bookrest Pro'
// For UI testing during development. Always set back to false before a production release.
const DEV_FORCE_PRO = __DEV__ && false

type ProStore = {
  isPro: boolean
  isLoading: boolean
  configure: () => void
  load: () => Promise<void>
  purchase: (pkg: PurchasesPackage) => Promise<{ success: boolean; error?: string }>
  restore: () => Promise<{ success: boolean; found: boolean }>
}

function syncToPremium(isPro: boolean) {
  useSettingsStore.getState().set('is_premium', isPro)
  // Also write to the App Group so the Share Extension (a separate process) can tell whether the user is Pro
  setPremium(isPro)
}

export const useProStore = create<ProStore>((setState) => ({
  isPro: DEV_FORCE_PRO,
  isLoading: false,

  configure: () => {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.VERBOSE)
    Purchases.configure({ apiKey: REVENUECAT_API_KEY })
  },

  load: async () => {
    try {
      const info = await Purchases.getCustomerInfo()
      const isPro = info.entitlements.active[ENTITLEMENT_ID] !== undefined
      setState({ isPro })
      syncToPremium(isPro)
    } catch {
      // If RevenueCat can't be reached, fall back to the existing value in settings
    }
  },

  purchase: async (pkg) => {
    setState({ isLoading: true })
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg)
      const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined
      setState({ isPro, isLoading: false })
      syncToPremium(isPro)
      return { success: isPro }
    } catch (e: unknown) {
      setState({ isLoading: false })
      if ((e as { userCancelled?: boolean }).userCancelled) return { success: false }
      return { success: false, error: 'Purchase failed. Please wait a moment and try again.' }
    }
  },

  restore: async () => {
    setState({ isLoading: true })
    try {
      const info = await Purchases.restorePurchases()
      const isPro = info.entitlements.active[ENTITLEMENT_ID] !== undefined
      setState({ isPro, isLoading: false })
      syncToPremium(isPro)
      return { success: true, found: isPro }
    } catch {
      setState({ isLoading: false })
      return { success: false, found: false }
    }
  },
}))
