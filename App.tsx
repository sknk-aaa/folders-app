import { useEffect, useState, useRef } from 'react'
import { View, ActivityIndicator, Text } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
import * as Linking from 'expo-linking'
import { StatusBar } from 'expo-status-bar'
import { initializeDatabase, migrateSchema, seedDefaultData } from './src/shared/db/migrations'
import { useSettingsStore } from './src/features/settings/store'
import { useProStore } from './src/features/pro/store'
import { useFoldersStore } from './src/features/folders/store'
import { useBookmarksStore } from './src/features/bookmarks/store'
import { RootNavigator } from './src/navigation'
import type { RootStackParamList } from './src/shared/types'

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

function handleIncomingUrl(url: string) {
  const parsed = Linking.parse(url)
  // foldersapp://add?url=... のとき、'add' は parser によって hostname または path に入る
  const isAddRoute = parsed.path === 'add' || parsed.hostname === 'add'
  if (isAddRoute && parsed.queryParams?.url) {
    const targetUrl = decodeURIComponent(parsed.queryParams.url as string)
    const targetTitle = parsed.queryParams?.name
      ? decodeURIComponent(parsed.queryParams.name as string)
      : undefined
    if (navigationRef.isReady()) {
      navigationRef.navigate('AddBookmark', { url: targetUrl, title: targetTitle })
    }
  }
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [initError, setInitError] = useState<Error | null>(null)
  const pendingUrl = useRef<string | null>(null)
  const readyRef = useRef(false)
  const navReadyRef = useRef(false)

  const processPendingUrl = () => {
    if (!pendingUrl.current) return
    if (!readyRef.current || !navReadyRef.current) return
    const url = pendingUrl.current
    pendingUrl.current = null
    handleIncomingUrl(url)
  }

  useEffect(() => {
    const init = async () => {
      try {
        initializeDatabase()
        migrateSchema()
        seedDefaultData()
        useProStore.getState().configure()
        await useSettingsStore.getState().load()
        await useFoldersStore.getState().load()
        await useBookmarksStore.getState().load()
        void useProStore.getState().load()
        // Share Extensionから保存されたブクマをDBに反映
        void useBookmarksStore.getState().drainShareQueue()
      } catch (error) {
        console.error('Failed to initialize app', error)
        setInitError(error instanceof Error ? error : new Error(String(error)))
      } finally {
        setReady(true)
        readyRef.current = true
        processPendingUrl()
      }
    }
    void init()

    // アプリが閉じた状態で URL スキームから起動された場合
    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          pendingUrl.current = url
          processPendingUrl()
        }
      })
      .catch((error) => {
        console.error('Failed to get initial URL', error)
      })

    // アプリがバックグラウンドにいるときに URL スキームが来た場合
    const sub = Linking.addEventListener('url', ({ url }) => {
      pendingUrl.current = url
      processPendingUrl()
    })

    return () => sub.remove()
  }, [])

  const handleNavigationReady = () => {
    navReadyRef.current = true
    processPendingUrl()
  }

  if (!ready) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}
      >
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }

  if (initError) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          backgroundColor: '#fff',
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 8 }}>
          アプリの初期化に失敗しました
        </Text>
        <Text style={{ fontSize: 13, color: '#666', textAlign: 'center' }}>
          アプリを再起動してください。問題が続く場合はログを確認してください。
        </Text>
      </View>
    )
  }

  const initialRouteName: keyof RootStackParamList = useSettingsStore.getState().settings
    .tutorial_completed
    ? 'Home'
    : 'Tutorial'

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef} onReady={handleNavigationReady}>
          <StatusBar style="dark" />
          <RootNavigator initialRouteName={initialRouteName} />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
