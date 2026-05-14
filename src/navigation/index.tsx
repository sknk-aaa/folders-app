import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { HomeScreen } from '../features/folders/screens/HomeScreen'
import { FolderDetailScreen } from '../features/folders/screens/FolderDetailScreen'
import { AllBookmarksScreen } from '../features/bookmarks/screens/AllBookmarksScreen'
import { AddBookmarkScreen } from '../features/bookmarks/screens/AddBookmarkScreen'
import { TrimScreen } from '../features/bookmarks/screens/TrimScreen'
import { SearchScreen } from '../features/bookmarks/screens/SearchScreen'
import { TutorialScreen } from '../features/tutorial/TutorialScreen'
import { DrawerContent } from '../shared/components/DrawerContent'
import type { RootStackParamList, DrawerParamList } from '../shared/types'

const Stack = createNativeStackNavigator<RootStackParamList>()
const Drawer = createDrawerNavigator<DrawerParamList>()

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="AllBookmarks" component={AllBookmarksScreen} />
      <Stack.Screen name="FolderDetail" component={FolderDetailScreen} />
      <Stack.Screen
        name="AddBookmark"
        component={AddBookmarkScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="Trim"
        component={TrimScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="Tutorial"
        component={TutorialScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
    </Stack.Navigator>
  )
}

export function RootNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={() => <DrawerContent />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { width: '80%' },
      }}
    >
      <Drawer.Screen name="Main" component={MainStack} />
    </Drawer.Navigator>
  )
}
