import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { CustomActionSheet } from '../../../shared/components/CustomActionSheet'
import { PinEntryModal } from './PinEntryModal'
import { useUnlockStore } from '../unlockStore'
import type { Folder, Bookmark } from '../../../shared/types'
import { useThemedStyles, spacing, radius, type Palette } from '../../../shared/theme'
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
  const { styles } = useThemedStyles(makeStyles)
  const realThumbnails = bookmarks
    .filter((b) => b.thumbnailPath)
    .map((b) => b.thumbnailPath as string)
  const count = realThumbnails.length

  const isUnlocked = useUnlockStore((s) => Boolean(s.unlockedIds[folder.id]))
  const isLocked = Boolean(folder.pinCode) && !isUnlocked

  const [sheetVisible, setSheetVisible] = useState(false)
  const [pinVisible, setPinVisible] = useState(false)

  const handleMore = () => setSheetVisible(true)
  const handlePress = () => {
    if (isLocked) {
      setPinVisible(true)
    } else {
      onPress()
    }
  }

  const handleDeleteConfirm = () => {
    Alert.alert(
      'Delete Folder',
      `Delete "${folder.name}" and all bookmarks inside it?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ],
    )
  }

  return (
    <>
    <Pressable
      onPress={handlePress}
      onLongPress={drag}
      delayLongPress={160}
      style={[styles.card, isActive && styles.cardActive]}
    >
      <View style={styles.mosaic}>
        {isLocked ? (
          <LockedThumbnail />
        ) : folder.customThumbnailPath ? (
          <Image
            source={{ uri: folder.customThumbnailPath }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <FolderMosaic count={count} realThumbnails={realThumbnails} />
        )}
      </View>

      <View style={styles.meta}>
        <View style={styles.metaText}>
          <Text style={styles.name} numberOfLines={1}>
            {folder.name}
          </Text>
          <Text style={styles.count}>{bookmarks.length}</Text>
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

    <CustomActionSheet
      visible={sheetVisible}
      title={folder.name}
      options={[
        { label: 'Edit', onPress: onEdit },
        { label: 'Delete', destructive: true, onPress: handleDeleteConfirm },
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

function LockedThumbnail() {
  const { styles } = useThemedStyles(makeStyles)
  return (
    <View style={[StyleSheet.absoluteFill, styles.lockedThumb]}>
      <Text style={styles.lockedThumbIcon}>🔒</Text>
    </View>
  )
}

function FolderMosaic({
  count,
  realThumbnails,
}: {
  count: number
  realThumbnails: string[]
}) {
  const { styles } = useThemedStyles(makeStyles)
  // 0 items: local placeholder image
  if (count === 0) {
    return (
      <Image source={FOLDER_PLACEHOLDER} style={StyleSheet.absoluteFill} contentFit="cover" />
    )
  }

  // 1 item: single full-bleed image
  if (count === 1) {
    return (
      <Image
        source={{ uri: realThumbnails[0] }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
    )
  }

  // 2 items: full-bleed + PIP at bottom right
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

  // 3 or more items: 1 large on the left + 2 small on the right
  const [main, sub1, sub2] = realThumbnails.slice(0, 3)
  return (
    <View style={styles.threeMosaic}>
      <Image source={{ uri: main }} style={styles.mosaicMain} contentFit="cover" />
      <View style={styles.mosaicSide}>
        <Image source={{ uri: sub1 }} style={styles.mosaicSub1} contentFit="cover" />
        <View style={styles.mosaicDivider} />
        <Image source={{ uri: sub2 }} style={styles.mosaicSub2} contentFit="cover" />
      </View>
    </View>
  )
}

const makeStyles = (c: Palette) => {
  // Blend the seams between mosaic images with the card color
  const seam = c.surface
  return StyleSheet.create({
    card: {
      aspectRatio: 1.15,
      backgroundColor: c.surface,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 0,
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
      backgroundColor: c.placeholderBg,
      position: 'relative',
    },
    lockedThumb: {
      backgroundColor: c.placeholderBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    lockedThumbIcon: {
      fontSize: 28,
      color: c.textSecondary,
      opacity: 0.7,
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
      borderLeftColor: seam,
    },
    mosaicSub1: {
      flex: 1.4,
    },
    mosaicSub2: {
      flex: 1,
    },
    mosaicDivider: {
      height: 1,
      backgroundColor: seam,
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
      borderColor: seam,
    },
    meta: {
      height: 50,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
    },
    metaText: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontSize: 14,
      fontWeight: '400',
      color: c.text,
      marginTop: 2,
    },
    count: {
      fontSize: 11,
      color: c.textSecondary,
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
      color: c.textSecondary,
      lineHeight: 22,
      letterSpacing: -2,
    },
  })
}
