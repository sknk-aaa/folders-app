import { useEffect, useState } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Purchases from 'react-native-purchases'
import { useProStore } from '../store'
import { Toast } from '../../../shared/components/Toast'
import { colors, spacing, radius } from '../../../shared/theme'

type Props = {
  visible: boolean
  onClose: () => void
}

const FEATURES: { label: string; soon?: boolean }[] = [
  { label: 'ブックマークを無制限に保存' },
  { label: 'フォルダをPINロックで保護' },
  { label: '複数デバイスでiCloud同期', soon: true },
]

export function ProUpgradeModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets()
  const { isPro, isLoading, purchase, restore } = useProStore()
  const [priceString, setPriceString] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
  }

  useEffect(() => {
    if (!visible) return
    Purchases.getOfferings()
      .then((offerings) => {
        const pkg = offerings.current?.availablePackages[0]
        if (pkg) setPriceString(pkg.product.priceString)
      })
      .catch(() => {})
  }, [visible])

  const handlePurchase = async () => {
    const result = await purchase()
    if (result.success) {
      onClose()
    } else if (result.error) {
      Alert.alert('購入エラー', result.error)
    }
  }

  const handleRestore = async () => {
    const result = await restore()
    if (!result.success) {
      Alert.alert('復元失敗', '購入情報を取得できませんでした。')
      return
    }
    if (result.found) {
      showToast('購入を復元しました')
      setTimeout(onClose, 1200)
    } else {
      Alert.alert('購入が見つかりません', 'このApple IDではProの購入履歴が見つかりませんでした。')
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.handle} />

        <View style={styles.badge}>
          <Text style={styles.badgeText}>PRO</Text>
        </View>

        <Text style={styles.title}>Bookrest Pro</Text>
        <Text style={styles.subtitle}>一度購入すれば、ずっと使える</Text>

        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <View style={[styles.checkCircle, f.soon && styles.checkCircleSoon]}>
                <Text style={[styles.checkMark, f.soon && styles.checkMarkSoon]}>✓</Text>
              </View>
              <Text style={[styles.featureLabel, f.soon && styles.featureLabelSoon]}>
                {f.label}
              </Text>
              {f.soon && (
                <View style={styles.soonBadge}>
                  <Text style={styles.soonBadgeText}>近日公開</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.purchaseBtn, (isLoading || isPro) && styles.purchaseBtnDisabled]}
          onPress={handlePurchase}
          disabled={isLoading || isPro}
          activeOpacity={0.82}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.background} />
          ) : isPro ? (
            <Text style={styles.purchaseBtnText}>購入済み</Text>
          ) : (
            <Text style={styles.purchaseBtnText}>
              {priceString ? `${priceString}　で購入` : '---'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.legalNote}>
          App Store経由の一括払い。サブスクリプションではありません。
        </Text>

        <TouchableOpacity onPress={handleRestore} disabled={isLoading} style={styles.restoreBtn}>
          <Text style={styles.restoreText}>購入を復元</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>閉じる</Text>
        </TouchableOpacity>

        <Toast message={toastMsg} visible={toastVisible} onHide={() => setToastVisible(false)} />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: 12,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textTertiary,
    marginBottom: 32,
  },
  badge: {
    backgroundColor: '#1C1C1E',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD60A',
    letterSpacing: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 36,
    textAlign: 'center',
  },
  featureList: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSoon: {
    backgroundColor: colors.placeholderBg,
  },
  checkMark: {
    fontSize: 13,
    color: colors.background,
    fontWeight: '700',
  },
  checkMarkSoon: {
    color: colors.textSecondary,
  },
  featureLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  featureLabelSoon: {
    color: colors.textSecondary,
  },
  soonBadge: {
    backgroundColor: colors.placeholderBg,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  soonBadgeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  purchaseBtn: {
    width: '100%',
    padding: 18,
    borderRadius: radius.md,
    backgroundColor: colors.text,
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseBtnDisabled: {
    opacity: 0.4,
  },
  purchaseBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.background,
  },
  legalNote: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 16,
  },
  restoreBtn: {
    paddingVertical: 10,
    marginBottom: 8,
  },
  restoreText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  closeBtn: {
    paddingVertical: 10,
  },
  closeText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
})
