import { create } from 'zustand'
import { getDb } from '../../shared/db/client'
import type { Settings, GridColumns } from '../../shared/types'

const DEFAULTS: Settings = {
  default_browser: 'safari',
  capture_thumbnail: true,
  grid_columns: 2,
  view_mode: 'grid',
  is_premium: false,
  tutorial_completed: false,
  last_selected_folder_id: null,
}

type SettingsStore = {
  settings: Settings
  load: () => void
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

function parse(key: keyof Settings, raw: string): Settings[keyof Settings] {
  switch (key) {
    case 'capture_thumbnail':
    case 'is_premium':
    case 'tutorial_completed':
      return raw === 'true'
    case 'grid_columns':
      return (parseInt(raw, 10) || 2) as GridColumns
    case 'last_selected_folder_id':
      return raw || null
    default:
      return raw
  }
}

export const useSettingsStore = create<SettingsStore>((setState) => ({
  settings: DEFAULTS,

  load: () => {
    const db = getDb()
    const rows = db.getAllSync<{ key: string; value: string }>('SELECT key, value FROM settings')
    const settings = { ...DEFAULTS }
    rows.forEach(({ key, value }) => {
      if (key in settings) {
        ;(settings as Record<string, unknown>)[key] = parse(key as keyof Settings, value)
      }
    })
    setState({ settings })
  },

  set: (key, value) => {
    const db = getDb()
    const strValue = value === null ? '' : String(value)
    db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, strValue])
    setState((state) => ({ settings: { ...state.settings, [key]: value } }))
  },
}))
