import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import { parseQuickAdd } from './quickAdd'
import { addParsed, inView, newTask, quadrantOf, streak, toggleDone } from './tasks'

const today = '2026-10-20'

describe('inView', () => {
  it('puts undated, project-less tasks in the Inbox only', () => {
    const t = newTask({ title: 'a' })
    expect(inView('inbox', t, today)).toBe(true)
    expect(inView('today', t, today)).toBe(false)
  })

  it('shows overdue and due-today tasks in Today', () => {
    expect(inView('today', newTask({ title: 'a', scheduled: '2026-10-18' }), today)).toBe(true)
    expect(inView('today', newTask({ title: 'a', due: today }), today)).toBe(true)
    expect(inView('upcoming', newTask({ title: 'a', scheduled: '2026-10-21' }), today)).toBe(true)
  })

  it('moves done tasks to the Logbook', () => {
    const t = newTask({ title: 'a', scheduled: today, status: 'done' })
    expect(inView('today', t, today)).toBe(false)
    expect(inView('logbook', t, today)).toBe(true)
  })
})

describe('quadrantOf', () => {
  it('derives the Eisenhower quadrant from priority and due date', () => {
    expect(quadrantOf(newTask({ title: 'a', priority: 1, due: today }), today)).toBe('do')
    expect(quadrantOf(newTask({ title: 'a', priority: 2 }), today)).toBe('plan')
    expect(quadrantOf(newTask({ title: 'a', priority: 4, due: '2026-10-21' }), today)).toBe(
      'delegate',
    )
    expect(quadrantOf(newTask({ title: 'a' }), today)).toBe('drop')
  })

  it('respects a quadrant set by hand', () => {
    expect(quadrantOf(newTask({ title: 'a', quadrant: 'do' }), today)).toBe('do')
  })
})

describe('streak', () => {
  it('counts consecutive days back from today or yesterday', () => {
    expect(streak({ days: ['2026-10-18', '2026-10-19', '2026-10-20'] }, today)).toBe(3)
    expect(streak({ days: ['2026-10-18', '2026-10-19'] }, today)).toBe(2)
    expect(streak({ days: ['2026-10-17'] }, today)).toBe(0)
  })
})

describe('storage', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('adds a parsed task and creates its project once', async () => {
    const a = await addParsed(parseQuickAdd('Write intro #Thesis p2'))
    const b = await addParsed(parseQuickAdd('Write outro #thesis'))
    expect(await db.projects.count()).toBe(1)
    expect(a.projectId).toBe(b.projectId)
    expect(a.priority).toBe(2)
  })

  it('toggles done and back without losing the task', async () => {
    const t = await addParsed(parseQuickAdd('Ship it'))
    await toggleDone(t)
    const done = await db.tasks.get(t.id)
    expect(done?.status).toBe('done')
    expect(done?.completedAt).toBeTypeOf('number')
    if (done) await toggleDone(done)
    expect((await db.tasks.get(t.id))?.completedAt).toBeNull()
  })
})
