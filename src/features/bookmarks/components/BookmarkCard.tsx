import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions, Linking } from 'react-native'
import { Image } from 'expo-image'
import { PlaceholderImage } from '../../../shared/components/PlaceholderImage'
import { colors, spacing, radius, getFaviconColor, getFaviconLetter, getDomain } from '../../../shared/theme'
import { openInBrowser } from '../../../shared/utils/url'
import { useBookmarksStore } from '../store'
import { useSettingsStore } from '../../settings/store'
import { BookmarkEditModal } from './BookmarkEditModal'
import type { Bookmark, Folder } from '../../../shared/types'

const { width: SCREEN_W } = Dimensions.get('window')
const CARD_W = (SCREEN_W - spacing.lg * 2 - spacing.sm) / 2

type Props = {
  bookmark: Bookmark
  allFolders: Folder[]
  onDelete: () => void
  onMove: (folderId: string) => void
  drag?: () => void
  isActive?: boolean
}

export function BookmarkCard({ bookmark, allFolders, onDelete, onMove, drag, isActive }: Props) {
  const imageH = CARD_W * 0.72
  const { update } = useBookmarksStore()
  const { settings } = useSettingsStore()
  const [editVisible, setEditVisible] = useState(false)

  const handlePress = () => {
    const target = openInBrowser(bookmark.url, settings.default_browser)
    Linking.openURL(target)
  }

  const handleMore = () => {
    Alert.alert(bookmark.name, undefined, [
      { text: '編集', onPress: () => setEditVisible(true) },
      ...(allFolders.length > 1
        ? [{ text: '移動', onPress: () => showMoveSheet(allFolders, onMove) }]
        : []),
      {
        text: '削除',
        style: 'destructive' as const,
        onPress: () => {
          Alert.alert('削除', `「${bookmark.name}」を削除しますか？`, [
            { text: 'キャンセル', style: 'cancel' },
            { text: '削除', style: 'destructive', onPress: onDelete },
          ])
        },
      },
      { text: 'キャンセル', style: 'cancel' },
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
            style={[styles.image, { height: imageH }]}
            contentFit="cover"
          />
        ) : (
          <PlaceholderImage width={CARD_W} height={imageH} style={styles.image} />
        )}

        {/* Meta row */}
        <View style={styles.meta}>
          <View style={styles.metaLeft}>
            <FaviconCircle url={bookmark.url} />
            <View style={styles.textBlock}>
              <Text style={styles.name} numberOfLines={2}>{bookmark.name}</Text>
              <Text style={styles.domain} numberOfLines={1}>{getDomain(bookmark.url)}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleMore} hitSlop={8} style={styles.moreBtn}>
            <Text style={styles.moreDots}>•••</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <BookmarkEditModal
        bookmark={editVisible ? bookmark : null}
        onClose={() => setEditVisible(false)}
        onSave={(name, url) => update(bookmark.id, name, url)}
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
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.separator,
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
    overflow: 'hidden',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 82,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
    backgroundColor: '#fff',
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
  moreBtn: {
    alignSelf: 'center',
    paddingHorizontal: 4,
    paddingVertical: 10,
    marginRight: -2,
  },
  moreDots: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1,
    lineHeight: 12,
  },
})
