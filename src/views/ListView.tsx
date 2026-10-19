import { EmptyState, type EmptyArt } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { TaskList } from '@/components/TaskList'
import { useViewTasks } from '@/hooks/data'
import { relativeDay } from '@/lib/dates'
import type { Task } from '@/lib/db'
import type { View } from '@/lib/tasks'

const COPY: Record<
  Exclude<View, 'today'>,
  { title: string; eyebrow: string; empty: string; hint: string; art: EmptyArt }
> = {
  inbox: {
    title: 'Inbox',
    eyebrow: 'Capture',
    empty: 'Inbox zero',
    hint: 'Press Q to capture anything. Sort it later.',
    art: 'inbox',
  },
  upcoming: {
    title: 'Upcoming',
    eyebrow: 'Ahead',
    empty: 'Clear skies ahead',
    hint: 'Tasks with a future date show up here, grouped by day.',
    art: 'today',
  },
  someday: {
    title: 'Someday',
    eyebrow: 'Parked',
    empty: 'Nothing parked',
    hint: 'Type "someday" in quick add to park an idea out of sight.',
    art: 'focus',
  },
  logbook: {
    title: 'Logbook',
    eyebrow: 'Done',
    empty: 'Nothing done yet',
    hint: 'Finished tasks land here, newest first.',
    art: 'board',
  },
}

/** Groups tasks by a key, keeping the order they arrive in. */
function groupBy(tasks: Task[], key: (t: Task) => string) {
  const groups = new Map<string, Task[]>()
  for (const t of tasks) groups.set(key(t), [...(groups.get(key(t)) ?? []), t])
  return [...groups]
}

export function ListView({ view }: { view: Exclude<View, 'today'> }) {
  const tasks = useViewTasks(view)
  const copy = COPY[view]
  if (!tasks) return null

  const empty = (
    <EmptyState art={copy.art} title={copy.empty}>
      {copy.hint}
    </EmptyState>
  )

  return (
    <>
      <PageHeader eyebrow={copy.eyebrow} title={copy.title} />
      {view === 'upcoming' || view === 'logbook' ? (
        tasks.length === 0 ? (
          empty
        ) : (
          groupBy(tasks, (t) =>
            view === 'upcoming' ? (t.scheduled ?? '') : new Date(t.completedAt ?? 0).toDateString(),
          ).map(([key, group]) => (
            <section key={key} className="mb-8" aria-labelledby={`g-${key}`}>
              <h2 id={`g-${key}`} className="hud border-line text-muted mb-2 border-b pb-2">
                {view === 'upcoming'
                  ? relativeDay(key)
                  : new Date(key).toLocaleDateString(undefined, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short',
                    })}
              </h2>
              <TaskList tasks={group} label={key} />
            </section>
          ))
        )
      ) : (
        <TaskList tasks={tasks} label={copy.title} empty={empty} />
      )}
    </>
  )
}

export const InboxView = () => <ListView view="inbox" />
export const UpcomingView = () => <ListView view="upcoming" />
export const SomedayView = () => <ListView view="someday" />
export const LogbookView = () => <ListView view="logbook" />
