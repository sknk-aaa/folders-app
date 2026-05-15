import { useState } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { Folder, FolderIconId } from '../../../shared/types'
import { colors, spacing, radius } from '../../../shared/theme'

type Props = {
  visible: boolean
  folder?: Folder
  onSave: (name: string, iconId: FolderIconId) => void
  onClose: () => void
}

export function FolderEditModal({ visible, folder, onSave, onClose }: Props) {
  const insets = useSafeAreaInsets()
  const [name, setName] = useState(folder?.name ?? '')

  const handleOpen = () => {
    setName(folder?.name ?? '')
  }

  const handleSave = () => {
    if (!name.trim()) return
    onSave(name.trim(), folder?.iconId ?? 'default')
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onShow={handleOpen}
    >
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
