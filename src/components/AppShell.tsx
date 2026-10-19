import { useAllTasks, useProjects } from '@/hooks/data'
import { useShortcuts } from '@/hooks/useShortcuts'
import { cn } from '@/lib/cn'
import { dayKey } from '@/lib/dates'
import { inView, type View } from '@/lib/tasks'
import { useUi } from '@/stores/ui'
import { Link, Outlet } from '@tanstack/react-router'
import { Command, Plus, Settings } from 'lucide-react'
import { CommandPalette, ShortcutsDialog } from './CommandPalette'
import { Logo } from './Logo'
import { NAV } from './nav'
import { Onboarding } from './Onboarding'
import { QuickAdd } from './QuickAdd'
import { TaskDetail } from './TaskDetail'
import { Button } from './ui/button'

const COUNTED: Partial<Record<string, View>> = { '/app/inbox': 'inbox', '/app/today': 'today' }
const MOBILE = ['/app/inbox', '/app/today', '/app/board', '/app/calendar', '/app/focus']

function useCounts() {
  const tasks = useAllTasks() ?? []
  const today = dayKey()
  return (to: string) => {
    const view = COUNTED[to]
    return view ? tasks.filter((t) => inView(view, t, today)).length : 0
  }
}

const navLink =
  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text [&.active]:bg-surface-2 [&.active]:text-text [&_svg]:size-4'

export function AppShell() {
  useShortcuts()
  const set = useUi((s) => s.set)
  const projects = useProjects()
  const count = useCounts()

  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="focus:bg-accent focus:text-accent-ink sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <aside className="border-line bg-surface/60 sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r px-3 py-4 md:flex">
        <Link to="/" className="mb-6 px-2" aria-label="TaskPilot home">
          <Logo />
        </Link>
        <Button
          variant="primary"
          className="mb-2 justify-start"
          onClick={() => set({ quickAdd: true })}
        >
          <Plus /> New task <kbd className="hud ml-auto opacity-70">Q</kbd>
        </Button>
        <Button
          variant="ghost"
          className="mb-4 justify-start"
          onClick={() => set({ palette: true })}
        >
          <Command /> Search &amp; commands <kbd className="hud ml-auto">Ctrl K</kbd>
        </Button>
        <nav aria-label="Views" className="flex flex-col gap-0.5">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={navLink}>
              <n.icon /> {n.label}
              {count(n.to) > 0 && <span className="hud ml-auto">{count(n.to)}</span>}
            </Link>
          ))}
        </nav>
        {projects && projects.length > 0 && (
          <nav aria-label="Projects" className="mt-6 flex min-h-0 flex-col gap-0.5 overflow-y-auto">
            <p className="hud text-muted mb-1 px-3">Projects</p>
            {projects.map((p) => (
              <Link
                key={p.id}
                to="/app/projects/$projectId"
                params={{ projectId: p.id }}
                className={navLink}
              >
                <span className="size-2.5 rounded-full" style={{ background: p.color }} />
                <span className="truncate">{p.name}</span>
              </Link>
            ))}
          </nav>
        )}
        <Link to="/settings" className={cn(navLink, 'mt-auto')}>
          <Settings /> Settings
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-line bg-bg/80 sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 backdrop-blur md:hidden">
          <Link to="/" aria-label="TaskPilot home">
            <Logo />
          </Link>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search and commands"
              onClick={() => set({ palette: true })}
            >
              <Command />
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link to="/settings" aria-label="Settings">
                <Settings />
              </Link>
            </Button>
          </div>
        </header>

        <main
          id="main"
          className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 md:px-10 md:pt-10 md:pb-16"
        >
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Main"
        className="border-line bg-surface/95 fixed inset-x-0 bottom-0 z-30 flex border-t backdrop-blur md:hidden"
      >
        {NAV.filter((n) => MOBILE.includes(n.to)).map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="text-muted [&.active]:text-accent flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]"
          >
            <n.icon className="size-5" aria-hidden />
            {n.label}
          </Link>
        ))}
      </nav>
      <Button
        variant="primary"
        size="icon"
        aria-label="New task"
        onClick={() => set({ quickAdd: true })}
        className="fixed right-4 bottom-20 z-30 size-14 rounded-2xl shadow-lg md:hidden [&_svg]:size-6"
      >
        <Plus />
      </Button>

      <QuickAdd />
      <CommandPalette />
      <ShortcutsDialog />
      <TaskDetail />
      <Onboarding />
    </div>
  )
}
