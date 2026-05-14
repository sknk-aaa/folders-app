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
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import WebView from 'react-native-webview'
import { captureRef } from 'react-native-view-shot'
import * as FileSystem from 'expo-file-system/legacy'
import { useBookmarksStore } from '../store'
import { useFoldersStore } from '../../folders/store'
import { useSettingsStore } from '../../settings/store'
import { PlaceholderImage } from '../../../shared/components/PlaceholderImage'
import { Toast } from '../../../shared/components/Toast'
import { fetchOgp } from '../../../shared/utils/url'
import { colors, spacing, radius } from '../../../shared/theme'
import type { RootStackParamList } from '../../../shared/types'

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = NativeStackScreenProps<RootStackParamList, 'AddBookmark'>['route']

type Step = 'url-input' | 'loading' | 'webview' | 'meta'

export function AddBookmarkScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const insets = useSafeAreaInsets()

  const { add } = useBookmarksStore()
  const { folders } = useFoldersStore()
  const { settings, set: setSetting } = useSettingsStore()

  const [step, setStep] = useState<Step>(route.params?.url ? 'loading' : 'url-input')
  const [urlInput, setUrlInput] = useState(route.params?.url ?? '')
  const [name, setName] = useState(route.params?.title ?? '')
  const [url, setUrl] = useState(route.params?.url ?? '')
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null)
  const [folderId, setFolderId] = useState(settings.last_selected_folder_id ?? folders[0]?.id)
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  const webviewRef = useRef<WebView>(null)

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
    setUrl(finalUrl)
    setStep('loading')

    if (settings.capture_thumbnail) {
      // WebView mode: load page then let user capture
      setStep('webview')
    } else {
      // OGP mode
      try {
        const ogp = await fetchOgp(finalUrl)
        if (!name) setName(ogp.title)
        if (ogp.imageUrl) {
          const dest = `${FileSystem.documentDirectory}thumbnails/${Date.now()}.jpg`
          await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}thumbnails/`, {
            intermediates: true,
          })
          await FileSystem.downloadAsync(ogp.imageUrl, dest)
          setThumbnailUri(dest)
        }
      } catch {
        // OGP fetch failed; proceed without thumbnail
      }
      setStep('meta')
    }
  }

  const handleWebViewCapture = async () => {
    if (!webviewRef.current) return
    try {
      const uri = await captureRef(webviewRef, { format: 'jpg', quality: 0.8 })
      // Navigate to Trim screen
      navigation.navigate('Trim', { imageUri: uri })
    } catch {
      showToast('スクリーンショットの取得に失敗しました')
      setStep('meta')
    }
  }

  const handleWebViewLoad = (e: { nativeEvent: { title: string } }) => {
    if (!name && e.nativeEvent.title) {
      setName(e.nativeEvent.title)
    }
  }

  const handleSave = async () => {
    if (!name.trim() || !url.trim()) {
      Alert.alert('入力エラー', 'サイト名とURLを入力してください')
      return
    }

    const total = useBookmarksStore.getState().total()
    if (!settings.is_premium && total >= 100) {
      Alert.alert('上限に達しました', 'プレミアム版で無制限に保存できます')
      return
    }
    if (!settings.is_premium && total === 90) {
      showToast('残り10件です（プレミアムで無制限に）')
    }

    setSetting('last_selected_folder_id', folderId)
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
              returnKeyType="go"
              onSubmitEditing={handleUrlSubmit}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, !urlInput.trim() && styles.primaryBtnDisabled]}
            onPress={handleUrlSubmit}
            disabled={!urlInput.trim()}
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
        <Text style={styles.webviewHint}>保存したい画面でタップしてください</Text>
        <WebView
          ref={webviewRef}
          source={{ uri: url }}
          style={{ flex: 1 }}
          onLoad={handleWebViewLoad}
        />
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.folderScroll}>
              {folders.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setFolderId(f.id)}
                  style={[styles.folderChip, folderId === f.id && styles.folderChipSelected]}
                >
                  <Text style={[styles.folderChipText, folderId === f.id && styles.folderChipTextSelected]}>
                    {f.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        <Toast message={toastMsg} visible={toastVisible} onHide={() => setToastVisible(false)} />
      </View>
    </KeyboardAvoidingView>
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
