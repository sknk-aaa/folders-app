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
  Image,
  type ImageSourcePropType,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Purchases, { type PurchasesPackage } from 'react-native-purchases'
import { useProStore } from '../store'
import { Toast } from '../../../shared/components/Toast'
import { useThemedStyles, type Palette } from '../../../shared/theme'
import { tr } from '../../../shared/i18n'

type Props = {
  visible: boolean
  onClose: () => void
  hint?: string
}

// Gold is reserved exclusively as the subtle "Pro" accent — distinct from the app's blue accent.
const GOLD = '#C8960A'
const GOLD_BRIGHT = '#FFD60A'

// All feature images share one height; width follows each image's own aspect ratio.
const FEATURE_IMG_H = 224

type Feature = { image: ImageSourcePropType; ratio: number; title: string; body: string }

const FEATURES: Feature[] = [
  {
    image: require('../../../../assets/pro-feature_dark.png'),
    ratio: 828 / 1792,
    title: tr({ en: 'Dark Mode', ja: 'ダークモード' }),
    body: tr({
      en: 'An easy-on-the-eyes dark theme — your own quiet study at night.',
      ja: '夜も目にやさしい、自分だけの暗い書斎。',
    }),
  },
  {
    image: require('../../../../assets/pro-feature_note.png'),
    ratio: 1122 / 1402,
    title: tr({ en: 'Notes', ja: 'メモ' }),
    body: tr({
      en: 'Jot why you saved it — right when you share, or anytime after.',
      ja: '“なぜ保存したか”を一言。共有時も、後からでも書ける。',
    }),
  },
  {
    image: require('../../../../assets/pro-feature_cover.png'),
    ratio: 1448 / 1086,
    title: tr({ en: 'Folder Covers', ja: 'フォルダのカバー' }),
    body: tr({
      en: 'Dress up each folder with a cover image of your own.',
      ja: 'フォルダを“自分の表紙”に着せ替え。',
    }),
  },
]

type Row = { label: string; free: string | boolean; pro: string | boolean }

const COMPARE: Row[] = [
  { label: tr({ en: 'Bookmarks', ja: 'ブックマーク保存' }), free: tr({ en: '100', ja: '100件' }), pro: tr({ en: 'Unlimited', ja: '無制限' }) },
  { label: tr({ en: 'Folders', ja: 'フォルダ' }), free: tr({ en: '5', ja: '5個' }), pro: tr({ en: 'Unlimited', ja: '無制限' }) },
  { label: tr({ en: 'Notes', ja: 'メモ' }), free: false, pro: true },
  { label: tr({ en: 'Dark Mode', ja: 'ダークモード' }), free: false, pro: true },
  { label: tr({ en: 'Folder covers', ja: 'フォルダカバー変更' }), free: false, pro: true },
  { label: tr({ en: 'iCloud backup', ja: 'iCloudバックアップ' }), free: false, pro: true },
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
      Alert.alert(
        tr({ en: 'Just a moment', ja: '準備中' }),
        tr({
          en: 'Purchases are being set up. Please wait a moment and try again.',
          ja: 'ただいま購入の準備中です。少し待ってからお試しください。',
        }),
      )
      return
    }
    const result = await purchase(pkg)
    if (result.success) {
      onClose()
    } else if (result.error) {
      Alert.alert(tr({ en: 'Purchase Error', ja: '購入エラー' }), result.error)
    }
  }

  const handleRestore = async () => {
    const result = await restore()
    if (!result.success) {
      Alert.alert(
        tr({ en: 'Restore Failed', ja: '復元失敗' }),
        tr({ en: 'Could not retrieve your purchase information.', ja: '購入情報を取得できませんでした。' }),
      )
      return
    }
    if (result.found) {
      showToast(tr({ en: 'Purchase restored', ja: '購入を復元しました' }))
      setTimeout(onClose, 1200)
    } else {
      Alert.alert(
        tr({ en: 'No Purchase Found', ja: '購入が見つかりません' }),
        tr({
          en: 'No Pro purchase history was found for this Apple ID.',
          ja: 'このApple IDではProの購入履歴が見つかりませんでした。',
        }),
      )
    }
  }

  const lifetimePrice = lifetimePkg?.product.priceString ?? '¥1,500'
  const monthlyPrice = monthlyPkg?.product.priceString ?? '¥400'

  const plans = (keySuffix: string) => (
    <View style={styles.plans}>
      <TouchableOpacity
        key={`life-${keySuffix}`}
        style={[styles.planCard, isLoading && styles.disabled]}
        onPress={() => void buy(lifetimePkg)}
        disabled={isLoading}
        activeOpacity={0.85}
      >
        <View style={styles.planLeft}>
          <View style={styles.planNameRow}>
            <Text style={styles.planName}>{tr({ en: 'Lifetime', ja: '買い切り' })}</Text>
            <View style={styles.recommendChip}>
              <Text style={styles.recommendText}>{tr({ en: 'Popular', ja: 'おすすめ' })}</Text>
            </View>
          </View>
          <Text style={styles.planDesc}>{tr({ en: 'One-time, yours forever', ja: '一度きり・ずっと使える' })}</Text>
        </View>
        <Text style={styles.planPrice}>{lifetimePrice}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        key={`month-${keySuffix}`}
        style={[styles.planCard, isLoading && styles.disabled]}
        onPress={() => void buy(monthlyPkg)}
        disabled={isLoading}
        activeOpacity={0.85}
      >
        <View style={styles.planLeft}>
          <Text style={styles.planName}>{tr({ en: 'Monthly', ja: '月額' })}</Text>
          <Text style={styles.planDesc}>{tr({ en: 'Cancel anytime', ja: 'いつでも解約できます' })}</Text>
        </View>
        <Text style={styles.planPrice}>
          {monthlyPrice}
          {tr({ en: '/mo', ja: '／月' })}
        </Text>
      </TouchableOpacity>

      {isLoading ? <ActivityIndicator color={c.textSecondary} style={styles.plansSpinner} /> : null}
    </View>
  )

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity style={[styles.closeBtn, { top: insets.top + 6 }]} onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={22} color={c.textSecondary} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 44, paddingBottom: insets.bottom + 28 }]}
          showsVerticalScrollIndicator={false}
        >
          {hint ? (
            <View style={styles.hintBanner}>
              <Text style={styles.hintText}>{hint}</Text>
            </View>
          ) : null}

          {/* Hero */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PRO</Text>
          </View>
          <Text style={styles.headline}>{tr({ en: 'Unlock all of Bookrest.', ja: 'サムネブクマを、\nぜんぶ解放。' })}</Text>
          <Text style={styles.subhead}>
            {tr({ en: 'No limits, plus Pro-only features.', ja: '無料の上限なし＋Pro限定の機能。' })}
          </Text>

          {/* Comparison */}
          <View style={styles.table}>
            <View style={[styles.row, styles.headRow]}>
              <Text style={[styles.cellLabel, styles.headText]}>{tr({ en: 'Feature', ja: '機能' })}</Text>
              <Text style={[styles.cellVal, styles.headText]}>{tr({ en: 'Free', ja: '無料' })}</Text>
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

          {/* Price (after table) or owned state */}
          {isPro ? (
            <View style={styles.ownedBox}>
              <Ionicons name="checkmark-circle" size={20} color={GOLD} style={{ marginBottom: 6 }} />
              <Text style={styles.ownedText}>
                {tr({ en: 'Thanks for your support — Pro is active.', ja: 'ご利用ありがとうございます（Pro 有効）' })}
              </Text>
            </View>
          ) : (
            plans('top')
          )}

          {/* Feature showcase */}
          <View style={styles.showcase}>
            {FEATURES.map((f) => (
              <View key={f.title} style={styles.featureCard}>
                <Image
                  source={f.image}
                  style={[styles.featureImage, { height: FEATURE_IMG_H, aspectRatio: f.ratio }]}
                  resizeMode="cover"
                />
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureBody}>{f.body}</Text>
              </View>
            ))}
          </View>

          {/* Price (bottom) */}
          {!isPro ? (
            <>
              {plans('bottom')}
              <Text style={styles.trust}>
                {tr({
                  en: 'No ads · Data stays on your device · Cancel anytime · Billed via App Store',
                  ja: '広告なし・データは端末内・解約自由・App Store決済',
                })}
              </Text>
              <TouchableOpacity onPress={() => void handleRestore()} disabled={isLoading} style={styles.restoreBtn}>
                <Text style={styles.restoreText}>{tr({ en: 'Restore Purchase', ja: '購入を復元' })}</Text>
              </TouchableOpacity>
            </>
          ) : null}
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
      <Text style={[styles.cellVal, { color: value ? (pro ? GOLD : c.text) : c.textTertiary }]}>
        {value ? '✓' : '—'}
      </Text>
    )
  }
  return <Text style={[styles.cellVal, pro && styles.cellValPro]}>{value}</Text>
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    closeBtn: {
      position: 'absolute',
      right: 14,
      zIndex: 10,
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.placeholderBg,
    },
    content: { paddingHorizontal: 20, alignItems: 'center' },

    hintBanner: {
      backgroundColor: c.placeholderBg,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginBottom: 18,
      width: '100%',
    },
    hintText: { fontSize: 13, color: c.textSecondary, textAlign: 'center' },

    badge: {
      backgroundColor: '#1C1C1E',
      borderRadius: 6,
      paddingHorizontal: 11,
      paddingVertical: 4,
      marginBottom: 14,
    },
    badgeText: { fontSize: 11, fontWeight: '800', color: GOLD_BRIGHT, letterSpacing: 2.5 },
    headline: {
      fontSize: 27,
      fontWeight: '800',
      color: c.text,
      textAlign: 'center',
      letterSpacing: -0.3,
      lineHeight: 33,
    },
    subhead: { fontSize: 14, color: c.textSecondary, marginTop: 8, marginBottom: 24, textAlign: 'center' },

    table: {
      width: '100%',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 18,
    },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
    rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.cardBorder },
    headRow: { backgroundColor: c.placeholderBg },
    headText: { fontWeight: '700', color: c.textSecondary, fontSize: 12 },
    headPro: { color: GOLD },
    cellLabel: { flex: 1.5, fontSize: 14, color: c.text },
    cellVal: { flex: 1, fontSize: 14, color: c.textSecondary, textAlign: 'center' },
    cellValPro: { color: c.text, fontWeight: '600' },

    // Balanced plan cards (used both after the table and at the bottom)
    plans: { width: '100%', gap: 10, marginBottom: 4 },
    planCard: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1.5,
      borderColor: c.cardBorder,
      borderRadius: 14,
      paddingVertical: 15,
      paddingHorizontal: 18,
    },
    planLeft: { gap: 3, flexShrink: 1 },
    planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    planName: { fontSize: 16, fontWeight: '700', color: c.text },
    planDesc: { fontSize: 12.5, color: c.textSecondary },
    planPrice: { fontSize: 18, fontWeight: '700', color: c.text },
    recommendChip: {
      backgroundColor: c.placeholderBg,
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    recommendText: { fontSize: 10, fontWeight: '700', color: c.textSecondary, letterSpacing: 0.5 },
    plansSpinner: { marginTop: 4 },
    disabled: { opacity: 0.5 },

    // Feature showcase
    showcase: { width: '100%', gap: 30, marginTop: 30, marginBottom: 30, alignItems: 'center' },
    featureCard: { width: '100%', alignItems: 'center' },
    featureImage: {
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
      backgroundColor: c.placeholderBg,
      marginBottom: 12,
    },
    featureTitle: { fontSize: 18, fontWeight: '700', color: c.text, letterSpacing: -0.2, textAlign: 'center' },
    featureBody: { fontSize: 14, color: c.textSecondary, marginTop: 4, lineHeight: 20, textAlign: 'center' },

    trust: {
      fontSize: 11.5,
      color: c.textTertiary,
      textAlign: 'center',
      lineHeight: 17,
      marginTop: 16,
    },
    restoreBtn: { paddingVertical: 12, marginTop: 4 },
    restoreText: { fontSize: 13.5, color: c.textSecondary, textAlign: 'center' },

    ownedBox: {
      width: '100%',
      backgroundColor: c.placeholderBg,
      borderRadius: 14,
      padding: 18,
      alignItems: 'center',
    },
    ownedText: { fontSize: 14, color: c.text, fontWeight: '600', textAlign: 'center' },
  })
