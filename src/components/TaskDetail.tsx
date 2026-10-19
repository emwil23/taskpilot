import { useAi } from '@/ai/useAi'
import { useProjects, useTask } from '@/hooks/data'
import { duration } from '@/lib/dates'
import { db, uid, type Priority, type Status, type Task } from '@/lib/db'
import { deleteTask, setStatus, updateTask } from '@/lib/tasks'
import { useUi } from '@/stores/ui'
import { Check, Plus, Sparkles, Trash2, Wand2, X } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { AiNotice } from './AiNotice'
import { Checkbox } from './TaskRow'
import { Button } from './ui/button'
import { Dialog, DialogContent } from './ui/dialog'

export function TaskDetail() {
  const id = useUi((s) => s.detailId)
  const set = useUi((s) => s.set)
  const task = useTask(id)

  return (
    <Dialog open={Boolean(id)} onOpenChange={(o) => !o && set({ detailId: null })}>
      {task && (
        <DialogContent side title="Task details" hideTitle>
          <Body key={task.id} task={task} close={() => set({ detailId: null })} />
        </DialogContent>
      )}
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="hud text-muted">
        {label}
      </label>
      {children(id)}
    </div>
  )
}

const input =
  'h-10 rounded-xl border border-line bg-bg px-3 text-sm outline-none focus:border-accent'

function Body({ task, close }: { task: Task; close: () => void }) {
  const projects = useProjects()
  const [newSub, setNewSub] = useState('')
  const breakdown = useAi('breakdown')
  const rewrite = useAi('rewrite')
  const save = (changes: Partial<Task>) => void updateTask(task.id, changes)

  async function runBreakdown() {
    const items = await breakdown.run({
      goal: task.title,
      ...(task.notes && { context: task.notes.slice(0, 500) }),
    })
    // Models sometimes repeat a step, and running it twice shouldn't double the list: skip known titles.
    const seen = new Set(task.subtasks.map((s) => s.title.trim().toLowerCase()))
    const fresh = items.filter((i) => {
      const key = i.title.trim().toLowerCase()
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    if (fresh.length === 0) return
    save({
      subtasks: [
        ...task.subtasks,
        ...fresh.map((i) => ({ id: uid(), title: i.title.trim(), done: false })),
      ],
      estimateMin: task.estimateMin ?? fresh.reduce((sum, i) => sum + (i.estimateMin || 0), 0),
    })
    toast.success(`Added ${fresh.length} subtasks`)
  }

  async function runRewrite() {
    const [r] = await rewrite.run({
      title: task.title,
      ...(task.notes && { notes: task.notes.slice(0, 1000) }),
    })
    if (!r) return
    const notes = [task.notes, `First step: ${r.firstStep}`].filter(Boolean).join('\n\n')
    save({ title: r.title, notes, estimateMin: task.estimateMin ?? r.estimateMin })
    toast.success('Task rewritten', {
      action: {
        label: 'Undo',
        onClick: () =>
          save({ title: task.title, notes: task.notes, estimateMin: task.estimateMin }),
      },
    })
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <Checkbox task={task} className="mt-2" />
        <label htmlFor="task-title" className="sr-only">
          Title
        </label>
        <textarea
          id="task-title"
          defaultValue={task.title}
          rows={2}
          onBlur={(e) => e.target.value.trim() && save({ title: e.target.value.trim() })}
          className="font-display min-w-0 flex-1 resize-none bg-transparent text-xl font-semibold outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="ai"
          size="sm"
          onClick={() => void runBreakdown()}
          disabled={breakdown.status === 'running'}
        >
          <Sparkles /> {breakdown.status === 'running' ? 'Breaking down…' : 'Break into subtasks'}
        </Button>
        <Button
          variant="ai"
          size="sm"
          onClick={() => void runRewrite()}
          disabled={rewrite.status === 'running'}
        >
          <Wand2 /> {rewrite.status === 'running' ? 'Rewriting…' : 'Make it clearer'}
        </Button>
      </div>
      <AiNotice status={breakdown.status} error={breakdown.error} />
      <AiNotice status={rewrite.status} error={rewrite.error} />
      {breakdown.status === 'running' && breakdown.items.length > 0 && (
        <ul className="text-sky flex flex-col gap-1 text-sm" aria-live="polite">
          {breakdown.items.map((i) => (
            <li key={i.title}>
              + {i.title} <span className="text-muted">{duration(i.estimateMin)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Status">
          {(id) => (
            <select
              id={id}
              className={input}
              value={task.status}
              onChange={(e) => void setStatus(task, e.target.value as Status)}
            >
              <option value="todo">To do</option>
              <option value="doing">In progress</option>
              <option value="done">Done</option>
            </select>
          )}
        </Field>
        <Field label="Priority">
          {(id) => (
            <select
              id={id}
              className={input}
              value={task.priority}
              onChange={(e) => save({ priority: Number(e.target.value) as Priority })}
            >
              <option value={1}>P1 · Urgent</option>
              <option value={2}>P2 · High</option>
              <option value={3}>P3 · Medium</option>
              <option value={4}>P4 · None</option>
            </select>
          )}
        </Field>
        <Field label="When">
          {(id) => (
            <input
              id={id}
              type="date"
              className={input}
              value={task.scheduled ?? ''}
              onChange={(e) => save({ scheduled: e.target.value || null, someday: false })}
            />
          )}
        </Field>
        <Field label="Deadline">
          {(id) => (
            <input
              id={id}
              type="date"
              className={input}
              value={task.due ?? ''}
              onChange={(e) => save({ due: e.target.value || null })}
            />
          )}
        </Field>
        <Field label="Project">
          {(id) => (
            <select
              id={id}
              className={input}
              value={task.projectId ?? ''}
              onChange={(e) => save({ projectId: e.target.value || null })}
            >
              <option value="">None</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Estimate (min)">
          {(id) => (
            <input
              id={id}
              type="number"
              min={0}
              step={5}
              className={input}
              defaultValue={task.estimateMin ?? ''}
              onBlur={(e) => save({ estimateMin: e.target.value ? Number(e.target.value) : null })}
            />
          )}
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={task.someday}
          onChange={(e) =>
            save({ someday: e.target.checked, scheduled: e.target.checked ? null : task.scheduled })
          }
          className="size-4 accent-[var(--accent)]"
        />
        Someday (park it out of sight)
      </label>

      <section aria-labelledby="subtasks-h">
        <h3 id="subtasks-h" className="hud text-muted mb-2">
          Subtasks
        </h3>
        <ul className="flex flex-col gap-1">
          {task.subtasks.map((s) => (
            <li key={s.id} className="group flex items-center gap-3 rounded-lg px-1 py-1">
              <button
                type="button"
                role="checkbox"
                aria-checked={s.done}
                aria-label={s.title}
                onClick={() =>
                  save({
                    subtasks: task.subtasks.map((x) =>
                      x.id === s.id ? { ...x, done: !x.done } : x,
                    ),
                  })
                }
                className={`grid size-4 place-items-center rounded border-2 ${s.done ? 'border-go bg-go text-bg' : 'border-muted/60'}`}
              >
                {s.done && <Check className="size-3" strokeWidth={3} />}
              </button>
              <span className={`flex-1 text-sm ${s.done ? 'text-muted line-through' : ''}`}>
                {s.title}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label={`Delete subtask ${s.title}`}
                onClick={() => save({ subtasks: task.subtasks.filter((x) => x.id !== s.id) })}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!newSub.trim()) return
            save({ subtasks: [...task.subtasks, { id: uid(), title: newSub.trim(), done: false }] })
            setNewSub('')
          }}
        >
          <label htmlFor="new-sub" className="sr-only">
            New subtask
          </label>
          <input
            id="new-sub"
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
            placeholder="Add a subtask"
            className={`${input} flex-1`}
          />
          <Button type="submit" size="icon" aria-label="Add subtask">
            <Plus />
          </Button>
        </form>
      </section>

      <Field label="Notes">
        {(id) => (
          <textarea
            id={id}
            defaultValue={task.notes}
            rows={5}
            onBlur={(e) => save({ notes: e.target.value })}
            className={`${input} h-auto py-2`}
            placeholder="Links, context, anything."
          />
        )}
      </Field>

      <div className="border-line flex justify-between border-t pt-4">
        <Button
          variant="danger"
          onClick={() => {
            const copy = task
            void deleteTask(task.id)
            close()
            toast('Task deleted', {
              action: { label: 'Undo', onClick: () => void db.tasks.add(copy) },
            })
          }}
        >
          <Trash2 /> Delete
        </Button>
        <p className="hud text-muted self-center">
          Created {new Date(task.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}
