import { useState, useRef } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  Dimensions,
  PanResponder,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useBookmarksStore } from '../store'
import { useFoldersStore } from '../../folders/store'
import { Header } from '../../../shared/components/Header'
import { BookmarkCard } from '../components/BookmarkCard'
import { BookmarkListItem } from '../components/BookmarkListItem'
import { colors, spacing } from '../../../shared/theme'
import type { RootStackParamList, ViewMode, GridColumns } from '../../../shared/types'

const { width: SCREEN_W } = Dimensions.get('window')
const PADDING = spacing.lg
const GAP = spacing.sm

type Nav = NativeStackNavigationProp<RootStackParamList>

export function AllBookmarksScreen() {
  const navigation = useNavigation<Nav>()
  const { bookmarks, remove, move } = useBookmarksStore()
  const { folders } = useFoldersStore()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [columns, setColumns] = useState<GridColumns>(2)

  const sortedBookmarks = [...bookmarks].sort((a, b) => b.createdAt - a.createdAt)
  const cardW = (SCREEN_W - PADDING * 2 - GAP * (columns - 1)) / columns

  return (
    <View style={styles.container}>
      <Header
        title="ブックマーク"
        showSearch
        onSearch={() => navigation.navigate('Search', {})}
        showAdd
        onAdd={() => navigation.navigate('AddBookmark', {})}
      />

      {/* View mode toggle */}
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
          <Text style={styles.toolbarIcon}>{viewMode === 'grid' ? '≡' : '⊞'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        key={`${viewMode}-${columns}`}
        data={sortedBookmarks}
        keyExtractor={(b) => b.id}
        numColumns={viewMode === 'grid' ? columns : 1}
        columnWrapperStyle={viewMode === 'grid' && columns > 1 ? { gap: GAP, marginBottom: GAP } : undefined}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          if (viewMode === 'list') {
            return (
              <BookmarkListItem
                bookmark={item}
                allFolders={folders}
                onDelete={() => remove(item.id)}
                onMove={(fId) => move(item.id, fId)}
                onEdit={() => {}}
              />
            )
          }
          return (
            <View style={{ width: cardW }}>
              <BookmarkCard
                bookmark={item}
                allFolders={folders}
                onDelete={() => remove(item.id)}
                onMove={(fId) => move(item.id, fId)}
                onEdit={() => {}}
              />
            </View>
          )
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>ブックマークがまだありません</Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: PADDING,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  toolbarIcon: {
    fontSize: 22,
    color: colors.text,
  },
  listContent: {
    padding: PADDING,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 48,
  },
})
