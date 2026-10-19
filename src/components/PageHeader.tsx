import type { ReactNode } from 'react'

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string
  title: string
  children?: ReactNode
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="hud text-accent mb-2">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  )
}
