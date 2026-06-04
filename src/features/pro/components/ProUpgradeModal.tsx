import { useEffect, useState } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Purchases, { type PurchasesPackage } from 'react-native-purchases'
import { useProStore } from '../store'
import { Toast } from '../../../shared/components/Toast'
import { useThemedStyles, type Palette } from '../../../shared/theme'

type Props = {
  visible: boolean
  onClose: () => void
  hint?: string
}

type Row = { label: string; free: string | boolean; pro: string | boolean }

const COMPARE: Row[] = [
  { label: 'Bookmarks', free: '100', pro: 'Unlimited' },
  { label: 'Folders', free: '5', pro: 'Unlimited' },
  { label: 'Add notes', free: false, pro: true },
  { label: 'Dark Mode', free: false, pro: true },
  { label: 'Custom covers', free: false, pro: true },
  { label: 'iCloud backup', free: false, pro: true },
]

export function ProUpgradeModal({ visible, onClose, hint }: Props) {
  const insets = useSafeAreaInsets()
  const { isPro, isLoading, purchase, restore } = useProStore()
  const { c, styles } = useThemedStyles(makeStyles)
  const [lifetimePkg, setLifetimePkg] = useState<PurchasesPackage | null>(null)
  const [monthlyPkg, setMonthlyPkg] = useState<PurchasesPackage | null>(null)
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
        const pkgs = offerings.current?.availablePackages ?? []
        setLifetimePkg(pkgs.find((p) => p.packageType === 'LIFETIME') ?? null)
        setMonthlyPkg(pkgs.find((p) => p.packageType === 'MONTHLY') ?? null)
      })
      .catch(() => {})
  }, [visible])

  const buy = async (pkg: PurchasesPackage | null) => {
    if (isPro) return
    if (!pkg) {
      Alert.alert('Just a moment', 'Purchases are being set up. Please wait a moment and try again.')
      return
    }
    const result = await purchase(pkg)
    if (result.success) {
      onClose()
    } else if (result.error) {
      Alert.alert('Purchase Error', result.error)
    }
  }

  const handleRestore = async () => {
    const result = await restore()
    if (!result.success) {
      Alert.alert('Restore Failed', 'Could not retrieve your purchase information.')
      return
    }
    if (result.found) {
      showToast('Purchase restored')
      setTimeout(onClose, 1200)
    } else {
      Alert.alert('No Purchase Found', 'No Pro purchase history was found for this Apple ID.')
    }
  }

  const lifetimePrice = lifetimePkg?.product.priceString ?? '¥1,500'
  const monthlyPrice = monthlyPkg?.product.priceString ?? '¥400'

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.handle} />
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {hint && (
            <View style={styles.hintBanner}>
              <Text style={styles.hintText}>{hint}</Text>
            </View>
          )}

          <View style={styles.badge}>
            <Text style={styles.badgeText}>PRO</Text>
          </View>
          <Text style={styles.title}>Bookrest Pro</Text>
          <Text style={styles.subtitle}>How it compares to the free version</Text>

          {/* Comparison table */}
          <View style={styles.table}>
            <View style={[styles.row, styles.headRow]}>
              <Text style={[styles.cellLabel, styles.headText]}>Feature</Text>
              <Text style={[styles.cellVal, styles.headText]}>Free</Text>
              <Text style={[styles.cellVal, styles.headText, styles.headPro]}>Pro</Text>
            </View>
            {COMPARE.map((r, i) => (
              <View key={r.label} style={[styles.row, i < COMPARE.length - 1 && styles.rowBorder]}>
                <Text style={styles.cellLabel}>{r.label}</Text>
                <Cell value={r.free} styles={styles} c={c} />
                <Cell value={r.pro} styles={styles} c={c} pro />
              </View>
            ))}
          </View>

          {isPro ? (
            <View style={styles.ownedBox}>
              <Text style={styles.ownedText}>Thanks for your support (already purchased)</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.planPrimary, isLoading && styles.disabled]}
                onPress={() => void buy(lifetimePkg)}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color={c.background} />
                ) : (
                  <>
                    <View style={styles.planLeft}>
                      <Text style={styles.planNamePrimary}>Lifetime</Text>
                      <Text style={styles.planDescPrimary}>One-time payment, yours forever</Text>
                    </View>
                    <Text style={styles.planPricePrimary}>{lifetimePrice}</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.planSecondary, isLoading && styles.disabled]}
                onPress={() => void buy(monthlyPkg)}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <View style={styles.planLeft}>
                  <Text style={styles.planName}>Monthly</Text>
                  <Text style={styles.planDesc}>Cancel anytime</Text>
                </View>
                <Text style={styles.planPrice}>{monthlyPrice}/mo</Text>
              </TouchableOpacity>

              <Text style={styles.legalNote}>
                Payment is processed through the App Store. Lifetime is a one-time purchase; the monthly plan can be canceled anytime.
              </Text>

              <TouchableOpacity onPress={() => void handleRestore()} disabled={isLoading} style={styles.linkBtn}>
                <Text style={styles.linkText}>Restore Purchase</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={onClose} style={styles.linkBtn}>
            <Text style={styles.linkText}>Close</Text>
          </TouchableOpacity>
        </ScrollView>

        <Toast message={toastMsg} visible={toastVisible} onHide={() => setToastVisible(false)} />
      </View>
    </Modal>
  )
}

function Cell({
  value,
  styles,
  c,
  pro,
}: {
  value: string | boolean
  styles: ReturnType<typeof makeStyles>
  c: Palette
  pro?: boolean
}) {
  if (typeof value === 'boolean') {
    return (
      <Text style={[styles.cellVal, { color: value ? (pro ? c.accent : c.text) : c.textTertiary }]}>
        {value ? '✓' : '—'}
      </Text>
    )
  }
  return <Text style={[styles.cellVal, pro && styles.cellValPro]}>{value}</Text>
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.textTertiary,
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 8,
    },
    content: { paddingHorizontal: 20, alignItems: 'center' },
    badge: {
      backgroundColor: '#1C1C1E',
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginTop: 12,
      marginBottom: 14,
    },
    badgeText: { fontSize: 11, fontWeight: '700', color: '#FFD60A', letterSpacing: 2 },
    title: { fontSize: 26, fontWeight: '700', color: c.text, marginBottom: 6, textAlign: 'center' },
    subtitle: { fontSize: 13, color: c.textSecondary, marginBottom: 22 },
    table: {
      width: '100%',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 24,
    },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14 },
    rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.cardBorder },
    headRow: { backgroundColor: c.placeholderBg },
    headText: { fontWeight: '700', color: c.textSecondary, fontSize: 12 },
    headPro: { color: c.accent },
    cellLabel: { flex: 1.5, fontSize: 14, color: c.text },
    cellVal: { flex: 1, fontSize: 14, color: c.textSecondary, textAlign: 'center' },
    cellValPro: { color: c.text, fontWeight: '600' },
    planPrimary: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.text,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 18,
      marginBottom: 10,
      minHeight: 64,
    },
    planSecondary: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1.5,
      borderColor: c.cardBorder,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 18,
      marginBottom: 16,
    },
    planLeft: { gap: 2 },
    planNamePrimary: { fontSize: 16, fontWeight: '700', color: c.background },
    planDescPrimary: { fontSize: 12, color: c.background, opacity: 0.7 },
    planPricePrimary: { fontSize: 19, fontWeight: '700', color: c.background },
    planName: { fontSize: 16, fontWeight: '700', color: c.text },
    planDesc: { fontSize: 12, color: c.textSecondary },
    planPrice: { fontSize: 17, fontWeight: '700', color: c.text },
    disabled: { opacity: 0.5 },
    legalNote: {
      fontSize: 11,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 16,
      marginBottom: 12,
    },
    ownedBox: {
      width: '100%',
      backgroundColor: c.placeholderBg,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginBottom: 12,
    },
    ownedText: { fontSize: 14, color: c.text, fontWeight: '500' },
    linkBtn: { paddingVertical: 10 },
    linkText: { fontSize: 14, color: c.textSecondary },
    hintBanner: {
      backgroundColor: c.placeholderBg,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginTop: 8,
      width: '100%',
    },
    hintText: { fontSize: 13, color: c.textSecondary, textAlign: 'center' },
  })
