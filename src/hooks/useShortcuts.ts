import { NAV } from '@/components/nav'
import { db } from '@/lib/db'
import { toggleDone } from '@/lib/tasks'
import { useUi } from '@/stores/ui'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

/** Visible task ids, top to bottom, from the rows on screen. */
const rowIds = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>('[data-task-id]'),
    (el) => el.dataset.taskId ?? '',
  )

/**
 * Keyboard-first controls, Linear style:
 * Ctrl/Cmd+K palette · q quick add · g then a letter to jump · j/k move · x complete · Enter open · ? help
 */
export function useShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    let gPressed = 0
    const onKey = (e: KeyboardEvent) => {
      const ui = useUi.getState()
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        ui.set({ palette: !ui.palette })
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return
      if (ui.quickAdd || ui.palette || ui.detailId || document.querySelector('[role="dialog"]'))
        return

      if (Date.now() - gPressed < 800) {
        const item = NAV.find((n) => n.key === e.key)
        gPressed = 0
        if (item) {
          e.preventDefault()
          void navigate({ to: item.to })
        }
        return
      }

      const ids = rowIds()
      const at = ui.selectedId ? ids.indexOf(ui.selectedId) : -1
      switch (e.key) {
        case 'g':
          gPressed = Date.now()
          break
        case 'q':
        case 'n':
          e.preventDefault()
          ui.set({ quickAdd: true })
          break
        case '?':
          ui.set({ shortcuts: true })
          break
        case 'j':
        case 'ArrowDown': {
          const next = ids[Math.min(at + 1, ids.length - 1)]
          if (next) {
            e.preventDefault()
            ui.set({ selectedId: next })
            document.querySelector(`[data-task-id="${next}"]`)?.scrollIntoView({ block: 'nearest' })
          }
          break
        }
        case 'k':
        case 'ArrowUp': {
          const prev = ids[Math.max(at - 1, 0)]
          if (prev) {
            e.preventDefault()
            ui.set({ selectedId: prev })
            document.querySelector(`[data-task-id="${prev}"]`)?.scrollIntoView({ block: 'nearest' })
          }
          break
        }
        case 'x':
          if (ui.selectedId) void db.tasks.get(ui.selectedId).then((t) => t && toggleDone(t))
          break
        case 'Enter':
        case 'e':
          if (ui.selectedId && at >= 0) ui.set({ detailId: ui.selectedId })
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])
}

export const SHORTCUTS: [string, string][] = [
  ['Ctrl K', 'Command palette'],
  ['Q', 'Quick add'],
  ['J / K', 'Move down / up'],
  ['X', 'Complete selected task'],
  ['Enter', 'Open selected task'],
  ...NAV.map((n): [string, string] => [`G then ${n.key.toUpperCase()}`, `Go to ${n.label}`]),
  ['?', 'Show shortcuts'],
]
