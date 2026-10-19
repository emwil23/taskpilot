import { describe, expect, it } from 'vitest'
import { parseQuickAdd, removeToken } from './quickAdd'

// Monday 20 October 2026, 09:00 local time.
const now = new Date(2026, 9, 19 + 1, 9, 0)

describe('parseQuickAdd', () => {
  it('pulls out priority, project, estimate and a dated time', () => {
    const t = parseQuickAdd('Call mom tomorrow at 5pm p1 #Family ~30m', now)
    expect(t.title).toBe('Call mom')
    expect(t.priority).toBe(1)
    expect(t.projectName).toBe('Family')
    expect(t.estimateMin).toBe(30)
    expect(t.scheduled).toBe('2026-10-21')
    expect(t.at?.getHours()).toBe(17)
    expect(t.due).toBeNull()
  })

  it('treats "due" and "by" dates as deadlines, not schedules', () => {
    const t = parseQuickAdd('Tax return due Friday', now)
    expect(t.title).toBe('Tax return')
    expect(t.due).toBe('2026-10-23')
    expect(t.scheduled).toBeNull()
    expect(parseQuickAdd('Send deck by tomorrow', now).due).toBe('2026-10-21')
  })

  it('reads hours in estimates', () => {
    expect(parseQuickAdd('Deep work ~1.5h', now).estimateMin).toBe(90)
  })

  it('marks someday tasks and defaults to p4 with no dates', () => {
    const t = parseQuickAdd('Learn piano someday', now)
    expect(t).toMatchObject({
      title: 'Learn piano',
      someday: true,
      priority: 4,
      scheduled: null,
      at: null,
    })
  })

  it('leaves plain text alone', () => {
    const t = parseQuickAdd('Buy oat milk', now)
    expect(t).toMatchObject({ title: 'Buy oat milk', tokens: {} })
  })

  it('does not treat words like "p10" or emails as tokens', () => {
    expect(parseQuickAdd('Read p10 notes', now).priority).toBe(4)
  })
})

describe('removeToken', () => {
  it('drops the text a field came from, so the parser forgets it', () => {
    const input = 'Call mom at 11 p1 #Family'
    const t = parseQuickAdd(input, now)
    expect(t.tokens.date).toBe('at 11')
    const without = removeToken(input, t.tokens.date ?? '')
    expect(without).toBe('Call mom p1 #Family')
    expect(parseQuickAdd(without, now).scheduled).toBeNull()
    expect(removeToken(without, t.tokens.project ?? '')).toBe('Call mom p1')
  })
})
