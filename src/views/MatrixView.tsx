import { DropBoard } from '@/components/DropBoard'
import { PageHeader } from '@/components/PageHeader'
import { useAllTasks } from '@/hooks/data'
import { dayKey } from '@/lib/dates'
import type { Quadrant } from '@/lib/db'
import { byOrder, quadrantOf, updateTask } from '@/lib/tasks'

const QUADRANTS: { id: Quadrant; title: string; hint: string; color: string }[] = [
  { id: 'do', title: 'Do first', hint: 'Urgent and important', color: 'var(--accent)' },
  { id: 'plan', title: 'Schedule', hint: 'Important, not urgent', color: 'var(--sky)' },
  { id: 'delegate', title: 'Delegate', hint: 'Urgent, not important', color: 'var(--go)' },
  { id: 'drop', title: 'Drop', hint: 'Neither. Maybe someday.', color: 'var(--muted)' },
]

/** TickTick-style Eisenhower matrix. Quadrants come from priority and deadline until you drag a task. */
export function MatrixView() {
  const tasks = useAllTasks()
  if (!tasks) return null
  const today = dayKey()
  const open = tasks.filter((t) => t.status !== 'done' && !t.someday).sort(byOrder)

  return (
    <>
      <PageHeader eyebrow="Prioritise" title="Matrix" />
      <DropBoard
        className="sm:grid-cols-2"
        columns={QUADRANTS.map((q) => ({
          ...q,
          tasks: open.filter((t) => quadrantOf(t, today) === q.id),
        }))}
        onMove={(id, quadrant) => void updateTask(id, { quadrant: quadrant as Quadrant })}
      />
    </>
  )
}
