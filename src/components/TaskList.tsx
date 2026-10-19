import type { Task } from '@/lib/db'
import { useUi } from '@/stores/ui'
import { AnimatePresence } from 'motion/react'
import type { ReactNode } from 'react'
import { TaskRow } from './TaskRow'

/** A list of tasks. j/k and x work on it through the global shortcuts (they read `data-task-id`). */
export function TaskList({
  tasks,
  label,
  empty,
}: {
  tasks: Task[]
  label: string
  empty?: ReactNode
}) {
  const selectedId = useUi((s) => s.selectedId)
  if (tasks.length === 0) return <>{empty}</>
  return (
    <ul aria-label={label} className="flex flex-col gap-0.5">
      <AnimatePresence initial={false}>
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} selected={t.id === selectedId} />
        ))}
      </AnimatePresence>
    </ul>
  )
}
