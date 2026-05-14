import { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native'
import { Image } from 'expo-image'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist'
import { useFoldersStore } from '../store'
import { useBookmarksStore } from '../../bookmarks/store'
import { BookmarkCard } from '../../bookmarks/components/BookmarkCard'
import { BookmarkListItem } from '../../bookmarks/components/BookmarkListItem'
import { FolderEditModal } from '../components/FolderEditModal'
import { colors, spacing, radius } from '../../../shared/theme'
import type { RootStackParamList, Bookmark, FolderIconId, ViewMode } from '../../../shared/types'

const { width: SCREEN_W } = Dimensions.get('window')
const PADDING = spacing.lg
const GAP = spacing.sm

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

  if (!folder) return null

  const cardW = (SCREEN_W - PADDING * 2 - GAP) / 2

  const handleFolderSave = (name: string, iconId: FolderIconId) => {
    updateFolder(folder.id, name, iconId)
    setEditModalVisible(false)
  }

  const mosaicThumbnails = bookmarks
    .filter((b) => b.thumbnailPath)
    .slice(0, 1)
    .map((b) => b.thumbnailPath as string)

  const renderItem = useCallback(
    ({ item, drag, isActive }: { item: Bookmark; drag: () => void; isActive: boolean }) => {
      if (viewMode === 'list') {
        return (
          <BookmarkListItem
            bookmark={item}
            allFolders={folders}
            onDelete={() => remove(item.id)}
            onMove={(fId) => move(item.id, fId)}
          />
        )
      }
      return (
        <ScaleDecorator>
          <View style={{ width: cardW }}>
            <BookmarkCard
              bookmark={item}
              allFolders={folders}
              onDelete={() => remove(item.id)}
              onMove={(fId) => move(item.id, fId)}
              drag={drag}
              isActive={isActive}
            />
          </View>
        </ScaleDecorator>
      )
    },
    [viewMode, cardW, folders, remove, move]
  )

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <FolderDetailHeader
        folder={folder}
        mosaicThumbnail={mosaicThumbnails[0]}
        bookmarkCount={bookmarks.length}
        viewMode={viewMode}
        onBack={() => navigation.goBack()}
        onSearch={() => navigation.navigate('Search', { folderId: folder.id })}
        onMore={() => setEditModalVisible(true)}
        onToggleView={() => setViewMode((v) => (v === 'grid' ? 'list' : 'grid'))}
      />

      <DraggableFlatList
        data={bookmarks}
        keyExtractor={(b) => b.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
        onDragEnd={({ data }) => reorder(folderId, data)}
        renderItem={renderItem}
        columnWrapperStyle={viewMode === 'grid' ? { gap: GAP, marginBottom: GAP } : undefined}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>このフォルダにはまだブックマークがありません</Text>
        }
      />

      <FolderEditModal
        visible={editModalVisible}
        folder={folder}
        onSave={handleFolderSave}
        onClose={() => setEditModalVisible(false)}
      />
    </View>
  )
}

function FolderDetailHeader({
  folder,
  mosaicThumbnail,
  bookmarkCount,
  viewMode,
  onBack,
  onSearch,
  onMore,
  onToggleView,
}: {
  folder: { name: string }
  mosaicThumbnail?: string
  bookmarkCount: number
  viewMode: ViewMode
  onBack: () => void
  onSearch: () => void
  onMore: () => void
  onToggleView: () => void
}) {
  const { useSafeAreaInsets } = require('react-native-safe-area-context')
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        {/* Left: back + thumbnail + title */}
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        {mosaicThumbnail ? (
          <Image
            source={{ uri: mosaicThumbnail }}
            style={styles.folderThumb}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.folderThumb, { backgroundColor: colors.placeholderBg, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 16 }}>📁</Text>
          </View>
        )}
        <View style={styles.titleBlock}>
          <Text style={styles.headerTitle} numberOfLines={1}>{folder.name}</Text>
          <Text style={styles.headerSub}>{bookmarkCount}件のブックマーク</Text>
        </View>

        {/* Right: search + more */}
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={onSearch} hitSlop={8}>
            <Text style={styles.headerIcon}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onMore} hitSlop={8}>
            <Text style={styles.headerMoreDots}>•••</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* View mode toggle */}
      <View style={styles.viewToggleRow}>
        <TouchableOpacity onPress={onToggleView}>
          <Text style={styles.viewIcon}>{viewMode === 'grid' ? '⊞' : '≡'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.headerBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  backBtn: {
    marginRight: 4,
  },
  backArrow: {
    fontSize: 30,
    color: colors.text,
    lineHeight: 30,
    fontWeight: '300',
  },
  folderThumb: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  titleBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  headerSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 18,
  },
  headerMoreDots: {
    fontSize: 9,
    color: colors.text,
    letterSpacing: 1,
  },
  viewToggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
  },
  viewIcon: {
    fontSize: 20,
    color: colors.text,
  },
  listContent: {
    padding: PADDING,
    paddingTop: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 48,
  },
})
