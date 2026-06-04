import { useRef, useState } from 'react'
import {
  Alert,
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
import { useVideoPlayer, VideoView } from 'expo-video'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSettingsStore } from '../settings/store'
import type { RootStackParamList } from '../../shared/types'
import { requestNotificationPermission, scheduleWeeklyReminder } from '../notifications/engine'
import { tr } from '../../shared/i18n'

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

const PHONE_ASPECT = 0.46

const SINGLE_PHONE_HEIGHT = Math.min(H * 0.48, 390)
const SINGLE_PHONE_WIDTH = SINGLE_PHONE_HEIGHT * PHONE_ASPECT

type Nav = NativeStackNavigationProp<RootStackParamList>

type PageVisual =
  | { kind: 'welcome'; image: ImageSourcePropType }
  | { kind: 'single'; image: ImageSourcePropType; aspectRatio?: number }
  | { kind: 'video'; source: number; aspectRatio?: number }
  | { kind: 'duo'; first: ImageSourcePropType; second: ImageSourcePropType; firstAspect?: number; secondAspect?: number }
  | { kind: 'icon'; image: ImageSourcePropType; label?: string; singleHalo?: boolean }
  | { kind: 'steps' }

type Page = {
  key: string
  visual: PageVisual
  number: string
  title: string
  description: string
  bgColor?: string
  showDivider?: boolean
}

const TOTAL = '04'

const PAGES: Page[] = [
  {
    key: '1',
    visual: {
      kind: 'welcome',
      image: require('../../../assets/onboarding/welcome.png'),
    },
    number: '01',
    title: tr({ en: 'Save Sites as Thumbnails', ja: '気になるページを、\nすっきり保存。' }),
    description: tr({
      en: 'Turn pages that catch your eye into a personal gallery, complete with images. Browse them back at a glance.',
      ja: 'ブラウザから1タップで、\n画像つきブックマークに。',
    }),
  },
  {
    key: 'view-modes',
    visual: {
      kind: 'video',
      source: require('../../../assets/onboarding/movie_02.mp4'),
    },
    number: '02',
    title: tr({ en: 'Three Ways to Browse', ja: '3つの表示モード' }),
    description: tr({
      en: 'Switch between grid, list, and photo views to see your bookmarks just the way you like.',
      ja: 'グリッド・リスト・写真の3つの表示を切り替えて、自分好みでブックマークを見返せます。',
    }),
  },
  {
    key: '4',
    visual: {
      kind: 'duo',
      first: require('../../../assets/onboarding/04-tap-app.png'),
      second: require('../../../assets/onboarding/05-save-screen.png'),
      firstAspect: 1284 / 1819,
      secondAspect: 828 / 1792,
    },
    number: '03',
    title: tr({ en: 'Save with One Tap from Share', ja: '共有から1タップで保存' }),
    description: tr({
      en: 'Tap "Bookrest" in the share menu. Just pick a thumbnail, name, and folder, then save.',
      ja: '共有メニューから「サムネブクマ」をタップ。\nサムネ・名前・フォルダを選んで\n保存するだけ。',
    }),
  },
  {
    key: '5',
    visual: {
      kind: 'icon',
      image: require('../../../assets/icon.png'),
      label: tr({ en: 'Bookrest', ja: 'サムネブクマ' }),
    },
    number: '04',
    title: tr({ en: "Let's Get Started", ja: 'さあ、始めよう' }),
    description: tr({
      en: "Let's start building your very own bookmark collection.",
      ja: 'あなただけのブックマーク集を\n作っていきましょう。',
    }),
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
      const next = currentIndex + 1
      setCurrentIndex(next)
      listRef.current?.scrollToIndex({ index: next, animated: true })
    } else {
      // Last page: prompt for notification permission for unread reminders, then finish
      Alert.alert(
        tr({ en: 'Get reminded of unread bookmarks', ja: '積ん読をお知らせします' }),
        tr({
          en: "When you haven't viewed your saved bookmarks yet, we'll remind you once a week.",
          ja: '登録したブックマークをまだ見ていないとき、週1回お知らせします。',
        }),
        [
          {
            text: tr({ en: 'Skip', ja: 'スキップ' }),
            style: 'cancel',
            onPress: finish,
          },
          {
            text: tr({ en: 'Allow', ja: '許可する' }),
            onPress: async () => {
              const granted = await requestNotificationPermission()
              if (granted) {
                set('notification_enabled', true)
                await scheduleWeeklyReminder(0)
              }
              finish()
            },
          },
        ],
      )
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
        <TouchableOpacity onPress={finish} hitSlop={12} style={styles.skipBtn}>
          <Text style={styles.skipText}>{tr({ en: 'Skip', ja: 'スキップ' })}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={PAGES}
        keyExtractor={(p) => p.key}
        renderItem={({ item }) => <PageView page={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / W)
          setCurrentIndex(index)
        }}
        onScrollEndDrag={(e) => {
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
          <Text style={styles.nextText}>{isLast ? tr({ en: 'Get Started', ja: '始める' }) : tr({ en: 'Next', ja: '次へ' })}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function PageView({ page }: { page: Page }) {
  const isWelcome = page.visual.kind === 'welcome'
  const isDuo = page.visual.kind === 'duo'

  return (
    <View style={[styles.page, { width: W, backgroundColor: page.bgColor }]}>
      <View
        style={[
          styles.visualArea,
          isWelcome && styles.visualAreaWelcome,
          isDuo && styles.visualAreaDuo,
        ]}
      >
        <Visual visual={page.visual} />
      </View>

      <View
        style={[
          styles.textArea,
          page.bgColor ? { backgroundColor: page.bgColor } : undefined,
        ]}
      >
        <Text style={styles.title}>{page.title}</Text>
        {page.showDivider && <View style={styles.titleDivider} />}
        <Text style={styles.description}>{page.description}</Text>
      </View>
    </View>
  )
}

function Visual({ visual }: { visual: PageVisual }) {
  if (visual.kind === 'welcome') {
    return <WelcomeVisual image={visual.image} />
  }
  if (visual.kind === 'single') {
    const ratio = visual.aspectRatio ?? PHONE_ASPECT
    const maxWidth = W - 40
    let width: number, height: number
    if (ratio >= 1) {
      width = Math.min(maxWidth, 310)
      height = width / ratio
    } else {
      height = SINGLE_PHONE_HEIGHT
      width = height * ratio
      if (width > maxWidth) {
        width = maxWidth
        height = width / ratio
      }
    }
    return <PhoneFrame image={visual.image} width={width} height={height} />
  }
  if (visual.kind === 'video') {
    const ratio = visual.aspectRatio ?? PHONE_ASPECT
    const maxWidth = W - 40
    let width = SINGLE_PHONE_HEIGHT * ratio
    let height = SINGLE_PHONE_HEIGHT
    if (width > maxWidth) {
      width = maxWidth
      height = width / ratio
    }
    return <VideoFrame source={visual.source} width={width} height={height} />
  }
  if (visual.kind === 'duo') {
    const fa = visual.firstAspect ?? PHONE_ASPECT
    const sa = visual.secondAspect ?? PHONE_ASPECT
    const arrowSpace = 28
    const frameWidth = Math.min((W - 4 - arrowSpace) / 2, 172)
    const h1 = frameWidth / fa
    const h2 = frameWidth / sa
    const shorterH = Math.min(h1, h2)
    return (
      <View style={[styles.duoRow, { alignItems: 'flex-end' }]}>
        <PhoneFrame image={visual.first} width={frameWidth} height={h1} />
        <View style={[styles.duoArrowWrap, { height: shorterH, justifyContent: 'center' }]}>
          <Text style={styles.duoArrow}>›</Text>
        </View>
        <PhoneFrame image={visual.second} width={frameWidth} height={h2} />
      </View>
    )
  }
  if (visual.kind === 'icon') {
    return (
      <View style={styles.iconWrap}>
        <View style={styles.iconHaloOuter} />
        {!visual.singleHalo && <View style={styles.iconHaloInner} />}
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
      <Text style={styles.stepsCaption}>Three easy steps</Text>
    </View>
  )
}

function WelcomeVisual({ image }: { image: ImageSourcePropType }) {
  return (
    <View style={styles.welcomeArtworkFrame}>
      <Image source={image} style={styles.welcomeArtwork} resizeMode="contain" />
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

function VideoFrame({
  source,
  width,
  height,
}: {
  source: number
  width: number
  height: number
}) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true
    p.muted = true
    p.play()
  })
  return (
    <View style={[styles.phoneFrame, { width, height }]}>
      <VideoView
        player={player}
        style={styles.phoneImage}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
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
  visualAreaWelcome: {
    paddingHorizontal: 4,
  },
  visualAreaDuo: {
    paddingHorizontal: 2,
  },
  textArea: {
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 8,
    minHeight: 140,
  },
  titleDivider: {
    width: 36,
    height: 2,
    backgroundColor: '#C4A47C',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2C1A10',
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
  welcomeArtworkFrame: {
    width: Math.min(W - 8, 380),
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeArtwork: {
    width: '100%',
    height: '100%',
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
    width: 28,
    alignItems: 'center',
  },
  duoArrow: {
    fontSize: 34,
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
