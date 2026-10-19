import { cn } from '@/lib/cn'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CalendarDays, Columns3, Grid2x2, Keyboard, Sparkles, Timer } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

gsap.registerPlugin(ScrollTrigger)

const STEPS = [
  {
    icon: Keyboard,
    time: '07:58',
    title: 'Capture in plain words',
    body: '"Call mom tomorrow 5pm p1 #Family ~30m" becomes a task with a date, time, priority, project and estimate. Parsed on your device. Or just say it.',
  },
  {
    icon: Sparkles,
    time: '08:05',
    title: 'Plan the morning',
    body: 'Pull what matters into Today. The co-pilot time-blocks it around your meetings, hardest work first.',
  },
  {
    icon: CalendarDays,
    time: '08:10',
    title: 'See the day as a runway',
    body: 'Every task gets a slot on the calendar. Drag to adjust; an orange line shows where you are.',
  },
  {
    icon: Grid2x2,
    time: '11:20',
    title: 'Know what matters',
    body: 'The Eisenhower matrix sorts tasks by urgency and importance, so the trivial stops crowding the vital.',
  },
  {
    icon: Timer,
    time: '14:00',
    title: 'Fly through focus',
    body: 'Pomodoro rounds on one task at a time, with habit streaks to keep you honest.',
  },
  {
    icon: Columns3,
    time: '18:30',
    title: 'Land softly',
    body: 'The evening review looks back at the day and rolls the rest to tomorrow. Shut the laptop.',
  },
]

/** Pinned scroll story: a flight path draws itself while each stop of the day lights up. */
export function FlightPath({ animate }: { animate: boolean }) {
  const root = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)

  // Put one stop marker on the path for each step, spread evenly along it.
  useEffect(() => {
    const path = root.current?.querySelector<SVGPathElement>('[data-path]')
    if (!path) return
    const length = path.getTotalLength()
    root.current?.querySelectorAll<SVGCircleElement>('[data-stop]').forEach((c, i) => {
      const p = path.getPointAtLength((length * i) / (STEPS.length - 1))
      c.setAttribute('cx', String(p.x))
      c.setAttribute('cy', String(p.y))
    })
  }, [])

  useEffect(() => {
    if (!animate || !root.current) return
    const ctx = gsap.context(() => {
      const path = root.current?.querySelector<SVGPathElement>('[data-path]')
      const length = path?.getTotalLength() ?? 0
      if (path) gsap.set(path, { strokeDasharray: length, strokeDashoffset: length })
      gsap
        .timeline({
          scrollTrigger: {
            trigger: '[data-pin]',
            start: 'top top',
            end: `+=${STEPS.length * 70}%`,
            pin: true,
            scrub: 0.6,
            onUpdate: (st) =>
              setActive(Math.min(STEPS.length - 1, Math.floor(st.progress * STEPS.length))),
          },
        })
        .to(path ?? {}, { strokeDashoffset: 0, ease: 'none' })
    }, root)
    return () => ctx.revert()
  }, [animate])

  return (
    <section ref={root} id="features" aria-labelledby="flight-h" className="relative">
      <div
        data-pin
        className={cn(
          'relative mx-auto max-w-6xl px-6',
          animate ? 'flex min-h-dvh flex-col justify-center py-24' : 'py-28',
        )}
      >
        <p className="hud text-accent">A day with TaskPilot</p>
        <h2
          id="flight-h"
          className="font-display mt-3 max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl"
        >
          From first coffee to lights out, on one flight path.
        </h2>

        <div className="relative mt-12 grid gap-10 md:grid-cols-[1fr_1.1fr]">
          <svg viewBox="0 0 400 520" className="hidden h-[52vh] w-full md:block" aria-hidden>
            <path
              d="M40 500 C 40 380, 360 400, 340 300 S 40 220, 80 120 S 300 40, 360 20"
              fill="none"
              stroke="var(--line)"
              strokeWidth="2"
            />
            <path
              data-path
              d="M40 500 C 40 380, 360 400, 340 300 S 40 220, 80 120 S 300 40, 360 20"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {STEPS.map((step, i) => (
              <circle
                key={step.title}
                data-stop
                r={i <= active || !animate ? 8 : 5}
                fill={i <= active || !animate ? 'var(--accent)' : 'var(--line)'}
                className="transition-all duration-300"
              />
            ))}
          </svg>

          <ol className="flex flex-col gap-3">
            {STEPS.map((s, i) => {
              const on = !animate || i === active
              return (
                <li
                  key={s.title}
                  className={cn(
                    'rounded-2xl border p-5 transition-all duration-500',
                    on ? 'border-line bg-surface/80' : 'text-muted border-transparent',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <s.icon
                      className={cn('size-5', on ? 'text-accent' : 'text-muted')}
                      aria-hidden
                    />
                    <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                    <span className="hud text-muted ml-auto">{s.time}</span>
                  </div>
                  <p className={cn('text-muted mt-2 text-sm', animate && !on && 'hidden')}>
                    {s.body}
                  </p>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}
