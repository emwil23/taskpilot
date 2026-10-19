import { cn } from '@/lib/cn'
import type { Task } from '@/lib/db'
import { useUi } from '@/stores/ui'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useState, type ReactNode } from 'react'
import { Checkbox } from './TaskRow'

export interface Column {
  id: string
  title: string
  hint?: string
  color: string
  tasks: Task[]
}

/** Columns you can drag tasks between, by mouse, touch or keyboard (Space to lift, arrows, Space to drop). */
export function DropBoard({
  columns,
  onMove,
  className,
}: {
  columns: Column[]
  onMove: (taskId: string, columnId: string) => void
  className?: string
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )
  const [active, setActive] = useState<Task | null>(null)

  const onDragEnd = (e: DragEndEvent) => {
    setActive(null)
    if (e.over) onMove(String(e.active.id), String(e.over.id))
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) =>
        setActive(columns.flatMap((c) => c.tasks).find((t) => t.id === e.active.id) ?? null)
      }
      onDragEnd={onDragEnd}
      onDragCancel={() => setActive(null)}
      accessibility={{
        announcements: {
          onDragStart: () => 'Picked up task. Use arrow keys to move between columns.',
          onDragOver: ({ over }) =>
            over ? `Over ${columns.find((c) => c.id === over.id)?.title ?? ''}` : '',
          onDragEnd: ({ over }) =>
            over ? `Moved to ${columns.find((c) => c.id === over.id)?.title ?? ''}` : 'Dropped',
          onDragCancel: () => 'Move cancelled',
        },
      }}
    >
      <div className={cn('grid gap-4', className)}>
        {columns.map((c) => (
          <DropColumn key={c.id} column={c} />
        ))}
      </div>
      <DragOverlay>{active && <Card task={active} overlay />}</DragOverlay>
    </DndContext>
  )
}

function DropColumn({ column }: { column: Column }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  return (
    <section
      ref={setNodeRef}
      aria-labelledby={`col-${column.id}`}
      className={cn(
        'border-line bg-surface/50 flex min-h-48 flex-col rounded-2xl border p-3 transition-colors',
        isOver && 'border-accent bg-accent/5',
      )}
    >
      <header className="mb-3 flex items-center gap-2 px-1">
        <span className="size-2.5 rounded-full" style={{ background: column.color }} aria-hidden />
        <h2 id={`col-${column.id}`} className="font-medium">
          {column.title}
        </h2>
        <span className="hud text-muted ml-auto">{column.tasks.length}</span>
      </header>
      {column.hint && <p className="text-muted mb-3 px-1 text-xs">{column.hint}</p>}
      <ul className="flex flex-col gap-2">
        {column.tasks.map((t) => (
          <DraggableCard key={t.id} task={t} />
        ))}
      </ul>
    </section>
  )
}

function DraggableCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id })
  return (
    <li
      ref={setNodeRef}
      className={cn(isDragging && 'opacity-30')}
      {...attributes}
      {...listeners}
      aria-roledescription="draggable task"
    >
      <Card task={task} />
    </li>
  )
}

function Card({ task, overlay }: { task: Task; overlay?: boolean }): ReactNode {
  const set = useUi((s) => s.set)
  return (
    <div
      className={cn(
        'border-line bg-surface flex cursor-grab items-start gap-2.5 rounded-xl border p-3 text-sm shadow-sm active:cursor-grabbing',
        overlay && 'ring-accent rotate-2 shadow-xl ring-1',
      )}
    >
      <Checkbox task={task} className="mt-0.5" />
      <button
        type="button"
        onClick={() => set({ detailId: task.id })}
        onPointerDown={(e) => e.stopPropagation()}
        className={cn('flex-1 text-left', task.status === 'done' && 'text-muted line-through')}
      >
        {task.title}
      </button>
    </div>
  )
}
