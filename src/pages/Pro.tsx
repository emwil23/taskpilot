import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { Link } from '@tanstack/react-router'
import { Check } from 'lucide-react'

export const PLANS = [
  { name: 'Monthly', price: '$2', per: '/month', note: 'Cancel any time' },
  { name: 'Yearly', price: '$15', per: '/year', note: 'Save 37%', featured: true },
  { name: 'Lifetime', price: '$29', per: 'once', note: 'Pay once, keep it' },
]

const FREE = [
  'Every view: Today, Board, Calendar, Matrix, Focus',
  'AI co-pilot (free, never paywalled)',
  'Works offline, data stays on your device',
  'Import and export JSON',
]
const PRO = [
  'Sync across your devices',
  'Shared lists with a link',
  'Morning email digest',
  'Google Calendar two-way sync',
  'Higher daily AI quota',
  'One pass unlocks all 7 EW apps',
]

export function Pro() {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-36 pb-28">
      <p className="hud text-accent">TaskPilot Pro</p>
      <h1 className="font-display mt-4 max-w-3xl text-5xl font-semibold tracking-tight md:text-6xl">
        Free to fly. Pro when you want the whole fleet.
      </h1>
      <p className="text-muted mt-6 max-w-xl text-lg">
        Pro pays for the servers that sync, share and send. The AI co-pilot stays free for everyone.
        Regional prices are available at checkout.
      </p>

      <ul className="mt-14 grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <li
            key={p.name}
            className={cn(
              'rounded-3xl border p-6',
              p.featured ? 'border-accent bg-accent/5' : 'border-line bg-surface/50',
            )}
          >
            <p className="hud text-muted">{p.name}</p>
            <p className="mt-4">
              <span className="font-display text-5xl font-semibold">{p.price}</span>
              <span className="text-muted"> {p.per}</span>
            </p>
            <p className="text-muted mt-2 text-sm">{p.note}</p>
            <Button className="mt-6 w-full" variant={p.featured ? 'primary' : 'secondary'} disabled>
              Coming soon
            </Button>
          </li>
        ))}
      </ul>

      <div className="mt-16 grid gap-10 md:grid-cols-2">
        <FeatureList title="Free, forever" items={FREE} />
        <FeatureList title="Pro adds" items={PRO} accent />
      </div>
      <p className="text-muted mt-12 text-sm">
        Checkout opens once the core app has been tested in the wild. Until then everything here is
        free.{' '}
        <Link to="/app/today" className="text-sky underline underline-offset-4">
          Start using TaskPilot
        </Link>
        .
      </p>
    </div>
  )
}

function FeatureList({
  title,
  items,
  accent,
}: {
  title: string
  items: string[]
  accent?: boolean
}) {
  return (
    <section>
      <h2 className="font-display mb-4 text-xl font-semibold">{title}</h2>
      <ul className="flex flex-col gap-3">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-3">
            <Check
              className={cn('mt-0.5 size-4 shrink-0', accent ? 'text-accent' : 'text-go')}
              aria-hidden
            />
            {i}
          </li>
        ))}
      </ul>
    </section>
  )
}
