import { useAi } from '@/ai/useAi'
import { AiNotice } from '@/components/AiNotice'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useAllTasks } from '@/hooks/data'
import { addDays, dayKey, relativeDay } from '@/lib/dates'
import { db } from '@/lib/db'
import { inView } from '@/lib/tasks'
import { useNavigate } from '@tanstack/react-router'
import { CalendarDays, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface RitualProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Sunsama-style morning ritual: pull tasks into today, then hand off to "Plan my day". */
export function MorningPlan({ open, onOpenChange }: RitualProps) {
  const all = useAllTasks()
  const navigate = useNavigate()
  const today = dayKey()
  const candidates =
    all?.filter(
      (t) =>
        !inView('today', t, today) &&
        t.status !== 'done' &&
        (inView('inbox', t, today) ||
          (t.due !== null && t.due <= addDays(today, 3)) ||
          t.scheduled === addDays(today, 1)),
    ) ?? []
  const [picked, setPicked] = useState<Set<string>>(new Set())

  async function commit(plan: boolean) {
    await db.tasks.bulkUpdate(
      [...picked].map((id) => ({ key: id, changes: { scheduled: today, someday: false } })),
    )
    if (picked.size) toast.success(`Added ${picked.size} to today`)
    setPicked(new Set())
    onOpenChange(false)
    if (plan) void navigate({ to: '/app/calendar', search: { plan: 1 } })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Plan my morning"
        description="Pick what deserves today. Be honest about time."
      >
        {candidates.length === 0 ? (
          <p className="text-muted mt-6 text-sm">Nothing waiting in the Inbox or due soon. Nice.</p>
        ) : (
          <ul className="mt-4 flex max-h-[45vh] flex-col gap-1 overflow-y-auto">
            {candidates.map((t) => (
              <li key={t.id}>
                <label className="hover:bg-surface-2 flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--accent)]"
                    checked={picked.has(t.id)}
                    onChange={(e) => {
                      const next = new Set(picked)
                      if (e.target.checked) next.add(t.id)
                      else next.delete(t.id)
                      setPicked(next)
                    }}
                  />
                  <span className="flex-1">{t.title}</span>
                  {t.due && <span className="hud text-muted">due {relativeDay(t.due)}</span>}
                </label>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button onClick={() => void commit(false)}>Done</Button>
          <Button variant="primary" onClick={() => void commit(true)}>
            <CalendarDays /> Time-block my day
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Sunsama-style shutdown: an AI review of the day, then roll unfinished tasks to tomorrow. */
export function EveningReview({ open, onOpenChange }: RitualProps) {
  const all = useAllTasks()
  const ai = useAi('review')
  const [notes, setNotes] = useState('')
  const today = dayKey()
  const done = all?.filter((t) => t.completedAt && dayKey(new Date(t.completedAt)) === today) ?? []
  const notDone = all?.filter((t) => inView('today', t, today)) ?? []

  async function rollOver() {
    const tomorrow = addDays(today, 1)
    await db.tasks.bulkUpdate(
      notDone.map((t) => ({ key: t.id, changes: { scheduled: tomorrow, block: null } })),
    )
    toast.success(`Moved ${notDone.length} to tomorrow`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Evening review"
        description={`${done.length} done · ${notDone.length} still open`}
      >
        <label htmlFor="review-notes" className="hud text-muted mt-4 mb-1.5 block">
          How did today feel? (optional)
        </label>
        <textarea
          id="review-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={1000}
          rows={3}
          className="border-line bg-bg focus:border-accent w-full rounded-xl border p-3 text-sm outline-none"
        />
        <Button
          variant="ai"
          className="mt-3"
          disabled={ai.status === 'running' || (done.length === 0 && notDone.length === 0)}
          onClick={() =>
            void ai.run({
              done: done.slice(0, 40).map((t) => t.title.slice(0, 200)),
              notDone: notDone.slice(0, 40).map((t) => t.title.slice(0, 200)),
              ...(notes.trim() && { notes: notes.trim() }),
            })
          }
        >
          <Sparkles /> {ai.status === 'running' ? 'Reviewing…' : 'Review my day'}
        </Button>
        <AiNotice status={ai.status} error={ai.error} />
        {ai.text && (
          <div
            aria-live="polite"
            className="border-line bg-bg mt-4 rounded-xl border p-4 text-sm leading-relaxed whitespace-pre-wrap"
          >
            {ai.text.replace(/\*\*/g, '').trim()}
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <Button variant="primary" onClick={() => void rollOver()} disabled={notDone.length === 0}>
            Move {notDone.length} unfinished to tomorrow
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
