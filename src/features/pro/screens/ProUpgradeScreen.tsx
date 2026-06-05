import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Linking,
  type ImageSourcePropType,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Purchases, { type PurchasesPackage } from 'react-native-purchases'
import { useProStore } from '../store'
import { Toast } from '../../../shared/components/Toast'
import { useThemedStyles, type Palette } from '../../../shared/theme'
import { tr } from '../../../shared/i18n'
import type { RootStackParamList } from '../../../shared/types'

type Nav = NativeStackNavigationProp<RootStackParamList>

// Gold is reserved exclusively as the subtle "Pro" accent — distinct from the app's blue accent.
const GOLD = '#C8960A'
const GOLD_BRIGHT = '#FFD60A'
// Softer-than-black charcoal for the selected plan card and purchase button.
const PLAN_DARK = '#3A3A3C'

// Required by App Store Guideline 3.1.2 — functional links on the paywall.
const PRIVACY_URL = 'https://sknk-aaa.github.io/folders-app/'
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'

const APP_ICON = require('../../../../assets/icon.png')

// Each image keeps its own aspect ratio; `h` is its display height (tuned per image).
type Feature = { image: ImageSourcePropType; ratio: number; h: number; title: string; body: string }

const FEATURES: Feature[] = [
  {
    image: require('../../../../assets/pro-feature_dark.png'),
    ratio: 828 / 933,
    h: 224,
    title: tr({ en: 'Dark Mode', ja: 'ダークモード' }),
    body: tr({
      en: 'An easy-on-the-eyes dark theme — your own quiet study at night.',
      ja: '夜も目にやさしい、自分だけの暗い書斎。',
    }),
  },
  {
    image: require('../../../../assets/pro-feature_note.png'),
    ratio: 1122 / 1155,
    h: 360,
    title: tr({ en: 'Notes', ja: 'メモ' }),
    body: tr({
      en: 'Jot why you saved it — right when you share, or anytime after.',
      ja: '“なぜ保存したか”を一言。共有時も、後からでも書ける。',
    }),
  },
  {
    image: require('../../../../assets/pro-feature_cover.png'),
    ratio: 1354 / 993,
    h: 265,
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

export function ProUpgradeScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<Nav>()
  const route = useRoute<RouteProp<RootStackParamList, 'ProUpgrade'>>()
  const hint = route.params?.hint
  const onClose = () => navigation.goBack()
  const { isPro, isLoading, purchase, restore } = useProStore()
  const { c, styles } = useThemedStyles(makeStyles)
  const [lifetimePkg, setLifetimePkg] = useState<PurchasesPackage | null>(null)
  const [monthlyPkg, setMonthlyPkg] = useState<PurchasesPackage | null>(null)
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [selected, setSelected] = useState<'lifetime' | 'monthly'>('lifetime')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
  }

  useEffect(() => {
    Purchases.getOfferings()
      .then((offerings) => {
        const pkgs = offerings.current?.availablePackages ?? []
        setLifetimePkg(pkgs.find((p) => p.packageType === 'LIFETIME') ?? null)
        setMonthlyPkg(pkgs.find((p) => p.packageType === 'MONTHLY') ?? null)
      })
      .catch(() => {})
  }, [])

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

  const buyLabel =
    selected === 'lifetime'
      ? tr({ en: `Buy · ${lifetimePrice}`, ja: `${lifetimePrice}で購入` })
      : tr({ en: `Subscribe · ${monthlyPrice}/mo`, ja: `${monthlyPrice}／月で購入` })

  const plans = (keySuffix: string) => {
    const lifeActive = selected === 'lifetime'
    const monthActive = selected === 'monthly'
    return (
      <View style={styles.plans}>
        {/* Lifetime — selectable */}
        <TouchableOpacity
          key={`life-${keySuffix}`}
          style={[styles.planCard, lifeActive ? styles.planCardActive : styles.planCardIdle]}
          onPress={() => setSelected('lifetime')}
          activeOpacity={0.9}
        >
          <View style={styles.planLeft}>
            <View style={styles.planNameRow}>
              <Text style={[styles.planName, lifeActive && styles.planTextOnActive]}>
                {tr({ en: 'Lifetime', ja: '買い切り' })}
              </Text>
              <View style={[styles.recommendChip, lifeActive && styles.recommendChipActive]}>
                <Text style={[styles.recommendText, lifeActive && styles.planTextOnActive]}>
                  {tr({ en: 'Popular', ja: 'おすすめ' })}
                </Text>
              </View>
            </View>
            <Text style={[styles.planDesc, lifeActive && styles.planDescOnActive]}>
              {tr({ en: 'One payment, yours forever', ja: '一度の支払いで永久に使える' })}
            </Text>
          </View>
          <Text style={[styles.planPrice, lifeActive && styles.planTextOnActive]}>{lifetimePrice}</Text>
        </TouchableOpacity>

        {/* Monthly — selectable */}
        <TouchableOpacity
          key={`month-${keySuffix}`}
          style={[styles.planCard, monthActive ? styles.planCardActive : styles.planCardIdle]}
          onPress={() => setSelected('monthly')}
          activeOpacity={0.9}
        >
          <View style={styles.planLeft}>
            <Text style={[styles.planName, monthActive && styles.planTextOnActive]}>
              {tr({ en: 'Monthly', ja: '月額プラン' })}
            </Text>
            <Text style={[styles.planDesc, monthActive && styles.planDescOnActive]}>
              {tr({ en: 'Cancel anytime', ja: 'いつでもキャンセル可能' })}
            </Text>
          </View>
          <Text style={[styles.planPrice, monthActive && styles.planTextOnActive]}>
            {monthlyPrice}
            <Text style={[styles.planPriceUnit, monthActive && styles.planDescOnActive]}>{tr({ en: '/mo', ja: '／月' })}</Text>
          </Text>
        </TouchableOpacity>

        {/* Single purchase button for the selected plan */}
        <TouchableOpacity
          key={`buy-${keySuffix}`}
          style={[styles.buyBtn, isLoading && styles.disabled]}
          onPress={() => void buy(selected === 'lifetime' ? lifetimePkg : monthlyPkg)}
          disabled={isLoading}
          activeOpacity={0.88}
        >
          {isLoading ? (
            <ActivityIndicator color={c.background} />
          ) : (
            <Text style={styles.buyBtnText}>{buyLabel}</Text>
          )}
        </TouchableOpacity>
      </View>
    )
  }

  return (
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
          <Image source={APP_ICON} style={styles.appIcon} />
          <Text style={styles.title}>{tr({ en: 'Bookrest Pro', ja: 'サムネブクマ Pro' })}</Text>
          <Text style={styles.subhead}>
            {tr({
              en: 'Unlock every feature\nand make bookmarking truly yours',
              ja: 'すべての機能を解放して\nブックマークをもっと自由に',
            })}
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
                  style={[styles.featureImage, { height: f.h, aspectRatio: f.ratio }]}
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
                  en: 'No ads · Data stays on your device · Billed via App Store',
                  ja: '広告なし・データは端末内・App Store決済',
                })}
              </Text>
              <Text style={styles.legalNote}>
                {tr({
                  en: 'The monthly plan auto-renews unless turned off at least 24 hours before the end of the period. Manage or cancel anytime in App Store Settings. The Lifetime plan is a one-time purchase.',
                  ja: '月額プランは、期間終了の24時間前までにオフにしない限り自動更新されます。App Storeの「サブスクリプション」からいつでも管理・解約できます。買い切りは一度きりの購入です。',
                })}
              </Text>
              <View style={styles.legalLinks}>
                <TouchableOpacity onPress={() => void Linking.openURL(PRIVACY_URL)} hitSlop={8}>
                  <Text style={styles.legalLink}>{tr({ en: 'Privacy Policy', ja: 'プライバシーポリシー' })}</Text>
                </TouchableOpacity>
                <Text style={styles.legalSep}>·</Text>
                <TouchableOpacity onPress={() => void Linking.openURL(TERMS_URL)} hitSlop={8}>
                  <Text style={styles.legalLink}>{tr({ en: 'Terms of Use (EULA)', ja: '利用規約（EULA）' })}</Text>
                </TouchableOpacity>
                <Text style={styles.legalSep}>·</Text>
                <TouchableOpacity onPress={() => void handleRestore()} disabled={isLoading} hitSlop={8}>
                  <Text style={styles.legalLink}>{tr({ en: 'Restore', ja: '復元' })}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </ScrollView>

      <Toast message={toastMsg} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </View>
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

    appIcon: {
      width: 78,
      height: 78,
      borderRadius: 18,
      marginBottom: 18,
    },
    title: {
      fontSize: 26,
      fontWeight: '800',
      color: c.text,
      textAlign: 'center',
      letterSpacing: -0.3,
      marginBottom: 10,
    },
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
    subhead: { fontSize: 14.5, color: c.textSecondary, lineHeight: 22, marginBottom: 26, textAlign: 'center' },

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

    // Selectable plan cards + a single purchase button
    plans: { width: '100%', gap: 10, marginBottom: 4 },
    planCard: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 14,
      paddingVertical: 15,
      paddingHorizontal: 18,
    },
    planCardIdle: {
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
    },
    planCardActive: {
      backgroundColor: PLAN_DARK,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: PLAN_DARK,
    },
    planLeft: { gap: 3, flexShrink: 1 },
    planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    planName: { fontSize: 16, fontWeight: '700', color: c.text },
    planDesc: { fontSize: 12.5, color: c.textSecondary },
    planPrice: { fontSize: 18, fontWeight: '700', color: c.text },
    planPriceUnit: { fontSize: 12.5, fontWeight: '600', color: c.textSecondary },
    planTextOnActive: { color: c.background },
    planDescOnActive: { color: c.background, opacity: 0.65 },
    recommendChip: {
      backgroundColor: c.placeholderBg,
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    recommendChipActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
    recommendText: { fontSize: 10, fontWeight: '700', color: c.textSecondary, letterSpacing: 0.5 },
    buyBtn: {
      width: '100%',
      backgroundColor: PLAN_DARK,
      borderRadius: 14,
      paddingVertical: 17,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      minHeight: 54,
    },
    buyBtnText: { fontSize: 16, fontWeight: '700', color: c.background, letterSpacing: 0.2 },
    disabled: { opacity: 0.5 },

    // Feature showcase
    showcase: { width: '100%', gap: 30, marginTop: 30, marginBottom: 30, marginHorizontal: -12, alignItems: 'center' },
    featureCard: { width: '100%', alignItems: 'center' },
    featureImage: {
      maxWidth: '100%',
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
    legalNote: {
      fontSize: 11,
      color: c.textTertiary,
      textAlign: 'center',
      lineHeight: 16,
      marginTop: 10,
    },
    legalLinks: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 7,
      marginTop: 14,
    },
    legalLink: { fontSize: 12.5, color: c.textSecondary, textDecorationLine: 'underline' },
    legalSep: { fontSize: 12, color: c.textTertiary },

    ownedBox: {
      width: '100%',
      backgroundColor: c.placeholderBg,
      borderRadius: 14,
      padding: 18,
      alignItems: 'center',
    },
    ownedText: { fontSize: 14, color: c.text, fontWeight: '600', textAlign: 'center' },
  })
