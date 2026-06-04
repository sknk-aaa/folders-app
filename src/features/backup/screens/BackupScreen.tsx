import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useSettingsStore } from '../../settings/store'
import { useBackupStore } from '../store'
import { ProUpgradeModal } from '../../pro/components/ProUpgradeModal'
import { useThemedStyles, spacing, radius, type Palette } from '../../../shared/theme'

function formatDate(ts: number | null): string {
  if (!ts) return 'Not backed up yet'
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function BackupScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { settings } = useSettingsStore()
  const { state, backup, restore } = useBackupStore()
  const { c, styles } = useThemedStyles(makeStyles)
  const [proModalVisible, setProModalVisible] = useState(false)

  const isPremium = settings.is_premium
  const busy = state !== 'idle'

  const handleBackup = async () => {
    const r = await backup()
    if (r.ok) {
      Alert.alert('Backup Done', `Saved ${r.manifest?.bookmarkCount ?? 0} bookmarks`)
    } else {
      Alert.alert('Backup Failed', r.error ?? 'Please try again later')
    }
  }

  const handleRestore = () => {
    Alert.alert(
      'Confirm Restore',
      'All current bookmarks will be overwritten. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            const r = await restore()
            if (r.ok) {
              Alert.alert('Restore Done', `Restored ${r.manifest?.bookmarkCount ?? 0} bookmarks`, [
                { text: 'OK', onPress: () => navigation.goBack() },
              ])
            } else {
              Alert.alert('Restore Failed', r.error ?? 'Please try again later')
            }
          },
        },
      ],
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={busy}>
          <Text style={[styles.cancelText, busy && styles.disabled]}>Close</Text>
        </TouchableOpacity>
        <Text style={styles.modalTitle}>iCloud Backup</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!isPremium ? (
          <View style={styles.lockCard}>
            <Ionicons name="cloud-outline" size={40} color={c.textSecondary} />
            <Text style={styles.lockTitle}>This is a Pro feature</Text>
            <Text style={styles.lockDesc}>
              Save your bookmarks and thumbnails to iCloud, so you can restore them even after switching devices or reinstalling the app.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setProModalVisible(true)}>
              <Text style={styles.primaryBtnText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={18} color={c.textSecondary} />
                <Text style={styles.infoLabel}>Last Backup</Text>
                <Text style={styles.infoValue}>{formatDate(settings.last_backup_at)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, busy && styles.disabled]}
              onPress={() => void handleBackup()}
              disabled={busy}
            >
              {state === 'backing-up' ? (
                <ActivityIndicator color={c.background} />
              ) : (
                <Text style={styles.primaryBtnText}>Back Up Now</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, busy && styles.disabled]}
              onPress={handleRestore}
              disabled={busy}
            >
              {state === 'restoring' ? (
                <ActivityIndicator color={c.destructive} />
              ) : (
                <Text style={styles.secondaryBtnText}>Restore from Backup</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.note}>
              Restoring overwrites your current data. The backup is saved only to this device's iCloud and is not visible to others.
            </Text>
          </>
        )}
      </ScrollView>

      <ProUpgradeModal visible={proModalVisible} onClose={() => setProModalVisible(false)} />
    </View>
  )
}

const makeStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.separator,
  },
  modalTitle: { fontSize: 16, fontWeight: '600', color: c.text },
  cancelText: { fontSize: 15, color: c.textSecondary },
  disabled: { opacity: 0.4 },
  content: { padding: spacing.lg, gap: spacing.md },
  infoCard: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.cardBorder,
    padding: spacing.lg,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 14, color: c.textSecondary, flex: 1 },
  infoValue: { fontSize: 13, color: c.text, fontWeight: '500' },
  primaryBtn: {
    backgroundColor: c.text,
    padding: 16,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: c.background },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: c.destructive,
    padding: 16,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '600', color: c.destructive },
  note: {
    fontSize: 12,
    color: c.textSecondary,
    lineHeight: 18,
    marginTop: spacing.sm,
    paddingHorizontal: 4,
  },
  lockCard: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.cardBorder,
    padding: spacing.xl,
    alignItems: 'center',
    gap: 12,
  },
  lockTitle: { fontSize: 18, fontWeight: '700', color: c.text },
  lockDesc: {
    fontSize: 14,
    color: c.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 8,
  },
})
