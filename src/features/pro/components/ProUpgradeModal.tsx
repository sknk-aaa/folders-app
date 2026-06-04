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

// Gold is reserved exclusively as the "Pro" accent — distinct from the app's blue accent.
const GOLD = '#C8960A'
const GOLD_BRIGHT = '#FFD60A'

type Feature = { image: ImageSourcePropType; title: string; body: string }

const FEATURES: Feature[] = [
  {
    image: require('../../../../assets/pro-feature_dark.png'),
    title: tr({ en: 'Dark Mode', ja: 'ダークモード' }),
    body: tr({
      en: 'An easy-on-the-eyes dark theme — your own quiet study at night.',
      ja: '夜も目にやさしい、自分だけの暗い書斎。',
    }),
  },
  {
    image: require('../../../../assets/pro-feature_note.png'),
    title: tr({ en: 'Notes', ja: 'メモ' }),
    body: tr({
      en: 'Jot why you saved it — right when you share, or anytime after.',
      ja: '“なぜ保存したか”を一言。共有時も、後からでも書ける。',
    }),
  },
  {
    image: require('../../../../assets/pro-feature_cover.png'),
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
          <Text style={styles.headline}>{tr({ en: 'Unlock all of Bookrest.', ja: 'Bookrest を、ぜんぶ解放。' })}</Text>
          <Text style={styles.subhead}>
            {tr({ en: 'No limits, plus Pro-only features.', ja: '無料の上限なし＋Pro限定の機能。' })}
          </Text>

          {/* Feature showcase */}
          <View style={styles.showcase}>
            {FEATURES.map((f) => (
              <View key={f.title} style={styles.featureCard}>
                <View style={styles.featureImageWrap}>
                  <Image source={f.image} style={styles.featureImage} resizeMode="contain" />
                </View>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureBody}>{f.body}</Text>
              </View>
            ))}
          </View>

          {/* Compact comparison */}
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

          {isPro ? (
            <View style={styles.ownedBox}>
              <Ionicons name="checkmark-circle" size={20} color={GOLD} style={{ marginBottom: 6 }} />
              <Text style={styles.ownedText}>
                {tr({ en: 'Thanks for your support — Pro is active.', ja: 'ご利用ありがとうございます（Pro 有効）' })}
              </Text>
            </View>
          ) : (
            <>
              {/* Lifetime — hero plan */}
              <TouchableOpacity
                style={[styles.planHero, isLoading && styles.disabled]}
                onPress={() => void buy(lifetimePkg)}
                disabled={isLoading}
                activeOpacity={0.88}
              >
                <View style={styles.planHeroPill}>
                  <Text style={styles.planHeroPillText}>{tr({ en: 'BEST VALUE', ja: 'おすすめ' })}</Text>
                </View>
                {isLoading ? (
                  <ActivityIndicator color={c.background} />
                ) : (
                  <View style={styles.planRow}>
                    <View style={styles.planLeft}>
                      <Text style={styles.planNameHero}>{tr({ en: 'Lifetime', ja: '買い切り' })}</Text>
                      <Text style={styles.planDescHero}>{tr({ en: 'One-time, yours forever', ja: '一度きり・ずっと使える' })}</Text>
                    </View>
                    <Text style={styles.planPriceHero}>{lifetimePrice}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.anchorNote}>
                {tr({
                  en: 'Less than 4 months of the monthly plan — and it’s yours forever.',
                  ja: '月額の約4ヶ月分で、ずっと使えます。',
                })}
              </Text>

              {/* Monthly — secondary */}
              <TouchableOpacity
                style={[styles.planSecondary, isLoading && styles.disabled]}
                onPress={() => void buy(monthlyPkg)}
                disabled={isLoading}
                activeOpacity={0.88}
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
          )}
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
      marginBottom: 16,
    },
    badgeText: { fontSize: 11, fontWeight: '800', color: GOLD_BRIGHT, letterSpacing: 2.5 },
    headline: {
      fontSize: 28,
      fontWeight: '800',
      color: c.text,
      textAlign: 'center',
      letterSpacing: -0.3,
      lineHeight: 34,
    },
    subhead: { fontSize: 14, color: c.textSecondary, marginTop: 8, marginBottom: 28, textAlign: 'center' },

    showcase: { width: '100%', gap: 26, marginBottom: 30 },
    featureCard: { width: '100%' },
    featureImageWrap: {
      width: '100%',
      height: 236,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: c.placeholderBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
      marginBottom: 12,
    },
    featureImage: { width: '100%', height: '100%' },
    featureTitle: { fontSize: 18, fontWeight: '700', color: c.text, letterSpacing: -0.2 },
    featureBody: { fontSize: 14, color: c.textSecondary, marginTop: 4, lineHeight: 20 },

    table: {
      width: '100%',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 28,
    },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
    rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.cardBorder },
    headRow: { backgroundColor: c.placeholderBg },
    headText: { fontWeight: '700', color: c.textSecondary, fontSize: 12 },
    headPro: { color: GOLD },
    cellLabel: { flex: 1.5, fontSize: 14, color: c.text },
    cellVal: { flex: 1, fontSize: 14, color: c.textSecondary, textAlign: 'center' },
    cellValPro: { color: c.text, fontWeight: '600' },

    planHero: {
      width: '100%',
      backgroundColor: c.text,
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 18,
      marginTop: 6,
      minHeight: 66,
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: GOLD,
    },
    planHeroPill: {
      position: 'absolute',
      top: -11,
      left: 18,
      backgroundColor: GOLD_BRIGHT,
      borderRadius: 8,
      paddingHorizontal: 9,
      paddingVertical: 3,
    },
    planHeroPillText: { fontSize: 10, fontWeight: '800', color: '#1C1C1E', letterSpacing: 1 },
    planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    planLeft: { gap: 2, flexShrink: 1 },
    planNameHero: { fontSize: 17, fontWeight: '700', color: c.background },
    planDescHero: { fontSize: 12.5, color: c.background, opacity: 0.7 },
    planPriceHero: { fontSize: 22, fontWeight: '800', color: c.background, letterSpacing: -0.5 },

    anchorNote: {
      fontSize: 12.5,
      color: GOLD,
      fontWeight: '600',
      textAlign: 'center',
      marginTop: 10,
      marginBottom: 14,
    },

    planSecondary: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1.5,
      borderColor: c.cardBorder,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 18,
    },
    planName: { fontSize: 16, fontWeight: '700', color: c.text },
    planDesc: { fontSize: 12.5, color: c.textSecondary, marginTop: 2 },
    planPrice: { fontSize: 17, fontWeight: '700', color: c.text },
    disabled: { opacity: 0.5 },

    trust: {
      fontSize: 11.5,
      color: c.textTertiary,
      textAlign: 'center',
      lineHeight: 17,
      marginTop: 18,
    },
    restoreBtn: { paddingVertical: 12, marginTop: 4 },
    restoreText: { fontSize: 13.5, color: c.textSecondary, textAlign: 'center' },

    ownedBox: {
      width: '100%',
      backgroundColor: c.placeholderBg,
      borderRadius: 14,
      padding: 18,
      alignItems: 'center',
      marginTop: 6,
    },
    ownedText: { fontSize: 14, color: c.text, fontWeight: '600', textAlign: 'center' },
  })
