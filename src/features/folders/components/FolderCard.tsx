import { View, Text, TouchableOpacity, StyleSheet, Alert, Pressable } from 'react-native'
import { Image } from 'expo-image'
import type { Folder, Bookmark } from '../../../shared/types'
import { colors, spacing, radius } from '../../../shared/theme'
import { FOLDER_PLACEHOLDER } from '../../../shared/mockVisuals'

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
  const realThumbnails = bookmarks
    .filter((b) => b.thumbnailPath)
    .map((b) => b.thumbnailPath as string)
  const count = realThumbnails.length

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
        <FolderMosaic count={count} realThumbnails={realThumbnails} />
      </View>

      <View style={styles.meta}>
        <View style={styles.metaText}>
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
          <Text style={styles.moreDots}>⋮</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  )
}

function FolderMosaic({
  count,
  realThumbnails,
}: {
  count: number
  realThumbnails: string[]
}) {
  // 0件: ローカルプレースホルダー画像
  if (count === 0) {
    return (
      <Image source={FOLDER_PLACEHOLDER} style={StyleSheet.absoluteFill} contentFit="cover" />
    )
  }

  // 1件: 全面1枚
  if (count === 1) {
    return (
      <Image
        source={{ uri: realThumbnails[0] }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
    )
  }

  // 2件: 全面 + 右下にPIP
  if (count === 2) {
    return (
      <>
        <Image
          source={{ uri: realThumbnails[0] }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        <View style={styles.pipFrame}>
          <Image
            source={{ uri: realThumbnails[1] }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        </View>
      </>
    )
  }

  // 3件以上: 左大1 + 右に小2
  const [main, sub1, sub2] = realThumbnails.slice(0, 3)
  return (
    <View style={styles.threeMosaic}>
      <Image source={{ uri: main }} style={styles.mosaicMain} contentFit="cover" />
      <View style={styles.mosaicSide}>
        <Image source={{ uri: sub1 }} style={styles.mosaicSideImage} contentFit="cover" />
        <View style={styles.mosaicDivider} />
        <Image source={{ uri: sub2 }} style={styles.mosaicSideImage} contentFit="cover" />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    aspectRatio: 1.05,
    backgroundColor: '#fff',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.separator,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
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
    flex: 1,
    backgroundColor: colors.placeholderBg,
    position: 'relative',
  },
  threeMosaic: {
    flex: 1,
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
  },
  mosaicDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  pipFrame: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '42%',
    height: '55%',
    borderTopLeftRadius: radius.sm,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  meta: {
    height: 60,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  metaText: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginTop: 2,
  },
  count: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  moreBtn: {
    alignSelf: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginRight: -2,
  },
  moreDots: {
    fontSize: 22,
    color: '#3C3C3E',
    lineHeight: 22,
    letterSpacing: -2,
  },
})
