// Resolve the device language once at startup. iOS restarts the app when the
// per-app language changes, so reading this a single time is sufficient.
//
// expo-localization is a native module. On a dev client that was built before it
// was added, requiring it throws ("Cannot find native module 'ExpoLocalization'").
// Guard it so the app still runs (falling back to Japanese, the primary language)
// instead of hard-crashing at startup. Production builds always have the module.
function resolveLanguageCode(): string {
  try {
    const Localization = require('expo-localization') as {
      getLocales: () => { languageCode?: string | null }[]
    }
    return Localization.getLocales()[0]?.languageCode ?? 'ja'
  } catch {
    return 'ja'
  }
}

const languageCode = resolveLanguageCode()

export const lang: 'ja' | 'en' = languageCode === 'ja' ? 'ja' : 'en'

export const isJa = lang === 'ja'

// Pick the string for the current device language. Japanese devices get `ja`,
// everything else falls back to English.
export function tr(s: { en: string; ja: string }): string {
  return s[lang]
}
