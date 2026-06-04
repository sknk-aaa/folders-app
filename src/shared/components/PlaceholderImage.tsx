import { View, Text, StyleSheet } from 'react-native'
import { useThemedStyles, type Palette } from '../theme'

type Props = {
  width?: number
  height?: number
  style?: object
}

export function PlaceholderImage({ width, height, style }: Props) {
  const { styles } = useThemedStyles(makeStyles)
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
      <Text style={styles.text}>No image</Text>
    </View>
  )
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: {
      backgroundColor: c.placeholderBg,
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
      color: c.textTertiary,
    },
  })
