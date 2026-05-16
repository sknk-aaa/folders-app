import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../theme'

type Props = {
  width?: number
  height?: number
  style?: object
}

export function PlaceholderImage({ width, height, style }: Props) {
  return (
    <View
      style={[
        styles.container,
        width !== undefined && { width },
        height !== undefined && { height },
        style,
      ]}
    >
      <Text style={styles.icon}>🖼</Text>
      <Text style={styles.text}>画像がありません</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.placeholderBg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  icon: {
    fontSize: 24,
    opacity: 0.4,
  },
  text: {
    fontSize: 11,
    color: colors.textTertiary,
  },
})
