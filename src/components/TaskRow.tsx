import { useProjects } from '@/hooks/data'
import { cn } from '@/lib/cn'
import { dayKey, duration, relativeDay } from '@/lib/dates'
import type { Task } from '@/lib/db'
import { toggleDone } from '@/lib/tasks'
import { useUi } from '@/stores/ui'
import { CalendarClock, Check, Flag, ListChecks, Timer } from 'lucide-react'
import { motion } from 'motion/react'

const PRIORITY_COLOR = { 1: 'text-accent', 2: 'text-sky', 3: 'text-go', 4: '' } as const

export function Checkbox({ task, className }: { task: Task; className?: string }) {
  const done = task.status === 'done'
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? `Mark "${task.title}" as not done` : `Complete "${task.title}"`}
      onClick={(e) => {
        e.stopPropagation()
        void toggleDone(task)
      }}
      className={cn(
        'grid size-5 shrink-0 place-items-center rounded-md border-2 transition-colors',
        done ? 'border-go bg-go text-bg' : 'border-muted/60 hover:border-accent',
        task.priority === 1 && !done && 'border-accent',
        className,
      )}
    >
      {done && <Check className="size-3.5" strokeWidth={3} />}
    </button>
  )
}

export function TaskRow({ task, selected }: { task: Task; selected?: boolean }) {
  const set = useUi((s) => s.set)
  const project = useProjects()?.find((p) => p.id === task.projectId)
  const done = task.status === 'done'
  const subDone = task.subtasks.filter((s) => s.done).length
  const overdue = task.due !== null && task.due < dayKey() && !done

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      data-task-id={task.id}
      className={cn(
        'group hover:bg-surface-2 flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors',
        selected && 'bg-surface-2 ring-line ring-1',
      )}
    >
      <Checkbox task={task} className="mt-0.5" />
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={() => set({ detailId: task.id, selectedId: task.id })}
      >
        <span className={cn('block truncate', done && 'text-muted line-through')}>
          {task.title}
        </span>
        <span className="text-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs empty:hidden">
          {project && (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: project.color }} />
              {project.name}
            </span>
          )}
          {task.due && (
            <span className={cn('inline-flex items-center gap-1', overdue && 'text-danger')}>
              <CalendarClock className="size-3.5" aria-hidden />
              <span className="sr-only">Due</span>
              {relativeDay(task.due)}
            </span>
          )}
          {task.block && (
            <span className="font-mono">
              {new Date(task.block.start).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          {task.estimateMin && (
            <span className="inline-flex items-center gap-1">
              <Timer className="size-3.5" aria-hidden />
              {duration(task.estimateMin)}
            </span>
          )}
          {task.subtasks.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <ListChecks className="size-3.5" aria-hidden />
              {subDone}/{task.subtasks.length}
            </span>
          )}
          {task.priority < 4 && (
            <span className={cn('inline-flex items-center gap-1', PRIORITY_COLOR[task.priority])}>
              <Flag className="size-3.5" aria-hidden />P{task.priority}
            </span>
          )}
        </span>
      </button>
    </motion.li>
  )
}
