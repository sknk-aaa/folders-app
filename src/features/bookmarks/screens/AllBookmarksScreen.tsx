import { useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useBookmarksStore } from '../store'
import { useFoldersStore } from '../../folders/store'
import { Header } from '../../../shared/components/Header'
import { BookmarkCollectionList } from '../components/BookmarkCollectionList'
import { colors, spacing } from '../../../shared/theme'
import type { RootStackParamList, ViewMode } from '../../../shared/types'

const PADDING = spacing.lg

type Nav = NativeStackNavigationProp<RootStackParamList>

export function AllBookmarksScreen() {
  const navigation = useNavigation<Nav>()
  const { bookmarks, remove, move } = useBookmarksStore()
  const { folders } = useFoldersStore()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchVisible, setSearchVisible] = useState(false)
  const [query, setQuery] = useState('')
  const searchInputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (searchVisible) {
      requestAnimationFrame(() => searchInputRef.current?.focus())
    }
  }, [searchVisible])

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

  const openSearch = () => {
    setSearchVisible(true)
    requestAnimationFrame(() => searchInputRef.current?.focus())
  }

  const closeSearch = () => {
    setQuery('')
    setSearchVisible(false)
  }

  return (
    <View style={styles.container}>
      <Header
        title="ブックマーク"
        showBack
        onBack={handleBack}
        showSearch
        onSearch={openSearch}
        showAdd
        onAdd={() => navigation.navigate('AddBookmark', {})}
      />

      {searchVisible && (
        <View style={styles.searchBar}>
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="ブックマークを検索"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
          <TouchableOpacity onPress={closeSearch} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>キャンセル</Text>
          </TouchableOpacity>
        </View>
      )}

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
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PADDING,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  searchInput: {
    flex: 1,
    height: 38,
    backgroundColor: colors.placeholderBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.text,
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 15,
    color: colors.accent,
  },
})
