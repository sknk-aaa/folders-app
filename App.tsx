import { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { initializeDatabase, seedDefaultData } from './src/shared/db/migrations'
import { useSettingsStore } from './src/features/settings/store'
import { useFoldersStore } from './src/features/folders/store'
import { useBookmarksStore } from './src/features/bookmarks/store'
import { RootNavigator } from './src/navigation'

export default function App() {
  const [ready, setReady] = useState(false)

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
  }, [])

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
        <NavigationContainer>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
