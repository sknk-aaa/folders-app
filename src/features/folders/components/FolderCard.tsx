import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { Image } from 'expo-image'
import type { Folder, Bookmark } from '../../../shared/types'
import { colors, spacing, radius } from '../../../shared/theme'

type Props = {
  folder: Folder
  bookmarks: Bookmark[]
  onPress: () => void
  onEdit: () => void
  onDelete: () => void
  drag?: () => void
  isActive?: boolean
}

export function FolderCard({ folder, bookmarks, onPress, onEdit, onDelete, drag, isActive }: Props) {
  const thumbnails = bookmarks
    .filter((b) => b.thumbnailPath)
    .slice(0, 4)
    .map((b) => b.thumbnailPath as string)

  const handleMore = () => {
    Alert.alert(folder.name, undefined, [
      { text: '編集', onPress: onEdit },
      { text: '削除', style: 'destructive', onPress: () => {
        Alert.alert('フォルダを削除', `「${folder.name}」とその中のブックマークをすべて削除しますか？`, [
          { text: 'キャンセル', style: 'cancel' },
          { text: '削除', style: 'destructive', onPress: onDelete },
        ])
      }},
      { text: 'キャンセル', style: 'cancel' },
    ])
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={drag}
      activeOpacity={isActive ? 1 : 0.85}
      style={[styles.card, isActive && styles.cardActive]}
    >
      {/* Mosaic */}
      <View style={styles.mosaic}>
        {thumbnails.length === 0 ? (
          <View style={styles.emptyMosaic}>
            <Text style={styles.emptyIcon}>📁</Text>
          </View>
        ) : thumbnails.length === 1 ? (
          <Image source={{ uri: thumbnails[0] }} style={styles.mosaicFull} contentFit="cover" />
        ) : (
          <View style={styles.mosaicGrid}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.mosaicCell}>
                {thumbnails[i] ? (
                  <Image source={{ uri: thumbnails[i] }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.placeholderBg }]} />
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerText}>
          <Text style={styles.name} numberOfLines={1}>{folder.name}</Text>
          <Text style={styles.count}>{bookmarks.length}件</Text>
        </View>
        <TouchableOpacity onPress={handleMore} hitSlop={8} style={styles.moreBtn}>
          <Text style={styles.moreDots}>•••</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
  cardActive: {
    opacity: 0.85,
    transform: [{ scale: 1.02 }],
  },
  mosaic: {
    aspectRatio: 1,
    backgroundColor: colors.placeholderBg,
  },
  emptyMosaic: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 36,
    opacity: 0.5,
  },
  mosaicFull: {
    width: '100%',
    height: '100%',
  },
  mosaicGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mosaicCell: {
    width: '50%',
    height: '50%',
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  footerText: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  count: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  moreBtn: {
    padding: 4,
  },
  moreDots: {
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
})
