import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native'
import { Image } from 'expo-image'
import { CustomActionSheet } from '../../../shared/components/CustomActionSheet'
import { MoreButton } from '../../../shared/components/MoreButton'
import { PlaceholderImage } from '../../../shared/components/PlaceholderImage'
import { useThemedStyles, spacing, radius, getFaviconColor, getFaviconLetter, getDomain, type Palette } from '../../../shared/theme'
import { openInBrowser } from '../../../shared/utils/url'
import { useBookmarksStore } from '../store'
import { useSettingsStore } from '../../settings/store'
import { BookmarkEditModal } from './BookmarkEditModal'
import type { Bookmark, Folder } from '../../../shared/types'

const IMAGE_ASPECT = 1 / 0.72 // About 1.389:1 (W:H) - fixed regardless of column count

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
    Alert.alert('Delete', `Delete "${bookmark.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
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
        onSave={(name, url, memo) => update(bookmark.id, name, url, memo)}
      />

      <CustomActionSheet
        visible={sheetVisible}
        title={bookmark.name}
        options={[
          { label: 'Edit', onPress: () => setEditVisible(true) },
          ...(allFolders.length > 1
            ? [{ label: 'Move', onPress: () => setMoveSheetVisible(true) }]
            : []),
          { label: 'Delete', destructive: true, onPress: handleDeleteConfirm },
        ]}
        onCancel={() => setSheetVisible(false)}
      />

      <CustomActionSheet
        visible={moveSheetVisible}
        title="Move to folder"
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
  Alert.alert('Move to folder', undefined, [
    ...folders.map((f) => ({ text: f.name, onPress: () => onMove(f.id) })),
    { text: 'Cancel', style: 'cancel' as const },
  ])
}

const makeStyles = (c: Palette) => StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0,
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
    backgroundColor: c.surface,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: c.cardBorder,
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
    color: c.text,
    lineHeight: 16,
  },
  domain: {
    fontSize: 11,
    color: c.textSecondary,
    marginTop: 1,
  },
})
