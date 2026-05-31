import { create } from 'zustand'
import * as StoreReview from 'expo-store-review'
import { getDb } from '../../shared/db/client'
import type { Settings, GridColumns } from '../../shared/types'

// 3回保存して価値を感じた段階で1回だけレビュー依頼を出す
const REVIEW_AFTER_SAVES = 3

const DEFAULTS: Settings = {
  default_browser: 'safari',
  capture_thumbnail: true,
  grid_columns: 2,
  view_mode: 'grid',
  is_premium: false,
  tutorial_completed: false,
  last_selected_folder_id: null,
  default_folder_id: null,
  save_count: 0,
  review_prompted: false,
  last_backup_at: null,
}

type SettingsStore = {
  settings: Settings
  load: () => void
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  recordSaveForReview: () => Promise<void>
}

function parse(key: keyof Settings, raw: string): Settings[keyof Settings] {
  switch (key) {
    case 'capture_thumbnail':
    case 'is_premium':
    case 'tutorial_completed':
    case 'review_prompted':
      return raw === 'true'
    case 'grid_columns':
      return (parseInt(raw, 10) || 2) as GridColumns
    case 'save_count':
      return parseInt(raw, 10) || 0
    case 'last_backup_at':
      return raw ? parseInt(raw, 10) || null : null
    case 'last_selected_folder_id':
    case 'default_folder_id':
      return raw || null
    default:
      return raw
  }
}

export const useSettingsStore = create<SettingsStore>((setState, getState) => ({
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

  recordSaveForReview: async () => {
    const { settings, set } = getState()
    if (settings.review_prompted) return
    const next = settings.save_count + 1
    set('save_count', next)
    if (next < REVIEW_AFTER_SAVES) return
    if (!(await StoreReview.isAvailableAsync())) return
    set('review_prompted', true)
    await StoreReview.requestReview()
  },
}))
