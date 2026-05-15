import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radius, spacing } from '../theme'

type Option = {
  label: string
  onPress: () => void
  destructive?: boolean
}

type Props = {
  visible: boolean
  title?: string
  options: Option[]
  onCancel: () => void
}

export function CustomActionSheet({ visible, title, options, onCancel }: Props) {
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
          onPress={() => undefined}
        >
          {title ? (
            <View style={styles.titleRow}>
              <Text style={styles.titleText}>{title}</Text>
            </View>
          ) : null}

          {options.map((opt, i) => (
            <View key={i}>
              {i > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                activeOpacity={0.6}
                style={styles.optionBtn}
                onPress={() => {
                  onCancel()
                  opt.onPress()
                }}
              >
                <Text style={[styles.optionText, opt.destructive && styles.optionTextDestructive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.cancelSeparator} />
          <TouchableOpacity activeOpacity={0.6} style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>キャンセル</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: spacing.lg,
  },
  titleRow: {
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  optionBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 17,
    color: colors.text,
  },
  optionTextDestructive: {
    color: '#FF3B30',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
  },
  cancelSeparator: {
    height: 8,
  },
  cancelBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: colors.placeholderBg,
    borderRadius: radius.md,
    marginBottom: 8,
  },
  cancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
})
