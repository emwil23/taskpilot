import { Button } from '@/components/ui/button'
import { prerendered, useReducedMotionSafe } from '@/lib/boot'
import { cn } from '@/lib/cn'
import { FlightPath } from '@/landing/FlightPath'
import { useSmoothScroll } from '@/landing/useSmoothScroll'
import { PLANS } from '@/pages/Pro'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Check, CloudOff, Command, Compass, Mic, Sparkles, Wand2 } from 'lucide-react'
import { motion } from 'motion/react'
import { lazy, Suspense, useEffect, useState } from 'react'

const Hero3D = lazy(() => import('@/landing/Hero3D'))

/** WebGL only when it helps: wide screens, a real GPU, no reduced motion and no save-data. */
function useCan3D(reduce: boolean) {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    if (reduce || !matchMedia('(min-width: 768px)').matches) return
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    if (conn?.saveData) return
    const gl = document.createElement('canvas').getContext('webgl2')
    if (!gl) return
    // Software rendering (no GPU) would spin the CPU for a decoration; the video and text carry the hero.
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
    if (/swiftshader|llvmpipe|software|basic render/i.test(renderer)) return
    // Wait until the page is idle so the 3D bundle never competes with the first paint.
    const id = requestIdleCallback(() => setOk(true), { timeout: 2500 })
    return () => cancelIdleCallback(id)
  }, [reduce])
  return ok
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

export function Landing() {
  const reduce = useReducedMotionSafe()
  const can3D = useCan3D(reduce)
  useSmoothScroll(!reduce)

  return (
    <>
      <Hero can3D={can3D} reduce={reduce} />
      <FlightPath animate={!reduce} />
      <Bento />
      <AiSection />
      <Pricing />
      <DeveloperCard />
    </>
  )
}

function Hero({ can3D, reduce }: { can3D: boolean; reduce: boolean }) {
  return (
    <section
      aria-labelledby="hero-h"
      className="relative flex min-h-dvh items-center overflow-hidden pt-28 pb-16"
    >
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      {/* The pilot: Emmanuel's character in the cockpit, catching task cards. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-full md:w-[62%]" aria-hidden>
        {reduce ? (
          <img
            src="/media/hero.webp"
            alt=""
            className="h-full w-full object-cover opacity-70"
            fetchPriority="high"
          />
        ) : (
          <video
            className="h-full w-full object-cover opacity-70"
            poster="/media/hero.webp"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          >
            <source src="/media/hero.webm" type="video/webm" />
            <source src="/media/hero.mp4" type="video/mp4" />
          </video>
        )}
        <div className="from-bg via-bg/60 absolute inset-0 bg-gradient-to-r to-transparent" />
        <div className="from-bg to-bg/40 absolute inset-0 bg-gradient-to-t via-transparent" />
      </div>
      {can3D && (
        <div
          className="pointer-events-none absolute inset-0 hidden md:left-[38%] md:block"
          aria-hidden
        >
          <Suspense fallback={null}>
            <Hero3D />
          </Suspense>
        </div>
      )}

      <div className="relative mx-auto w-full max-w-6xl px-6">
        <motion.p
          custom={0}
          initial={prerendered ? false : 'hidden'}
          animate="show"
          variants={fadeUp}
          className="hud border-line bg-bg/60 text-muted inline-flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur"
        >
          <span className="bg-go size-1.5 rounded-full" /> Free · offline · open source
        </motion.p>
        {/* Not animated: it is the LCP element and must paint straight from the prerendered HTML. */}
        <h1
          id="hero-h"
          className="font-display mt-6 max-w-3xl text-[clamp(3rem,8vw,6.5rem)] leading-[0.95] font-semibold tracking-tight"
        >
          Your day,
          <br />
          <span className="text-accent">co-piloted.</span>
        </h1>
        <motion.p
          custom={2}
          initial={prerendered ? false : 'hidden'}
          animate="show"
          variants={fadeUp}
          className="text-muted mt-6 max-w-lg text-lg"
        >
          TaskPilot is the AI co-pilot for your day. Capture in plain words, let it time-block your
          calendar, then fly through focus sessions. Keyboard-first and it works offline.
        </motion.p>
        <motion.div
          custom={3}
          initial={prerendered ? false : 'hidden'}
          animate="show"
          variants={fadeUp}
          className="mt-10 flex flex-wrap gap-3"
        >
          <Button asChild variant="primary" size="lg">
            <Link to="/app/today">
              Start flying <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg">
            <Link to="/" hash="features">
              See a day with it
            </Link>
          </Button>
        </motion.div>
        <motion.p
          custom={4}
          initial={prerendered ? false : 'hidden'}
          animate="show"
          variants={fadeUp}
          className="hud text-muted mt-12 flex items-center gap-2"
        >
          Press <kbd className="border-line rounded border px-1.5 py-0.5">Q</kbd> anywhere in the
          app to capture
        </motion.p>
      </div>
    </section>
  )
}

const BENTO = [
  {
    icon: Command,
    title: 'Keyboard-first',
    body: 'Ctrl+K for everything. J/K to move, X to complete, G then a letter to jump.',
    span: 'md:col-span-2',
    demo: <Kbds />,
  },
  { icon: Mic, title: 'Voice capture', body: 'Say the task. It is parsed like you typed it.' },
  {
    icon: CloudOff,
    title: 'Offline by default',
    body: 'Installable PWA. Your tasks live in your browser, not on our servers.',
  },
  {
    icon: Compass,
    title: 'What now?',
    body: 'Tell it your energy; it picks the one task to do next and says why.',
    span: 'md:col-span-2',
    demo: <NowDemo />,
  },
]

function Bento() {
  return (
    <section aria-labelledby="bento-h" className="mx-auto max-w-6xl px-6 py-28">
      <p className="hud text-accent">Instruments</p>
      <h2
        id="bento-h"
        className="font-display mt-3 max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl"
      >
        The best ideas from every task app, in one calm cockpit.
      </h2>
      <ul className="mt-12 grid gap-4 md:grid-cols-3">
        {BENTO.map((b, i) => (
          <motion.li
            key={b.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay: i * 0.06, duration: 0.6 }}
            className={cn(
              'border-line bg-surface/60 relative overflow-hidden rounded-3xl border p-6',
              b.span,
            )}
          >
            <b.icon className="text-accent size-6" aria-hidden />
            <h3 className="font-display mt-4 text-xl font-semibold">{b.title}</h3>
            <p className="text-muted mt-2 max-w-sm text-sm">{b.body}</p>
            {b.demo && <div className="mt-6">{b.demo}</div>}
          </motion.li>
        ))}
      </ul>
    </section>
  )
}

function Kbds() {
  return (
    <div className="flex flex-wrap gap-2" aria-hidden>
      {['Ctrl K', 'Q', 'J', 'K', 'X', 'G T'].map((k) => (
        <kbd
          key={k}
          className="hud border-line bg-bg rounded-lg border px-3 py-2 shadow-[0_2px_0_var(--line)]"
        >
          {k}
        </kbd>
      ))}
    </div>
  )
}

function NowDemo() {
  return (
    <div className="border-sky/25 bg-sky/5 rounded-2xl border p-4" aria-hidden>
      <p className="hud text-sky">Co-pilot · energy: low</p>
      <p className="font-display mt-2 font-semibold">Reply to Sam's email</p>
      <p className="text-muted text-sm">
        15 minutes, due today, and easy wins suit a low-energy afternoon.
      </p>
    </div>
  )
}

const AI_ACTIONS = [
  {
    icon: Sparkles,
    title: 'Goal → subtasks',
    body: 'Turn "launch my portfolio" into steps with time estimates.',
  },
  {
    icon: Compass,
    title: 'Plan my day',
    body: 'Time-blocks your tasks around your calendar, hardest first.',
  },
  { icon: Check, title: 'What now?', body: 'One task, picked for your time and energy.' },
  {
    icon: Wand2,
    title: 'Make it clearer',
    body: 'Rewrites a vague task into a concrete next action.',
  },
  {
    icon: Sparkles,
    title: 'Evening review',
    body: 'A short, kind look back, then roll the rest to tomorrow.',
  },
]

function AiSection() {
  return (
    <section
      aria-labelledby="ai-h"
      className="border-line bg-surface/40 relative overflow-hidden border-y py-28"
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-2">
        <div>
          <p className="hud text-sky">The co-pilot</p>
          <h2
            id="ai-h"
            className="font-display mt-3 text-4xl font-semibold tracking-tight md:text-5xl"
          >
            AI that plans with you, and is always free.
          </h2>
          <p className="text-muted mt-6 max-w-md">
            Use our free server, or bring your own: Puter, OpenRouter or any OpenAI-compatible key.
            Only task titles, times and priorities are sent. Never notes. Never paywalled.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {AI_ACTIONS.map((a) => (
            <li key={a.title} className="border-line bg-bg/60 rounded-2xl border p-5">
              <a.icon className="text-sky size-5" aria-hidden />
              <h3 className="mt-3 font-medium">{a.title}</h3>
              <p className="text-muted mt-1 text-sm">{a.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section aria-labelledby="pricing-h" className="mx-auto max-w-6xl px-6 py-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="hud text-accent">Pricing</p>
          <h2
            id="pricing-h"
            className="font-display mt-3 text-4xl font-semibold tracking-tight md:text-5xl"
          >
            Free to fly.
          </h2>
          <p className="text-muted mt-4 max-w-md">
            Every feature above is free. Pro adds sync, sharing and email, for all seven EW apps at
            once.
          </p>
        </div>
        <Button asChild>
          <Link to="/pro">
            Compare plans <ArrowRight />
          </Link>
        </Button>
      </div>
      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <li
            key={p.name}
            className={cn(
              'rounded-3xl border p-6',
              p.featured ? 'border-accent bg-accent/5' : 'border-line',
            )}
          >
            <p className="hud text-muted">Pro · {p.name}</p>
            <p className="mt-3">
              <span className="font-display text-4xl font-semibold">{p.price}</span>{' '}
              <span className="text-muted">{p.per}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function DeveloperCard() {
  return (
    <section aria-labelledby="dev-h" className="mx-auto max-w-6xl px-6 pb-28">
      <Link
        to="/developer"
        className="group border-line bg-surface/60 hover:border-accent grid items-center gap-8 overflow-hidden rounded-3xl border p-6 transition-colors md:grid-cols-[auto_1fr_auto] md:p-8"
      >
        <img
          src="/media/developer.webp"
          alt="Emmanuel's 3D character"
          width={160}
          height={160}
          loading="lazy"
          className="size-32 rounded-2xl object-cover md:size-40"
        />
        <div>
          <p className="hud text-accent">Built by</p>
          <h2 id="dev-h" className="font-display mt-2 text-3xl font-semibold">
            Emmanuel Wilson
          </h2>
          <p className="text-muted mt-2 max-w-md">
            Designer-developer behind EWSTUDIOS. Come and say hello.
          </p>
        </div>
        <ArrowRight
          className="text-muted group-hover:text-accent size-8 transition-transform group-hover:translate-x-1"
          aria-hidden
        />
      </Link>
    </section>
  )
}
