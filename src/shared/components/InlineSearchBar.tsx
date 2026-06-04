import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useThemedStyles, spacing, type Palette } from '../theme'

type Props = {
  query: string
  onChangeText: (t: string) => void
  onCancel: () => void
  placeholder?: string
}

export function InlineSearchBar({ query, onChangeText, onCancel, placeholder = 'Search' }: Props) {
  const { c, styles } = useThemedStyles(makeStyles)
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={onChangeText}
        autoFocus
        placeholder={placeholder}
        placeholderTextColor={c.textSecondary}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      <TouchableOpacity onPress={onCancel} style={styles.cancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  )
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    input: {
      flex: 1,
      height: 34,
      backgroundColor: c.placeholderBg,
      borderRadius: 10,
      paddingHorizontal: spacing.sm,
      fontSize: 15,
      color: c.text,
    },
    cancel: {
      flexShrink: 0,
    },
    cancelText: {
      fontSize: 15,
      color: c.text,
    },
  })
