import { View, Text, TouchableOpacity, Switch, StyleSheet, ScrollView, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import { useSettingsStore } from '../../features/settings/store'
import { colors, spacing } from '../theme'

export function DrawerContent() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { settings, set } = useSettingsStore()

  const close = () => navigation.dispatch(DrawerActions.closeDrawer())

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
        <Text style={styles.appName}>ブックマーク</Text>

        <View style={styles.section}>
          <DrawerItem label="使い方" onPress={close} />
          <DrawerItem label="アプリを評価" onPress={close} />
          <DrawerItem
            label="プレミアム版を購入"
            onPress={close}
            sublabel={settings.is_premium ? '購入済み' : undefined}
          />
          <DrawerItem label="よくある質問" onPress={close} />
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
