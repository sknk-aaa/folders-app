import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'
import type { Bookmark, Folder } from '../../../shared/types'
import { BookmarkCard } from './BookmarkCard'

type Props = {
  bookmarks: Bookmark[]
  allFolders: Folder[]
  cardWidth: number
  cardHeight: number
  gap: number
  columns?: number
  onDelete: (bookmark: Bookmark) => void
  onMove: (bookmark: Bookmark, folderId: string) => void
  onReorder: (bookmarks: Bookmark[]) => void
}

type DragOrigin = { x: number; y: number }

const LONG_PRESS_MS = 180

export function SortableBookmarkGrid({
  bookmarks,
  allFolders,
  cardWidth,
  cardHeight,
  gap,
  columns = 2,
  onDelete,
  onMove,
  onReorder,
}: Props) {
  const rowHeight = cardHeight + gap
  const columnWidth = cardWidth + gap

  const [orderedBookmarks, setOrderedBookmarks] = useState(bookmarks)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [dragOrigin, setDragOrigin] = useState<DragOrigin | null>(null)

  const orderedRef = useRef(bookmarks)
  const activeIdRef = useRef<string | null>(null)
  const originRef = useRef<DragOrigin | null>(null)

  useEffect(() => {
    if (activeIdRef.current) return
    orderedRef.current = bookmarks
    setOrderedBookmarks(bookmarks)
  }, [bookmarks])

  const getPosition = useCallback(
    (index: number) => ({
      x: (index % columns) * columnWidth,
      y: Math.floor(index / columns) * rowHeight,
    }),
    [columnWidth, columns, rowHeight],
  )

  const moveActive = useCallback((targetIndex: number) => {
    const id = activeIdRef.current
    if (!id) return
    const current = orderedRef.current
    const currentIndex = current.findIndex((b) => b.id === id)
    if (currentIndex < 0 || targetIndex === currentIndex) return

    const next = [...current]
    const [active] = next.splice(currentIndex, 1)
    next.splice(targetIndex, 0, active)
    orderedRef.current = next
    setOrderedBookmarks(next)
  }, [])

  const updateTargetIndex = useCallback(
    (tx: number, ty: number) => {
      const origin = originRef.current
      if (!origin) return
      const rows = Math.max(1, Math.ceil(orderedRef.current.length / columns))
      const centerX = origin.x + cardWidth / 2 + tx
      const centerY = origin.y + cardHeight / 2 + ty
      const col = clamp(Math.round((centerX - cardWidth / 2) / columnWidth), 0, columns - 1)
      const row = clamp(Math.round((centerY - cardHeight / 2) / rowHeight), 0, rows - 1)
      const targetIndex = Math.min(row * columns + col, orderedRef.current.length - 1)
      moveActive(targetIndex)
    },
    [cardHeight, cardWidth, columnWidth, columns, moveActive, rowHeight],
  )

  const beginDrag = useCallback(
    (bookmarkId: string) => {
      const index = orderedRef.current.findIndex((b) => b.id === bookmarkId)
      if (index < 0) return
      const origin = getPosition(index)
      activeIdRef.current = bookmarkId
      originRef.current = origin
      setActiveId(bookmarkId)
      setDragOrigin(origin)
      setDragOffset({ x: 0, y: 0 })
    },
    [getPosition],
  )

  const moveDrag = useCallback(
    (bookmarkId: string, tx: number, ty: number) => {
      if (activeIdRef.current !== bookmarkId) return
      setDragOffset({ x: tx, y: ty })
      updateTargetIndex(tx, ty)
    },
    [updateTargetIndex],
  )

  const endDrag = useCallback(
    (bookmarkId: string) => {
      if (activeIdRef.current !== bookmarkId) return
      const next = orderedRef.current
      const changed = next.some((b, i) => b.id !== bookmarks[i]?.id)
      activeIdRef.current = null
      originRef.current = null
      setActiveId(null)
      setDragOrigin(null)
      setDragOffset({ x: 0, y: 0 })
      if (changed) onReorder(next)
    },
    [bookmarks, onReorder],
  )

  const rows = Math.ceil(orderedBookmarks.length / columns)
  const height = rows > 0 ? rows * cardHeight + (rows - 1) * gap : 0
  const activeBookmark = activeId
    ? orderedBookmarks.find((b) => b.id === activeId) ?? null
    : null

  return (
    <View style={[styles.grid, { height }]}>
      {orderedBookmarks.map((bookmark, index) => {
        const position = getPosition(index)
        const isActive = bookmark.id === activeId

        return (
          <SortableBookmarkCell
            key={bookmark.id}
            bookmark={bookmark}
            allFolders={allFolders}
            width={cardWidth}
            x={position.x}
            y={position.y}
            hidden={isActive}
            onDelete={() => onDelete(bookmark)}
            onMove={(folderId) => onMove(bookmark, folderId)}
            onDragStart={beginDrag}
            onDragMove={moveDrag}
            onDragEnd={endDrag}
          />
        )
      })}

      {activeBookmark && dragOrigin ? (
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
          <BookmarkCard
            bookmark={activeBookmark}
            allFolders={allFolders}
            onDelete={() => onDelete(activeBookmark)}
            onMove={(folderId) => onMove(activeBookmark, folderId)}
            isActive
          />
        </View>
      ) : null}
    </View>
  )
}

function SortableBookmarkCell({
  bookmark,
  allFolders,
  width,
  x,
  y,
  hidden,
  onDelete,
  onMove,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  bookmark: Bookmark
  allFolders: Folder[]
  width: number
  x: number
  y: number
  hidden: boolean
  onDelete: () => void
  onMove: (folderId: string) => void
  onDragStart: (id: string) => void
  onDragMove: (id: string, tx: number, ty: number) => void
  onDragEnd: (id: string) => void
}) {
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(LONG_PRESS_MS)
        .maxPointers(1)
        .onStart(() => {
          runOnJS(onDragStart)(bookmark.id)
        })
        .onUpdate((e) => {
          runOnJS(onDragMove)(bookmark.id, e.translationX, e.translationY)
        })
        .onFinalize(() => {
          runOnJS(onDragEnd)(bookmark.id)
        }),
    [bookmark.id, onDragEnd, onDragMove, onDragStart],
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
        <BookmarkCard
          bookmark={bookmark}
          allFolders={allFolders}
          onDelete={onDelete}
          onMove={onMove}
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
