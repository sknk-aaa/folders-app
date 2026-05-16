import { useState, useCallback } from 'react'
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
import DraggableFlatList, { ScaleDecorator, ShadowDecorator } from 'react-native-draggable-flatlist'
import { useFoldersStore } from '../store'
import { useBookmarksStore } from '../../bookmarks/store'
import { Header } from '../../../shared/components/Header'
import { CustomActionSheet } from '../../../shared/components/CustomActionSheet'
import { ViewModeToggle } from '../../../shared/components/ViewModeToggle'
import { MoreButton } from '../../../shared/components/MoreButton'
import { PinEntryModal } from '../components/PinEntryModal'
import { FolderCard } from '../components/FolderCard'
import { FolderEditModal } from '../components/FolderEditModal'
import { SortableFolderGrid } from '../components/SortableFolderGrid'
import { PlaceholderImage } from '../../../shared/components/PlaceholderImage'
import { colors, spacing, radius, getDomain } from '../../../shared/theme'
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

  const openFolderAdd = () => {
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
    ({ item: folder, drag, isActive }: { item: Folder; drag: () => void; isActive: boolean }) => {
      const bookmarks = byFolder(folder.id)
      const openFolder = () => navigation.navigate('FolderDetail', { folderId: folder.id })

      return (
        <ShadowDecorator opacity={0.3} radius={14}>
          <ScaleDecorator activeScale={1.03}>
            <FolderListRow
              folder={folder}
              count={bookmarks.length}
              onPress={openFolder}
              onEdit={() => openEdit(folder)}
              onDelete={() => remove(folder.id)}
              drag={drag}
              isActive={isActive}
            />
          </ScaleDecorator>
        </ShadowDecorator>
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
          </View>
          {listFooter}
        </ScrollView>
      ) : (
        <DraggableFlatList
          data={folders}
          keyExtractor={(f) => f.id}
          onDragEnd={({ data }) => reorder(data)}
          renderItem={renderFolder}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          contentContainerStyle={styles.listContent}
          activationDistance={0}
          autoscrollThreshold={80}
          autoscrollSpeed={180}
          dragItemOverflow
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
    </View>
  )
}

function RecentItem({
  item,
}: {
  item: { thumbnailPath: string | null; name: string; url: string }
}) {
  const { settings } = useSettingsStore()
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
  onPress,
  onEdit,
  onDelete,
  drag,
  isActive,
}: {
  folder: Folder
  count: number
  onPress: () => void
  onEdit: () => void
  onDelete: () => void
  drag: () => void
  isActive: boolean
}) {
  const visual = MOCK_BOOKMARKS[folder.sortOrder % MOCK_BOOKMARKS.length]

  const [sheetVisible, setSheetVisible] = useState(false)
  const [pinVisible, setPinVisible] = useState(false)

  const handlePress = () => {
    if (folder.pinCode) {
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
        onLongPress={drag}
        delayLongPress={160}
        style={[styles.folderRow, isActive && styles.folderRowActive]}
      >
        <Image
          source={{ uri: visual.thumbnailPath }}
          style={styles.folderRowImage}
          contentFit="cover"
        />
        <View style={styles.folderRowText}>
          <Text style={styles.folderRowName} numberOfLines={1}>
            {folder.name}
          </Text>
          <Text style={styles.folderRowCount}>{count}件</Text>
        </View>
        {folder.pinCode && <Text style={styles.folderRowLock}>🔒</Text>}
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
          onSuccess={() => { setPinVisible(false); onPress() }}
          onCancel={() => setPinVisible(false)}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: {
    paddingBottom: 34,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GRID_PADDING,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
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
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.cardBorder,
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
    backgroundColor: colors.placeholderBg,
  },
  folderRowLock: {
    fontSize: 14,
    marginRight: 4,
  },
  folderRowText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  folderRowName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  folderRowCount: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  recentList: {
    paddingHorizontal: GRID_PADDING,
  },
  recentCard: {
    marginRight: 10,
    minHeight: 150,
    borderRadius: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.cardBorder,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  recentImage: {
    width: '100%',
    height: 86,
    backgroundColor: colors.placeholderBg,
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
    color: colors.text,
    lineHeight: 15,
  },
  recentDomain: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: GRID_PADDING,
  },
})
