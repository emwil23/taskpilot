import { useState, type ReactNode } from 'react'

export type EmptyArt = 'inbox' | 'today' | 'board' | 'focus'

/** Calm empty state with one of the four character illustrations (see docs/assets.md). */
export function EmptyState({
  art,
  title,
  children,
}: {
  art: EmptyArt
  title: string
  children?: ReactNode
}) {
  const [hasArt, setHasArt] = useState(true)
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {hasArt && (
        <img
          src={`/media/empty-${art}.webp`}
          alt=""
          width={240}
          height={240}
          loading="lazy"
          onError={() => setHasArt(false)}
          className="mb-6 size-48 rounded-3xl object-cover opacity-90 sm:size-60"
        />
      )}
      <p className="font-display text-xl font-semibold">{title}</p>
      {children && <div className="text-muted mt-2 max-w-sm text-sm">{children}</div>}
    </div>
  )
}
