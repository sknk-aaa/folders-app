import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'
import type { Bookmark, Folder } from '../../../shared/types'
import { FolderCard } from './FolderCard'

type Props = {
  folders: Folder[]
  getBookmarks: (folderId: string) => Bookmark[]
  cardWidth: number
  gap: number
  onPressFolder: (folder: Folder) => void
  onEditFolder: (folder: Folder) => void
  onDeleteFolder: (folder: Folder) => void
  onReorder: (folders: Folder[]) => void
  onDragStateChange?: (dragging: boolean) => void
}

type DragOrigin = {
  x: number
  y: number
}

const CARD_ASPECT_RATIO = 1.34
const COLUMNS = 2
const LONG_PRESS_MS = 180

export function SortableFolderGrid({
  folders,
  getBookmarks,
  cardWidth,
  gap,
  onPressFolder,
  onEditFolder,
  onDeleteFolder,
  onReorder,
  onDragStateChange,
}: Props) {
  const cardHeight = cardWidth / CARD_ASPECT_RATIO
  const rowHeight = cardHeight + gap
  const columnWidth = cardWidth + gap

  const [orderedFolders, setOrderedFolders] = useState(folders)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [dragOrigin, setDragOrigin] = useState<DragOrigin | null>(null)

  const orderedRef = useRef(folders)
  const activeIdRef = useRef<string | null>(null)
  const originRef = useRef<DragOrigin | null>(null)
  const blockedDragIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (activeIdRef.current) return
    orderedRef.current = folders
    setOrderedFolders(folders)
  }, [folders])

  const getPosition = useCallback(
    (index: number) => ({
      x: (index % COLUMNS) * columnWidth,
      y: Math.floor(index / COLUMNS) * rowHeight,
    }),
    [columnWidth, rowHeight],
  )

  const moveActiveFolder = useCallback(
    (targetIndex: number) => {
      const id = activeIdRef.current
      if (!id) return

      const current = orderedRef.current
      const currentIndex = current.findIndex((folder) => folder.id === id)
      if (currentIndex < 0 || targetIndex === currentIndex) return

      const next = [...current]
      const [activeFolder] = next.splice(currentIndex, 1)
      next.splice(targetIndex, 0, activeFolder)
      orderedRef.current = next
      setOrderedFolders(next)
    },
    [],
  )

  const updateTargetIndex = useCallback(
    (translationX: number, translationY: number) => {
      const origin = originRef.current
      if (!origin) return

      const rows = Math.max(1, Math.ceil(orderedRef.current.length / COLUMNS))
      const centerX = origin.x + cardWidth / 2 + translationX
      const centerY = origin.y + cardHeight / 2 + translationY
      const col = clamp(Math.round((centerX - cardWidth / 2) / columnWidth), 0, COLUMNS - 1)
      const row = clamp(Math.round((centerY - cardHeight / 2) / rowHeight), 0, rows - 1)
      const targetIndex = Math.min(row * COLUMNS + col, orderedRef.current.length - 1)

      moveActiveFolder(targetIndex)
    },
    [cardHeight, cardWidth, columnWidth, moveActiveFolder, rowHeight],
  )

  const beginDrag = useCallback(
    (folderId: string) => {
      if (blockedDragIdRef.current === folderId) return

      const index = orderedRef.current.findIndex((folder) => folder.id === folderId)
      if (index < 0) return

      const origin = getPosition(index)
      activeIdRef.current = folderId
      originRef.current = origin
      setActiveId(folderId)
      setDragOrigin(origin)
      setDragOffset({ x: 0, y: 0 })
      onDragStateChange?.(true)
    },
    [getPosition, onDragStateChange],
  )

  const setDragBlocked = useCallback((folderId: string, blocked: boolean) => {
    if (blocked) {
      blockedDragIdRef.current = folderId
      return
    }

    if (blockedDragIdRef.current === folderId) {
      blockedDragIdRef.current = null
    }
  }, [])

  const moveDrag = useCallback(
    (folderId: string, translationX: number, translationY: number) => {
      if (activeIdRef.current !== folderId) return
      setDragOffset({ x: translationX, y: translationY })
      updateTargetIndex(translationX, translationY)
    },
    [updateTargetIndex],
  )

  const endDrag = useCallback(
    (folderId: string) => {
      if (activeIdRef.current !== folderId) return

      const next = orderedRef.current
      const changed = next.some((folder, index) => folder.id !== folders[index]?.id)
      activeIdRef.current = null
      originRef.current = null
      setActiveId(null)
      setDragOrigin(null)
      setDragOffset({ x: 0, y: 0 })
      onDragStateChange?.(false)

      if (changed) {
        onReorder(next)
      }
    },
    [folders, onDragStateChange, onReorder],
  )

  const rows = Math.ceil(orderedFolders.length / COLUMNS)
  const height = rows > 0 ? rows * cardHeight + (rows - 1) * gap : 0
  const activeFolder = activeId
    ? orderedFolders.find((folder) => folder.id === activeId) ?? null
    : null

  return (
    <View style={[styles.grid, { height }]}>
      {orderedFolders.map((folder, index) => {
        const position = getPosition(index)
        const isActive = folder.id === activeId

        return (
          <SortableFolderCell
            key={folder.id}
            folder={folder}
            bookmarks={getBookmarks(folder.id)}
            width={cardWidth}
            x={position.x}
            y={position.y}
            hidden={isActive}
            onPress={() => onPressFolder(folder)}
            onEdit={() => onEditFolder(folder)}
            onDelete={() => onDeleteFolder(folder)}
            onDragStart={beginDrag}
            onDragMove={moveDrag}
            onDragEnd={endDrag}
            onDragBlockedChange={setDragBlocked}
          />
        )
      })}

      {activeFolder && dragOrigin ? (
        <View
          pointerEvents="none"
          style={[
            styles.dragOverlay,
            {
              width: cardWidth,
              left: dragOrigin.x + dragOffset.x,
              top: dragOrigin.y + dragOffset.y,
            },
          ]}
        >
          <FolderCard
            folder={activeFolder}
            bookmarks={getBookmarks(activeFolder.id)}
            onPress={() => undefined}
            onEdit={() => onEditFolder(activeFolder)}
            onDelete={() => onDeleteFolder(activeFolder)}
            isActive
          />
        </View>
      ) : null}
    </View>
  )
}

function SortableFolderCell({
  folder,
  bookmarks,
  width,
  x,
  y,
  hidden,
  onPress,
  onEdit,
  onDelete,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragBlockedChange,
}: {
  folder: Folder
  bookmarks: Bookmark[]
  width: number
  x: number
  y: number
  hidden: boolean
  onPress: () => void
  onEdit: () => void
  onDelete: () => void
  onDragStart: (folderId: string) => void
  onDragMove: (folderId: string, translationX: number, translationY: number) => void
  onDragEnd: (folderId: string) => void
  onDragBlockedChange: (folderId: string, blocked: boolean) => void
}) {
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(LONG_PRESS_MS)
        .maxPointers(1)
        .onStart(() => {
          runOnJS(onDragStart)(folder.id)
        })
        .onUpdate((event) => {
          runOnJS(onDragMove)(folder.id, event.translationX, event.translationY)
        })
        .onFinalize(() => {
          runOnJS(onDragEnd)(folder.id)
        }),
    [folder.id, onDragEnd, onDragMove, onDragStart],
  )

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={[
          styles.cell,
          {
            width,
            left: x,
            top: y,
            opacity: hidden ? 0 : 1,
          },
        ]}
      >
        <FolderCard
          folder={folder}
          bookmarks={bookmarks}
          onPress={onPress}
          onEdit={onEdit}
          onDelete={onDelete}
          onMorePressIn={() => onDragBlockedChange(folder.id, true)}
          onMorePressOut={() => onDragBlockedChange(folder.id, false)}
        />
      </View>
    </GestureDetector>
  )
}

function clamp(value: number, min: number, max: number) {
  'worklet'
  return Math.min(Math.max(value, min), max)
}

const styles = StyleSheet.create({
  grid: {
    position: 'relative',
  },
  cell: {
    position: 'absolute',
  },
  dragOverlay: {
    position: 'absolute',
    zIndex: 50,
    elevation: 24,
    transform: [{ scale: 1.04 }],
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
})
