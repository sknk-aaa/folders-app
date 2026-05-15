import { Dimensions } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createDrawerNavigator } from '@react-navigation/drawer'

const SCREEN_WIDTH = Dimensions.get('window').width
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

type MainStackProps = {
  initialRouteName: keyof RootStackParamList
}

function MainStack({ initialRouteName }: MainStackProps) {
  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="AllBookmarks"
        component={AllBookmarksScreen}
        options={{ fullScreenGestureEnabled: true, gestureResponseDistance: SCREEN_WIDTH }}
      />
      <Stack.Screen
        name="FolderDetail"
        component={FolderDetailScreen}
        options={{ fullScreenGestureEnabled: true, gestureResponseDistance: SCREEN_WIDTH }}
      />
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
      <Stack.Screen name="Search" component={SearchScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen
        name="Tutorial"
        component={TutorialScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
    </Stack.Navigator>
  )
}

type RootNavigatorProps = {
  initialRouteName: keyof RootStackParamList
}

export function RootNavigator({ initialRouteName }: RootNavigatorProps) {
  return (
    <Drawer.Navigator
      drawerContent={() => <DrawerContent />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        swipeEnabled: false,
        drawerStyle: { width: '80%' },
      }}
    >
      <Drawer.Screen name="Main">
        {() => <MainStack initialRouteName={initialRouteName} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  )
}
