import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native'
import { Image } from 'expo-image'
import { CustomActionSheet } from '../../../shared/components/CustomActionSheet'
import { MoreButton } from '../../../shared/components/MoreButton'
import { PlaceholderImage } from '../../../shared/components/PlaceholderImage'
import { colors, spacing, radius } from '../../../shared/theme'
import { openInBrowser } from '../../../shared/utils/url'
import { useBookmarksStore } from '../store'
import { useSettingsStore } from '../../settings/store'
import { BookmarkEditModal } from './BookmarkEditModal'
import type { Bookmark, Folder } from '../../../shared/types'

const THUMB_SIZE = 52

type Props = {
  bookmark: Bookmark
  allFolders: Folder[]
  onDelete: () => void
  onMove: (folderId: string) => void
}

export function BookmarkListItem({ bookmark, allFolders, onDelete, onMove }: Props) {
  const { update } = useBookmarksStore()
  const { settings } = useSettingsStore()
  const [editVisible, setEditVisible] = useState(false)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [moveSheetVisible, setMoveSheetVisible] = useState(false)

  const handlePress = () => {
    const target = openInBrowser(bookmark.url, settings.default_browser)
    Linking.openURL(target)
  }

  const handleDeleteConfirm = () => {
    Alert.alert('削除', `「${bookmark.name}」を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: onDelete },
    ])
  }

  return (
    <>
      <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={handlePress}>
        {bookmark.thumbnailPath ? (
          <Image
            source={{ uri: bookmark.thumbnailPath }}
            style={styles.thumb}
            contentFit="cover"
          />
        ) : (
          <PlaceholderImage width={THUMB_SIZE} height={THUMB_SIZE} style={styles.thumb} />
        )}
        <View style={styles.textBlock}>
          <Text style={styles.name} numberOfLines={2}>{bookmark.name}</Text>
          <Text style={styles.domain} numberOfLines={1}>{bookmark.url}</Text>
        </View>
        <MoreButton onPress={() => setSheetVisible(true)} />
      </TouchableOpacity>

      <BookmarkEditModal
        bookmark={editVisible ? bookmark : null}
        onClose={() => setEditVisible(false)}
        onSave={(name, url) => update(bookmark.id, name, url)}
      />

      <CustomActionSheet
        visible={sheetVisible}
        title={bookmark.name}
        options={[
          { label: '編集', onPress: () => setEditVisible(true) },
          ...(allFolders.length > 1
            ? [{ label: '移動', onPress: () => setMoveSheetVisible(true) }]
            : []),
          { label: '削除', destructive: true, onPress: handleDeleteConfirm },
        ]}
        onCancel={() => setSheetVisible(false)}
      />

      <CustomActionSheet
        visible={moveSheetVisible}
        title="移動先フォルダ"
        options={allFolders.map((f) => ({ label: f.name, onPress: () => onMove(f.id) }))}
        onCancel={() => setMoveSheetVisible(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
    gap: spacing.md,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.sm,
    overflow: 'hidden',
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  domain: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
})
