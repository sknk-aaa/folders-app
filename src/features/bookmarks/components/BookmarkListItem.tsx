import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { Image } from 'expo-image'
import { PlaceholderImage } from '../../../shared/components/PlaceholderImage'
import { colors, spacing, radius, getDomain, getFaviconColor, getFaviconLetter } from '../../../shared/theme'
import type { Bookmark, Folder } from '../../../shared/types'

const THUMB_SIZE = 52

type Props = {
  bookmark: Bookmark
  allFolders: Folder[]
  onDelete: () => void
  onMove: (folderId: string) => void
  onEdit: () => void
}

export function BookmarkListItem({ bookmark, allFolders, onDelete, onMove, onEdit }: Props) {
  const handleMore = () => {
    Alert.alert(bookmark.name, undefined, [
      { text: '編集', onPress: onEdit },
      ...(allFolders.length > 0
        ? [{ text: '移動', onPress: () => showMoveSheet(allFolders, onMove) }]
        : []),
      { text: '削除', style: 'destructive' as const, onPress: () => {
        Alert.alert('削除', `「${bookmark.name}」を削除しますか？`, [
          { text: 'キャンセル', style: 'cancel' },
          { text: '削除', style: 'destructive', onPress: onDelete },
        ])
      }},
      { text: 'キャンセル', style: 'cancel' },
    ])
  }

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7}>
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
      </View>
      <TouchableOpacity onPress={handleMore} hitSlop={8}>
        <Text style={styles.moreDots}>•••</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

function showMoveSheet(folders: Folder[], onMove: (id: string) => void) {
  Alert.alert(
    '移動先フォルダ',
    undefined,
    [
      ...folders.map((f) => ({ text: f.name, onPress: () => onMove(f.id) })),
      { text: 'キャンセル', style: 'cancel' as const },
    ]
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
  moreDots: {
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
})
