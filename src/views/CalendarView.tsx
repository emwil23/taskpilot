import { toAiTask } from '@/ai/actions'
import { useAi } from '@/ai/useAi'
import { AiNotice } from '@/components/AiNotice'
import { PageHeader } from '@/components/PageHeader'
import { Checkbox } from '@/components/TaskRow'
import { Button } from '@/components/ui/button'
import { useAllTasks } from '@/hooks/data'
import { cn } from '@/lib/cn'
import { addDays, dayKey, fromDayKey, hhmm, relativeDay } from '@/lib/dates'
import type { Task } from '@/lib/db'
import { byOrder, inView, updateTask } from '@/lib/tasks'
import { useSettings } from '@/stores/settings'
import { useUi } from '@/stores/ui'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useSearch } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const START_HOUR = 6
const END_HOUR = 24
const HOUR_PX = 64

/** "HH:MM" on a given day to an ISO date-time. */
const at = (day: string, time: string) => {
  const [h = 0, m = 0] = time.split(':').map(Number)
  const d = fromDayKey(day)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

const minutesOfDay = (iso: string) => {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

/** Motion-style calendar: drag tasks onto the day, or let "Plan my day" time-block them. */
export function CalendarView() {
  const autoPlan = Boolean(useSearch({ from: '/shell/app/calendar' }).plan)
  const tasks = useAllTasks()
  const [day, setDay] = useState(dayKey())
  const today = dayKey()
  const dayEnd = useSettings((s) => s.dayEnd)
  const set = useUi((s) => s.set)
  const ai = useAi('plan-day')
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )
  const autoRan = useRef(false)

  const blocks = (tasks ?? []).filter((t) => t.block && dayKey(new Date(t.block.start)) === day)
  const unplanned = (tasks ?? [])
    .filter(
      (t) =>
        !t.block &&
        t.status !== 'done' &&
        (day === today ? inView('today', t, today) : t.scheduled === day),
    )
    .sort(byOrder)

  async function planDay() {
    const now = new Date()
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15)
    const events = blocks
      .filter((b) => b.status !== 'done')
      .slice(0, 20)
      .map((b) => ({
        title: b.title.slice(0, 120),
        start: hhmm(new Date(b.block?.start ?? '')),
        end: hhmm(new Date(b.block?.end ?? '')),
      }))
    const plan = await ai.run({
      tasks: unplanned.slice(0, 40).map(toAiTask),
      now: hhmm(now),
      dayEnd,
      events,
    })
    const valid = plan.filter(
      (p) =>
        unplanned.some((t) => t.id === p.taskId) &&
        /^\d\d:\d\d$/.test(p.start) &&
        /^\d\d:\d\d$/.test(p.end) &&
        p.end > p.start,
    )
    for (const p of valid)
      await updateTask(p.taskId, {
        block: { start: at(today, p.start), end: at(today, p.end) },
        scheduled: today,
      })
    if (valid.length)
      toast.success(`Planned ${valid.length} ${valid.length === 1 ? 'block' : 'blocks'}`, {
        action: {
          label: 'Undo',
          onClick: () => valid.forEach((p) => void updateTask(p.taskId, { block: null })),
        },
      })
  }

  useEffect(() => {
    if (autoPlan && !autoRan.current && tasks && unplanned.length) {
      autoRan.current = true
      void planDay()
    }
  })

  function onDrop(taskId: string, slot: string) {
    const task = tasks?.find((t) => t.id === taskId)
    if (!task) return
    const start = at(day, slot)
    const length = task.block
      ? minutesOfDay(task.block.end) - minutesOfDay(task.block.start)
      : (task.estimateMin ?? 30)
    void updateTask(taskId, {
      scheduled: day,
      block: { start, end: new Date(new Date(start).getTime() + length * 60_000).toISOString() },
    })
  }

  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()

  return (
    <>
      <PageHeader eyebrow="Time-block" title="Calendar">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous day"
            onClick={() => setDay(addDays(day, -1))}
          >
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDay(today)}>
            {relativeDay(day)}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next day"
            onClick={() => setDay(addDays(day, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
        {day === today && (
          <Button
            variant="ai"
            onClick={() => void planDay()}
            disabled={ai.status === 'running' || unplanned.length === 0}
          >
            <Sparkles /> {ai.status === 'running' ? 'Planning…' : 'Plan my day'}
          </Button>
        )}
      </PageHeader>
      <AiNotice status={ai.status} error={ai.error} />

      <DndContext
        sensors={sensors}
        onDragEnd={(e) => e.over && onDrop(String(e.active.id), String(e.over.id))}
      >
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_16rem]">
          <div
            className="border-line bg-surface/40 relative rounded-2xl border"
            style={{ height: (END_HOUR - START_HOUR) * HOUR_PX }}
          >
            {Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, i) => {
              const min = START_HOUR * 60 + i * 30
              const slot = `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
              return <Slot key={slot} slot={slot} top={i * (HOUR_PX / 2)} />
            })}
            {day === today && nowMin > START_HOUR * 60 && (
              <div
                className="border-accent pointer-events-none absolute inset-x-0 z-10 border-t-2"
                style={{ top: ((nowMin - START_HOUR * 60) / 60) * HOUR_PX }}
              >
                <span className="bg-accent absolute -top-1.5 -left-1 size-3 rounded-full" />
                <span className="sr-only">Now</span>
              </div>
            )}
            {blocks.map((t) => (
              <Block key={t.id} task={t} onOpen={() => set({ detailId: t.id })} />
            ))}
          </div>

          <aside aria-labelledby="unplanned-h" className="lg:sticky lg:top-10 lg:self-start">
            <h2 id="unplanned-h" className="hud text-muted mb-3">
              To place · {unplanned.length}
            </h2>
            <ul className="flex flex-col gap-2">
              {unplanned.map((t) => (
                <DraggableTask key={t.id} task={t} />
              ))}
            </ul>
            {unplanned.length === 0 && (
              <p className="text-muted text-sm">Everything for this day has a time.</p>
            )}
            <p className="text-muted mt-4 text-xs">
              Drag a task onto the timeline, or use Plan my day.
            </p>
          </aside>
        </div>
      </DndContext>
    </>
  )
}

function Slot({ slot, top }: { slot: string; top: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: slot })
  const full = slot.endsWith(':00')
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute inset-x-0 border-t',
        full ? 'border-line' : 'border-line/40 border-dashed',
        isOver && 'bg-accent/10',
      )}
      style={{ top, height: HOUR_PX / 2 }}
    >
      {full && <span className="hud text-muted absolute top-1 left-2">{slot}</span>}
    </div>
  )
}

function Block({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id })
  if (!task.block) return null
  const start = minutesOfDay(task.block.start)
  const end = minutesOfDay(task.block.end) || 24 * 60
  const top = ((start - START_HOUR * 60) / 60) * HOUR_PX
  const height = Math.max(((end - start) / 60) * HOUR_PX - 4, 28)
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-roledescription="draggable time block"
      className={cn(
        'border-accent bg-surface-2 absolute right-2 left-16 z-20 flex cursor-grab gap-2 overflow-hidden rounded-xl border-l-4 px-3 py-1.5 text-sm shadow-md',
        task.status === 'done' && 'border-go opacity-60',
      )}
      style={{
        top: top + 2,
        height,
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
      }}
    >
      <Checkbox task={task} className="mt-0.5" />
      <button
        type="button"
        onClick={onOpen}
        onPointerDown={(e) => e.stopPropagation()}
        className="min-w-0 flex-1 text-left"
      >
        <span
          className={cn('block truncate font-medium', task.status === 'done' && 'line-through')}
        >
          {task.title}
        </span>
        <span className="hud text-muted">
          {hhmm(new Date(task.block.start))}–{hhmm(new Date(task.block.end))}
        </span>
      </button>
      <button
        type="button"
        aria-label={`Unschedule ${task.title}`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => void updateTask(task.id, { block: null })}
        className="text-muted hover:text-text self-start rounded p-0.5"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

function DraggableTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-roledescription="draggable task"
      className={cn(
        'border-line bg-surface relative z-30 cursor-grab rounded-xl border p-3 text-sm',
        isDragging && 'ring-accent shadow-xl ring-1',
      )}
      style={{ transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined }}
    >
      {task.title}
      {task.estimateMin && <span className="hud text-muted ml-2">{task.estimateMin}m</span>}
    </li>
  )
}
