import { useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ListRenderItemInfo,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSettingsStore } from '../settings/store'
import { colors, spacing } from '../../shared/theme'
import type { RootStackParamList } from '../../shared/types'

const { width: W } = Dimensions.get('window')

type Nav = NativeStackNavigationProp<RootStackParamList>

type Page = {
  key: string
  emoji: string
  title: string
  description: string
}

const PAGES: Page[] = [
  {
    key: '1',
    emoji: '🔖',
    title: 'ブックマークを\nビジュアルで管理',
    description: 'サイトのスクリーンショットをサムネイルとして保存。一目でどのサイトかわかります。',
  },
  {
    key: '2',
    emoji: '📁',
    title: 'フォルダで整理',
    description: '仕事・エンタメ・ショッピングなど、用途ごとにフォルダを作って整理できます。',
  },
  {
    key: '3',
    emoji: '✂️',
    title: 'サムネを\n自由にカット',
    description: 'ページを読み込んで好きな部分を切り取り、オリジナルのサムネイルを作れます。',
  },
  {
    key: '4',
    emoji: '🔗',
    title: 'Safariから\nすぐ追加',
    description: 'Safariの共有ボタンから直接このアプリへ追加できます。コピペ不要で快適。',
  },
  {
    key: '5',
    emoji: '🚀',
    title: 'さっそく\n始めよう',
    description: 'お気に入りのサイトを集めて、あなただけのブックマーク集を作りましょう。',
  },
]

export function TutorialScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const { set } = useSettingsStore()
  const listRef = useRef<FlatList<Page>>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const finish = () => {
    set('tutorial_completed', true)
    navigation.navigate('Home')
  }

  const goNext = () => {
    if (currentIndex < PAGES.length - 1) {
      listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true })
    } else {
      finish()
    }
  }

  const renderItem = ({ item }: ListRenderItemInfo<Page>) => (
    <View style={[styles.page, { width: W }]}>
      <View style={styles.emojiWrap}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <Text style={styles.pageTitle}>{item.title}</Text>
      <Text style={styles.pageDesc}>{item.description}</Text>
    </View>
  )

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipBtn} onPress={finish}>
        <Text style={styles.skipText}>スキップ</Text>
      </TouchableOpacity>

      {/* Pages */}
      <FlatList
        ref={listRef}
        data={PAGES}
        keyExtractor={(p) => p.key}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / W)
          setCurrentIndex(index)
        }}
        style={{ flex: 1 }}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {PAGES.map((_, i) => (
          <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
        ))}
      </View>

      {/* Next / Start button */}
      <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
        <Text style={styles.nextText}>
          {currentIndex === PAGES.length - 1 ? 'はじめる' : '次へ'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 24,
  },
  emojiWrap: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: colors.placeholderBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 56,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 36,
  },
  pageDesc: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.separator,
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.text,
  },
  nextBtn: {
    marginHorizontal: spacing.lg,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.background,
  },
})
