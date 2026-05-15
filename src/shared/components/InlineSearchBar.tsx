import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { colors, spacing } from '../theme'

type Props = {
  query: string
  onChangeText: (t: string) => void
  onCancel: () => void
  placeholder?: string
}

export function InlineSearchBar({ query, onChangeText, onCancel, placeholder = '検索' }: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={onChangeText}
        autoFocus
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      <TouchableOpacity onPress={onCancel} style={styles.cancel}>
        <Text style={styles.cancelText}>キャンセル</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: 34,
    backgroundColor: colors.placeholderBg,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    fontSize: 15,
    color: colors.text,
  },
  cancel: {
    flexShrink: 0,
  },
  cancelText: {
    fontSize: 15,
    color: colors.text,
  },
})
