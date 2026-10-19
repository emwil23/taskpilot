import { useSettings } from '@/stores/settings'
import { useState } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent } from './ui/dialog'

const STEPS = [
  {
    art: '/media/onboarding-1.webp',
    alt: 'A ribbon of light turning into a glass task card',
    title: 'Capture in plain words',
    body: 'Press Q anywhere and type like you talk: "Call mom tomorrow 5pm p1 #Family ~30m". Dates, priority, project and estimate are understood on your device. Or tap the mic.',
  },
  {
    art: '/media/onboarding-2.webp',
    alt: 'Glass task cards snapping onto an orange flight path along a timeline',
    title: 'Plan the day as a flight path',
    body: 'Each morning, pull what matters into Today. "Plan my day" time-blocks it on the calendar around your meetings.',
  },
  {
    art: '/media/onboarding-3.webp',
    alt: 'A glass task card inside a glowing focus timer ring',
    title: 'Fly through focus',
    body: 'One task, one Pomodoro, no noise. Your data stays in this browser and works offline. Ctrl+K finds everything.',
  },
]

/** First-run tour, shown once. */
export function Onboarding() {
  const onboarded = useSettings((s) => s.onboarded)
  const set = useSettings((s) => s.set)
  const [step, setStep] = useState(0)
  const current = STEPS[step] ?? STEPS[0]
  if (!current) return null
  const last = step === STEPS.length - 1
  const finish = () => set({ onboarded: true })

  return (
    <Dialog open={!onboarded} onOpenChange={(open) => !open && finish()}>
      <DialogContent title={current.title} className="max-w-lg overflow-hidden p-0" hideTitle>
        <img
          src={current.art}
          alt={current.alt}
          width={960}
          height={717}
          className="aspect-[4/3] w-full object-cover"
        />
        <div className="p-6">
          <p className="hud text-accent">
            Step {step + 1} of {STEPS.length}
          </p>
          <p aria-hidden className="font-display mt-2 text-2xl font-semibold">
            {current.title}
          </p>
          <p className="text-muted mt-2 text-sm leading-relaxed">{current.body}</p>
          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="flex gap-1.5" aria-hidden>
              {STEPS.map((s, i) => (
                <span
                  key={s.title}
                  className={`h-1.5 rounded-full transition-all ${i === step ? 'bg-accent w-6' : 'bg-line w-1.5'}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {!last && (
                <Button variant="ghost" onClick={finish}>
                  Skip
                </Button>
              )}
              <Button variant="primary" onClick={() => (last ? finish() : setStep(step + 1))}>
                {last ? 'Start flying' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
