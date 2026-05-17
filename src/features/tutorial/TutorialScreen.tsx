import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSettingsStore } from '../settings/store'
import type { RootStackParamList } from '../../shared/types'

const { width: W, height: H } = Dimensions.get('window')

const PALETTE = {
  bg: '#FAFAF7',
  surface: '#FFFFFF',
  ink: '#0A0A0A',
  inkSoft: '#3A3A3C',
  textSecondary: '#6C6C70',
  textMuted: '#A8A6A0',
  divider: '#D8D6D0',
  border: '#EAE8E2',
}

// iPhone screenshot aspect ratio (width / height)
const PHONE_ASPECT = 0.46

const SINGLE_PHONE_HEIGHT = Math.min(H * 0.52, 470)
const SINGLE_PHONE_WIDTH = SINGLE_PHONE_HEIGHT * PHONE_ASPECT

const DUO_PHONE_HEIGHT = Math.min(H * 0.4, 340)
const DUO_PHONE_WIDTH = DUO_PHONE_HEIGHT * PHONE_ASPECT

type Nav = NativeStackNavigationProp<RootStackParamList>

type PageVisual =
  | { kind: 'single'; image: ImageSourcePropType }
  | { kind: 'duo'; first: ImageSourcePropType; second: ImageSourcePropType }
  | { kind: 'icon'; image: ImageSourcePropType; label?: string }
  | { kind: 'steps' }

type Page = {
  key: string
  visual: PageVisual
  number: string
  title: string
  description: string
}

const TOTAL = '06'

const PAGES: Page[] = [
  {
    key: '1',
    visual: {
      kind: 'single',
      image: require('../../../assets/onboarding/01-home.png'),
    },
    number: '01',
    title: 'サイトをサムネで残す',
    description:
      '気になったページを、画像付きで\nあなただけのギャラリーに。\nあとから一目で見返せます。',
  },
  {
    key: '2',
    visual: { kind: 'steps' },
    number: '02',
    title: '初回セットアップ',
    description:
      'ブラウザの共有メニューから保存できるよう、\n最初に一度だけ準備します。\n約30秒で終わります。',
  },
  {
    key: '3',
    visual: {
      kind: 'single',
      image: require('../../../assets/onboarding/02-tap-more.png'),
    },
    number: '03',
    title: '「その他」をタップ',
    description:
      'ブラウザで共有を開いて、\nアプリ一覧の右端にある\n「その他」を選びます。',
  },
  {
    key: '4',
    visual: {
      kind: 'single',
      image: require('../../../assets/onboarding/03-toggle-on.png'),
    },
    number: '04',
    title: 'サムネブクマをONに',
    description:
      'リストから「サムネブクマ」を有効化。\nこれで準備は完了です。',
  },
  {
    key: '5',
    visual: {
      kind: 'duo',
      first: require('../../../assets/onboarding/04-tap-app.png'),
      second: require('../../../assets/onboarding/05-save-screen.png'),
    },
    number: '05',
    title: '共有から1タップで保存',
    description:
      '共有メニューから「サムネブクマ」をタップ。\nサムネ・名前・フォルダを選んで\n保存するだけ。',
  },
  {
    key: '6',
    visual: {
      kind: 'icon',
      image: require('../../../assets/icon.png'),
      label: 'サムネブクマ',
    },
    number: '06',
    title: 'さあ、始めよう',
    description: 'あなただけのブックマーク集を\n作っていきましょう。',
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
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    })
  }

  const goNext = () => {
    if (currentIndex < PAGES.length - 1) {
      listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true })
    } else {
      finish()
    }
  }

  const isLast = currentIndex === PAGES.length - 1

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topBar}>
        <View style={styles.chapterRow}>
          <View style={styles.chapterLine} />
          <Text style={styles.chapterText}>
            <Text style={styles.chapterCurrent}>{PAGES[currentIndex].number}</Text>
            <Text style={styles.chapterTotal}> {'  /  '} {TOTAL}</Text>
          </Text>
        </View>
        {!isLast ? (
          <TouchableOpacity onPress={finish} hitSlop={12} style={styles.skipBtn}>
            <Text style={styles.skipText}>スキップ</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipBtnPlaceholder} />
        )}
      </View>

      <FlatList
        ref={listRef}
        data={PAGES}
        keyExtractor={(p) => p.key}
        renderItem={({ item, index }) => (
          <PageView page={item} active={index === currentIndex} />
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / W)
          setCurrentIndex(index)
        }}
        style={styles.flatList}
      />

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.dots}>
          {PAGES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={goNext}
          style={styles.nextBtn}
        >
          <Text style={styles.nextText}>{isLast ? '始める' : '次へ'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function PageView({ page, active }: { page: Page; active: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(16)).current
  const visualOpacity = useRef(new Animated.Value(0)).current
  const visualTranslate = useRef(new Animated.Value(10)).current

  useEffect(() => {
    if (active) {
      Animated.stagger(80, [
        Animated.parallel([
          Animated.timing(visualOpacity, {
            toValue: 1,
            duration: 550,
            useNativeDriver: true,
          }),
          Animated.timing(visualTranslate, {
            toValue: 0,
            duration: 550,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]).start()
    } else {
      opacity.setValue(0)
      translateY.setValue(16)
      visualOpacity.setValue(0)
      visualTranslate.setValue(10)
    }
  }, [active, opacity, translateY, visualOpacity, visualTranslate])

  return (
    <View style={[styles.page, { width: W }]}>
      <Animated.View
        style={[
          styles.visualArea,
          {
            opacity: visualOpacity,
            transform: [{ translateY: visualTranslate }],
          },
        ]}
      >
        <Visual visual={page.visual} />
      </Animated.View>

      <Animated.View
        style={[
          styles.textArea,
          { opacity, transform: [{ translateY }] },
        ]}
      >
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.description}>{page.description}</Text>
      </Animated.View>
    </View>
  )
}

function Visual({ visual }: { visual: PageVisual }) {
  if (visual.kind === 'single') {
    return (
      <PhoneFrame
        image={visual.image}
        width={SINGLE_PHONE_WIDTH}
        height={SINGLE_PHONE_HEIGHT}
      />
    )
  }
  if (visual.kind === 'duo') {
    return (
      <View style={styles.duoRow}>
        <PhoneFrame
          image={visual.first}
          width={DUO_PHONE_WIDTH}
          height={DUO_PHONE_HEIGHT}
        />
        <View style={styles.duoArrowWrap}>
          <Text style={styles.duoArrow}>›</Text>
        </View>
        <PhoneFrame
          image={visual.second}
          width={DUO_PHONE_WIDTH}
          height={DUO_PHONE_HEIGHT}
        />
      </View>
    )
  }
  if (visual.kind === 'icon') {
    return (
      <View style={styles.iconWrap}>
        <View style={styles.iconHaloOuter} />
        <View style={styles.iconHaloInner} />
        <Image source={visual.image} style={styles.iconImage} />
        {visual.label ? (
          <Text style={styles.iconLabel}>{visual.label}</Text>
        ) : null}
      </View>
    )
  }
  // steps
  return (
    <View style={styles.stepsBlock}>
      <View style={styles.stepsRow}>
        {[1, 2, 3].map((n) => (
          <View key={n} style={styles.stepGroup}>
            {n > 1 && <View style={styles.stepLine} />}
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>{n}</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.stepsCaption}>3つの簡単なステップ</Text>
    </View>
  )
}

function PhoneFrame({
  image,
  width,
  height,
}: {
  image: ImageSourcePropType
  width: number
  height: number
}) {
  return (
    <View style={[styles.phoneFrame, { width, height }]}>
      <Image source={image} style={styles.phoneImage} resizeMode="cover" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 6,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chapterLine: {
    width: 24,
    height: 1,
    backgroundColor: PALETTE.ink,
  },
  chapterText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2.5,
  },
  chapterCurrent: {
    color: PALETTE.ink,
  },
  chapterTotal: {
    color: PALETTE.textMuted,
    fontWeight: '500',
  },
  skipBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  skipBtnPlaceholder: {
    width: 60,
  },
  skipText: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.6,
  },
  flatList: {
    flex: 1,
  },
  page: {
    flex: 1,
    paddingTop: 8,
  },
  visualArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  textArea: {
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 8,
    minHeight: 140,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: PALETTE.ink,
    letterSpacing: -0.4,
    lineHeight: 34,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14.5,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  phoneFrame: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: PALETTE.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  phoneImage: {
    width: '100%',
    height: '100%',
  },
  duoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  duoArrowWrap: {
    paddingHorizontal: 10,
  },
  duoArrow: {
    fontSize: 38,
    color: PALETTE.textMuted,
    fontWeight: '200',
    lineHeight: 40,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHaloOuter: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#F2EFE8',
    opacity: 0.6,
  },
  iconHaloInner: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#E9E5DC',
    opacity: 0.7,
  },
  iconImage: {
    width: 144,
    height: 144,
    borderRadius: 34,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  iconLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.ink,
    letterSpacing: 1.5,
    marginTop: 28,
  },
  stepsBlock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PALETTE.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  stepNumber: {
    color: PALETTE.surface,
    fontSize: 22,
    fontWeight: '700',
  },
  stepLine: {
    width: 32,
    height: 1,
    backgroundColor: PALETTE.divider,
  },
  stepsCaption: {
    marginTop: 26,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 2,
    color: PALETTE.textMuted,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 22,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: PALETTE.divider,
  },
  dotActive: {
    width: 24,
    backgroundColor: PALETTE.ink,
  },
  nextBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: PALETTE.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600',
    color: PALETTE.surface,
    letterSpacing: 1.2,
  },
})
