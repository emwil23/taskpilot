import { useAllTasks, useProjects } from '@/hooks/data'
import { SHORTCUTS } from '@/hooks/useShortcuts'
import { useSettings } from '@/stores/settings'
import { useUi } from '@/stores/ui'
import { useNavigate } from '@tanstack/react-router'
import { Command } from 'cmdk'
import { CircleCheck, Folder, Keyboard, Moon, Plus, Settings, Sun } from 'lucide-react'
import { Dialog as D } from 'radix-ui'
import type { ReactNode } from 'react'
import { NAV } from './nav'
import { Dialog, DialogContent } from './ui/dialog'

const item =
  'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm aria-selected:bg-surface-2 [&_svg]:size-4 [&_svg]:text-muted'
const group =
  '[&_[cmdk-group-heading]]:hud [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-muted'

export function CommandPalette() {
  const open = useUi((s) => s.palette)
  const set = useUi((s) => s.set)
  const navigate = useNavigate()
  const tasks = useAllTasks()
  const projects = useProjects()
  const theme = useSettings((s) => s.theme)
  const setSettings = useSettings((s) => s.set)

  const go = (fn: () => void) => () => {
    set({ palette: false })
    fn()
  }

  return (
    <D.Root open={open} onOpenChange={(o) => set({ palette: o })}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <D.Content
          aria-describedby={undefined}
          className="border-line bg-surface fixed top-[14vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border shadow-2xl"
        >
          <D.Title className="sr-only">Command palette</D.Title>
          <Command label="Command palette" loop>
            <Command.Input
              placeholder="Search tasks, jump to a view, run a command…"
              className="border-line placeholder:text-muted/70 h-14 w-full border-b bg-transparent px-5 outline-none"
            />
            <Command.List className="max-h-[50vh] overflow-y-auto p-2">
              <Command.Empty className="text-muted p-6 text-center text-sm">
                Nothing found.
              </Command.Empty>
              <Command.Group heading="Actions" className={group}>
                <Command.Item className={item} onSelect={go(() => set({ quickAdd: true }))}>
                  <Plus /> New task <Kbd>Q</Kbd>
                </Command.Item>
                <Command.Item
                  className={item}
                  onSelect={go(() => setSettings({ theme: theme === 'light' ? 'dark' : 'light' }))}
                >
                  {theme === 'light' ? <Moon /> : <Sun />} Switch theme
                </Command.Item>
                <Command.Item
                  className={item}
                  onSelect={go(() => void navigate({ to: '/settings' }))}
                >
                  <Settings /> Settings
                </Command.Item>
                <Command.Item className={item} onSelect={go(() => set({ shortcuts: true }))}>
                  <Keyboard /> Keyboard shortcuts <Kbd>?</Kbd>
                </Command.Item>
              </Command.Group>
              <Command.Group heading="Go to" className={group}>
                {NAV.map((n) => (
                  <Command.Item
                    key={n.to}
                    className={item}
                    onSelect={go(() => void navigate({ to: n.to }))}
                  >
                    <n.icon /> {n.label} <Kbd>G {n.key.toUpperCase()}</Kbd>
                  </Command.Item>
                ))}
                {projects?.map((p) => (
                  <Command.Item
                    key={p.id}
                    value={`project ${p.name}`}
                    className={item}
                    onSelect={go(
                      () =>
                        void navigate({
                          to: '/app/projects/$projectId',
                          params: { projectId: p.id },
                        }),
                    )}
                  >
                    <Folder style={{ color: p.color }} /> {p.name}
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading="Tasks" className={group}>
                {tasks?.slice(0, 200).map((t) => (
                  <Command.Item
                    key={t.id}
                    value={`${t.title} ${t.id}`}
                    className={item}
                    onSelect={go(() => set({ detailId: t.id }))}
                  >
                    <CircleCheck className={t.status === 'done' ? 'text-go!' : ''} />
                    <span className="truncate">{t.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="hud border-line text-muted ml-auto rounded border px-1.5 py-0.5">
      {children}
    </kbd>
  )
}

export function ShortcutsDialog() {
  const open = useUi((s) => s.shortcuts)
  const set = useUi((s) => s.set)
  return (
    <Dialog open={open} onOpenChange={(o) => set({ shortcuts: o })}>
      <DialogContent title="Keyboard shortcuts">
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          {SHORTCUTS.map(([k, v]) => (
            <div key={k} className="contents">
              <dt>
                <kbd className="hud border-line rounded border px-1.5 py-0.5">{k}</kbd>
              </dt>
              <dd className="text-muted">{v}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  )
}
