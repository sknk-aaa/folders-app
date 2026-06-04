import type { ReactNode } from 'react'
import { Dimensions, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native'
import { ViewModeToggle } from '../../../shared/components/ViewModeToggle'
import { useThemedStyles, spacing, type Palette } from '../../../shared/theme'
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
  onListPress: () => void
  onDelete: (bookmark: Bookmark) => void
  onMove: (bookmark: Bookmark, folderId: string) => void
  title?: string
  emptyText: string
  headerAccessory?: ReactNode
  onReorder?: (bookmarks: Bookmark[]) => void
  columns?: number
  /** ツールバー上部に追加する余白。フォルダ詳細のヘッダー帯と本文の被りを防ぐ */
  contentTopInset?: number
}

export function BookmarkCollectionList({
  bookmarks,
  allFolders,
  viewMode,
  onGridPress,
  onListPress,
  onDelete,
  onMove,
  title,
  emptyText,
  headerAccessory,
  onReorder,
  columns: columnsProp = 2,
  contentTopInset = 0,
}: Props) {
  const { styles } = useThemedStyles(makeStyles)
  const columns = viewMode === 'grid' ? columnsProp : 1
  const cardW = (SCREEN_W - PADDING * 2 - GAP * (columnsProp - 1)) / columnsProp
  const isDraggable = Boolean(onReorder)
  const listKey = `${viewMode}-${columnsProp}-${isDraggable ? 'draggable' : 'static'}`
  const columnWrapperStyle =
    viewMode === 'grid' && columns > 1 ? styles.columnWrapper : undefined

  const toolbar = (
    <View style={[styles.toolbar, { paddingBottom: 12 + contentTopInset }]}>
      {headerAccessory}
      {title ? (
        <Text style={styles.toolbarTitle} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View />
      )}
      <ViewModeToggle value={viewMode} onGridPress={onGridPress} onListPress={onListPress} />
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

const makeStyles = (c: Palette) => StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PADDING,
    paddingTop: 15,
    paddingBottom: 12,
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
