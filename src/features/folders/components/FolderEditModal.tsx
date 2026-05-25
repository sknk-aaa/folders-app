import { useState } from 'react'
import {
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
import {
  pickAndSaveFolderThumbnail,
  deleteFolderThumbnail,
} from '../../../shared/utils/folderThumbnail'
import type { Bookmark, Folder, FolderIconId } from '../../../shared/types'
import { colors, spacing, radius } from '../../../shared/theme'

type PinFlow = 'idle' | 'set' | 'changeVerify' | 'changeSet' | 'removeVerify'

type Props = {
  visible: boolean
  folder?: Folder
  onSave?: (name: string, iconId: FolderIconId) => void
  onClose: () => void
  bookmarks?: Bookmark[]
  onDeleteBookmarks?: (ids: string[]) => void
  manageOnly?: boolean
}

export function FolderEditModal({
  visible,
  folder,
  onSave,
  onClose,
  bookmarks,
  onDeleteBookmarks,
  manageOnly = false,
}: Props) {
  const insets = useSafeAreaInsets()
  const [name, setName] = useState(folder?.name ?? '')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [pinFlow, setPinFlow] = useState<PinFlow>('idle')
  const [proModalVisible, setProModalVisible] = useState(false)
  const { folders, setPin, removePin, setCustomThumbnail, removeCustomThumbnail } = useFoldersStore()
  const currentFolder = folder ? folders.find((f) => f.id === folder.id) : undefined
  const hasPin = Boolean(currentFolder?.pinCode)
  const hasCustomThumb = Boolean(currentFolder?.customThumbnailPath)
  const isPro = useProStore((s) => s.isPro)

  const handleOpen = () => {
    setName(folder?.name ?? '')
    setSelectedIds(new Set())
    setPinFlow('idle')
    setProModalVisible(false)
  }

  const handleSetThumb = async () => {
    if (!isPro) {
      setProModalVisible(true)
      return
    }
    if (!folder) return
    const prevPath = currentFolder?.customThumbnailPath
    const path = await pickAndSaveFolderThumbnail(folder.id)
    if (path) {
      if (prevPath) {
        await deleteFolderThumbnail(prevPath)
      }
      setCustomThumbnail(folder.id, path)
    }
  }

  const handleRemoveThumb = async () => {
    if (!folder) return
    await removeCustomThumbnail(folder.id)
  }

  const handleSave = () => {
    if (manageOnly) {
      // ブクマ管理モード: 選択中を削除してクローズ
      if (selectedIds.size > 0 && onDeleteBookmarks) {
        onDeleteBookmarks(Array.from(selectedIds))
      }
      onClose()
      return
    }
    // フォルダ編集モード: 名前必須・名前保存
    if (!name.trim()) return
    onSave?.(name.trim(), folder?.iconId ?? 'default')
    onClose()
  }

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return
    onDeleteBookmarks?.(Array.from(selectedIds))
    setSelectedIds(new Set())
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

          <Text style={styles.title}>
            {manageOnly ? 'ブックマーク管理' : folder ? 'フォルダを編集' : '新しいフォルダ'}
          </Text>

          {!manageOnly && (
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="フォルダ名"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          )}

          {!manageOnly && folder && (
            <View style={styles.lockSection}>
              <View style={styles.lockRow}>
                <Text style={styles.lockRowLabel}>PINロック</Text>
                <View style={styles.lockActions}>
                  {hasPin ? (
                    <>
                      <TouchableOpacity
                        style={styles.lockBtn}
                        onPress={() => setPinFlow('changeVerify')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.lockBtnText}>変更</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.lockBtn}
                        onPress={() => setPinFlow('removeVerify')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.lockBtnDestructive}>解除</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.lockBtn}
                      onPress={() => setPinFlow('set')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.lockBtnText}>設定する</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <Text style={styles.lockCaption}>
                ロック中のフォルダは「最近追加」「すべてのブックマーク」「検索」にも表示されません
              </Text>
            </View>
          )}

          {!manageOnly && folder && (
            <View style={styles.thumbSection}>
              <View style={styles.thumbRow}>
                <View style={styles.thumbLabelRow}>
                  <Text style={styles.thumbLabel}>サムネイル画像</Text>
                  <View style={styles.proBadge}>
                    <Text style={styles.proBadgeText}>PRO</Text>
                  </View>
                </View>
                <View style={styles.lockActions}>
                  {hasCustomThumb ? (
                    <>
                      <TouchableOpacity
                        style={styles.lockBtn}
                        onPress={handleSetThumb}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.lockBtnText}>変更</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.lockBtn}
                        onPress={handleRemoveThumb}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.lockBtnDestructive}>削除</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.lockBtn}
                      onPress={handleSetThumb}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.lockBtnText}>設定する</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <Text style={styles.lockCaption}>フォルダカバーを自由に変更できます</Text>
            </View>
          )}

          {hasBookmarks && onDeleteBookmarks ? (
            <View style={styles.bookmarkSection}>
              <View style={styles.bookmarkHeader}>
                <Text style={styles.bookmarkSectionTitle}>
                  {manageOnly ? '削除するブックマークを選択' : 'ブックマーク管理'}
                </Text>
                {selectedIds.size > 0 && (
                  manageOnly ? (
                    <View style={styles.selectionBadge}>
                      <Text style={styles.selectionBadgeText}>{selectedIds.size}件選択中</Text>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={handleDeleteSelected} style={styles.deleteBtn}>
                      <Text style={styles.deleteBtnText}>{selectedIds.size}件を削除</Text>
                    </TouchableOpacity>
                  )
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
            {manageOnly ? (
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  styles.deleteCommitBtn,
                  selectedIds.size === 0 && styles.saveBtnDisabled,
                ]}
                onPress={handleSave}
                disabled={selectedIds.size === 0}
              >
                <Text style={styles.saveText}>削除</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!name.trim()}
              >
                <Text style={styles.saveText}>保存</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {pinFlow === 'set' && folder && (
        <PinEntryModal
          mode="set"
          onSet={(pin) => {
            setPin(folder.id, pin)
            setPinFlow('idle')
          }}
          onCancel={() => setPinFlow('idle')}
        />
      )}
      {pinFlow === 'changeVerify' && currentFolder?.pinCode && (
        <PinEntryModal
          mode="unlock"
          correctPin={currentFolder.pinCode}
          onSuccess={() => setPinFlow('changeSet')}
          onCancel={() => setPinFlow('idle')}
        />
      )}
      {pinFlow === 'changeSet' && folder && (
        <PinEntryModal
          mode="set"
          onSet={(pin) => {
            setPin(folder.id, pin)
            setPinFlow('idle')
          }}
          onCancel={() => setPinFlow('idle')}
        />
      )}
      {pinFlow === 'removeVerify' && currentFolder?.pinCode && folder && (
        <PinEntryModal
          mode="unlock"
          correctPin={currentFolder.pinCode}
          onSuccess={() => {
            removePin(folder.id)
            setPinFlow('idle')
          }}
          onCancel={() => setPinFlow('idle')}
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
  selectionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: '#FFEBEA',
  },
  selectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3B30',
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
  deleteCommitBtn: {
    backgroundColor: '#FF3B30',
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
  lockSection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  lockCaption: {
    fontSize: 12,
    color: colors.textSecondary,
    paddingHorizontal: 4,
    lineHeight: 17,
  },
  lockRowLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  lockActions: {
    flexDirection: 'row',
    gap: 8,
  },
  lockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: colors.placeholderBg,
  },
  lockBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  lockBtnDestructive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
  },
  thumbSection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  thumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  thumbLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thumbLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
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
})
