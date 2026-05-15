import { useState } from 'react'
import { View, Text, TouchableOpacity, Switch, StyleSheet, ScrollView, Alert, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'
import { useSettingsStore } from '../../features/settings/store'
import { ProUpgradeModal } from '../../features/pro/components/ProUpgradeModal'
import { colors, spacing } from '../theme'

export function DrawerContent() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { settings, set } = useSettingsStore()
  const [proModalVisible, setProModalVisible] = useState(false)

  const close = () => navigation.dispatch(DrawerActions.closeDrawer())

  const handleReview = () => {
    close()
    // TODO: App Store公開後にIDをURLに追加する
    // void Linking.openURL('https://apps.apple.com/app/idXXXXXXXXX?action=write-review')
    Alert.alert('準備中', 'App Store公開後にレビューをお願いします！')
  }

  const handleFaq = () => {
    close()
    void Linking.openURL('https://sknk-aaa.github.io/folders-app/faq.html')
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
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.appName}>Bookrest</Text>

        <View style={styles.section}>
          <DrawerItem label="使い方" onPress={openTutorial} />
          <DrawerItem label="アプリを評価" onPress={handleReview} />
          <DrawerItem
            label="プレミアム版を購入"
            onPress={handlePro}
            sublabel={settings.is_premium ? '購入済み' : undefined}
          />
          <DrawerItem label="よくある質問" onPress={handleFaq} />
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <TouchableOpacity style={styles.row} onPress={handleBrowserChange}>
            <Text style={styles.label}>デフォルトブラウザ</Text>
            <Text style={styles.value}>{browserLabel[settings.default_browser]}</Text>
          </TouchableOpacity>
          <View style={styles.row}>
            <Text style={styles.label}>サムネ撮影</Text>
            <Switch
              value={settings.capture_thumbnail}
              onValueChange={(v) => set('capture_thumbnail', v)}
              trackColor={{ true: '#34C759' }}
            />
          </View>
        </View>
      </ScrollView>
      <ProUpgradeModal visible={proModalVisible} onClose={() => setProModalVisible(false)} />
    </View>
  )
}

function DrawerItem({
  label,
  onPress,
  sublabel,
}: {
  label: string
  onPress: () => void
  sublabel?: string
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
      {sublabel && <Text style={styles.value}>{sublabel}</Text>}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.drawerBg,
    paddingHorizontal: spacing.xl,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 28,
  },
  section: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  label: {
    fontSize: 16,
    color: colors.text,
  },
  value: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  divider: {
    height: 24,
  },
})
