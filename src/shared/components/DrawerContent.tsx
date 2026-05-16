import { useState } from 'react'
import { View, Text, TouchableOpacity, Switch, StyleSheet, ScrollView, Alert, Linking, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'
import { useSettingsStore } from '../../features/settings/store'
import { useFoldersStore } from '../../features/folders/store'
import { ProUpgradeModal } from '../../features/pro/components/ProUpgradeModal'
import { colors, spacing } from '../theme'

const APP_ICON = require('../../../assets/icon.png')

export function DrawerContent() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { settings, set } = useSettingsStore()
  const { folders } = useFoldersStore()
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
    Alert.alert('準備中', 'App Store公開後にレビューをお願いします！')
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
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Header: app icon + name */}
        <View style={styles.header}>
          <Image source={APP_ICON} style={styles.icon} />
          <View style={styles.headerText}>
            <Text style={styles.appName}>Bookrest</Text>
            <Text style={styles.appTagline}>{settings.is_premium ? 'Pro' : 'お気に入りをひとまとめに'}</Text>
          </View>
        </View>

        {/* サポート */}
        <SectionTitle>サポート</SectionTitle>
        <View style={styles.card}>
          <DrawerLinkItem label="使い方" onPress={openTutorial} />
          <DrawerLinkItem label="よくある質問" onPress={handleFaq} />
          <DrawerLinkItem label="不具合・要望を報告" onPress={handleReportBug} />
          <DrawerLinkItem label="アプリを評価" onPress={handleReview} isLast />
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
                  <Text style={styles.proTitle}>Bookrest Pro</Text>
                  <Text style={styles.proSub}>無制限保存・フォルダPINロック</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* 設定 */}
        <SectionTitle>設定</SectionTitle>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleDefaultFolderChange}>
            <Text style={styles.label}>デフォルトの保存先</Text>
            <View style={styles.rowRight}>
              <Text style={styles.value}>{defaultFolderName}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.row} onPress={handleBrowserChange}>
            <Text style={styles.label}>デフォルトブラウザ</Text>
            <View style={styles.rowRight}>
              <Text style={styles.value}>{browserLabel[settings.default_browser]}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.separator} />
          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.label}>サムネ撮影</Text>
              <Text style={styles.description}>
                {settings.capture_thumbnail
                  ? 'サイトを開いて保存したい画面をサムネに'
                  : 'サイト画像を自動取得してサムネに'}
              </Text>
            </View>
            <Switch
              value={settings.capture_thumbnail}
              onValueChange={(v) => set('capture_thumbnail', v)}
              trackColor={{ true: '#34C759' }}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Bookrest v1.0.0</Text>
          <Text style={styles.footerText}>© 2026 s-knk</Text>
        </View>
      </ScrollView>
      <ProUpgradeModal visible={proModalVisible} onClose={() => setProModalVisible(false)} />
    </View>
  )
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>
}

function DrawerLinkItem({
  label,
  onPress,
  isLast,
}: {
  label: string
  onPress: () => void
  isLast?: boolean
}) {
  return (
    <>
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
      {!isLast && <View style={styles.separator} />}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.drawerBg,
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
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.2,
  },
  appTagline: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 6,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  toggleText: {
    flex: 1,
    minWidth: 0,
  },
  description: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 15,
  },
  label: {
    fontSize: 15,
    color: colors.text,
  },
  value: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 18,
    color: colors.textTertiary,
    fontWeight: '300',
    lineHeight: 18,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.cardBorder,
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
    backgroundColor: '#1C1C1E',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFD60A',
    letterSpacing: 1,
  },
  proTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  proTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  proSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
})
