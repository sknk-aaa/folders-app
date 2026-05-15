import { create } from 'zustand'
import Purchases, { LOG_LEVEL } from 'react-native-purchases'
import { useSettingsStore } from '../settings/store'

const REVENUECAT_API_KEY = 'appl_uesZfCuFvseRYpwJqpMMcFrDRfc'
const ENTITLEMENT_ID = 'Bookrest Pro'

type ProStore = {
  isPro: boolean
  isLoading: boolean
  configure: () => void
  load: () => Promise<void>
  purchase: () => Promise<{ success: boolean; error?: string }>
  restore: () => Promise<{ success: boolean; found: boolean }>
}

function syncToPremium(isPro: boolean) {
  useSettingsStore.getState().set('is_premium', isPro)
}

export const useProStore = create<ProStore>((setState) => ({
  isPro: false,
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
      // RevenueCatに接続できない場合はsettingsの既存値を使用
    }
  },

  purchase: async () => {
    setState({ isLoading: true })
    try {
      const offerings = await Purchases.getOfferings()
      const pkg = offerings.current?.availablePackages[0]
      if (!pkg) {
        setState({ isLoading: false })
        return { success: false, error: '商品情報を取得できませんでした' }
      }
      const { customerInfo } = await Purchases.purchasePackage(pkg)
      const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined
      setState({ isPro, isLoading: false })
      syncToPremium(isPro)
      return { success: isPro }
    } catch (e: unknown) {
      setState({ isLoading: false })
      if ((e as { userCancelled?: boolean }).userCancelled) return { success: false }
      return { success: false, error: '購入に失敗しました。時間をおいて再試行してください。' }
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
