import Dexie, { type EntityTable } from 'dexie'

export type Priority = 1 | 2 | 3 | 4
export type Status = 'todo' | 'doing' | 'done'
export type Quadrant = 'do' | 'plan' | 'delegate' | 'drop'

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  notes: string
  status: Status
  priority: Priority
  projectId: string | null
  /** Day the user plans to do it (YYYY-MM-DD). Null with `someday` false means Inbox. */
  scheduled: string | null
  /** Deadline (YYYY-MM-DD). */
  due: string | null
  someday: boolean
  estimateMin: number | null
  /** Set by hand in the matrix; otherwise derived from priority and due date. */
  quadrant: Quadrant | null
  /** A time block on the calendar (ISO date-times), e.g. from "Plan my day". */
  block: { start: string; end: string } | null
  subtasks: Subtask[]
  /** Sort key within a list or board column. */
  order: number
  createdAt: number
  completedAt: number | null
}

export interface Project {
  id: string
  name: string
  color: string
  createdAt: number
}

export interface Habit {
  id: string
  name: string
  /** Days it was done, as YYYY-MM-DD. */
  days: string[]
  createdAt: number
}

export interface FocusSession {
  id: string
  taskId: string | null
  /** Day it ended (YYYY-MM-DD), for stats. */
  day: string
  minutes: number
  endedAt: number
}

export const db = new Dexie('taskpilot') as Dexie & {
  tasks: EntityTable<Task, 'id'>
  projects: EntityTable<Project, 'id'>
  habits: EntityTable<Habit, 'id'>
  focus: EntityTable<FocusSession, 'id'>
}

db.version(1).stores({
  tasks: 'id, status, projectId, scheduled, due, someday, completedAt, order',
  projects: 'id, createdAt',
  habits: 'id, createdAt',
  focus: 'id, day, taskId',
})

export const uid = () => crypto.randomUUID()
