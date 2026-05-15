import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { colors } from '../theme'

type Props = { onPress: () => void }

export function MoreButton({ onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={8} style={styles.btn}>
      <Text style={styles.dots}>⋮</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 4, paddingVertical: 8 },
  dots: {
    fontSize: 20,
    color: colors.textSecondary,
    lineHeight: 20,
    letterSpacing: -3,
  },
})
