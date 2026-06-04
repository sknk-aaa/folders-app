import { useMemo, useState } from 'react'
import { View, StyleSheet } from 'react-native'
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
import { useThemedStyles, type Palette } from '../../../shared/theme'
import type {
  RootStackParamList,
  FolderIconId,
  ViewMode,
} from '../../../shared/types'

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
  const [columns, setColumns] = useState(2)
  const [isSearching, setIsSearching] = useState(false)
  const [query, setQuery] = useState('')
  const { styles } = useThemedStyles(makeStyles)

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
          setColumns(e.scale < 0.85 ? 3 : 2)
        })
        .runOnJS(true),
    [],
  )

  if (!folder) return null

  const handleFolderSave = (name: string, iconId: FolderIconId) => {
    updateFolder(folder.id, name, iconId)
    setEditModalVisible(false)
  }

  return (
    <View style={styles.container}>
      <Header
        title={isSearching ? undefined : folder.name}
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
        hideBorder
      />

      <View style={styles.collectionWrap}>
        <GestureDetector gesture={pinchGesture}>
          <View collapsable={false} style={{ flex: 1 }}>
            <BookmarkCollectionList
              bookmarks={filteredBookmarks}
              allFolders={folders}
              viewMode={viewMode}
              onGridPress={() => setViewMode('grid')}
              onListPress={() => setViewMode('list')}
              onDelete={(bookmark) => remove(bookmark.id)}
              onMove={(bookmark, targetFolderId) => move(bookmark.id, targetFolderId)}
              onReorder={(nextBookmarks) => reorder(folderId, nextBookmarks)}
              emptyText="このフォルダにはまだブックマークがありません"
              columns={columns}
              title={isSearching ? undefined : `${bookmarks.length}件のブックマーク`}
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


const makeStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  collectionWrap: {
    flex: 1,
  },
})
