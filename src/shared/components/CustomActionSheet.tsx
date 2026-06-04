import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemedStyles, radius, spacing, type Palette } from '../theme'

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
  const { styles } = useThemedStyles(makeStyles)

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

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: c.surfaceElevated,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 8,
      paddingHorizontal: spacing.lg,
    },
    titleRow: {
      paddingVertical: 12,
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.separator,
      marginBottom: 4,
    },
    titleText: {
      fontSize: 13,
      color: c.textSecondary,
    },
    optionBtn: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    optionText: {
      fontSize: 17,
      color: c.text,
    },
    optionTextDestructive: {
      color: c.destructive,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.separator,
    },
    cancelSeparator: {
      height: 8,
    },
    cancelBtn: {
      paddingVertical: 16,
      alignItems: 'center',
      backgroundColor: c.placeholderBg,
      borderRadius: radius.md,
      marginBottom: 8,
    },
    cancelText: {
      fontSize: 17,
      fontWeight: '600',
      color: c.text,
    },
  })
