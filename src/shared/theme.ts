export const colors = {
  background: '#FFFFFF',
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
