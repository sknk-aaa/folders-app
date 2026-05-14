import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, DrawerActions } from '@react-navigation/native'
import { colors, spacing } from '../theme'

type Props = {
  title: string
  showBack?: boolean
  onBack?: () => void
  showSearch?: boolean
  onSearch?: () => void
  showAdd?: boolean
  onAdd?: () => void
  showMore?: boolean
  onMore?: () => void
  leftSlot?: React.ReactNode
}

export function Header({
  title,
  showBack = false,
  onBack,
  showSearch = false,
  onSearch,
  showAdd = false,
  onAdd,
  showMore = false,
  onMore,
  leftSlot,
}: Props) {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigation.goBack()
    }
  }

  const handleMenu = () => {
    navigation.dispatch(DrawerActions.openDrawer())
  }

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        {/* Left */}
        <View style={styles.left}>
          {showBack ? (
            <TouchableOpacity onPress={handleBack} style={styles.iconBtn} hitSlop={8}>
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleMenu} style={styles.iconBtn} hitSlop={8}>
              <HamburgerIcon />
            </TouchableOpacity>
          )}
          {leftSlot}
        </View>

        {/* Center */}
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* Right */}
        <View style={styles.right}>
          {showSearch && (
            <TouchableOpacity onPress={onSearch} style={styles.iconBtn} hitSlop={8}>
              <SearchIcon />
            </TouchableOpacity>
          )}
          {showAdd && (
            <TouchableOpacity onPress={onAdd} style={styles.iconBtn} hitSlop={8}>
              <Text style={styles.addIcon}>+</Text>
            </TouchableOpacity>
          )}
          {showMore && (
            <TouchableOpacity onPress={onMore} style={styles.iconBtn} hitSlop={8}>
              <Text style={styles.moreIcon}>•••</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

function HamburgerIcon() {
  return (
    <View style={{ gap: 4, paddingVertical: 2 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ width: 20, height: 1.5, backgroundColor: colors.text, borderRadius: 1 }} />
      ))}
    </View>
  )
}

function SearchIcon() {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: 13,
          height: 13,
          borderRadius: 7,
          borderWidth: 1.8,
          borderColor: colors.text,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 1,
          right: 1,
          width: 6,
          height: 1.8,
          backgroundColor: colors.text,
          borderRadius: 1,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.headerBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: spacing.lg,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  center: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    gap: 16,
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 24,
    minHeight: 24,
  },
  backArrow: {
    fontSize: 30,
    color: colors.text,
    lineHeight: 30,
    marginTop: -2,
    fontWeight: '300',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  addIcon: {
    fontSize: 24,
    color: colors.text,
    lineHeight: 26,
    fontWeight: '300',
  },
  moreIcon: {
    fontSize: 10,
    color: colors.text,
    letterSpacing: 1,
  },
})
