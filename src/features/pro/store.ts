import { create } from 'zustand'
import Purchases, { LOG_LEVEL, type PurchasesPackage } from 'react-native-purchases'
import { useSettingsStore } from '../settings/store'
import { setPremium } from '../../shared/storage/sharedStorage'
import { tr } from '../../shared/i18n'

const REVENUECAT_API_KEY = 'appl_uesZfCuFvseRYpwJqpMMcFrDRfc'
const ENTITLEMENT_ID = 'Bookrest Pro'
// For UI testing during development. Always set back to false before a production release.
const DEV_FORCE_PRO = __DEV__ && false
// Force the free (non-premium) state in dev, ignoring RevenueCat. Set back to false before release.
const DEV_FORCE_FREE = __DEV__ && true

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
    if (DEV_FORCE_FREE) {
      setState({ isPro: false })
      syncToPremium(false)
      return
    }
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
      return {
        success: false,
        error: tr({
          en: 'Purchase failed. Please wait a moment and try again.',
          ja: '購入に失敗しました。時間をおいて再試行してください。',
        }),
      }
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
