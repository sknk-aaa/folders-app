import { create } from 'zustand'
import * as StoreReview from 'expo-store-review'
import { getDb } from '../../shared/db/client'
import type { Settings, GridColumns } from '../../shared/types'

// レビュー依頼を出すタイミング。各カウンターがマイルストーン値を
// ちょうど通過した時に1回だけ発火する（カウンターは1ずつしか増えないので各値1回）。
// iOS側で年≤3回に間引かれるため、複数仕込んでも出しすぎにはならない。
const SAVE_REVIEW_MILESTONES = [3, 10]
const LAUNCH_REVIEW_MILESTONE = 5

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
  launch_count: 0,
  last_backup_at: null,
}

async function requestReviewIfAvailable(): Promise<void> {
  if (!(await StoreReview.isAvailableAsync())) return
  await StoreReview.requestReview()
}

type SettingsStore = {
  settings: Settings
  load: () => void
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  recordSaveForReview: () => Promise<void>
  recordLaunchForReview: () => Promise<void>
}

function parse(key: keyof Settings, raw: string): Settings[keyof Settings] {
  switch (key) {
    case 'capture_thumbnail':
    case 'is_premium':
    case 'tutorial_completed':
      return raw === 'true'
    case 'grid_columns':
      return (parseInt(raw, 10) || 2) as GridColumns
    case 'save_count':
    case 'launch_count':
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
    const next = settings.save_count + 1
    set('save_count', next)
    if (SAVE_REVIEW_MILESTONES.includes(next)) {
      await requestReviewIfAvailable()
    }
  },

  recordLaunchForReview: async () => {
    const { settings, set } = getState()
    const next = settings.launch_count + 1
    set('launch_count', next)
    if (next === LAUNCH_REVIEW_MILESTONE) {
      await requestReviewIfAvailable()
    }
  },
}))
