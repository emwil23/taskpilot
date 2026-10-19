import { create } from 'zustand'

interface Ui {
  quickAdd: boolean
  palette: boolean
  shortcuts: boolean
  /** Task open in the detail sheet. */
  detailId: string | null
  /** Keyboard-selected task in the current list. */
  selectedId: string | null
  set: (patch: Partial<Omit<Ui, 'set'>>) => void
}

export const useUi = create<Ui>()((set) => ({
  quickAdd: false,
  palette: false,
  shortcuts: false,
  detailId: null,
  selectedId: null,
  set: (patch) => set(patch),
}))
