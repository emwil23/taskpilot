import { dayKey } from '@/lib/dates'
import { db } from '@/lib/db'
import { byOrder, inView, type View } from '@/lib/tasks'
import { useLiveQuery } from 'dexie-react-hooks'

export const useAllTasks = () => useLiveQuery(() => db.tasks.toArray(), [])

export function useViewTasks(view: View) {
  return useLiveQuery(async () => {
    const today = dayKey()
    const tasks = (await db.tasks.toArray()).filter((t) => inView(view, t, today))
    return view === 'logbook'
      ? tasks.sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
      : tasks.sort(byOrder)
  }, [view])
}

export const useProjects = () => useLiveQuery(() => db.projects.orderBy('createdAt').toArray(), [])

export const useHabits = () => useLiveQuery(() => db.habits.orderBy('createdAt').toArray(), [])

export const useTask = (id: string | null) =>
  useLiveQuery(() => (id ? db.tasks.get(id) : undefined), [id])
