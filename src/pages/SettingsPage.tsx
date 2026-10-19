import { finishOpenRouterAuth, startOpenRouterAuth } from '@/ai/openrouter'
import { inBlockedRegion, providers } from '@/ai/providers'
import { confirmAdult, getSupabase, isAdult, sendMagicLink, signOut } from '@/ai/supabase'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { SHORTCUTS } from '@/hooks/useShortcuts'
import { cn } from '@/lib/cn'
import { exportAll, importAll } from '@/lib/backup'
import { useSettings, type ProviderId, type Theme } from '@/stores/settings'
import { Link } from '@tanstack/react-router'
import { Download, Monitor, Moon, Sun, Upload } from 'lucide-react'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-h`}
      className="border-line scroll-mt-24 border-b py-8 first:pt-0"
    >
      <h2 id={`${id}-h`} className="font-display mb-4 text-xl font-semibold">
        {title}
      </h2>
      {children}
    </section>
  )
}

const input =
  'h-10 w-full rounded-xl border border-line bg-bg px-3 text-sm outline-none focus:border-accent'

export function SettingsPage() {
  const s = useSettings()

  // Back from OpenRouter's consent screen with ?code=...
  useEffect(() => {
    const code = new URLSearchParams(location.search).get('code')
    if (!code) return
    history.replaceState(null, '', location.pathname + location.hash)
    finishOpenRouterAuth(code)
      .then((ok) => ok && toast.success('OpenRouter connected'))
      .catch((e: unknown) =>
        toast.error(e instanceof Error ? e.message : 'OpenRouter sign-in failed'),
      )
  }, [])

  return (
    <>
      <PageHeader eyebrow="Preferences" title="Settings" />

      <Section id="theme" title="Theme">
        <div role="radiogroup" aria-label="Theme" className="flex gap-2">
          {(
            [
              ['system', 'System', Monitor],
              ['dark', 'Dark', Moon],
              ['light', 'Light', Sun],
            ] as [Theme, string, typeof Sun][]
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={s.theme === value}
              onClick={() => s.set({ theme: value })}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-4 py-2 text-sm',
                s.theme === value ? 'border-accent bg-accent/10' : 'border-line hover:bg-surface-2',
              )}
            >
              <Icon className="size-4" aria-hidden /> {label}
            </button>
          ))}
        </div>
      </Section>

      <Section id="ai" title="AI co-pilot">
        <p className="text-muted mb-4 max-w-prose text-sm">
          AI is free in TaskPilot, never behind Pro. Pick where it runs. Only task titles, estimates
          and dates are sent, never notes or project names. See the{' '}
          <Link to="/privacy" className="text-sky underline underline-offset-4">
            privacy page
          </Link>
          .
        </p>
        <div role="radiogroup" aria-label="AI provider" className="grid gap-3 md:grid-cols-2">
          {providers.map((p) => {
            const offered = p.offered()
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={s.provider === p.id}
                disabled={!offered}
                onClick={() => s.set({ provider: p.id })}
                className={cn(
                  'rounded-2xl border p-4 text-left transition-colors disabled:opacity-50',
                  s.provider === p.id ? 'border-sky bg-sky/10' : 'border-line hover:bg-surface-2',
                )}
              >
                <span className="font-medium">{p.label}</span>
                <span className="text-muted mt-1 block text-sm">
                  {offered
                    ? p.blurb
                    : p.id === 'ew' && inBlockedRegion()
                      ? 'Not available in your region.'
                      : 'Not set up on this deployment.'}
                </span>
              </button>
            )
          })}
        </div>
        <ProviderSetup provider={s.provider} />
      </Section>

      <Section id="planning" title="Planning and focus">
        <div className="grid max-w-lg gap-4 sm:grid-cols-3">
          <NumberField
            label="Day ends"
            type="time"
            value={s.dayEnd}
            onChange={(v) => s.set({ dayEnd: v })}
          />
          <NumberField
            label="Focus (min)"
            value={String(s.focusMinutes)}
            onChange={(v) => s.set({ focusMinutes: clamp(v, 5, 120) })}
          />
          <NumberField
            label="Break (min)"
            value={String(s.breakMinutes)}
            onChange={(v) => s.set({ breakMinutes: clamp(v, 1, 60) })}
          />
        </div>
      </Section>

      <Section id="shortcuts" title="Keyboard shortcuts">
        <dl className="grid max-w-lg grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          {SHORTCUTS.map(([k, v]) => (
            <div key={k} className="contents">
              <dt>
                <kbd className="hud border-line rounded border px-1.5 py-0.5">{k}</kbd>
              </dt>
              <dd className="text-muted">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="data" title="Import and export">
        <p className="text-muted mb-4 max-w-prose text-sm">
          Everything lives in this browser (IndexedDB). Export a JSON backup, or import one.
          Importing adds to what is here and replaces items with the same id.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void exportAll()}>
            <Download /> Export JSON
          </Button>
          <Button asChild>
            <label className="cursor-pointer">
              <Upload /> Import JSON
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file)
                    importAll(file)
                      .then((n) => toast.success(`Imported ${n} items`))
                      .catch((err: unknown) =>
                        toast.error(err instanceof Error ? err.message : 'Import failed'),
                      )
                  e.target.value = ''
                }}
              />
            </label>
          </Button>
        </div>
      </Section>
    </>
  )
}

const clamp = (v: string, min: number, max: number) =>
  Math.min(max, Math.max(min, Number(v) || min))

function NumberField({
  label,
  value,
  onChange,
  type = 'number',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="hud text-muted">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={input}
      />
    </div>
  )
}

function ProviderSetup({ provider }: { provider: ProviderId | null }) {
  const s = useSettings()
  const [email, setEmail] = useState('')
  const [signedIn, setSignedIn] = useState(false)
  const [adult, setAdult] = useState(false)

  useEffect(() => {
    if (provider !== 'ew') return
    let unsubscribe = () => {}
    let live = true
    void getSupabase().then((sb) => {
      if (!sb || !live) return
      // Fires once straight away with the current session, then on every sign-in or sign-out.
      const { data } = sb.auth.onAuthStateChange((_event, session) => {
        setSignedIn(Boolean(session))
        void isAdult().then(setAdult)
      })
      unsubscribe = () => data.subscription.unsubscribe()
    })
    return () => {
      live = false
      unsubscribe()
    }
  }, [provider])

  if (provider === 'ew')
    return (
      <div className="border-line mt-6 max-w-lg rounded-2xl border p-4">
        {!signedIn ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              sendMagicLink(email)
                .then(() => toast.success('Check your email for a sign-in link'))
                .catch((err: unknown) =>
                  toast.error(err instanceof Error ? err.message : 'Could not send the link'),
                )
            }}
          >
            <label htmlFor="ew-email" className="text-sm">
              Sign in with a one-time email link (used only to count your daily AI calls):
            </label>
            <div className="flex gap-2">
              <input
                id="ew-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={input}
                autoComplete="email"
              />
              <Button type="submit" variant="primary">
                Send link
              </Button>
            </div>
          </form>
        ) : adult ? (
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-go">Signed in. 30 free AI calls a day.</span>
            <Button variant="ghost" size="sm" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 text-sm">
            <p>The free AI server is for people aged 18 or over.</p>
            <Button
              variant="primary"
              className="self-start"
              onClick={() => void confirmAdult().then(() => setAdult(true))}
            >
              I am 18 or older
            </Button>
          </div>
        )}
      </div>
    )

  if (provider === 'openrouter')
    return (
      <div className="border-line mt-6 flex max-w-lg flex-col gap-3 rounded-2xl border p-4">
        {s.openrouterKey ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-go">OpenRouter connected.</span>
            <Button variant="ghost" size="sm" onClick={() => s.set({ openrouterKey: null })}>
              Disconnect
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            className="self-start"
            onClick={() => void startOpenRouterAuth()}
          >
            Connect OpenRouter
          </Button>
        )}
        <NumberField
          label="Model"
          type="text"
          value={s.openrouterModel}
          onChange={(v) => s.set({ openrouterModel: v })}
        />
      </div>
    )

  if (provider === 'own')
    return (
      <div className="border-line mt-6 grid max-w-lg gap-3 rounded-2xl border p-4">
        <NumberField
          label="API base URL"
          type="url"
          value={s.ownBaseUrl}
          onChange={(v) => s.set({ ownBaseUrl: v })}
        />
        <NumberField
          label="Model"
          type="text"
          value={s.ownModel}
          onChange={(v) => s.set({ ownModel: v })}
        />
        <NumberField
          label="API key (stored only in this browser)"
          type="password"
          value={s.ownKey ?? ''}
          onChange={(v) => s.set({ ownKey: v || null })}
        />
      </div>
    )

  return null
}
