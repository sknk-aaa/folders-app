import { getLocales } from 'expo-localization'

// Resolve the device language once at startup. iOS restarts the app when the
// per-app language changes, so reading this a single time is sufficient.
const languageCode = getLocales()[0]?.languageCode ?? 'en'

export const lang: 'ja' | 'en' = languageCode === 'ja' ? 'ja' : 'en'

export const isJa = lang === 'ja'

// Pick the string for the current device language. Japanese devices get `ja`,
// everything else falls back to English.
export function tr(s: { en: string; ja: string }): string {
  return s[lang]
}
