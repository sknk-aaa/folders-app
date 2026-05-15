import { useState } from 'react'
import {
  Alert,
  FlatList,
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PlaceholderImage } from '../../../shared/components/PlaceholderImage'
import { PinEntryModal } from './PinEntryModal'
import { useFoldersStore } from '../store'
import { useProStore } from '../../pro/store'
import { ProUpgradeModal } from '../../pro/components/ProUpgradeModal'
import type { Bookmark, Folder, FolderIconId } from '../../../shared/types'
import { colors, spacing, radius } from '../../../shared/theme'

type Props = {
  visible: boolean
  folder?: Folder
  onSave: (name: string, iconId: FolderIconId) => void
  onClose: () => void
  bookmarks?: Bookmark[]
  onDeleteBookmarks?: (ids: string[]) => void
}

export function FolderEditModal({
  visible,
  folder,
  onSave,
  onClose,
  bookmarks,
  onDeleteBookmarks,
}: Props) {
  const insets = useSafeAreaInsets()
  const [name, setName] = useState(folder?.name ?? '')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [pinModalMode, setPinModalMode] = useState<'set' | 'unlock' | null>(null)
  const { folders, setPin, removePin } = useFoldersStore()
  const currentFolder = folder ? folders.find((f) => f.id === folder.id) : undefined
  const isPro = useProStore((s) => s.isPro)
  const [proModalVisible, setProModalVisible] = useState(false)

  const handleOpen = () => {
    setName(folder?.name ?? '')
    setSelectedIds(new Set())
    setPinModalMode(null)
  }

  const handleSave = () => {
    if (!name.trim()) return
    onSave(name.trim(), folder?.iconId ?? 'default')
    onClose()
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleDeleteSelected = () => {
    const count = selectedIds.size
    Alert.alert(
      `${count}件を削除`,
      'この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            onDeleteBookmarks?.(Array.from(selectedIds))
            setSelectedIds(new Set())
          },
        },
      ],
    )
  }

  const hasBookmarks = bookmarks && bookmarks.length > 0

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
          <View style={styles.handle} />

          <Text style={styles.title}>{folder ? 'フォルダを編集' : '新しいフォルダ'}</Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="フォルダ名"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          {folder && (
            <TouchableOpacity
              style={styles.lockRow}
              onPress={() => {
                if (!isPro) { setProModalVisible(true); return }
                setPinModalMode(currentFolder?.pinCode ? 'unlock' : 'set')
              }}
            >
              <Text style={styles.lockRowText}>
                {currentFolder?.pinCode ? '🔒 PINロックを解除' : '🔓 PINロックを設定'}
              </Text>
            </TouchableOpacity>
          )}

          {hasBookmarks && onDeleteBookmarks ? (
            <View style={styles.bookmarkSection}>
              <View style={styles.bookmarkHeader}>
                <Text style={styles.bookmarkSectionTitle}>ブックマーク管理</Text>
                {selectedIds.size > 0 && (
                  <TouchableOpacity onPress={handleDeleteSelected} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>{selectedIds.size}件を削除</Text>
                  </TouchableOpacity>
                )}
              </View>
              <FlatList
                data={bookmarks}
                keyExtractor={(b) => b.id}
                style={styles.bookmarkList}
                renderItem={({ item }) => (
                  <BookmarkRow
                    bookmark={item}
                    selected={selectedIds.has(item.id)}
                    onToggle={() => toggleSelect(item.id)}
                  />
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>
          ) : null}

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

      {pinModalMode === 'set' && folder && (
        <PinEntryModal
          mode="set"
          onSet={(pin) => { setPin(folder.id, pin); setPinModalMode(null) }}
          onCancel={() => setPinModalMode(null)}
        />
      )}
      {pinModalMode === 'unlock' && currentFolder?.pinCode && (
        <PinEntryModal
          mode="unlock"
          correctPin={currentFolder.pinCode}
          onSuccess={() => { removePin(folder!.id); setPinModalMode(null) }}
          onCancel={() => setPinModalMode(null)}
        />
      )}
      <ProUpgradeModal visible={proModalVisible} onClose={() => setProModalVisible(false)} />
    </Modal>
  )
}

function BookmarkRow({
  bookmark,
  selected,
  onToggle,
}: {
  bookmark: Bookmark
  selected: boolean
  onToggle: () => void
}) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onToggle} style={styles.bookmarkRow}>
      {bookmark.thumbnailPath ? (
        <Image
          source={{ uri: bookmark.thumbnailPath }}
          style={styles.bookmarkThumb}
          contentFit="cover"
        />
      ) : (
        <PlaceholderImage width={40} height={40} style={styles.bookmarkThumb} />
      )}
      <Text style={styles.bookmarkName} numberOfLines={1}>
        {bookmark.name}
      </Text>
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
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
  bookmarkSection: {
    flex: 1,
    minHeight: 0,
    marginBottom: 16,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bookmarkSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: '#FF3B30',
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  bookmarkList: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.separator,
    borderRadius: radius.sm,
  },
  bookmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  bookmarkThumb: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: colors.placeholderBg,
  },
  bookmarkName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  checkmark: {
    fontSize: 12,
    color: colors.background,
    fontWeight: '700',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: 62,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 16,
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
  lockRow: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  lockRowText: {
    fontSize: 15,
    color: colors.text,
  },
})
