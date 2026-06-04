import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { useThemedStyles, type Palette } from '../theme'
import type { ViewMode } from '../types'

type Props = {
  value: ViewMode
  onGridPress: () => void
  onPhotoPress?: () => void
  onListPress: () => void
}

export function ViewModeToggle({ value, onGridPress, onPhotoPress, onListPress }: Props) {
  const { styles } = useThemedStyles(makeStyles)
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onGridPress}
        style={[styles.button, value === 'grid' && styles.buttonActive]}
        accessibilityRole="button"
        accessibilityLabel="Grid view"
      >
        <View style={styles.gridIcon}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.gridDot} />
          ))}
        </View>
      </TouchableOpacity>
      {onPhotoPress && (
        <TouchableOpacity
          onPress={onPhotoPress}
          style={[styles.button, value === 'photo' && styles.buttonActive]}
          accessibilityRole="button"
          accessibilityLabel="Photo view"
        >
          <View style={styles.photoIcon}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <View key={i} style={styles.photoDot} />
            ))}
          </View>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={onListPress}
        style={[styles.button, value === 'list' && styles.buttonActive]}
        accessibilityRole="button"
        accessibilityLabel="List view"
      >
        <View style={styles.listIcon}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.listLine} />
          ))}
        </View>
      </TouchableOpacity>
    </View>
  )
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      padding: 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.divider,
      borderRadius: 12,
      backgroundColor: c.surfaceElevated,
    },
    button: {
      width: 34,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
    },
    buttonActive: {
      backgroundColor: c.placeholderBg,
    },
    gridIcon: {
      width: 15,
      height: 15,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 2,
    },
    gridDot: {
      width: 6,
      height: 6,
      borderRadius: 1.5,
      backgroundColor: c.text,
    },
    photoIcon: {
      width: 15,
      height: 15,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 1.5,
    },
    photoDot: {
      width: 4,
      height: 4,
      borderRadius: 1,
      backgroundColor: c.text,
    },
    listIcon: {
      gap: 2.7,
    },
    listLine: {
      width: 15,
      height: 2,
      borderRadius: 1,
      backgroundColor: c.text,
    },
  })
