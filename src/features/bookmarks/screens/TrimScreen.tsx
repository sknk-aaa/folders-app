import { useState, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import * as ImageManipulator from 'expo-image-manipulator'
import * as FileSystem from 'expo-file-system/legacy'
import { colors, spacing, radius } from '../../../shared/theme'
import type { RootStackParamList } from '../../../shared/types'

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = NativeStackScreenProps<RootStackParamList, 'Trim'>['route']

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')
const MIN_SIZE = 60

type Rect = { x: number; y: number; w: number; h: number }

type Handle = 'move' | 'tl' | 'tr' | 'bl' | 'br'

export function TrimScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const insets = useSafeAreaInsets()
  const { imageUri } = route.params

  const imageAreaH = SCREEN_H - insets.top - insets.bottom - 96 - 52

  const [crop, setCrop] = useState<Rect>({
    x: SCREEN_W * 0.1,
    y: imageAreaH * 0.1,
    w: SCREEN_W * 0.8,
    h: imageAreaH * 0.8,
  })
  const [saving, setSaving] = useState(false)

  const cropRef = useRef(crop)
  cropRef.current = crop

  const activeHandle = useRef<Handle | null>(null)
  const startGesture = useRef({ x: 0, y: 0 })
  const startCrop = useRef<Rect>({ x: 0, y: 0, w: 0, h: 0 })

  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

  const makePanResponder = (handle: Handle) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (e: GestureResponderEvent) => {
        activeHandle.current = handle
        startGesture.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }
        startCrop.current = { ...cropRef.current }
      },
      onPanResponderMove: (_: GestureResponderEvent, gs: PanResponderGestureState) => {
        const dx = gs.dx
        const dy = gs.dy
        const sc = startCrop.current
        let next: Rect = { ...sc }

        if (handle === 'move') {
          next.x = clamp(sc.x + dx, 0, SCREEN_W - sc.w)
          next.y = clamp(sc.y + dy, 0, imageAreaH - sc.h)
        } else if (handle === 'tl') {
          const newX = clamp(sc.x + dx, 0, sc.x + sc.w - MIN_SIZE)
          const newY = clamp(sc.y + dy, 0, sc.y + sc.h - MIN_SIZE)
          next = { x: newX, y: newY, w: sc.x + sc.w - newX, h: sc.y + sc.h - newY }
        } else if (handle === 'tr') {
          const newY = clamp(sc.y + dy, 0, sc.y + sc.h - MIN_SIZE)
          const newW = clamp(sc.w + dx, MIN_SIZE, SCREEN_W - sc.x)
          next = { x: sc.x, y: newY, w: newW, h: sc.y + sc.h - newY }
        } else if (handle === 'bl') {
          const newX = clamp(sc.x + dx, 0, sc.x + sc.w - MIN_SIZE)
          const newH = clamp(sc.h + dy, MIN_SIZE, imageAreaH - sc.y)
          next = { x: newX, y: sc.y, w: sc.x + sc.w - newX, h: newH }
        } else if (handle === 'br') {
          const newW = clamp(sc.w + dx, MIN_SIZE, SCREEN_W - sc.x)
          const newH = clamp(sc.h + dy, MIN_SIZE, imageAreaH - sc.y)
          next = { x: sc.x, y: sc.y, w: newW, h: newH }
        }
        setCrop(next)
      },
      onPanResponderRelease: () => {
        activeHandle.current = null
      },
    })

  const panMove = useRef(makePanResponder('move')).current
  const panTL = useRef(makePanResponder('tl')).current
  const panTR = useRef(makePanResponder('tr')).current
  const panBL = useRef(makePanResponder('bl')).current
  const panBR = useRef(makePanResponder('br')).current

  const handleCrop = async () => {
    setSaving(true)
    try {
      const scaleX = crop.x / SCREEN_W
      const scaleY = crop.y / imageAreaH
      const scaleW = crop.w / SCREEN_W
      const scaleH = crop.h / imageAreaH

      // Get actual image dimensions first to compute crop origin
      const { width: imgW, height: imgH } = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { base64: false }
      ).then((r) => ({ width: r.width, height: r.height }))

      const originX = Math.round(scaleX * imgW)
      const originY = Math.round(scaleY * imgH)
      const cropW = Math.round(scaleW * imgW)
      const cropH = Math.round(scaleH * imgH)

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ crop: { originX, originY, width: cropW, height: cropH } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      )

      await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}thumbnails/`, {
        intermediates: true,
      })
      const dest = `${FileSystem.documentDirectory}thumbnails/${Date.now()}.jpg`
      await FileSystem.moveAsync({ from: result.uri, to: dest })

      // Pass thumbnailUri back to AddBookmark via navigation params
      navigation.navigate('AddBookmark', { thumbnailUri: dest } as never)
    } catch {
      setSaving(false)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>キャンセル</Text>
        </TouchableOpacity>
        <Text style={styles.title}>トリミング</Text>
        <TouchableOpacity onPress={handleCrop} disabled={saving}>
          <Text style={[styles.doneText, saving && { opacity: 0.4 }]}>完了</Text>
        </TouchableOpacity>
      </View>

      {/* Image + crop overlay */}
      <View style={[styles.imageArea, { height: imageAreaH }]}>
        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="contain" />

        {/* Dark mask: top */}
        <View style={[styles.mask, { top: 0, left: 0, right: 0, height: crop.y }]} />
        {/* Dark mask: bottom */}
        <View style={[styles.mask, { top: crop.y + crop.h, left: 0, right: 0, bottom: 0 }]} />
        {/* Dark mask: left */}
        <View style={[styles.mask, { top: crop.y, left: 0, width: crop.x, height: crop.h }]} />
        {/* Dark mask: right */}
        <View
          style={[styles.mask, { top: crop.y, left: crop.x + crop.w, right: 0, height: crop.h }]}
        />

        {/* Crop rect border (draggable) */}
        <View
          {...panMove.panHandlers}
          style={[
            styles.cropRect,
            { left: crop.x, top: crop.y, width: crop.w, height: crop.h },
          ]}
        >
          {/* Grid lines */}
          <View style={[styles.gridLine, styles.gridV1]} />
          <View style={[styles.gridLine, styles.gridV2]} />
          <View style={[styles.gridLine, styles.gridH1]} />
          <View style={[styles.gridLine, styles.gridH2]} />
        </View>

        {/* Corner handles */}
        <View
          {...panTL.panHandlers}
          style={[styles.handle, { left: crop.x - 12, top: crop.y - 12 }]}
        />
        <View
          {...panTR.panHandlers}
          style={[styles.handle, { left: crop.x + crop.w - 12, top: crop.y - 12 }]}
        />
        <View
          {...panBL.panHandlers}
          style={[styles.handle, { left: crop.x - 12, top: crop.y + crop.h - 12 }]}
        />
        <View
          {...panBR.panHandlers}
          style={[styles.handle, { left: crop.x + crop.w - 12, top: crop.y + crop.h - 12 }]}
        />
      </View>

      {/* Footer hint */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        <Text style={styles.hintText}>ドラッグして範囲を選択</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    height: 52,
  },
  title: { fontSize: 16, fontWeight: '600', color: '#fff' },
  cancelText: { fontSize: 15, color: 'rgba(255,255,255,0.7)' },
  doneText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  imageArea: { width: SCREEN_W, position: 'relative', overflow: 'hidden' },
  mask: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.55)' },
  cropRect: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#fff',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  gridV1: { left: '33.3%', top: 0, bottom: 0, width: 1 },
  gridV2: { left: '66.6%', top: 0, bottom: 0, width: 1 },
  gridH1: { top: '33.3%', left: 0, right: 0, height: 1 },
  gridH2: { top: '66.6%', left: 0, right: 0, height: 1 },
  handle: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  footer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
  },
  hintText: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
})
