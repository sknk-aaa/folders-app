import { useEffect, useState, useRef } from 'react'
import { AppState, View, ActivityIndicator, Text } from 'react-native'
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
import { useTheme, darkColors } from './src/shared/theme'
import { tr } from './src/shared/i18n'
import type { RootStackParamList } from './src/shared/types'

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

function ThemedStatusBar() {
  const c = useTheme()
  return <StatusBar style={c === darkColors ? 'light' : 'dark'} />
}

function handleIncomingUrl(url: string) {
  const parsed = Linking.parse(url)
  // For foldersapp://add?url=..., 'add' is placed in hostname or path depending on the parser
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
        // Reflect bookmarks saved from the Share Extension into the DB
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

    // When the app is launched from a URL scheme while closed
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

    // When a URL scheme arrives while the app is in the background
    const sub = Linking.addEventListener('url', ({ url }) => {
      pendingUrl.current = url
      processPendingUrl()
    })

    // Process the Share Extension queue when returning to the foreground
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void useBookmarksStore.getState().drainShareQueue()
      }
    })

    return () => {
      sub.remove()
      appStateSub.remove()
    }
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
          {tr({ en: 'Failed to initialize the app', ja: 'アプリの初期化に失敗しました' })}
        </Text>
        <Text style={{ fontSize: 13, color: '#666', textAlign: 'center' }}>
          {tr({ en: 'Please restart the app. If the problem persists, check the logs.', ja: 'アプリを再起動してください。問題が続く場合はログを確認してください。' })}
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
          <ThemedStatusBar />
          <RootNavigator initialRouteName={initialRouteName} />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
