import { useState } from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'
import { Text, TextInput, View } from 'expo-share-extension'
import { close, openHostApp, type InitialProps } from 'expo-share-extension'

export default function ShareExtension({ url }: InitialProps) {
  const [name, setName] = useState('')

  const handleAdd = () => {
    if (!url) {
      close()
      return
    }
    const params = new URLSearchParams()
    params.set('url', url)
    if (name.trim()) params.set('name', name.trim())
    openHostApp(`add?${params.toString()}`)
  }

  return (
    <View style={styles.container}>
      {/* Handle bar */}
      <View style={styles.handle} />

      <Text style={styles.title} allowFontScaling={false}>
        ブックマークを追加
      </Text>

      {url ? (
        <Text style={styles.url} numberOfLines={2} allowFontScaling={false}>
          {url}
        </Text>
      ) : (
        <Text style={styles.noUrl} allowFontScaling={false}>
          URLを取得できませんでした
        </Text>
      )}

      {url && (
        <View style={styles.field}>
          <Text style={styles.label} allowFontScaling={false}>サイト名</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="任意（後で変更できます）"
            placeholderTextColor="#C7C7CC"
            allowFontScaling={false}
            returnKeyType="done"
          />
        </View>
      )}

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.cancelBtn} onPress={close}>
          <Text style={styles.cancelText} allowFontScaling={false}>
            キャンセル
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addBtn, !url && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!url}
        >
          <Text style={styles.addText} allowFontScaling={false}>
            追加
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
    marginBottom: 16,
  },
  url: {
    fontSize: 13,
    color: '#8A8A8E',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
    lineHeight: 18,
  },
  noUrl: {
    fontSize: 13,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 24,
  },
  field: {
    marginBottom: 20,
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
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#000000',
  },
  addBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    opacity: 0.3,
  },
  addText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
