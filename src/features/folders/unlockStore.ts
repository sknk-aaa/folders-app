import { create } from 'zustand'

type UnlockStore = {
  unlockedIds: Record<string, true>
  unlock: (id: string) => void
  forget: (id: string) => void
  isUnlocked: (id: string) => boolean
}

export const useUnlockStore = create<UnlockStore>((setState, getState) => ({
  unlockedIds: {},
  unlock: (id) =>
    setState((s) => ({ unlockedIds: { ...s.unlockedIds, [id]: true } })),
  forget: (id) =>
    setState((s) => {
      if (!s.unlockedIds[id]) return s
      const next = { ...s.unlockedIds }
      delete next[id]
      return { unlockedIds: next }
    }),
  isUnlocked: (id) => Boolean(getState().unlockedIds[id]),
}))
