import { toAiTask } from '@/ai/actions'
import { useAi } from '@/ai/useAi'
import { AiNotice } from '@/components/AiNotice'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { TaskList } from '@/components/TaskList'
import { Button } from '@/components/ui/button'
import { useAllTasks, useViewTasks } from '@/hooks/data'
import { dayKey, hhmm } from '@/lib/dates'
import { useUi } from '@/stores/ui'
import { Link } from '@tanstack/react-router'
import { Compass, Sparkles, Sunrise, Sunset, Timer } from 'lucide-react'
import { useState } from 'react'
import { EveningReview, MorningPlan } from './Rituals'

export function TodayView() {
  const tasks = useViewTasks('today')
  const all = useAllTasks()
  const [ritual, setRitual] = useState<'morning' | 'evening' | null>(null)
  const today = dayKey()
  if (!tasks) return null

  const overdue = tasks.filter((t) => (t.scheduled ?? today) < today || (t.due ?? today) < today)
  const rest = tasks.filter((t) => !overdue.includes(t))
  const doneToday =
    all?.filter((t) => t.completedAt && dayKey(new Date(t.completedAt)) === today) ?? []
  const hour = new Date().getHours()

  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString(undefined, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
        title="Today"
      >
        <Button variant={hour < 14 ? 'primary' : 'secondary'} onClick={() => setRitual('morning')}>
          <Sunrise /> Plan my morning
        </Button>
        <Button variant={hour >= 17 ? 'primary' : 'secondary'} onClick={() => setRitual('evening')}>
          <Sunset /> Evening review
        </Button>
      </PageHeader>

      {tasks.length > 0 && <WhatNow />}

      {overdue.length > 0 && (
        <section className="mb-4" aria-labelledby="overdue-h">
          <h2 id="overdue-h" className="hud text-danger mb-2">
            Overdue · {overdue.length}
          </h2>
          <TaskList tasks={overdue} label="Overdue" />
        </section>
      )}

      <TaskList
        tasks={rest}
        label="Today"
        empty={
          overdue.length === 0 && (
            <EmptyState
              art="today"
              title={doneToday.length ? 'All done for today' : 'A clear runway'}
            >
              {doneToday.length
                ? `You finished ${doneToday.length} ${doneToday.length === 1 ? 'task' : 'tasks'}. Time for the evening review.`
                : 'Start with "Plan my morning" to pull tasks in, or press Q to add one.'}
            </EmptyState>
          )
        }
      />

      {doneToday.length > 0 && (
        <details className="mt-8">
          <summary className="hud text-muted cursor-pointer">
            Done today · {doneToday.length}
          </summary>
          <div className="mt-2">
            <TaskList tasks={doneToday} label="Done today" />
          </div>
        </details>
      )}

      <MorningPlan
        open={ritual === 'morning'}
        onOpenChange={(o) => setRitual(o ? 'morning' : null)}
      />
      <EveningReview
        open={ritual === 'evening'}
        onOpenChange={(o) => setRitual(o ? 'evening' : null)}
      />
    </>
  )
}

/** Motion-style "what should I do now?" card. */
function WhatNow() {
  const tasks = useViewTasks('today')
  const ai = useAi('next')
  const set = useUi((s) => s.set)
  const [energy, setEnergy] = useState<'low' | 'medium' | 'high'>('medium')
  const pick = ai.items[0]
  const task = tasks?.find((t) => t.id === pick?.taskId)

  return (
    <section
      aria-labelledby="now-h"
      className="border-sky/25 from-sky/10 mb-8 rounded-2xl border bg-gradient-to-br to-transparent p-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Compass className="text-sky size-5" aria-hidden />
        <h2 id="now-h" className="font-medium">
          What should I do now?
        </h2>
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="energy" className="text-muted text-sm">
            Energy
          </label>
          <select
            id="energy"
            value={energy}
            onChange={(e) => setEnergy(e.target.value as typeof energy)}
            className="border-line bg-bg h-8 rounded-lg border px-2 text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <Button
            variant="ai"
            size="sm"
            disabled={ai.status === 'running'}
            onClick={() =>
              void ai.run({
                tasks: (tasks ?? []).slice(0, 40).map(toAiTask),
                now: hhmm(new Date()),
                energy,
              })
            }
          >
            <Sparkles /> {ai.status === 'running' ? 'Thinking…' : 'Ask co-pilot'}
          </Button>
        </div>
      </div>
      <AiNotice status={ai.status} error={ai.error} />
      {task && pick && (
        <div className="mt-4 flex flex-wrap items-center gap-3" aria-live="polite">
          <button type="button" onClick={() => set({ detailId: task.id })} className="text-left">
            <p className="font-display text-lg font-semibold">{task.title}</p>
            <p className="text-muted text-sm">{pick.why}</p>
          </button>
          <Button asChild variant="primary" size="sm" className="ml-auto">
            <Link to="/app/focus" search={{ task: task.id }}>
              <Timer /> Focus on it
            </Link>
          </Button>
        </div>
      )}
    </section>
  )
}
