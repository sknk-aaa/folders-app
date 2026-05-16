import { useState } from 'react'
import { Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, TextInput, View } from 'expo-share-extension'
import { close, type InitialProps } from 'expo-share-extension'
import { getFolders, queueBookmark } from './src/shared/storage/sharedStorage'

type Preprocessing = {
  url?: string
  title?: string
  ogTitle?: string
  ogImage?: string
  ogDescription?: string
}

type Props = InitialProps & { preprocessingResults?: Preprocessing }

export default function ShareExtension({ url, preprocessingResults }: Props) {
  const pp = preprocessingResults ?? {}
  const actualUrl = pp.url ?? url ?? ''
  const defaultTitle = pp.ogTitle ?? pp.title ?? ''
  const ogImage = pp.ogImage ?? null

  const folders = getFolders()
  const [name, setName] = useState(defaultTitle)
  const [folderId, setFolderId] = useState(folders[0]?.id ?? '')

  const handleSave = () => {
    if (!actualUrl) {
      close()
      return
    }
    if (!folderId) {
      close()
      return
    }
    queueBookmark({
      url: actualUrl,
      name: name.trim() || defaultTitle || actualUrl,
      folderId,
      ogImageUrl: ogImage,
      createdAt: Date.now(),
    })
    close()
  }

  return (
    <View style={styles.container}>
      <View style={styles.handle} />

      <Text style={styles.title} allowFontScaling={false}>
        ブックマークを追加
      </Text>

      {!actualUrl ? (
        <Text style={styles.noUrl} allowFontScaling={false}>
          URLを取得できませんでした
        </Text>
      ) : (
        <>
          {ogImage ? (
            <Image source={{ uri: ogImage }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]}>
              <Text style={styles.thumbPlaceholderText} allowFontScaling={false}>
                サムネなし
              </Text>
            </View>
          )}

          <Text style={styles.url} numberOfLines={1} allowFontScaling={false}>
            {actualUrl}
          </Text>

          <View style={styles.field}>
            <Text style={styles.label} allowFontScaling={false}>サイト名</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="サイト名"
              placeholderTextColor="#C7C7CC"
              allowFontScaling={false}
              returnKeyType="done"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label} allowFontScaling={false}>保存先</Text>
            {folders.length === 0 ? (
              <Text style={styles.noFolder} allowFontScaling={false}>
                フォルダがありません。先にアプリを起動してください。
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {folders.map((f) => {
                  const active = f.id === folderId
                  return (
                    <TouchableOpacity
                      key={f.id}
                      onPress={() => setFolderId(f.id)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text
                        style={[styles.chipText, active && styles.chipTextActive]}
                        allowFontScaling={false}
                      >
                        {f.name}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            )}
          </View>
        </>
      )}

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.cancelBtn} onPress={close}>
          <Text style={styles.cancelText} allowFontScaling={false}>
            キャンセル
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, (!actualUrl || !folderId) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!actualUrl || !folderId}
        >
          <Text style={styles.saveText} allowFontScaling={false}>
            保存
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 14,
  },
  thumb: {
    width: '100%',
    aspectRatio: 1.4,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    marginBottom: 12,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPlaceholderText: {
    fontSize: 12,
    color: '#8A8A8E',
  },
  url: {
    fontSize: 12,
    color: '#8A8A8E',
    marginBottom: 14,
  },
  noUrl: {
    fontSize: 13,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    color: '#8A8A8E',
    marginBottom: 6,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  chipRow: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
  },
  chipActive: {
    backgroundColor: '#000000',
  },
  chipText: {
    fontSize: 13,
    color: '#000000',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  noFolder: {
    fontSize: 12,
    color: '#8A8A8E',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#000000',
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.3,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
