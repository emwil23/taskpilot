import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { useHabits, useViewTasks } from '@/hooks/data'
import { cn } from '@/lib/cn'
import { addDays, dayKey, duration } from '@/lib/dates'
import { db, uid } from '@/lib/db'
import { streak, toggleHabitToday } from '@/lib/tasks'
import { useSettings } from '@/stores/settings'
import { useSearch } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Flame, Pause, Play, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type Mode = 'focus' | 'break'

function chime() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 660
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 1.2)
  } catch {
    // No audio is fine.
  }
}

/** TickTick-style Pomodoro plus habit streaks. */
export function FocusView() {
  const initialTask = useSearch({ from: '/shell/app/focus' }).task
  const { focusMinutes, breakMinutes } = useSettings()
  const tasks = useViewTasks('today')
  const [taskId, setTaskId] = useState(initialTask ?? '')
  const [mode, setMode] = useState<Mode>('focus')
  const total = (mode === 'focus' ? focusMinutes : breakMinutes) * 60_000
  // null = a full, untouched round, so changing the length in Settings applies straight away.
  const [paused, setPaused] = useState<number | null>(null)
  const [tick, setTick] = useState(0)
  const [endAt, setEndAt] = useState<number | null>(null)
  const remaining = endAt ? tick : (paused ?? total)
  const today = dayKey()
  const minutesToday = useLiveQuery(
    async () =>
      (await db.focus.where('day').equals(today).toArray()).reduce((s, f) => s + f.minutes, 0),
    [today],
  )

  useEffect(() => {
    if (!endAt) return
    const id = setInterval(() => {
      const left = endAt - Date.now()
      if (left > 0) {
        setTick(left)
        return
      }
      clearInterval(id)
      setEndAt(null)
      chime()
      if (mode === 'focus') {
        void db.focus.add({
          id: uid(),
          taskId: taskId || null,
          day: dayKey(),
          minutes: focusMinutes,
          endedAt: Date.now(),
        })
        toast.success(`${focusMinutes} focused minutes logged. Take a break.`)
        setPaused(null)
        setMode('break')
      } else {
        toast('Break over. Ready for another round?')
        setPaused(null)
        setMode('focus')
      }
    }, 250)
    return () => clearInterval(id)
  }, [endAt, mode, taskId, focusMinutes])

  useEffect(() => {
    const mm = String(Math.floor(remaining / 60_000)).padStart(2, '0')
    const ss = String(Math.floor((remaining % 60_000) / 1000)).padStart(2, '0')
    document.title = endAt
      ? `${mm}:${ss} · ${mode === 'focus' ? 'Focus' : 'Break'} · TaskPilot`
      : 'Focus · TaskPilot'
  }, [remaining, endAt, mode])

  const mm = String(Math.floor(remaining / 60_000)).padStart(2, '0')
  const ss = String(Math.floor((remaining % 60_000) / 1000)).padStart(2, '0')
  const progress = 1 - remaining / total
  const R = 120
  const C = 2 * Math.PI * R

  return (
    <>
      <PageHeader eyebrow="Deep work" title="Focus">
        <p className="hud text-muted self-center">Today · {duration(minutesToday ?? 0)} focused</p>
      </PageHeader>

      <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
        <section
          aria-label="Pomodoro timer"
          className="border-line bg-surface/40 flex flex-col items-center rounded-3xl border p-8"
        >
          <div
            className="border-line mb-6 flex rounded-xl border p-1"
            role="group"
            aria-label="Mode"
          >
            {(['focus', 'break'] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                disabled={Boolean(endAt)}
                onClick={() => {
                  setMode(m)
                  setPaused(null)
                }}
                className={cn(
                  'rounded-lg px-4 py-1.5 text-sm capitalize',
                  mode === m ? 'bg-surface-2 text-text' : 'text-muted',
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="relative grid size-72 place-items-center">
            <svg viewBox="0 0 260 260" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="130" cy="130" r={R} fill="none" stroke="var(--line)" strokeWidth="6" />
              <circle
                cx="130"
                cy="130"
                r={R}
                fill="none"
                stroke={mode === 'focus' ? 'var(--accent)' : 'var(--go)'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - progress)}
                className="transition-[stroke-dashoffset] duration-300"
              />
            </svg>
            <p
              className="font-display text-6xl font-semibold tabular-nums"
              role="timer"
              aria-live="off"
            >
              {mm}:{ss}
            </p>
          </div>

          <label htmlFor="focus-task" className="sr-only">
            Task to focus on
          </label>
          <select
            id="focus-task"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            className="border-line bg-bg mt-6 h-10 w-full max-w-sm rounded-xl border px-3 text-sm"
          >
            <option value="">No specific task</option>
            {tasks?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>

          <div className="mt-6 flex gap-3">
            {endAt ? (
              <Button
                size="lg"
                onClick={() => {
                  setPaused(endAt - Date.now())
                  setEndAt(null)
                }}
              >
                <Pause /> Pause
              </Button>
            ) : (
              <Button
                size="lg"
                variant="primary"
                onClick={() => {
                  setTick(remaining)
                  setEndAt(Date.now() + remaining)
                }}
              >
                <Play /> {remaining < total ? 'Resume' : 'Start'}
              </Button>
            )}
            <Button
              size="lg"
              variant="ghost"
              aria-label="Reset timer"
              onClick={() => {
                setEndAt(null)
                setPaused(null)
              }}
            >
              <RotateCcw />
            </Button>
          </div>
        </section>

        <Habits today={today} />
      </div>
    </>
  )
}

function Habits({ today }: { today: string }) {
  const habits = useHabits()
  const [name, setName] = useState('')
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))

  return (
    <section aria-labelledby="habits-h">
      <h2 id="habits-h" className="font-display mb-4 text-xl font-semibold">
        Habits
      </h2>
      {habits?.length === 0 && (
        <EmptyState art="focus" title="Small things, every day">
          Add a habit and tick it off daily to grow a streak.
        </EmptyState>
      )}
      <ul className="flex flex-col gap-3">
        {habits?.map((h) => {
          const done = h.days.includes(today)
          const s = streak(h, today)
          return (
            <li key={h.id} className="group border-line bg-surface/50 rounded-2xl border p-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={done}
                  aria-label={`${h.name} done today`}
                  onClick={() => void toggleHabitToday(h, today)}
                  className={cn(
                    'grid size-8 place-items-center rounded-xl border-2',
                    done ? 'border-go bg-go text-bg' : 'border-line hover:border-go',
                  )}
                >
                  {done && <Check className="size-4" strokeWidth={3} />}
                </button>
                <span className="flex-1 font-medium">{h.name}</span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-sm',
                    s ? 'text-accent' : 'text-muted',
                  )}
                >
                  <Flame className="size-4" aria-hidden /> {s}
                  <span className="sr-only">day streak</span>
                </span>
                <button
                  type="button"
                  aria-label={`Delete habit ${h.name}`}
                  onClick={() => void db.habits.delete(h.id)}
                  className="text-muted rounded p-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="mt-3 flex gap-1.5" aria-hidden>
                {week.map((d) => (
                  <span
                    key={d}
                    className={cn(
                      'h-1.5 flex-1 rounded-full',
                      h.days.includes(d) ? 'bg-go' : 'bg-line',
                    )}
                  />
                ))}
              </div>
            </li>
          )
        })}
      </ul>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          void db.habits.add({ id: uid(), name: name.trim(), days: [], createdAt: Date.now() })
          setName('')
        }}
      >
        <label htmlFor="habit-name" className="sr-only">
          New habit
        </label>
        <input
          id="habit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Read 20 pages"
          className="border-line bg-bg focus:border-accent h-10 flex-1 rounded-xl border px-3 text-sm outline-none"
        />
        <Button type="submit" size="icon" aria-label="Add habit">
          <Plus />
        </Button>
      </form>
    </section>
  )
}
