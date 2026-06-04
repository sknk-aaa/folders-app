import { useState, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import { useBookmarksStore } from '../store'
import { useFoldersStore } from '../../folders/store'
import { BookmarkCard } from '../components/BookmarkCard'
import { useThemedStyles, spacing, type Palette } from '../../../shared/theme'
import type { RootStackParamList } from '../../../shared/types'

const { width: SCREEN_W } = Dimensions.get('window')
const PADDING = spacing.lg
const GAP = spacing.sm
const CARD_W = (SCREEN_W - PADDING * 2 - GAP) / 2

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = NativeStackScreenProps<RootStackParamList, 'Search'>['route']

export function SearchScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const folderId = route.params?.folderId
  const insets = useSafeAreaInsets()

  const bookmarks = useBookmarksStore((s) => s.bookmarks)
  const { remove, move, publicBookmarks } = useBookmarksStore()
  const { folders } = useFoldersStore()
  const { c, styles } = useThemedStyles(makeStyles)
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const pool = folderId
      ? bookmarks.filter((b) => b.folderId === folderId)
      : publicBookmarks()
    if (!query.trim()) return pool
    const q = query.toLowerCase()
    return pool.filter(
      (b) => b.name.toLowerCase().includes(q) || b.url.toLowerCase().includes(q)
    )
  }, [query, bookmarks, folders, folderId, publicBookmarks])

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search..."
          placeholderTextColor={c.textTertiary}
          autoFocus
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={results}
        keyExtractor={(b) => b.id}
        numColumns={2}
        columnWrapperStyle={{ gap: GAP, marginBottom: GAP }}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={{ width: CARD_W }}>
            <BookmarkCard
              bookmark={item}
              allFolders={folders}
              onDelete={() => remove(item.id)}
              onMove={(fId) => move(item.id, fId)}
            />
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {query ? 'No results found' : 'Enter a keyword'}
          </Text>
        }
      />
    </View>
  )
}

const makeStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PADDING,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.separator,
  },
  input: {
    flex: 1,
    height: 38,
    backgroundColor: c.placeholderBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: c.text,
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 15,
    color: c.accent,
  },
  listContent: {
    padding: PADDING,
  },
  emptyText: {
    fontSize: 14,
    color: c.textSecondary,
    textAlign: 'center',
    marginTop: 48,
  },
})
