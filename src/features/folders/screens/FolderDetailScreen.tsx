import { useMemo, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useNavigation, useRoute } from '@react-navigation/native'
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack'
import { useFoldersStore } from '../store'
import { useBookmarksStore } from '../../bookmarks/store'
import { BookmarkCollectionList } from '../../bookmarks/components/BookmarkCollectionList'
import { FolderEditModal } from '../components/FolderEditModal'
import { Header } from '../../../shared/components/Header'
import { InlineSearchBar } from '../../../shared/components/InlineSearchBar'
import { ViewModeToggle } from '../../../shared/components/ViewModeToggle'
import { FOLDER_PLACEHOLDER } from '../../../shared/mockVisuals'
import { useThemedStyles, spacing, radius, type Palette } from '../../../shared/theme'
import { tr } from '../../../shared/i18n'
import type {
  RootStackParamList,
  Folder,
  FolderIconId,
  ViewMode,
} from '../../../shared/types'

const PADDING = spacing.lg

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = NativeStackScreenProps<RootStackParamList, 'FolderDetail'>['route']

export function FolderDetailScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { folderId } = route.params

  const folder = useFoldersStore((s) => s.folders.find((f) => f.id === folderId))
  const { update: updateFolder } = useFoldersStore()
  const folders = useFoldersStore((s) => s.folders)
  const { byFolder, reorder, remove, move } = useBookmarksStore()
  const bookmarks = folder ? byFolder(folder.id) : []

  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [dense, setDense] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [query, setQuery] = useState('')
  const { styles } = useThemedStyles(makeStyles)
  const columns = viewMode === 'photo' ? (dense ? 4 : 3) : dense ? 3 : 2

  const filteredBookmarks = useMemo(() => {
    if (!isSearching || !query.trim()) return bookmarks
    const q = query.toLowerCase()
    return bookmarks.filter(
      (b) => b.name.toLowerCase().includes(q) || b.url.toLowerCase().includes(q),
    )
  }, [bookmarks, isSearching, query])

  const handleSearchOpen = () => setIsSearching(true)
  const handleSearchClose = () => {
    setIsSearching(false)
    setQuery('')
  }

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onEnd((e) => {
          setDense(e.scale < 0.85)
        })
        .runOnJS(true),
    [],
  )

  if (!folder) return null

  const handleFolderSave = (name: string, iconId: FolderIconId) => {
    updateFolder(folder.id, name, iconId)
    setEditModalVisible(false)
  }

  const mosaicThumbnails = bookmarks
    .filter((b) => b.thumbnailPath)
    .slice(0, 1)
    .map((b) => b.thumbnailPath as string)
  const headerThumbnail = folder.customThumbnailPath ?? mosaicThumbnails[0]

  return (
    <View style={styles.container}>
      <Header
        title={isSearching ? undefined : tr({ en: 'Bookmarks', ja: 'ブックマーク' })}
        showBack
        onBack={isSearching ? handleSearchClose : () => navigation.goBack()}
        showSearch={!isSearching}
        onSearch={handleSearchOpen}
        showMore={!isSearching}
        onMore={() => setEditModalVisible(true)}
        contentSlot={
          isSearching ? (
            <InlineSearchBar query={query} onChangeText={setQuery} onCancel={handleSearchClose} />
          ) : undefined
        }
      />

      {!isSearching && (
        <View style={styles.folderBand}>
          <FolderHeaderSummary
            folder={folder}
            thumbnail={headerThumbnail}
            bookmarkCount={bookmarks.length}
          />
          <ViewModeToggle
            value={viewMode}
            onGridPress={() => setViewMode('grid')}
            onPhotoPress={() => setViewMode('photo')}
            onListPress={() => setViewMode('list')}
          />
        </View>
      )}

      <View style={styles.collectionWrap}>
        <GestureDetector gesture={pinchGesture}>
          <View collapsable={false} style={{ flex: 1 }}>
            <BookmarkCollectionList
              bookmarks={filteredBookmarks}
              allFolders={folders}
              viewMode={viewMode}
              onGridPress={() => setViewMode('grid')}
              onPhotoPress={() => setViewMode('photo')}
              onListPress={() => setViewMode('list')}
              onDelete={(bookmark) => remove(bookmark.id)}
              onMove={(bookmark, targetFolderId) => move(bookmark.id, targetFolderId)}
              onReorder={(nextBookmarks) => reorder(folderId, nextBookmarks)}
              emptyText={tr({ en: 'No bookmarks in this folder yet', ja: 'このフォルダにはまだブックマークがありません' })}
              columns={columns}
              hideToolbar={!isSearching}
            />
          </View>
        </GestureDetector>
      </View>

      <FolderEditModal
        visible={editModalVisible}
        folder={folder}
        onSave={handleFolderSave}
        onClose={() => setEditModalVisible(false)}
        bookmarks={bookmarks}
        onDeleteBookmarks={(ids) => ids.forEach((id) => remove(id))}
      />
    </View>
  )
}


function FolderHeaderSummary({
  folder,
  thumbnail,
  bookmarkCount,
}: {
  folder: Folder
  thumbnail: string | undefined
  bookmarkCount: number
}) {
  const { styles } = useThemedStyles(makeStyles)
  return (
    <View style={styles.folderSummary}>
      <Image
        source={thumbnail ? { uri: thumbnail } : FOLDER_PLACEHOLDER}
        style={styles.folderThumb}
        contentFit="cover"
      />
      <View style={styles.titleBlock}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {folder.name}
        </Text>
        <Text style={styles.headerSub} numberOfLines={1}>
          {tr({ en: `${bookmarkCount} bookmarks`, ja: `${bookmarkCount}件のブックマーク` })}
        </Text>
      </View>
    </View>
  )
}

const makeStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  collectionWrap: {
    flex: 1,
  },
  folderBand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: c.headerBg,
    paddingHorizontal: PADDING,
    paddingTop: 12,
    paddingBottom: 20,
  },
  folderSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  folderThumb: {
    width: 60,
    height: 52,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: c.placeholderBg,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: c.text,
  },
  headerSub: {
    fontSize: 13,
    color: c.textSecondary,
    marginTop: 5,
  },
})
