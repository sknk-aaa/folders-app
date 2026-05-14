import { useEffect, useState, useRef } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
import * as Linking from 'expo-linking'
import { StatusBar } from 'expo-status-bar'
import { initializeDatabase, seedDefaultData } from './src/shared/db/migrations'
import { useSettingsStore } from './src/features/settings/store'
import { useFoldersStore } from './src/features/folders/store'
import { useBookmarksStore } from './src/features/bookmarks/store'
import { RootNavigator } from './src/navigation'
import type { RootStackParamList } from './src/shared/types'

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

function handleIncomingUrl(url: string) {
  const parsed = Linking.parse(url)
  // foldersapp://add?url=...
  if (parsed.path === 'add' && parsed.queryParams?.url) {
    const targetUrl = decodeURIComponent(parsed.queryParams.url as string)
    if (navigationRef.isReady()) {
      navigationRef.navigate('AddBookmark', { url: targetUrl })
    }
  }
}

export default function App() {
  const [ready, setReady] = useState(false)
  const pendingUrl = useRef<string | null>(null)

  useEffect(() => {
    const init = async () => {
      initializeDatabase()
      seedDefaultData()
      await useSettingsStore.getState().load()
      await useFoldersStore.getState().load()
      await useBookmarksStore.getState().load()
      setReady(true)
    }
    init()

    // アプリが閉じた状態で URL スキームから起動された場合
    Linking.getInitialURL().then((url) => {
      if (url) pendingUrl.current = url
    })

    // アプリがバックグラウンドにいるときに URL スキームが来た場合
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (ready) {
        handleIncomingUrl(url)
      } else {
        pendingUrl.current = url
      }
    })

    return () => sub.remove()
  }, [])

  const handleNavigationReady = () => {
    // チュートリアル未完了なら最初に表示
    const { settings } = useSettingsStore.getState()
    if (!settings.tutorial_completed) {
      navigationRef.navigate('Tutorial')
    }
    // Share Extension から来た URL があれば AddBookmark へ
    if (pendingUrl.current) {
      handleIncomingUrl(pendingUrl.current)
      pendingUrl.current = null
    }
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef} onReady={handleNavigationReady}>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
