import * as chrono from 'chrono-node'
import type { Priority } from './db'
import { dayKey } from './dates'

export interface ParsedTask {
  title: string
  priority: Priority
  projectName: string | null
  estimateMin: number | null
  scheduled: string | null
  due: string | null
  someday: boolean
  /** Start time, when the text named one ("at 5pm"). */
  at: Date | null
  /** Pieces of the input that were understood, for highlighting in the quick-add box. */
  tokens: string[]
}

/**
 * Todoist-style quick add, parsed on the device:
 * "Call mom tomorrow at 5pm p1 #Family ~30m", "Tax return due Friday", "Learn piano someday".
 */
export function parseQuickAdd(input: string, now = new Date()): ParsedTask {
  let text = ` ${input} `
  const tokens: string[] = []
  const take = (re: RegExp): RegExpMatchArray | null => {
    const m = text.match(re)
    if (m) {
      tokens.push(m[0].trim())
      text = text.replace(m[0], ' ')
    }
    return m
  }

  const p = take(/\sp([1-4])(?=\s)/i)
  const project = take(/\s#([\p{L}\p{N}_-]+)/u)
  const est = take(/\s~(\d+(?:\.\d+)?)\s?(m|min|mins|h|hr|hrs)(?=\s)/i)
  const someday = take(/\ssomeday(?=\s)/i)

  let estimateMin: number | null = null
  if (est?.[1] && est[2]) {
    const n = Number(est[1])
    estimateMin = Math.round(est[2].toLowerCase().startsWith('h') ? n * 60 : n)
  }

  let scheduled: string | null = null
  let due: string | null = null
  let at: Date | null = null
  const [date] = chrono.parse(text, now, { forwardDate: true })
  if (date) {
    const before = text.slice(0, date.index)
    const deadline = before.match(/\s(due|by|before)\s*$/i)
    const start = deadline ? date.index - deadline[0].length + 1 : date.index
    tokens.push(text.slice(start, date.index + date.text.length).trim())
    text = text.slice(0, start) + ' ' + text.slice(date.index + date.text.length)
    const d = date.start.date()
    if (deadline) due = dayKey(d)
    else {
      scheduled = dayKey(d)
      if (date.start.isCertain('hour')) at = d
    }
  }

  return {
    title: text.replace(/\s+/g, ' ').trim(),
    priority: (p?.[1] ? Number(p[1]) : 4) as Priority,
    projectName: project?.[1] ?? null,
    estimateMin,
    scheduled,
    due,
    someday: Boolean(someday) && !scheduled,
    at,
    tokens,
  }
}
