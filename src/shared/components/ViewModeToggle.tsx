import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { colors } from '../theme'
import type { ViewMode } from '../types'

type Props = {
  value: ViewMode
  onGridPress: () => void
  onListPress: () => void
}

export function ViewModeToggle({ value, onGridPress, onListPress }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onGridPress}
        style={[styles.button, value === 'grid' && styles.buttonActive]}
        accessibilityRole="button"
        accessibilityLabel="グリッド表示"
      >
        <View style={styles.gridIcon}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.gridDot} />
          ))}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onListPress}
        style={[styles.button, value === 'list' && styles.buttonActive]}
        accessibilityRole="button"
        accessibilityLabel="リスト表示"
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  button: {
    width: 36,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  buttonActive: {
    backgroundColor: colors.placeholderBg,
  },
  gridIcon: {
    width: 15,
    height: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  gridDot: {
    width: 6,
    height: 6,
    borderRadius: 1.5,
    backgroundColor: colors.text,
  },
  listIcon: {
    gap: 4,
  },
  listLine: {
    width: 17,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.text,
  },
})
