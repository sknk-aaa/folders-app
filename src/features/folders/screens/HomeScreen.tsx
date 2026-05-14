import { useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native'
import { Image } from 'expo-image'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist'
import { useFoldersStore } from '../store'
import { useBookmarksStore } from '../../bookmarks/store'
import { Header } from '../../../shared/components/Header'
import { FolderCard } from '../components/FolderCard'
import { FolderEditModal } from '../components/FolderEditModal'
import { PlaceholderImage } from '../../../shared/components/PlaceholderImage'
import { colors, spacing, radius, getDomain } from '../../../shared/theme'
import type { RootStackParamList, Folder, FolderIconId } from '../../../shared/types'

const { width: SCREEN_W } = Dimensions.get('window')
const GRID_PADDING = spacing.lg
const GRID_GAP = spacing.sm
const CARD_W = (SCREEN_W - GRID_PADDING * 2 - GRID_GAP) / 2

type Nav = NativeStackNavigationProp<RootStackParamList>

export function HomeScreen() {
  const navigation = useNavigation<Nav>()
  const { folders, add, update, remove, reorder } = useFoldersStore()
  const { byFolder, recent, total } = useBookmarksStore()
  const recentBookmarks = recent(10)

  const [editTarget, setEditTarget] = useState<Folder | undefined>(undefined)
  const [modalVisible, setModalVisible] = useState(false)

  const openAdd = () => {
    setEditTarget(undefined)
    setModalVisible(true)
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
      return (
        <ScaleDecorator>
          <View style={{ width: CARD_W }}>
            <FolderCard
              folder={folder}
              bookmarks={bookmarks}
              onPress={() => navigation.navigate('FolderDetail', { folderId: folder.id })}
              onEdit={() => openEdit(folder)}
              onDelete={() => remove(folder.id)}
              drag={drag}
              isActive={isActive}
            />
          </View>
        </ScaleDecorator>
      )
    },
    [byFolder, navigation, remove]
  )

  return (
    <View style={styles.container}>
      <Header
        title="ブックマーク"
        showAdd
        onAdd={() => navigation.navigate('AddBookmark', {})}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Folder section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>フォルダ</Text>
          <TouchableOpacity onPress={openAdd}>
            <Text style={styles.sectionAction}>＋ 追加</Text>
          </TouchableOpacity>
        </View>

        {/* Folder grid (draggable) */}
        <View style={styles.gridWrapper}>
          <DraggableFlatList
            data={folders}
            keyExtractor={(f) => f.id}
            numColumns={2}
            onDragEnd={({ data }) => reorder(data)}
            renderItem={renderFolder}
            scrollEnabled={false}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.gridContent}
          />
        </View>

        {/* Recent bookmarks */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>最近追加したブックマーク</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AllBookmarks')}>
            <Text style={styles.sectionAction}>すべて見る</Text>
          </TouchableOpacity>
        </View>

        {recentBookmarks.length === 0 ? (
          <Text style={styles.emptyText}>まだブックマークがありません</Text>
        ) : (
          <FlatList
            data={recentBookmarks}
            keyExtractor={(b) => b.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentList}
            renderItem={({ item }) => <RecentItem item={item} />}
            scrollEnabled
          />
        )}

        {/* Bottom space for ad banner */}
        <View style={styles.adPlaceholder}>
          <Text style={styles.adText}>広告エリア（Phase 3で実装）</Text>
        </View>
      </ScrollView>

      <FolderEditModal
        visible={modalVisible}
        folder={editTarget}
        onSave={handleSave}
        onClose={() => setModalVisible(false)}
      />
    </View>
  )
}

function RecentItem({ item }: { item: { thumbnailPath: string | null; name: string; url: string } }) {
  const ITEM_W = 120
  return (
    <TouchableOpacity style={{ width: ITEM_W, marginRight: spacing.sm }}>
      {item.thumbnailPath ? (
        <Image
          source={{ uri: item.thumbnailPath }}
          style={{ width: ITEM_W, height: ITEM_W, borderRadius: radius.sm }}
          contentFit="cover"
        />
      ) : (
        <PlaceholderImage width={ITEM_W} height={ITEM_W} style={{ borderRadius: radius.sm }} />
      )}
      <Text style={styles.recentName} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.recentDomain} numberOfLines={1}>{getDomain(item.url)}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GRID_PADDING,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  sectionAction: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  gridWrapper: {
    paddingHorizontal: GRID_PADDING,
  },
  columnWrapper: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  gridContent: {
    gap: GRID_GAP,
  },
  recentList: {
    paddingHorizontal: GRID_PADDING,
  },
  recentName: {
    fontSize: 12,
    color: colors.text,
    marginTop: 4,
    lineHeight: 16,
  },
  recentDomain: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: GRID_PADDING,
  },
  adPlaceholder: {
    marginHorizontal: GRID_PADDING,
    marginTop: spacing.xl,
    height: 50,
    backgroundColor: colors.placeholderBg,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
})
