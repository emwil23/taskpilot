import { LogoMark } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'

/** A designed 404: the flight went off the map. */
export function NotFound() {
  return (
    <main
      id="main"
      className="relative grid min-h-dvh place-items-center overflow-hidden px-6 text-center"
    >
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <svg
        viewBox="0 0 600 200"
        className="pointer-events-none absolute top-1/2 left-1/2 w-[min(90vw,900px)] -translate-x-1/2 -translate-y-1/2 opacity-40"
        aria-hidden
      >
        <path
          d="M20 160 C 150 160, 200 40, 300 90 S 480 20, 580 60"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeDasharray="6 10"
        />
        <circle cx="580" cy="60" r="6" fill="var(--accent)" />
      </svg>
      <div className="relative">
        <LogoMark className="mx-auto mb-8 size-12" />
        <p className="hud text-accent">Error 404 · Off the flight plan</p>
        <h1 className="font-display mt-4 text-6xl font-semibold tracking-tight md:text-8xl">
          Lost altitude.
        </h1>
        <p className="text-muted mx-auto mt-4 max-w-md">
          This page isn't on any route we know. Let's get you back on course.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild variant="primary" size="lg">
            <Link to="/app/today">Back to Today</Link>
          </Button>
          <Button asChild size="lg">
            <Link to="/">Home</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
