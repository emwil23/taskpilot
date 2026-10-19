import { DropBoard } from '@/components/DropBoard'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { useAllTasks } from '@/hooks/data'
import { dayKey } from '@/lib/dates'
import type { Status } from '@/lib/db'
import { byOrder, setStatus } from '@/lib/tasks'

export function BoardView() {
  const tasks = useAllTasks()
  if (!tasks) return null
  const today = dayKey()
  // Done tasks stay on the board for the day they were finished, then live in the Logbook.
  const visible = tasks
    .filter(
      (t) => t.status !== 'done' || (t.completedAt && dayKey(new Date(t.completedAt)) === today),
    )
    .sort(byOrder)
  const col = (s: Status) => visible.filter((t) => t.status === s)

  return (
    <>
      <PageHeader eyebrow="Flow" title="Board" />
      {visible.length === 0 ? (
        <EmptyState art="board" title="An empty hangar">
          Add a few tasks and drag them across as you work.
        </EmptyState>
      ) : (
        <DropBoard
          className="md:grid-cols-3"
          columns={[
            { id: 'todo', title: 'To do', color: 'var(--muted)', tasks: col('todo') },
            { id: 'doing', title: 'In progress', color: 'var(--sky)', tasks: col('doing') },
            { id: 'done', title: 'Done today', color: 'var(--go)', tasks: col('done') },
          ]}
          onMove={(id, status) => {
            const t = tasks.find((x) => x.id === id)
            if (t && t.status !== status) void setStatus(t, status as Status)
          }}
        />
      )}
    </>
  )
}
