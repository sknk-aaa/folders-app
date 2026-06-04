import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native'
import { Image } from 'expo-image'
import { CustomActionSheet } from '../../../shared/components/CustomActionSheet'
import { MoreButton } from '../../../shared/components/MoreButton'
import { PlaceholderImage } from '../../../shared/components/PlaceholderImage'
import { useThemedStyles, spacing, radius, type Palette } from '../../../shared/theme'
import { tr } from '../../../shared/i18n'
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
  const { update, markViewed } = useBookmarksStore()
  const { settings } = useSettingsStore()
  const { styles } = useThemedStyles(makeStyles)
  const [editVisible, setEditVisible] = useState(false)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [moveSheetVisible, setMoveSheetVisible] = useState(false)

  const handlePress = () => {
    markViewed(bookmark.id)
    const target = openInBrowser(bookmark.url, settings.default_browser)
    Linking.openURL(target)
  }

  const handleDeleteConfirm = () => {
    Alert.alert(tr({ en: 'Delete', ja: '削除' }), tr({ en: `Delete "${bookmark.name}"?`, ja: `「${bookmark.name}」を削除しますか？` }), [
      { text: tr({ en: 'Cancel', ja: 'キャンセル' }), style: 'cancel' },
      { text: tr({ en: 'Delete', ja: '削除' }), style: 'destructive', onPress: onDelete },
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
          {bookmark.memo ? (
            <Text style={styles.memo} numberOfLines={2}>{bookmark.memo}</Text>
          ) : null}
        </View>
        <MoreButton onPress={() => setSheetVisible(true)} />
      </TouchableOpacity>

      <BookmarkEditModal
        bookmark={editVisible ? bookmark : null}
        onClose={() => setEditVisible(false)}
        onSave={(name, url, memo) => update(bookmark.id, name, url, memo)}
      />

      <CustomActionSheet
        visible={sheetVisible}
        title={bookmark.name}
        options={[
          { label: tr({ en: 'Edit', ja: '編集' }), onPress: () => setEditVisible(true) },
          ...(allFolders.length > 1
            ? [{ label: tr({ en: 'Move', ja: '移動' }), onPress: () => setMoveSheetVisible(true) }]
            : []),
          { label: tr({ en: 'Delete', ja: '削除' }), destructive: true, onPress: handleDeleteConfirm },
        ]}
        onCancel={() => setSheetVisible(false)}
      />

      <CustomActionSheet
        visible={moveSheetVisible}
        title={tr({ en: 'Move to folder', ja: '移動先フォルダ' })}
        options={allFolders.map((f) => ({ label: f.name, onPress: () => onMove(f.id) }))}
        onCancel={() => setMoveSheetVisible(false)}
      />
    </>
  )
}

const makeStyles = (c: Palette) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingRight: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.cardBorder,
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
    color: c.text,
    lineHeight: 20,
  },
  domain: {
    fontSize: 12,
    color: c.textSecondary,
    marginTop: 2,
  },
  memo: {
    fontSize: 12,
    color: c.text,
    marginTop: 4,
    lineHeight: 16,
  },
})
