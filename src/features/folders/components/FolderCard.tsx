import { View, Text, TouchableOpacity, StyleSheet, Alert, Pressable } from 'react-native'
import { Image } from 'expo-image'
import type { Folder, Bookmark } from '../../../shared/types'
import { colors, spacing, radius } from '../../../shared/theme'
import { getFolderVisual } from '../../../shared/mockVisuals'

type Props = {
  folder: Folder
  bookmarks: Bookmark[]
  onPress: () => void
  onEdit: () => void
  onDelete: () => void
  drag?: () => void
  isActive?: boolean
  onMorePressIn?: () => void
  onMorePressOut?: () => void
}

export function FolderCard({
  folder,
  bookmarks,
  onPress,
  onEdit,
  onDelete,
  drag,
  isActive,
  onMorePressIn,
  onMorePressOut,
}: Props) {
  const thumbnails = bookmarks
    .filter((b) => b.thumbnailPath)
    .slice(0, 3)
    .map((b) => b.thumbnailPath as string)
  const fallbackImages = getFolderVisual(folder).images
  const images = [...thumbnails, ...fallbackImages].slice(0, 3)

  const handleMore = () => {
    Alert.alert(folder.name, undefined, [
      { text: '編集', onPress: onEdit },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'フォルダを削除',
            `「${folder.name}」とその中のブックマークをすべて削除しますか？`,
            [
              { text: 'キャンセル', style: 'cancel' },
              { text: '削除', style: 'destructive', onPress: onDelete },
            ],
          )
        },
      },
      { text: 'キャンセル', style: 'cancel' },
    ])
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={drag}
      delayLongPress={160}
      style={[styles.card, isActive && styles.cardActive]}
    >
      <View style={styles.mosaic}>
        <Image source={{ uri: images[0] }} style={styles.mosaicMain} contentFit="cover" />
        <View style={styles.mosaicSide}>
          <Image source={{ uri: images[1] }} style={styles.mosaicSideImage} contentFit="cover" />
          <Image source={{ uri: images[2] }} style={styles.mosaicSideImage} contentFit="cover" />
        </View>
        <View style={styles.scrim} />

        <View style={styles.overlay}>
          <View style={styles.overlayText}>
            <Text style={styles.name} numberOfLines={1}>
              {folder.name}
            </Text>
            <Text style={styles.count}>{bookmarks.length}件</Text>
          </View>
          <TouchableOpacity
            onPress={handleMore}
            onPressIn={onMorePressIn}
            onPressOut={onMorePressOut}
            hitSlop={8}
            style={styles.moreBtn}
          >
            <Text style={styles.moreDots}>•••</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  cardActive: {
    opacity: 0.96,
    zIndex: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  mosaic: {
    aspectRatio: 1.34,
    backgroundColor: colors.placeholderBg,
    flexDirection: 'row',
  },
  mosaicMain: {
    flex: 1.55,
    height: '100%',
  },
  mosaicSide: {
    flex: 0.95,
    height: '100%',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.9)',
  },
  mosaicSideImage: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.9)',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  overlay: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  overlayText: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  count: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.92)',
    marginTop: 4,
  },
  moreBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  moreDots: {
    fontSize: 11,
    color: '#fff',
    letterSpacing: 1,
  },
})
