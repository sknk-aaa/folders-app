import { useMemo } from 'react'
import { StyleSheet, useColorScheme } from 'react-native'
import { useSettingsStore } from '../features/settings/store'

export type Palette = {
  background: string
  surface: string
  surfaceElevated: string
  text: string
  textSecondary: string
  textTertiary: string
  separator: string
  cardBorder: string
  divider: string
  placeholderBg: string
  accent: string
  destructive: string
  headerBg: string
  drawerBg: string
  iconBg: string
}

export const lightColors: Palette = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8A8A8E',
  textTertiary: '#C7C7CC',
  separator: '#D0D0D0',
  cardBorder: '#E6E6E6',
  divider: '#E8E8E8',
  placeholderBg: '#F2F2F2',
  accent: '#007AFF',
  destructive: '#FF3B30',
  headerBg: '#FFFFFF',
  drawerBg: '#FFFFFF',
  iconBg: '#F0F0F0',
}

export const darkColors: Palette = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#9A9AA0',
  textTertiary: '#5C5C60',
  separator: '#38383A',
  cardBorder: '#2E2E30',
  divider: '#2C2C2E',
  placeholderBg: '#2C2C2E',
  accent: '#0A84FF',
  destructive: '#FF453A',
  headerBg: '#000000',
  drawerBg: '#000000',
  iconBg: '#2C2C2E',
}

export function useTheme(): Palette {
  const mode = useSettingsStore((s) => s.settings.theme_mode)
  const system = useColorScheme()
  const isDark = mode === 'dark' || (mode === 'auto' && system === 'dark')
  return isDark ? darkColors : lightColors
}

// makeStyles(c) を現在のテーマでメモ化し、生の palette も併せて返す。
// 使い方: const { c, styles } = useThemedStyles(makeStyles)
export function useThemedStyles<T>(factory: (c: Palette) => T): { c: Palette; styles: T } {
  const c = useTheme()
  const styles = useMemo(() => factory(c), [c])
  return { c, styles }
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
}

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
}

// Favicon letter background colors (deterministic by char code)
export const faviconColors = [
  '#4CAF50', '#2196F3', '#FF9800', '#9C27B0',
  '#F44336', '#00BCD4', '#FF5722', '#795548',
  '#607D8B', '#E91E63',
]

export function getFaviconColor(url: string): string {
  try {
    const hostname = new URL(url).hostname
    const code = hostname.charCodeAt(0) || 0
    return faviconColors[code % faviconColors.length]
  } catch {
    return faviconColors[0]
  }
}

export function getFaviconLetter(url: string): string {
  try {
    return new URL(url).hostname.charAt(0).toUpperCase()
  } catch {
    return '?'
  }
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
