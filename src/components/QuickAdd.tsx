import { useProjects } from '@/hooks/data'
import { cn } from '@/lib/cn'
import { dayKey, duration, relativeDay } from '@/lib/dates'
import type { Task } from '@/lib/db'
import { parseQuickAdd, removeToken, type TokenKind } from '@/lib/quickAdd'
import { addParsed } from '@/lib/tasks'
import { useUi } from '@/stores/ui'
import { useRouterState } from '@tanstack/react-router'
import { CalendarDays, Flag, Folder, Mic, MicOff, Timer, X } from 'lucide-react'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Dialog, DialogContent } from './ui/dialog'

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}
type SpeechCtor = new () => SpeechRecognitionLike

const Speech = window as unknown as {
  SpeechRecognition?: SpeechCtor
  webkitSpeechRecognition?: SpeechCtor
}
const SpeechRecognition = Speech.SpeechRecognition ?? Speech.webkitSpeechRecognition

export function QuickAdd() {
  const open = useUi((s) => s.quickAdd)
  const set = useUi((s) => s.set)
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const recognition = useRef<SpeechRecognitionLike | null>(null)
  const projects = useProjects()
  const path = useRouterState({ select: (s) => s.location.pathname })

  const parsed = useMemo(() => parseQuickAdd(text), [text])
  const drop = (kind: TokenKind) => {
    const token = parsed.tokens[kind]
    if (token) setText(removeToken(text, token))
    document.getElementById('quick-add')?.focus()
  }
  const projectExists = projects?.some(
    (p) => p.name.toLowerCase() === parsed.projectName?.toLowerCase(),
  )

  async function submit(keepOpen: boolean) {
    if (!parsed.title) return
    // Tasks added from a view belong to it: Today gets today's date, a project page gets the project.
    const defaults: Partial<Task> = {}
    if (path.startsWith('/app/today') || path.startsWith('/app/calendar'))
      defaults.scheduled = dayKey()
    const project = /^\/app\/projects\/([^/]+)/.exec(path)?.[1]
    if (project) defaults.projectId = project
    if (path.startsWith('/app/someday')) defaults.someday = true
    // Clear first, so anything typed while saving starts a fresh task.
    setText('')
    if (!keepOpen) set({ quickAdd: false })
    await addParsed(parsed, defaults)
    toast.success(`Added "${parsed.title}"`)
  }

  function toggleVoice() {
    if (!SpeechRecognition) return
    if (listening) {
      recognition.current?.stop()
      return
    }
    const r = new SpeechRecognition()
    r.lang = navigator.language
    r.interimResults = true
    r.onresult = (e) => {
      setText(Array.from(e.results, (res) => res[0]?.transcript ?? '').join(''))
    }
    r.onend = () => setListening(false)
    r.onerror = () => {
      setListening(false)
      toast.error('Voice capture stopped. Check microphone permission.')
    }
    recognition.current = r
    r.start()
    setListening(true)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => set({ quickAdd: o })}>
      <DialogContent title="Quick add" description="Type naturally: dates, p1–p4, #project, ~30m.">
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault()
            void submit(false)
          }}
        >
          <div className="border-line bg-bg focus-within:border-accent flex items-center gap-2 rounded-xl border px-3">
            <label htmlFor="quick-add" className="sr-only">
              Task
            </label>
            <input
              id="quick-add"
              autoComplete="off"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.shiftKey) {
                  e.preventDefault()
                  void submit(true)
                }
              }}
              placeholder="Call mom tomorrow at 5pm p1 #Family ~30m"
              className="placeholder:text-muted/70 h-12 min-w-0 flex-1 bg-transparent outline-none"
            />
            {SpeechRecognition && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-pressed={listening}
                aria-label={listening ? 'Stop voice capture' : 'Add by voice'}
                onClick={toggleVoice}
                className={cn(listening && 'text-accent animate-pulse')}
              >
                {listening ? <MicOff /> : <Mic />}
              </Button>
            )}
          </div>

          <div className="mt-3 flex min-h-7 flex-wrap gap-2 text-xs" aria-live="polite">
            {parsed.scheduled && (
              <Chip icon={<CalendarDays />} what="date" onRemove={() => drop('date')}>
                {relativeDay(parsed.scheduled)}
                {parsed.at &&
                  ` ${parsed.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </Chip>
            )}
            {parsed.due && (
              <Chip icon={<CalendarDays />} what="deadline" onRemove={() => drop('date')}>
                Due {relativeDay(parsed.due)}
              </Chip>
            )}
            {parsed.priority < 4 && (
              <Chip icon={<Flag />} what="priority" onRemove={() => drop('priority')}>
                P{parsed.priority}
              </Chip>
            )}
            {parsed.projectName && (
              <Chip icon={<Folder />} what="project" onRemove={() => drop('project')}>
                {parsed.projectName}
                {!projectExists && ' (new)'}
              </Chip>
            )}
            {parsed.estimateMin && (
              <Chip icon={<Timer />} what="estimate" onRemove={() => drop('estimate')}>
                {duration(parsed.estimateMin)}
              </Chip>
            )}
            {parsed.someday && (
              <Chip what="someday" onRemove={() => drop('someday')}>
                Someday
              </Chip>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="hud text-muted">Enter add · Shift+Enter add another</p>
            <Button type="submit" variant="primary" disabled={!parsed.title}>
              Add task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** One understood part of the text. Clicking it takes that part out, e.g. to drop a wrongly guessed date. */
function Chip({
  icon,
  what,
  onRemove,
  children,
}: {
  icon?: ReactNode
  what: string
  onRemove: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      title={`Remove the ${what}`}
      className="group border-line bg-surface-2 hover:border-danger/60 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors [&_svg]:size-3.5"
    >
      {icon}
      {children}
      <X className="text-muted group-hover:text-danger" aria-hidden />
      <span className="sr-only">: remove the {what}</span>
    </button>
  )
}
