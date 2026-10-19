import { db, type FocusSession, type Habit, type Project, type Task } from './db'

interface Backup {
  app: 'taskpilot'
  version: 1
  tasks: Task[]
  projects: Project[]
  habits: Habit[]
  focus: FocusSession[]
}

export async function exportAll() {
  const backup: Backup = {
    app: 'taskpilot',
    version: 1,
    tasks: await db.tasks.toArray(),
    projects: await db.projects.toArray(),
    habits: await db.habits.toArray(),
    focus: await db.focus.toArray(),
  }
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }),
  )
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `taskpilot-${new Date().toISOString().slice(0, 10)}.json`,
  })
  a.click()
  URL.revokeObjectURL(url)
}

/** Imports a TaskPilot backup. Rejects anything that isn't one, so a wrong file can't corrupt the data. */
export async function importAll(file: File): Promise<number> {
  const data = JSON.parse(await file.text()) as Partial<Backup>
  if (data.app !== 'taskpilot' || !Array.isArray(data.tasks))
    throw new Error('This is not a TaskPilot backup.')
  const tasks = data.tasks.filter((t) => typeof t.id === 'string' && typeof t.title === 'string')
  await db.transaction('rw', [db.tasks, db.projects, db.habits, db.focus], async () => {
    await db.tasks.bulkPut(tasks)
    await db.projects.bulkPut(data.projects ?? [])
    await db.habits.bulkPut(data.habits ?? [])
    await db.focus.bulkPut(data.focus ?? [])
  })
  return tasks.length + (data.projects?.length ?? 0) + (data.habits?.length ?? 0)
}
