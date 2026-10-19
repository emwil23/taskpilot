import { addDays, dayKey } from './dates'
import { db, uid, type Habit, type Quadrant, type Task } from './db'
import type { ParsedTask } from './quickAdd'

export type View = 'inbox' | 'today' | 'upcoming' | 'someday' | 'logbook'

const open = (t: Task) => t.status !== 'done'

/** Which tasks a list view shows. Pure, so the views are easy to test. */
export function inView(view: View, t: Task, today = dayKey()): boolean {
  switch (view) {
    case 'inbox':
      return open(t) && !t.scheduled && !t.someday && !t.projectId
    case 'today':
      return (
        open(t) &&
        ((t.scheduled !== null && t.scheduled <= today) || (t.due !== null && t.due <= today))
      )
    case 'upcoming':
      return open(t) && t.scheduled !== null && t.scheduled > today
    case 'someday':
      return open(t) && t.someday
    case 'logbook':
      return t.status === 'done'
  }
}

export const byOrder = (a: Task, b: Task) => a.order - b.order || a.createdAt - b.createdAt

/** Urgent = due by tomorrow; important = p1 or p2. A quadrant set by hand wins. */
export function quadrantOf(t: Task, today = dayKey()): Quadrant {
  if (t.quadrant) return t.quadrant
  const urgent = t.due !== null && t.due <= addDays(today, 1)
  const important = t.priority <= 2
  if (urgent && important) return 'do'
  if (important) return 'plan'
  if (urgent) return 'delegate'
  return 'drop'
}

/** Days in a row the habit was done, counting back from today (or yesterday, if today isn't done yet). */
export function streak(h: Pick<Habit, 'days'>, today = dayKey()): number {
  const done = new Set(h.days)
  let day = done.has(today) ? today : addDays(today, -1)
  let n = 0
  while (done.has(day)) {
    n++
    day = addDays(day, -1)
  }
  return n
}

export function newTask(fields: Partial<Task> & Pick<Task, 'title'>): Task {
  return {
    id: uid(),
    notes: '',
    status: 'todo',
    priority: 4,
    projectId: null,
    scheduled: null,
    due: null,
    someday: false,
    estimateMin: null,
    quadrant: null,
    block: null,
    subtasks: [],
    order: Date.now(),
    createdAt: Date.now(),
    completedAt: null,
    ...fields,
  }
}

/** Saves a quick-add result, creating the #project if it doesn't exist yet. */
export async function addParsed(p: ParsedTask, defaults: Partial<Task> = {}): Promise<Task> {
  let projectId = defaults.projectId ?? null
  if (p.projectName) {
    const name = p.projectName
    const existing = (await db.projects.toArray()).find(
      (x) => x.name.toLowerCase() === name.toLowerCase(),
    )
    projectId = existing?.id ?? (await createProject(name)).id
  }
  const block = p.at
    ? {
        start: p.at.toISOString(),
        end: new Date(p.at.getTime() + (p.estimateMin ?? 30) * 60_000).toISOString(),
      }
    : null
  const task = newTask({
    ...defaults,
    title: p.title,
    priority: p.priority,
    projectId,
    estimateMin: p.estimateMin,
    scheduled: p.scheduled ?? defaults.scheduled ?? null,
    due: p.due,
    someday: p.someday,
    block,
  })
  await db.tasks.add(task)
  return task
}

const PROJECT_COLORS = ['#FF6B3D', '#7CC4FF', '#4ADE9A', '#F5C451', '#C792EA', '#FF8FB1']

export async function createProject(name: string) {
  const count = await db.projects.count()
  const project = {
    id: uid(),
    name,
    color: PROJECT_COLORS[count % PROJECT_COLORS.length] ?? '#FF6B3D',
    createdAt: Date.now(),
  }
  await db.projects.add(project)
  return project
}

export const updateTask = (id: string, changes: Partial<Task>) => db.tasks.update(id, changes)

export function setStatus(t: Task, status: Task['status']) {
  return db.tasks.update(t.id, { status, completedAt: status === 'done' ? Date.now() : null })
}

export const toggleDone = (t: Task) => setStatus(t, t.status === 'done' ? 'todo' : 'done')

export const deleteTask = (id: string) => db.tasks.delete(id)

export function toggleHabitToday(h: Habit, today = dayKey()) {
  const days = h.days.includes(today) ? h.days.filter((d) => d !== today) : [...h.days, today]
  return db.habits.update(h.id, { days })
}
