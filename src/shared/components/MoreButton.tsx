import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useThemedStyles, type Palette } from '../theme'

type Props = { onPress: () => void }

export function MoreButton({ onPress }: Props) {
  const { styles } = useThemedStyles(makeStyles)
  return (
    <TouchableOpacity onPress={onPress} hitSlop={8} style={styles.btn}>
      <Text style={styles.dots}>⋮</Text>
    </TouchableOpacity>
  )
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    btn: { paddingHorizontal: 4, paddingVertical: 8 },
    dots: {
      fontSize: 20,
      color: c.textSecondary,
      lineHeight: 20,
      letterSpacing: -3,
    },
  })
