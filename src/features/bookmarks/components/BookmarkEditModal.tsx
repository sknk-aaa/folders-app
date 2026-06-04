import { useState, useEffect } from 'react'
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
import { useThemedStyles, spacing, radius, type Palette } from '../../../shared/theme'
import type { Bookmark } from '../../../shared/types'

type Props = {
  bookmark: Bookmark | null
  onClose: () => void
  onSave: (name: string, url: string) => void
}

export function BookmarkEditModal({ bookmark, onClose, onSave }: Props) {
  const [name, setName] = useState(bookmark?.name ?? '')
  const [url, setUrl] = useState(bookmark?.url ?? '')
  const { c, styles } = useThemedStyles(makeStyles)

  useEffect(() => {
    setName(bookmark?.name ?? '')
    setUrl(bookmark?.url ?? '')
  }, [bookmark])

  if (!bookmark) return null

  const handleSave = () => {
    const trimName = name.trim()
    const trimUrl = url.trim()
    if (!trimName || !trimUrl) return
    onSave(trimName, trimUrl)
    onClose()
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>
            <Text style={styles.title}>ブックマークを編集</Text>
            <TouchableOpacity onPress={handleSave} disabled={!name.trim() || !url.trim()}>
              <Text style={[styles.saveText, (!name.trim() || !url.trim()) && { opacity: 0.3 }]}>
                保存
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>サイト名</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="サイト名"
              placeholderTextColor={c.textTertiary}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>URL</Text>
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="https://..."
              placeholderTextColor={c.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const makeStyles = (c: Palette) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: c.surfaceElevated,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.separator,
  },
  title: { fontSize: 16, fontWeight: '600', color: c.text },
  cancelText: { fontSize: 15, color: c.textSecondary },
  saveText: { fontSize: 15, fontWeight: '700', color: c.text },
  field: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: c.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: c.separator,
    borderRadius: radius.sm,
    padding: 12,
    fontSize: 15,
    color: c.text,
  },
})
