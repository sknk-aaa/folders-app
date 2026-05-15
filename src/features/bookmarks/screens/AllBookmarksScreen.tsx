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
import { colors } from '../../../shared/theme'
import type { RootStackParamList, ViewMode } from '../../../shared/types'


type Nav = NativeStackNavigationProp<RootStackParamList>

export function AllBookmarksScreen() {
  const navigation = useNavigation<Nav>()
  const { bookmarks, remove, move } = useBookmarksStore()
  const { folders } = useFoldersStore()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [columns, setColumns] = useState(2)
  const [searchVisible, setSearchVisible] = useState(false)
  const [query, setQuery] = useState('')

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onEnd((e) => {
          setColumns(e.scale < 0.85 ? 3 : 2)
        })
        .runOnJS(true),
    [],
  )

  const sortedBookmarks = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? bookmarks.filter((b) => b.name.toLowerCase().includes(q) || b.url.toLowerCase().includes(q))
      : bookmarks

    return [...filtered].sort((a, b) => b.createdAt - a.createdAt)
  }, [bookmarks, query])

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
        title={searchVisible ? undefined : 'ブックマーク'}
        showBack
        onBack={searchVisible ? closeSearch : handleBack}
        showSearch={!searchVisible}
        onSearch={openSearch}
        showAdd={!searchVisible}
        onAdd={() => navigation.navigate('AddBookmark', {})}
        contentSlot={
          searchVisible ? (
            <InlineSearchBar
              query={query}
              onChangeText={setQuery}
              onCancel={closeSearch}
              placeholder="ブックマークを検索"
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
            onListPress={() => setViewMode('list')}
            onDelete={(bookmark) => remove(bookmark.id)}
            onMove={(bookmark, folderId) => move(bookmark.id, folderId)}
            title="すべてのブックマーク"
            emptyText={query.trim() ? '検索結果がありません' : 'ブックマークがまだありません'}
            columns={columns}
          />
        </View>
      </GestureDetector>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
})
