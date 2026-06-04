import { useState, useCallback, useEffect } from 'react'
import {
  Alert,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  FlatList,
  Linking,
} from 'react-native'
import { Image } from 'expo-image'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useFoldersStore } from '../store'
import { useBookmarksStore } from '../../bookmarks/store'
import { useUnlockStore } from '../unlockStore'
import { Header } from '../../../shared/components/Header'
import { CustomActionSheet } from '../../../shared/components/CustomActionSheet'
import { ProUpgradeModal } from '../../pro/components/ProUpgradeModal'
import { ViewModeToggle } from '../../../shared/components/ViewModeToggle'
import { MoreButton } from '../../../shared/components/MoreButton'
import { PinEntryModal } from '../components/PinEntryModal'
import { FolderEditModal } from '../components/FolderEditModal'
import { SortableFolderGrid } from '../components/SortableFolderGrid'
import { PlaceholderImage } from '../../../shared/components/PlaceholderImage'
import { useThemedStyles, spacing, radius, getDomain, type Palette } from '../../../shared/theme'
import { MOCK_BOOKMARKS } from '../../../shared/mockVisuals'
import { openInBrowser } from '../../../shared/utils/url'
import type { RootStackParamList, Folder, FolderIconId, ViewMode } from '../../../shared/types'
import { useSettingsStore } from '../../settings/store'

const { width: SCREEN_W } = Dimensions.get('window')
const GRID_PADDING = spacing.lg
const GRID_GAP = 10
const FOLDER_COLUMNS = 2
const CARD_W = (SCREEN_W - GRID_PADDING * 2 - GRID_GAP * (FOLDER_COLUMNS - 1)) / FOLDER_COLUMNS

type Nav = NativeStackNavigationProp<RootStackParamList>

export function HomeScreen() {
  const navigation = useNavigation<Nav>()
  const { folders, add, update, remove, reorder } = useFoldersStore()
  const { byFolder, recent } = useBookmarksStore()
  const { styles } = useThemedStyles(makeStyles)
  const recentBookmarks = recent(10)
  const recentItems =
    recentBookmarks.length >= 5
      ? recentBookmarks
      : [
          ...recentBookmarks,
          ...MOCK_BOOKMARKS.map((bookmark, i) => ({ ...bookmark, id: `mock-recent-${i}` })),
        ].slice(0, 5)

  const [editTarget, setEditTarget] = useState<Folder | undefined>(undefined)
  const [modalVisible, setModalVisible] = useState(false)
  const [addSheetVisible, setAddSheetVisible] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [isGridDragging, setIsGridDragging] = useState(false)
  const [proModalVisible, setProModalVisible] = useState(false)

  // コールド起動5回目のレビュー依頼。ホームが表示されて少し経ってから出す。
  useEffect(() => {
    const t = setTimeout(() => {
      void useSettingsStore.getState().recordLaunchForReview()
    }, 1500)
    return () => clearTimeout(t)
  }, [])

  const openFolderAdd = () => {
    const isPremium = useSettingsStore.getState().settings.is_premium
    if (!isPremium && folders.length >= 5) {
      setProModalVisible(true)
      return
    }
    setEditTarget(undefined)
    setModalVisible(true)
  }
  const openAdd = () => {
    setAddSheetVisible(true)
  }
  const openEdit = (folder: Folder) => {
    setEditTarget(folder)
    setModalVisible(true)
  }
  const handleSave = (name: string, iconId: FolderIconId) => {
    if (editTarget) {
      update(editTarget.id, name, iconId)
    } else {
      add(name, iconId)
    }
    setModalVisible(false)
  }

  const renderFolder = useCallback(
    ({ item: folder }: { item: Folder }) => {
      const bookmarks = byFolder(folder.id)
      const firstThumb =
        folder.customThumbnailPath ??
        (bookmarks.find((b) => b.thumbnailPath)?.thumbnailPath ?? null)
      const openFolder = () => navigation.navigate('FolderDetail', { folderId: folder.id })

      return (
        <FolderListRow
          folder={folder}
          count={bookmarks.length}
          firstThumbnail={firstThumb}
          onPress={openFolder}
          onEdit={() => openEdit(folder)}
          onDelete={() => remove(folder.id)}
        />
      )
    },
    [byFolder, navigation, remove],
  )

  const listHeader = (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>フォルダ</Text>
      <ViewModeToggle
        value={viewMode}
        onGridPress={() => setViewMode('grid')}
        onListPress={() => setViewMode('list')}
      />
    </View>
  )

  const listFooter = (
    <View>
      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>最近追加したブックマーク</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AllBookmarks')}>
          <Text style={styles.sectionAction}>すべて見る 〉</Text>
        </TouchableOpacity>
      </View>

      {recentItems.length === 0 ? (
        <Text style={styles.emptyText}>まだブックマークがありません</Text>
      ) : (
        <FlatList
          data={recentItems}
          keyExtractor={(b) => b.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentList}
          renderItem={({ item }) => <RecentItem item={item} />}
          scrollEnabled
        />
      )}

    </View>
  )

  return (
    <View style={styles.container}>
      <Header
        title="ブックマーク"
        showSearch
        onSearch={() => navigation.navigate('Search', {})}
        showAdd
        onAdd={openAdd}
      />

      {viewMode === 'grid' ? (
        <ScrollView
          contentContainerStyle={styles.listContent}
          scrollEnabled={!isGridDragging}
          showsVerticalScrollIndicator={false}
        >
          {listHeader}
          <View style={styles.gridWrapper}>
            {folders.length === 0 ? (
              <FolderEmptyHint />
            ) : (
              <SortableFolderGrid
                folders={folders}
                getBookmarks={byFolder}
                cardWidth={CARD_W}
                gap={GRID_GAP}
                onPressFolder={(folder) =>
                  navigation.navigate('FolderDetail', { folderId: folder.id })
                }
                onEditFolder={openEdit}
                onDeleteFolder={(folder) => remove(folder.id)}
                onReorder={reorder}
                onDragStateChange={setIsGridDragging}
              />
            )}
          </View>
          {listFooter}
        </ScrollView>
      ) : (
        <FlatList
          data={folders}
          keyExtractor={(f) => f.id}
          renderItem={renderFolder}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          ListEmptyComponent={<FolderEmptyHint />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FolderEditModal
        visible={modalVisible}
        folder={editTarget}
        onSave={handleSave}
        onClose={() => setModalVisible(false)}
      />

      <CustomActionSheet
        visible={addSheetVisible}
        options={[
          { label: 'フォルダを追加', onPress: openFolderAdd },
          { label: 'ブックマークを追加', onPress: () => navigation.navigate('AddBookmark', {}) },
        ]}
        onCancel={() => setAddSheetVisible(false)}
      />

      <ProUpgradeModal visible={proModalVisible} onClose={() => setProModalVisible(false)} />
    </View>
  )
}

function FolderEmptyHint() {
  const { styles } = useThemedStyles(makeStyles)
  return (
    <View style={styles.folderEmptyHint}>
      <Text style={styles.folderEmptyIcon}>📁</Text>
      <Text style={styles.folderEmptyTitle}>フォルダがありません</Text>
      <Text style={styles.folderEmptyDesc}>右上の + からフォルダを追加できます</Text>
    </View>
  )
}

function RecentItem({
  item,
}: {
  item: { thumbnailPath: string | null; name: string; url: string }
}) {
  const { settings } = useSettingsStore()
  const { styles } = useThemedStyles(makeStyles)
  const ITEM_W = 72
  const IMAGE_H = 86
  const handlePress = () => {
    Linking.openURL(openInBrowser(item.url, settings.default_browser))
  }

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={handlePress}
      style={[styles.recentCard, { width: ITEM_W }]}
    >
      {item.thumbnailPath ? (
        <Image
          source={{ uri: item.thumbnailPath }}
          style={styles.recentImage}
          contentFit="cover"
        />
      ) : (
        <PlaceholderImage width={ITEM_W} height={IMAGE_H} style={styles.recentImage} />
      )}
      <View style={styles.recentMeta}>
        <Text style={styles.recentName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.recentDomain} numberOfLines={1}>
          {getDomain(item.url)}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

function FolderListRow({
  folder,
  count,
  firstThumbnail,
  onPress,
  onEdit,
  onDelete,
}: {
  folder: Folder
  count: number
  firstThumbnail: string | null
  onPress: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { styles } = useThemedStyles(makeStyles)
  const isUnlocked = useUnlockStore((s) => Boolean(s.unlockedIds[folder.id]))
  const isLocked = Boolean(folder.pinCode) && !isUnlocked

  const [sheetVisible, setSheetVisible] = useState(false)
  const [pinVisible, setPinVisible] = useState(false)

  const handlePress = () => {
    if (isLocked) {
      setPinVisible(true)
    } else {
      onPress()
    }
  }

  const handleDeleteConfirm = () => {
    Alert.alert(
      'フォルダを削除',
      `「${folder.name}」とその中のブックマークをすべて削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: onDelete },
      ],
    )
  }

  return (
    <>
      <Pressable
        onPress={handlePress}
        style={styles.folderRow}
      >
        {isLocked ? (
          <View style={[styles.folderRowImage, styles.folderRowLocked]}>
            <Text style={styles.folderRowLockedIcon}>🔒</Text>
          </View>
        ) : firstThumbnail ? (
          <Image
            source={{ uri: firstThumbnail }}
            style={styles.folderRowImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.folderRowImage, styles.folderRowLocked]} />
        )}
        <View style={styles.folderRowText}>
          <Text style={styles.folderRowName} numberOfLines={1}>
            {folder.name}
          </Text>
          <Text style={styles.folderRowCount}>{count}件</Text>
        </View>
        <MoreButton onPress={() => setSheetVisible(true)} />
      </Pressable>

      <CustomActionSheet
        visible={sheetVisible}
        title={folder.name}
        options={[
          { label: '編集', onPress: onEdit },
          { label: '削除', destructive: true, onPress: handleDeleteConfirm },
        ]}
        onCancel={() => setSheetVisible(false)}
      />

      {pinVisible && folder.pinCode && (
        <PinEntryModal
          mode="unlock"
          correctPin={folder.pinCode}
          onSuccess={() => {
            setPinVisible(false)
            useUnlockStore.getState().unlock(folder.id)
            onPress()
          }}
          onCancel={() => setPinVisible(false)}
        />
      )}
    </>
  )
}

const makeStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  listContent: {
    paddingBottom: 34,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GRID_PADDING,
    paddingTop: 10,
    paddingBottom: 12,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GRID_PADDING,
    paddingTop: 30,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '600',
    color: c.text,
  },
  gridWrapper: {
    paddingHorizontal: GRID_PADDING,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: GRID_PADDING,
    marginBottom: GRID_GAP,
    padding: spacing.sm,
    paddingRight: 16,
    borderRadius: 16,
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.cardBorder,
  },
  folderRowActive: {
    opacity: 0.96,
    zIndex: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  folderRowImage: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    backgroundColor: c.placeholderBg,
  },
  folderRowLocked: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderRowLockedIcon: {
    fontSize: 22,
    color: c.textSecondary,
    opacity: 0.7,
  },
  folderRowText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  folderRowName: {
    fontSize: 15,
    fontWeight: '500',
    color: c.text,
  },
  folderRowCount: {
    fontSize: 13,
    color: c.textSecondary,
    marginTop: 4,
  },
  recentList: {
    paddingHorizontal: GRID_PADDING,
  },
  recentCard: {
    marginRight: 10,
    minHeight: 150,
    borderRadius: 16,
    backgroundColor: c.surface,
    overflow: 'hidden',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  recentImage: {
    width: '100%',
    height: 86,
    backgroundColor: c.placeholderBg,
  },
  recentMeta: {
    minHeight: 64,
    paddingHorizontal: 6,
    paddingTop: 7,
    paddingBottom: 7,
  },
  recentName: {
    fontSize: 11,
    fontWeight: '600',
    color: c.text,
    lineHeight: 15,
  },
  recentDomain: {
    fontSize: 10,
    color: c.textSecondary,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: c.textSecondary,
    paddingHorizontal: GRID_PADDING,
  },
  folderEmptyHint: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 24,
  },
  folderEmptyIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  folderEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
    marginBottom: 8,
  },
  folderEmptyDesc: {
    fontSize: 13,
    color: c.textSecondary,
    textAlign: 'center',
  },
})
