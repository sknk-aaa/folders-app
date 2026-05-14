import { useState } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { Folder, FolderIconId } from '../../../shared/types'
import { colors, spacing, radius } from '../../../shared/theme'

const ICONS: Array<{ id: FolderIconId; label: string; emoji: string }> = [
  { id: 'default', label: '一般', emoji: '📁' },
  { id: 'article', label: '記事', emoji: '📄' },
  { id: 'music', label: '音楽', emoji: '🎵' },
  { id: 'video', label: '動画', emoji: '▶️' },
  { id: 'work', label: '仕事', emoji: '💼' },
  { id: 'shopping', label: '買物', emoji: '🛒' },
  { id: 'recipe', label: 'レシピ', emoji: '🍳' },
  { id: 'game', label: 'ゲーム', emoji: '🎮' },
  { id: 'sns', label: 'SNS', emoji: '💬' },
  { id: 'news', label: 'ニュース', emoji: '📰' },
  { id: 'study', label: '勉強', emoji: '📚' },
]

type Props = {
  visible: boolean
  folder?: Folder
  onSave: (name: string, iconId: FolderIconId) => void
  onClose: () => void
}

export function FolderEditModal({ visible, folder, onSave, onClose }: Props) {
  const insets = useSafeAreaInsets()
  const [name, setName] = useState(folder?.name ?? '')
  const [iconId, setIconId] = useState<FolderIconId>(folder?.iconId ?? 'default')

  const handleOpen = () => {
    setName(folder?.name ?? '')
    setIconId(folder?.iconId ?? 'default')
  }

  const handleSave = () => {
    if (!name.trim()) return
    onSave(name.trim(), iconId)
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onShow={handleOpen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
          {/* Handle bar */}
          <View style={styles.handle} />

          <Text style={styles.title}>{folder ? 'フォルダを編集' : '新しいフォルダ'}</Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="フォルダ名"
            placeholderTextColor={colors.textTertiary}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          <Text style={styles.sectionLabel}>アイコン</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconList}>
            {ICONS.map((icon) => (
              <TouchableOpacity
                key={icon.id}
                onPress={() => setIconId(icon.id)}
                style={[styles.iconItem, iconId === icon.id && styles.iconItemSelected]}
              >
                <Text style={styles.iconEmoji}>{icon.emoji}</Text>
                <Text style={[styles.iconLabel, iconId === icon.id && styles.iconLabelSelected]}>
                  {icon.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!name.trim()}
            >
              <Text style={styles.saveText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textTertiary,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.separator,
    borderRadius: radius.sm,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconList: {
    paddingBottom: 8,
    gap: 8,
  },
  iconItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.placeholderBg,
    minWidth: 64,
  },
  iconItemSelected: {
    borderColor: colors.text,
    backgroundColor: colors.background,
  },
  iconEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  iconLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  iconLabelSelected: {
    color: colors.text,
    fontWeight: '600',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 24,
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: radius.md,
    backgroundColor: colors.placeholderBg,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: colors.text,
  },
  saveBtn: {
    flex: 1,
    padding: 16,
    borderRadius: radius.md,
    backgroundColor: colors.text,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.3,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
})
