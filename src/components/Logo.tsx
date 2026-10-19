import { cn } from '@/lib/cn'

/** The TaskPilot mark: a check that takes off as a flight path, inside a rounded tile. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-7', className)} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path
        d="M8 17.5l5 5L25 9.5"
        fill="none"
        stroke="var(--accent-ink)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="25" cy="9.5" r="2.2" fill="var(--accent-ink)" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      <span className="font-display text-lg font-semibold tracking-tight">TaskPilot</span>
    </span>
  )
}
