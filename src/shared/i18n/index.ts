import { NativeModules, Platform } from 'react-native'

// Read the device language without expo-localization, using core React Native.
// Used as a fallback on dev clients that were built before expo-localization was
// added (where requiring it throws). Returns a 2-letter code or null.
function deviceLanguageFromRN(): string | null {
  try {
    if (Platform.OS === 'ios') {
      const settings = NativeModules.SettingsManager?.settings
      const raw: string | undefined = settings?.AppleLocale || settings?.AppleLanguages?.[0]
      return raw ? raw.split(/[-_]/)[0] : null
    }
    const raw: string | undefined = NativeModules.I18nManager?.localeIdentifier
    return raw ? raw.split(/[-_]/)[0] : null
  } catch {
    return null
  }
}

// Resolve the device language once at startup. iOS restarts the app when the
// per-app language changes, so reading this a single time is sufficient.
//
// expo-localization is a native module. On a dev client built before it was added,
// requiring it throws ("Cannot find native module 'ExpoLocalization'"). In that case
// we fall back to the device language via core RN, and finally to Japanese.
function resolveLanguageCode(): string {
  try {
    const Localization = require('expo-localization') as {
      getLocales: () => { languageCode?: string | null }[]
    }
    const code = Localization.getLocales()[0]?.languageCode
    if (code) return code
  } catch {
    // expo-localization unavailable (old dev client) — fall through.
  }
  return deviceLanguageFromRN() ?? 'ja'
}

const languageCode = resolveLanguageCode()

export const lang: 'ja' | 'en' = languageCode === 'ja' ? 'ja' : 'en'

export const isJa = lang === 'ja'

// Pick the string for the current device language. Japanese devices get `ja`,
// everything else falls back to English.
export function tr(s: { en: string; ja: string }): string {
  return s[lang]
}
