import { useMemo, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useBookmarksStore } from '../store'
import { useFoldersStore } from '../../folders/store'
import { Header } from '../../../shared/components/Header'
import { InlineSearchBar } from '../../../shared/components/InlineSearchBar'
import { BookmarkCollectionList } from '../components/BookmarkCollectionList'
import { FolderEditModal } from '../../folders/components/FolderEditModal'
import { useThemedStyles, type Palette } from '../../../shared/theme'
import type { RootStackParamList, ViewMode } from '../../../shared/types'


type Nav = NativeStackNavigationProp<RootStackParamList>

export function AllBookmarksScreen() {
  const navigation = useNavigation<Nav>()
  const bookmarks = useBookmarksStore((s) => s.bookmarks)
  const { remove, move, publicBookmarks } = useBookmarksStore()
  const { folders } = useFoldersStore()
  const { styles } = useThemedStyles(makeStyles)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [dense, setDense] = useState(false)
  const columns = viewMode === 'photo' ? (dense ? 4 : 3) : dense ? 3 : 2
  const [searchVisible, setSearchVisible] = useState(false)
  const [query, setQuery] = useState('')
  const [manageModalVisible, setManageModalVisible] = useState(false)

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onEnd((e) => {
          setDense(e.scale < 0.85)
        })
        .runOnJS(true),
    [],
  )

  const visibleBookmarks = useMemo(() => publicBookmarks(), [bookmarks, folders, publicBookmarks])

  const sortedBookmarks = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? visibleBookmarks.filter((b) => b.name.toLowerCase().includes(q) || b.url.toLowerCase().includes(q))
      : visibleBookmarks

    return [...filtered].sort((a, b) => b.createdAt - a.createdAt)
  }, [visibleBookmarks, query])

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }

  const openSearch = () => setSearchVisible(true)
  const closeSearch = () => {
    setQuery('')
    setSearchVisible(false)
  }

  return (
    <View style={styles.container}>
      <Header
        title={searchVisible ? undefined : 'Bookmarks'}
        showBack
        onBack={searchVisible ? closeSearch : handleBack}
        showSearch={!searchVisible}
        onSearch={openSearch}
        showMore={!searchVisible}
        onMore={() => setManageModalVisible(true)}
        contentSlot={
          searchVisible ? (
            <InlineSearchBar
              query={query}
              onChangeText={setQuery}
              onCancel={closeSearch}
              placeholder="Search bookmarks"
            />
          ) : undefined
        }
      />

      <GestureDetector gesture={pinchGesture}>
        <View collapsable={false} style={{ flex: 1 }}>
          <BookmarkCollectionList
            bookmarks={sortedBookmarks}
            allFolders={folders}
            viewMode={viewMode}
            onGridPress={() => setViewMode('grid')}
            onPhotoPress={() => setViewMode('photo')}
            onListPress={() => setViewMode('list')}
            onDelete={(bookmark) => remove(bookmark.id)}
            onMove={(bookmark, folderId) => move(bookmark.id, folderId)}
            title="All Bookmarks"
            emptyText={query.trim() ? 'No results found' : 'No bookmarks yet'}
            columns={columns}
          />
        </View>
      </GestureDetector>

      <FolderEditModal
        visible={manageModalVisible}
        onClose={() => setManageModalVisible(false)}
        bookmarks={visibleBookmarks}
        onDeleteBookmarks={(ids) => ids.forEach((id) => remove(id))}
        manageOnly
      />
    </View>
  )
}

const makeStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
})
