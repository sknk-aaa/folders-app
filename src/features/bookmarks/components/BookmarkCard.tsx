import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native'
import { Image } from 'expo-image'
import { CustomActionSheet } from '../../../shared/components/CustomActionSheet'
import { MoreButton } from '../../../shared/components/MoreButton'
import { PlaceholderImage } from '../../../shared/components/PlaceholderImage'
import { colors, spacing, radius, getFaviconColor, getFaviconLetter, getDomain } from '../../../shared/theme'
import { openInBrowser } from '../../../shared/utils/url'
import { useBookmarksStore } from '../store'
import { useSettingsStore } from '../../settings/store'
import { BookmarkEditModal } from './BookmarkEditModal'
import type { Bookmark, Folder } from '../../../shared/types'

const IMAGE_ASPECT = 1 / 0.72 // 約1.389:1 (W:H) - 列数によらず固定

type Props = {
  bookmark: Bookmark
  allFolders: Folder[]
  onDelete: () => void
  onMove: (folderId: string) => void
  drag?: () => void
  isActive?: boolean
  compact?: boolean
}

export function BookmarkCard({ bookmark, allFolders, onDelete, onMove, drag, isActive, compact }: Props) {
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
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={drag}
        activeOpacity={isActive ? 1 : 0.85}
        style={[styles.card, isActive && styles.cardActive]}
      >
        {/* Thumbnail */}
        {bookmark.thumbnailPath ? (
          <Image
            source={{ uri: bookmark.thumbnailPath }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <PlaceholderImage style={styles.image} />
        )}

        {/* Meta row */}
        <View style={[styles.meta, compact && styles.metaCompact]}>
          <View style={styles.metaLeft}>
            <FaviconCircle url={bookmark.url} size={compact ? 18 : 22} />
            <View style={styles.textBlock}>
              <Text style={styles.name} numberOfLines={compact ? 1 : 2}>{bookmark.name}</Text>
              {!compact && (
                <Text style={styles.domain} numberOfLines={1}>{getDomain(bookmark.url)}</Text>
              )}
            </View>
          </View>
          <MoreButton onPress={() => setSheetVisible(true)} />
        </View>
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

function FaviconCircle({ url, size = 22 }: { url: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: getFaviconColor(url),
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Text style={{ color: '#fff', fontSize: size * 0.48, fontWeight: '700' }}>
        {getFaviconLetter(url)}
      </Text>
    </View>
  )
}

function showMoveSheet(folders: Folder[], onMove: (id: string) => void) {
  Alert.alert('移動先フォルダ', undefined, [
    ...folders.map((f) => ({ text: f.name, onPress: () => onMove(f.id) })),
    { text: 'キャンセル', style: 'cancel' as const },
  ])
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardActive: {
    opacity: 0.85,
  },
  image: {
    width: '100%',
    aspectRatio: IMAGE_ASPECT,
    overflow: 'hidden',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
    backgroundColor: '#fff',
  },
  metaCompact: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  metaLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  textBlock: {
    flex: 1,
  },
  name: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 16,
  },
  domain: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
})
