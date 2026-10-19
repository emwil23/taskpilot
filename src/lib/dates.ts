/** Local calendar day as YYYY-MM-DD (not UTC, so late-evening tasks stay on the right day). */
export function dayKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function fromDayKey(key: string): Date {
  const [y = 0, m = 1, d = 1] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, n: number): string {
  const d = fromDayKey(key)
  d.setDate(d.getDate() + n)
  return dayKey(d)
}

export const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

/** "Today", "Tomorrow", "Yesterday", a weekday within the week, else "12 Nov". */
export function relativeDay(key: string, today = dayKey()): string {
  const diff = Math.round((fromDayKey(key).getTime() - fromDayKey(today).getTime()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  const d = fromDayKey(key)
  if (diff > 1 && diff < 7) return d.toLocaleDateString(undefined, { weekday: 'long' })
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

/** Minutes as "25m", "1h", "1h 30m". */
export function duration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return [h && `${h}h`, m && `${m}m`].filter(Boolean).join(' ') || '0m'
}
