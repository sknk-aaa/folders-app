import type { ReactNode } from 'react'
import { Dimensions, FlatList, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Image } from 'expo-image'
import { ViewModeToggle } from '../../../shared/components/ViewModeToggle'
import { PlaceholderImage } from '../../../shared/components/PlaceholderImage'
import { useThemedStyles, spacing, radius, type Palette } from '../../../shared/theme'
import { openInBrowser } from '../../../shared/utils/url'
import { useSettingsStore } from '../../settings/store'
import { useBookmarksStore } from '../store'
import type { Bookmark, Folder, ViewMode } from '../../../shared/types'
import { BookmarkCard } from './BookmarkCard'
import { BookmarkListItem } from './BookmarkListItem'
import { SortableBookmarkGrid } from './SortableBookmarkGrid'

const { width: SCREEN_W } = Dimensions.get('window')
const PADDING = spacing.lg
const GAP = spacing.sm

type Props = {
  bookmarks: Bookmark[]
  allFolders: Folder[]
  viewMode: ViewMode
  onGridPress: () => void
  onPhotoPress: () => void
  onListPress: () => void
  onDelete: (bookmark: Bookmark) => void
  onMove: (bookmark: Bookmark, folderId: string) => void
  title?: string
  emptyText: string
  headerAccessory?: ReactNode
  onReorder?: (bookmarks: Bookmark[]) => void
  columns?: number
  /** ツールバー(タイトル＋表示切替)を非表示にする。フォルダ詳細は独自のヘッダー帯を使う */
  hideToolbar?: boolean
}

export function BookmarkCollectionList({
  bookmarks,
  allFolders,
  viewMode,
  onGridPress,
  onPhotoPress,
  onListPress,
  onDelete,
  onMove,
  title,
  emptyText,
  headerAccessory,
  onReorder,
  columns: columnsProp = 2,
  hideToolbar = false,
}: Props) {
  const { styles } = useThemedStyles(makeStyles)
  const columns = viewMode === 'list' ? 1 : columnsProp
  const cardW = (SCREEN_W - PADDING * 2 - GAP * (columnsProp - 1)) / columnsProp
  const isDraggable = Boolean(onReorder)
  const listKey = `${viewMode}-${columnsProp}-${isDraggable ? 'draggable' : 'static'}`
  const columnWrapperStyle =
    viewMode !== 'list' && columns > 1 ? styles.columnWrapper : undefined

  const toolbar = hideToolbar ? null : (
    <View style={styles.toolbar}>
      {headerAccessory}
      {title ? (
        <Text style={styles.toolbarTitle} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View />
      )}
      <ViewModeToggle
        value={viewMode}
        onGridPress={onGridPress}
        onPhotoPress={onPhotoPress}
        onListPress={onListPress}
      />
    </View>
  )

  const emptyComponent = <Text style={styles.emptyText}>{emptyText}</Text>

  const compact = columnsProp >= 3
  const metaH = compact ? 38 : 64
  if (isDraggable && onReorder && viewMode === 'grid') {
    const cardH = cardW * 0.72 + metaH
    return (
      <ScrollView contentContainerStyle={styles.listContent}>
        {toolbar}
        {bookmarks.length === 0 ? (
          emptyComponent
        ) : (
          <SortableBookmarkGrid
            bookmarks={bookmarks}
            allFolders={allFolders}
            cardWidth={cardW}
            cardHeight={cardH}
            gap={GAP}
            columns={columnsProp}
            compact={compact}
            onDelete={onDelete}
            onMove={onMove}
            onReorder={onReorder}
          />
        )}
      </ScrollView>
    )
  }

  return (
    <>
      {toolbar}
      <FlatList
        key={listKey}
        data={bookmarks}
        keyExtractor={(b) => b.id}
        numColumns={columns}
        columnWrapperStyle={columnWrapperStyle}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={emptyComponent}
        renderItem={({ item }) =>
          renderBookmark({
            item,
            viewMode,
            cardW,
            allFolders,
            onDelete,
            onMove,
            compact,
          })
        }
      />
    </>
  )
}

function renderBookmark({
  item,
  drag,
  isActive,
  viewMode,
  cardW,
  allFolders,
  onDelete,
  onMove,
  compact,
}: {
  item: Bookmark
  drag?: () => void
  isActive?: boolean
  viewMode: ViewMode
  cardW: number
  allFolders: Folder[]
  onDelete: (bookmark: Bookmark) => void
  onMove: (bookmark: Bookmark, folderId: string) => void
  compact?: boolean
}) {
  if (viewMode === 'list') {
    return (
      <BookmarkListItem
        bookmark={item}
        allFolders={allFolders}
        onDelete={() => onDelete(item)}
        onMove={(folderId) => onMove(item, folderId)}
      />
    )
  }

  if (viewMode === 'photo') {
    return <PhotoCard bookmark={item} size={cardW} />
  }

  const card = (
    <View style={{ width: cardW }}>
      <BookmarkCard
        bookmark={item}
        allFolders={allFolders}
        onDelete={() => onDelete(item)}
        onMove={(folderId) => onMove(item, folderId)}
        drag={drag}
        isActive={isActive}
        compact={compact}
      />
    </View>
  )

  return card
}

function PhotoCard({ bookmark, size }: { bookmark: Bookmark; size: number }) {
  const { settings } = useSettingsStore()
  const { markViewed } = useBookmarksStore()
  const { styles } = useThemedStyles(makeStyles)
  const handlePress = () => {
    markViewed(bookmark.id)
    Linking.openURL(openInBrowser(bookmark.url, settings.default_browser))
  }
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      style={[styles.photoCard, { width: size, height: size }]}
    >
      {bookmark.thumbnailPath ? (
        <Image source={{ uri: bookmark.thumbnailPath }} style={styles.photoImg} contentFit="cover" />
      ) : (
        <PlaceholderImage width={size} height={size} style={styles.photoImg} />
      )}
    </TouchableOpacity>
  )
}

const makeStyles = (c: Palette) => StyleSheet.create({
  photoCard: {
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: c.placeholderBg,
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PADDING,
    paddingTop: 15,
    paddingBottom: 20,
  },
  toolbarTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
    flexShrink: 1,
  },
  columnWrapper: {
    gap: GAP,
    marginBottom: GAP,
  },
  listContent: {
    padding: PADDING,
    paddingTop: 0,
  },
  emptyText: {
    fontSize: 14,
    color: c.textSecondary,
    textAlign: 'center',
    marginTop: 48,
  },
})
