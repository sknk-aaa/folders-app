import type { ReactNode } from 'react'
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native'
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist'
import { ViewModeToggle } from '../../../shared/components/ViewModeToggle'
import { colors, spacing } from '../../../shared/theme'
import type { Bookmark, Folder, ViewMode } from '../../../shared/types'
import { BookmarkCard } from './BookmarkCard'
import { BookmarkListItem } from './BookmarkListItem'

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
}: Props) {
  const columns = viewMode === 'grid' ? columnsProp : 1
  const cardW = (SCREEN_W - PADDING * 2 - GAP * (columnsProp - 1)) / columnsProp
  const isDraggable = Boolean(onReorder)
  const listKey = `${viewMode}-${columnsProp}-${isDraggable ? 'draggable' : 'static'}`
  const columnWrapperStyle =
    viewMode === 'grid' && columns > 1 ? styles.columnWrapper : undefined

  const toolbar = (
    <View style={styles.toolbar}>
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

  if (isDraggable && onReorder) {
    return (
      <>
        {toolbar}
        <DraggableFlatList
          key={listKey}
          data={bookmarks}
          keyExtractor={(b) => b.id}
          numColumns={columns}
          onDragEnd={({ data }) => onReorder(data)}
          columnWrapperStyle={columnWrapperStyle}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={emptyComponent}
          renderItem={({ item, drag, isActive }) =>
            renderBookmark({
              item,
              drag,
              isActive,
              viewMode,
              cardW,
              allFolders,
              onDelete,
              onMove,
            })
          }
        />
      </>
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
}: {
  item: Bookmark
  drag?: () => void
  isActive?: boolean
  viewMode: ViewMode
  cardW: number
  allFolders: Folder[]
  onDelete: (bookmark: Bookmark) => void
  onMove: (bookmark: Bookmark, folderId: string) => void
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
      />
    </View>
  )

  return drag ? <ScaleDecorator>{card}</ScaleDecorator> : card
}

const styles = StyleSheet.create({
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
    color: colors.text,
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
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 48,
  },
})
