import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList, ThemeMode } from '../types'
import { useSettingsStore } from '../../features/settings/store'
import { useFoldersStore } from '../../features/folders/store'
import { ProUpgradeModal } from '../../features/pro/components/ProUpgradeModal'
import { useThemedStyles, darkColors, spacing, type Palette } from '../theme'

const APP_ICON = require('../../../assets/icon.png')

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: 'ライト' },
  { mode: 'dark', label: 'ダーク' },
  { mode: 'auto', label: '自動' },
]

export function DrawerContent() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { settings, set } = useSettingsStore()
  const { folders } = useFoldersStore()
  const { c, styles } = useThemedStyles(makeStyles)
  const [proModalVisible, setProModalVisible] = useState(false)

  const defaultFolderName =
    folders.find((f) => f.id === settings.default_folder_id)?.name ?? '未設定'

  const close = () => navigation.dispatch(DrawerActions.closeDrawer())

  const handleDefaultFolderChange = () => {
    Alert.alert('デフォルトの保存先', 'ブクマ追加時の初期フォルダを選択', [
      ...folders.map((f) => ({
        text: f.name,
        onPress: () => set('default_folder_id', f.id),
      })),
      { text: 'キャンセル', style: 'cancel' as const },
    ])
  }

  const handleReview = () => {
    close()
    void Linking.openURL('https://apps.apple.com/jp/app/id6769874184?action=write-review')
  }

  const handleFaq = () => {
    close()
    void Linking.openURL('https://sknk-aaa.github.io/folders-app/faq.html')
  }

  const handleReportBug = () => {
    close()
    void Linking.openURL('https://tally.so/r/WOKNyL')
  }

  const handlePro = () => {
    close()
    setProModalVisible(true)
  }

  const openTutorial = () => {
    close()
    navigation.navigate('Tutorial')
  }

  const handleBackup = () => {
    close()
    if (settings.is_premium) {
      navigation.navigate('Backup')
    } else {
      setProModalVisible(true)
    }
  }

  const handleBrowserChange = () => {
    Alert.alert('デフォルトブラウザ', '使用するブラウザを選択してください', [
      { text: 'Safari', onPress: () => set('default_browser', 'safari') },
      { text: 'Chrome', onPress: () => set('default_browser', 'chrome') },
      { text: 'Edge', onPress: () => set('default_browser', 'edge') },
      { text: 'キャンセル', style: 'cancel' },
    ])
  }

  const browserLabel: Record<string, string> = {
    safari: 'Safari',
    chrome: 'Chrome',
    edge: 'Edge',
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header: app icon + name */}
        <View style={styles.header}>
          <Image source={APP_ICON} style={styles.icon} />
          <View style={styles.headerText}>
            <Text style={styles.appName}>サムネブックマーク</Text>
            <Text style={styles.appTagline}>{settings.is_premium ? 'Pro' : 'お気に入りをひとまとめに'}</Text>
          </View>
        </View>

        {/* サポート */}
        <SectionTitle>サポート</SectionTitle>
        <View style={styles.card}>
          <DrawerLinkItem icon="compass-outline" label="使い方" onPress={openTutorial} />
          <DrawerLinkItem icon="help-circle-outline" label="よくある質問" onPress={handleFaq} />
          <DrawerLinkItem icon="chatbubble-ellipses-outline" label="不具合・要望を報告" onPress={handleReportBug} />
          <DrawerLinkItem icon="star-outline" label="レビューして応援する" onPress={() => { void handleReview() }} isLast />
        </View>

        {/* Pro */}
        {!settings.is_premium && (
          <>
            <SectionTitle>プレミアム</SectionTitle>
            <View style={styles.card}>
              <TouchableOpacity style={styles.proRow} onPress={handlePro} activeOpacity={0.7}>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
                <View style={styles.proTextBlock}>
                  <Text style={styles.proTitle}>サムネブクマ Pro</Text>
                  <Text style={styles.proSub}>無制限保存・フォルダカバー変更</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* 設定 */}
        <SectionTitle>設定</SectionTitle>
        <View style={styles.card}>
          <TouchableOpacity style={styles.rowColumn} onPress={handleDefaultFolderChange}>
            <View style={styles.rowLeft}>
              <Ionicons name="folder-outline" size={20} color={c.textSecondary} style={styles.itemIcon} />
              <Text style={styles.label}>デフォルトの保存先</Text>
            </View>
            <View style={styles.rowColumnRight}>
              <Text style={styles.value} numberOfLines={1}>{defaultFolderName}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.row} onPress={handleBrowserChange}>
            <View style={styles.rowLeft}>
              <Ionicons name="globe-outline" size={20} color={c.textSecondary} style={styles.itemIcon} />
              <Text style={styles.label}>デフォルトブラウザ</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.value}>{browserLabel[settings.default_browser]}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.row} onPress={handleBackup}>
            <View style={styles.rowLeft}>
              <Ionicons name="cloud-outline" size={20} color={c.textSecondary} style={styles.itemIcon} />
              <Text style={styles.label}>iCloudバックアップ</Text>
            </View>
            <View style={styles.rowRight}>
              {!settings.is_premium && (
                <View style={styles.miniProBadge}>
                  <Text style={styles.miniProBadgeText}>PRO</Text>
                </View>
              )}
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* テーマ（Pro限定） */}
        <SectionTitle>{settings.is_premium ? 'テーマ' : 'テーマ（PRO）'}</SectionTitle>
        <View style={styles.themeSeg}>
          {THEME_OPTIONS.map(({ mode, label }) => {
            const activeMode = settings.is_premium ? settings.theme_mode : 'light'
            const on = activeMode === mode
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.themeSegItem, on && styles.themeSegItemOn]}
                onPress={() => {
                  if (!settings.is_premium) {
                    setProModalVisible(true)
                    return
                  }
                  set('theme_mode', mode)
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.themeSegText, on && styles.themeSegTextOn]}>{label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Text style={styles.footerText}>v1.3.0</Text>
      </View>
      <ProUpgradeModal visible={proModalVisible} onClose={() => setProModalVisible(false)} />
    </View>
  )
}

function SectionTitle({ children }: { children: string }) {
  const { styles } = useThemedStyles(makeStyles)
  return <Text style={styles.sectionTitle}>{children}</Text>
}

function DrawerLinkItem({
  label,
  icon,
  onPress,
  isLast,
}: {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  onPress: () => void
  isLast?: boolean
}) {
  const { c, styles } = useThemedStyles(makeStyles)
  return (
    <>
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.rowLeft}>
          <Ionicons name={icon} size={20} color={c.textSecondary} style={styles.itemIcon} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
      {!isLast && <View style={styles.separator} />}
    </>
  )
}

const makeStyles = (c: Palette) => {
  const dark = c === darkColors
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.drawerBg,
      paddingHorizontal: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 4,
      paddingTop: 8,
      paddingBottom: 28,
      gap: 12,
    },
    icon: {
      width: 52,
      height: 52,
      borderRadius: 12,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    appName: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
      letterSpacing: 0.2,
    },
    appTagline: {
      fontSize: 12,
      color: c.textSecondary,
      marginTop: 3,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: c.textSecondary,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginTop: 24,
      marginBottom: 8,
      marginLeft: 6,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
      minWidth: 0,
    },
    rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    itemIcon: {
      width: 22,
    },
    label: {
      fontSize: 15,
      color: c.text,
    },
    value: {
      fontSize: 14,
      color: c.textSecondary,
    },
    chevron: {
      fontSize: 18,
      color: c.textTertiary,
      fontWeight: '300',
      lineHeight: 18,
    },
    rowColumn: {
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 2,
    },
    rowColumnRight: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: 34,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.cardBorder,
      marginLeft: 14,
    },
    proRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 12,
    },
    proBadge: {
      backgroundColor: dark ? '#FFD60A' : '#1C1C1E',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    proBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: dark ? '#1C1C1E' : '#FFD60A',
      letterSpacing: 1,
    },
    miniProBadge: {
      backgroundColor: dark ? '#FFD60A' : '#1C1C1E',
      borderRadius: 5,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    miniProBadgeText: {
      fontSize: 9,
      fontWeight: '700',
      color: dark ? '#1C1C1E' : '#FFD60A',
      letterSpacing: 0.8,
    },
    proTextBlock: {
      flex: 1,
      minWidth: 0,
    },
    proTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
    },
    proSub: {
      fontSize: 11,
      color: c.textSecondary,
      marginTop: 2,
    },
    themeSeg: {
      flexDirection: 'row',
      backgroundColor: c.iconBg,
      borderRadius: 10,
      padding: 3,
    },
    themeSegItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 7,
      borderRadius: 8,
    },
    themeSegItemOn: {
      backgroundColor: dark ? '#48484A' : c.surface,
      shadowColor: '#000',
      shadowOpacity: dark ? 0 : 0.12,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
    },
    themeSegText: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textSecondary,
    },
    themeSegTextOn: {
      color: c.text,
    },
    footer: {
      paddingTop: 12,
      alignItems: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.cardBorder,
    },
    footerText: {
      fontSize: 11,
      color: c.textTertiary,
    },
  })
}
