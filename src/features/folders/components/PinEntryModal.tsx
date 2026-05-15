import { useState } from 'react'
import { View, Text, TouchableOpacity, Modal, StyleSheet, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, radius } from '../../../shared/theme'

type Props =
  | { mode: 'unlock'; correctPin: string; onSuccess: () => void; onCancel: () => void }
  | { mode: 'set'; onSet: (pin: string) => void; onCancel: () => void }

export function PinEntryModal(props: Props) {
  const insets = useSafeAreaInsets()
  const [input, setInput] = useState('')
  const [confirmInput, setConfirmInput] = useState('')
  const [step, setStep] = useState<'enter' | 'confirm'>('enter')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleDigit = (d: string) => {
    setError('')
    if (props.mode === 'unlock') {
      const next = input + d
      setInput(next)
      if (next.length === 4) {
        if (next === props.correctPin) {
          setSuccess(true)
          setTimeout(() => {
            setInput('')
            setSuccess(false)
            props.onSuccess()
          }, 500)
        } else {
          setError('PINが違います')
          setInput('')
        }
      }
    } else {
      if (step === 'enter') {
        const next = input + d
        setInput(next)
        if (next.length === 4) {
          setStep('confirm')
        }
      } else {
        const next = confirmInput + d
        setConfirmInput(next)
        if (next.length === 4) {
          if (next === input) {
            const pin = input
            setSuccess(true)
            setTimeout(() => {
              setInput('')
              setConfirmInput('')
              setStep('enter')
              setSuccess(false)
              props.onSet(pin)
            }, 500)
          } else {
            setError('PINが一致しません')
            setConfirmInput('')
            setInput('')
            setStep('enter')
          }
        }
      }
    }
  }

  const handleDelete = () => {
    setError('')
    if (props.mode === 'unlock' || step === 'enter') {
      setInput((prev) => prev.slice(0, -1))
    } else {
      setConfirmInput((prev) => prev.slice(0, -1))
    }
  }

  const handleCancel = () => {
    setInput('')
    setConfirmInput('')
    setStep('enter')
    setError('')
    props.onCancel()
  }

  const currentLength = success ? 4 : (props.mode === 'unlock' || step === 'enter' ? input.length : confirmInput.length)

  const title = success
    ? (props.mode === 'unlock' ? 'ロックを解除しました' : 'PINを設定しました')
    : props.mode === 'unlock'
      ? 'PINを入力'
      : step === 'enter'
        ? '新しいPINを入力'
        : 'PINを再入力して確認'

  return (
    <Modal visible animationType="fade" transparent onRequestClose={handleCancel}>
      <Pressable style={styles.backdrop} onPress={handleCancel}>
        <Pressable style={[styles.panel, { paddingBottom: insets.bottom + 24 }]} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.dots}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.dot, i < currentLength && (success ? styles.dotSuccess : styles.dotFilled)]} />
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : <View style={styles.errorPlaceholder} />}

          <View style={styles.pad}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <TouchableOpacity key={d} style={styles.key} onPress={() => handleDigit(d)} activeOpacity={0.6}>
                <Text style={styles.keyText}>{d}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.keyEmpty} />
            <TouchableOpacity style={styles.key} onPress={() => handleDigit('0')} activeOpacity={0.6}>
              <Text style={styles.keyText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.key} onPress={handleDelete} activeOpacity={0.6}>
              <Text style={styles.keyText}>⌫</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 28,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 28,
  },
  dots: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
  },
  dotFilled: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  dotSuccess: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  error: {
    fontSize: 13,
    color: '#FF3B30',
    marginBottom: 8,
    height: 18,
  },
  errorPlaceholder: {
    height: 26,
  },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 240,
    gap: 16,
    justifyContent: 'center',
    marginBottom: 24,
  },
  key: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.placeholderBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: {
    width: 68,
    height: 68,
  },
  keyText: {
    fontSize: 22,
    fontWeight: '500',
    color: colors.text,
  },
  cancelBtn: {
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
})
