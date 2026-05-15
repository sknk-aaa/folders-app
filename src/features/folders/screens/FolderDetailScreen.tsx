import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
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
import { FOLDER_PLACEHOLDER } from '../../../shared/mockVisuals'
import { colors, spacing, radius } from '../../../shared/theme'
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

  if (!folder) return null

  const handleFolderSave = (name: string, iconId: FolderIconId) => {
    updateFolder(folder.id, name, iconId)
    setEditModalVisible(false)
  }

  const mosaicThumbnails = bookmarks
    .filter((b) => b.thumbnailPath)
    .slice(0, 1)
    .map((b) => b.thumbnailPath as string)

  return (
    <View style={styles.container}>
      <Header
        showBack
        onBack={() => navigation.goBack()}
        showSearch
        onSearch={() => navigation.navigate('Search', { folderId: folder.id })}
        showMore
        onMore={() => setEditModalVisible(true)}
        hideBorder
      />

      <BookmarkCollectionList
        bookmarks={bookmarks}
        allFolders={folders}
        viewMode={viewMode}
        onGridPress={() => setViewMode('grid')}
        onListPress={() => setViewMode('list')}
        onDelete={(bookmark) => remove(bookmark.id)}
        onMove={(bookmark, targetFolderId) => move(bookmark.id, targetFolderId)}
        onReorder={(nextBookmarks) => reorder(folderId, nextBookmarks)}
        emptyText="このフォルダにはまだブックマークがありません"
        headerAccessory={
          <FolderHeaderSummary
            folder={folder}
            thumbnail={mosaicThumbnails[0]}
            bookmarkCount={bookmarks.length}
          />
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

function FolderHeaderSummary({
  folder,
  thumbnail,
  bookmarkCount,
}: {
  folder: Folder
  thumbnail: string | undefined
  bookmarkCount: number
}) {
  return (
    <View style={styles.folderSummaryWrap} pointerEvents="none">
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
            {bookmarkCount}件のブックマーク
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  folderSummaryWrap: {
    position: 'absolute',
    top: -30,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: PADDING,
  },
  folderSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 260,
    minWidth: 0,
  },
  folderThumb: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.placeholderBg,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  headerSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 5,
  },
})
