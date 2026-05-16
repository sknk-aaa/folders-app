import { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack'
import WebView from 'react-native-webview'
import { captureRef } from 'react-native-view-shot'
import * as ImageManipulator from 'expo-image-manipulator'
import * as FileSystem from 'expo-file-system/legacy'
import { useBookmarksStore } from '../store'
import { useFoldersStore } from '../../folders/store'
import { useSettingsStore } from '../../settings/store'
import { ProUpgradeModal } from '../../pro/components/ProUpgradeModal'
import { PlaceholderImage } from '../../../shared/components/PlaceholderImage'
import { Toast } from '../../../shared/components/Toast'
import { fetchOgp } from '../../../shared/utils/url'
import { colors, spacing, radius } from '../../../shared/theme'
import type { RootStackParamList } from '../../../shared/types'

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = NativeStackScreenProps<RootStackParamList, 'AddBookmark'>['route']

type Step = 'url-input' | 'loading' | 'webview' | 'meta'

const { width: SCREEN_W } = Dimensions.get('window')
const THUMB_ASPECT = 1 / 0.72 // ≈1.389 (W:H) - BookmarkCardの画像エリアと同じ比率
const FRAME_WIDTH_RATIO = 0.92 // WebView画面幅に対する枠の幅

export function AddBookmarkScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const insets = useSafeAreaInsets()

  const { add } = useBookmarksStore()
  const { folders } = useFoldersStore()
  const { settings, set: setSetting } = useSettingsStore()

  const initialFolderId =
    route.params?.folderId ??
    settings.default_folder_id ??
    settings.last_selected_folder_id ??
    folders[0]?.id ??
    ''
  const [step, setStep] = useState<Step>(route.params?.url ? 'loading' : 'url-input')
  const [urlInput, setUrlInput] = useState(route.params?.url ?? '')
  const [name, setName] = useState(route.params?.title ?? '')
  const [url, setUrl] = useState(route.params?.url ?? '')
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null)
  const [folderId, setFolderId] = useState(initialFolderId)
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [proModalVisible, setProModalVisible] = useState(false)

  const webviewRef = useRef<WebView>(null)
  const webviewWrapRef = useRef<View>(null)
  const autoStartedRef = useRef(false)

  useEffect(() => {
    if (route.params?.url && !autoStartedRef.current) {
      autoStartedRef.current = true
      void handleUrlSubmit()
    }
  }, [route.params?.url])

  // TrimScreen から戻ってきたとき thumbnailUri を受け取る
  useEffect(() => {
    const uri = route.params?.thumbnailUri
    if (uri) {
      setThumbnailUri(uri)
      setStep('meta')
    }
  }, [route.params?.thumbnailUri])

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
  }

  const handleUrlSubmit = async () => {
    let finalUrl = urlInput.trim()
    if (!finalUrl) return
    if (!finalUrl.startsWith('http')) finalUrl = `https://${finalUrl}`
    setUrlInput(finalUrl)
    setUrl(finalUrl)
    setStep('loading')

    if (settings.capture_thumbnail) {
      // WebView mode: load page then let user capture
      setStep('webview')
    } else {
      // OGP mode
      try {
        const ogp = await fetchOgp(finalUrl)
        if (!name.trim()) setName(ogp.title)
        if (ogp.imageUrl) {
          await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}thumbnails/`, {
            intermediates: true,
          })
          const ts = Date.now()
          const tmpPath = `${FileSystem.documentDirectory}thumbnails/${ts}-raw.jpg`
          const dest = `${FileSystem.documentDirectory}thumbnails/${ts}.jpg`
          await FileSystem.downloadAsync(ogp.imageUrl, tmpPath)
          const info = await ImageManipulator.manipulateAsync(tmpPath, [], { base64: false })
          let cropW: number
          let cropH: number
          let originX: number
          let originY: number
          if (info.width / info.height > THUMB_ASPECT) {
            cropH = info.height
            cropW = cropH * THUMB_ASPECT
            originY = 0
            originX = (info.width - cropW) / 2
          } else {
            cropW = info.width
            cropH = cropW / THUMB_ASPECT
            originX = 0
            originY = (info.height - cropH) / 2
          }
          const result = await ImageManipulator.manipulateAsync(
            tmpPath,
            [{ crop: { originX, originY, width: cropW, height: cropH } }],
            { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
          )
          await FileSystem.moveAsync({ from: result.uri, to: dest })
          await FileSystem.deleteAsync(tmpPath, { idempotent: true })
          setThumbnailUri(dest)
        }
      } catch {
        // OGP fetch failed; proceed without thumbnail
      }
      setStep('meta')
    }
  }

  const handleWebViewCapture = async () => {
    if (!webviewWrapRef.current) return
    try {
      console.log('[capture] start')
      const uri = await captureRef(webviewWrapRef, { format: 'jpg', quality: 0.9 })
      console.log('[capture] captured uri:', uri)
      const info = await ImageManipulator.manipulateAsync(uri, [], { base64: false })
      console.log('[capture] image size:', info.width, 'x', info.height)
      const cropW = info.width * FRAME_WIDTH_RATIO
      const cropH = cropW / THUMB_ASPECT
      const originX = (info.width - cropW) / 2
      const originY = (info.height - cropH) / 2
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ crop: { originX, originY, width: cropW, height: cropH } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
      )
      console.log('[capture] cropped result uri:', result.uri)
      await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}thumbnails/`, {
        intermediates: true,
      })
      const dest = `${FileSystem.documentDirectory}thumbnails/${Date.now()}.jpg`
      await FileSystem.moveAsync({ from: result.uri, to: dest })
      console.log('[capture] moved to dest:', dest)
      setThumbnailUri(dest)
      setStep('meta')
    } catch (e) {
      console.error('[capture] error:', e)
      showToast('スクリーンショットの取得に失敗しました')
      setStep('meta')
    }
  }

  const handleWebViewLoad = (e: { nativeEvent: { title: string } }) => {
    if (!name.trim() && e.nativeEvent.title) {
      setName(e.nativeEvent.title)
    }
  }

  const handleSave = async () => {
    if (!name.trim() || !url.trim() || !folderId) {
      Alert.alert('入力エラー', 'サイト名、URL、保存先フォルダを入力してください')
      return
    }

    const total = useBookmarksStore.getState().total()
    if (!settings.is_premium && total >= 100) {
      setProModalVisible(true)
      return
    }
    if (!settings.is_premium && total === 90) {
      showToast('残り10件です。Proで無制限に保存できます')
    }

    setSetting('last_selected_folder_id', folderId)
    console.log('[save] thumbnailUri:', thumbnailUri)
    add({
      folderId,
      name: name.trim(),
      url: url.trim(),
      faviconUrl: null,
      thumbnailPath: thumbnailUri,
    })

    showToast('ブックマークを追加しました')
    setTimeout(() => navigation.goBack(), 500)
  }

  // -------- URL Input Step --------
  if (step === 'url-input') {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>ブックマークを追加</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>URL</Text>
            <TextInput
              style={styles.input}
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder="https://..."
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="next"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>サイト名</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="サイト名"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="done"
              onSubmitEditing={handleUrlSubmit}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>保存先フォルダ</Text>
            <FolderPicker folders={folders} folderId={folderId} onSelect={setFolderId} />
          </View>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              (!urlInput.trim() || !folderId) && styles.primaryBtnDisabled,
            ]}
            onPress={handleUrlSubmit}
            disabled={!urlInput.trim() || !folderId}
          >
            <Text style={styles.primaryBtnText}>次へ</Text>
          </TouchableOpacity>

          <Toast message={toastMsg} visible={toastVisible} onHide={() => setToastVisible(false)} />
        </View>
      </KeyboardAvoidingView>
    )
  }

  // -------- Loading Step --------
  if (step === 'loading') {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.text} />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    )
  }

  // -------- WebView Capture Step --------
  if (step === 'webview') {
    const frameWidth = SCREEN_W * FRAME_WIDTH_RATIO
    const frameHeight = frameWidth / THUMB_ASPECT
    const sideMaskWidth = (SCREEN_W - frameWidth) / 2
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setStep('meta')}>
            <Text style={styles.cancelText}>スキップ</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>サムネを選択</Text>
          <TouchableOpacity onPress={handleWebViewCapture}>
            <Text style={styles.captureText}>この画面を使う</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.webviewHint}>枠の中が保存されます</Text>
        <View style={styles.webviewWrap}>
          <View ref={webviewWrapRef} collapsable={false} style={{ flex: 1 }}>
            <WebView
              ref={webviewRef}
              source={{ uri: url }}
              style={{ flex: 1 }}
              onLoad={handleWebViewLoad}
            />
          </View>
          {/* Frame overlay (1.4:1) - 別Viewで重ねる（キャプチャ対象外） */}
          <View pointerEvents="none" style={styles.frameOverlay}>
            <View style={[styles.frameMaskSide, { width: sideMaskWidth }]} />
            <View style={styles.frameMiddleColumn}>
              <View style={styles.frameMaskTopBottom} />
              <View style={[styles.frameBox, { width: frameWidth, height: frameHeight }]} />
              <View style={styles.frameMaskTopBottom} />
            </View>
            <View style={[styles.frameMaskSide, { width: sideMaskWidth }]} />
          </View>
        </View>
      </View>
    )
  }

  // -------- Meta Input Step --------
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>キャンセル</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>ブックマーク情報</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveText}>保存</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.metaContent}>
          {/* Thumbnail preview */}
          <View style={styles.thumbPreview}>
            {thumbnailUri ? (
              <Image source={{ uri: thumbnailUri }} style={styles.thumbImg} contentFit="cover" />
            ) : (
              <PlaceholderImage width={120} height={80} style={{ borderRadius: radius.sm }} />
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>サイト名</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="サイト名"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="next"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>URL</Text>
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="https://..."
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>保存先フォルダ</Text>
            <FolderPicker folders={folders} folderId={folderId} onSelect={setFolderId} />
          </View>
        </ScrollView>

        <Toast message={toastMsg} visible={toastVisible} onHide={() => setToastVisible(false)} />
        <ProUpgradeModal visible={proModalVisible} onClose={() => setProModalVisible(false)} />
      </View>
    </KeyboardAvoidingView>
  )
}

function FolderPicker({
  folders,
  folderId,
  onSelect,
}: {
  folders: Array<{ id: string; name: string }>
  folderId: string
  onSelect: (folderId: string) => void
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.folderScroll}>
      {folders.map((f) => (
        <TouchableOpacity
          key={f.id}
          onPress={() => onSelect(f.id)}
          style={[styles.folderChip, folderId === f.id && styles.folderChipSelected]}
        >
          <Text style={[styles.folderChipText, folderId === f.id && styles.folderChipTextSelected]}>
            {f.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  modalTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  cancelText: { fontSize: 15, color: colors.textSecondary },
  captureText: { fontSize: 15, fontWeight: '600', color: colors.text },
  saveText: { fontSize: 15, fontWeight: '700', color: colors.text },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.separator,
    borderRadius: radius.sm,
    padding: 12,
    fontSize: 15,
    color: colors.text,
  },
  primaryBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    backgroundColor: colors.text,
    padding: 16,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.3 },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: colors.background },
  loadingText: { fontSize: 15, color: colors.textSecondary, marginTop: spacing.md },
  webviewHint: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 8,
    backgroundColor: colors.placeholderBg,
  },
  webviewWrap: {
    flex: 1,
    position: 'relative',
  },
  frameOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  frameMaskSide: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    height: '100%',
  },
  frameMiddleColumn: {
    flex: 1,
    flexDirection: 'column',
  },
  frameMaskTopBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  frameBox: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  metaContent: { paddingBottom: 32 },
  thumbPreview: { alignItems: 'center', paddingTop: spacing.xl },
  thumbImg: { width: 120, height: 80, borderRadius: radius.sm },
  folderScroll: { marginTop: 0 },
  folderChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.separator,
    marginRight: 8,
    backgroundColor: colors.placeholderBg,
  },
  folderChipSelected: { backgroundColor: colors.text, borderColor: colors.text },
  folderChipText: { fontSize: 14, color: colors.text },
  folderChipTextSelected: { color: colors.background },
})
