import type { ReactNode } from 'react'

function Page({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: ReactNode
}) {
  return (
    <article className="[&_h2]:font-display [&_p]:text-muted [&_ul]:text-muted mx-auto max-w-3xl px-6 pt-36 pb-28 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:mt-2 [&_p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
      <p className="hud text-accent">Last updated {updated}</p>
      <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
        {title}
      </h1>
      {children}
    </article>
  )
}

export function Privacy() {
  return (
    <Page title="Privacy" updated="19 October 2026">
      <p>
        The short version: your tasks stay on your device. We don't run ads, trackers or analytics.
      </p>

      <h2>What stays on your device</h2>
      <p>
        Tasks, projects, habits, focus sessions and settings are stored in your browser (IndexedDB
        and local storage). They never reach our servers. Clearing your browser data deletes them,
        so export a backup from Settings now and then.
      </p>

      <h2>When you use the AI co-pilot</h2>
      <p>
        You choose the provider in Settings. Each one sees only what the action needs: task titles,
        estimates, priorities and dates. Notes and project names are never sent.
      </p>
      <ul>
        <li>
          <strong>TaskPilot AI (free)</strong> runs through our server (ew-apps-api) on Google's
          Gemini API free tier.{' '}
          <strong>
            Google may read and use prompts sent on the free tier to improve its products
          </strong>
          , so don't put personal or sensitive details in task titles you send to the AI. You sign
          in with an email link (Supabase) so we can count your daily calls; we store your email, a
          user id and a per-day call count, and nothing else. This option is not offered in the EEA,
          the UK or Switzerland, or to anyone under 18.
        </li>
        <li>
          <strong>Puter</strong>, <strong>OpenRouter</strong> and <strong>your own key</strong> send
          requests straight from your browser to that service, under its own privacy policy. Keys
          are stored only in your browser.
        </li>
      </ul>

      <h2>Our server</h2>
      <p>
        Our API logs the time, route and status of requests to keep it running, and uses your IP
        address in memory to apply rate limits and the region rule. We don't sell or share data.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or deletion requests: reach Emmanuel via{' '}
        <a className="text-sky underline" href="https://emmanuelwilson.tech">
          emmanuelwilson.tech
        </a>
        .
      </p>
    </Page>
  )
}

export function Terms() {
  return (
    <Page title="Terms" updated="19 October 2026">
      <p>
        TaskPilot is open-source software provided as is, without warranty. By using it you agree to
        these terms.
      </p>
      <h2>Your data</h2>
      <p>Your tasks are yours and live on your device. You are responsible for backing them up.</p>
      <h2>The AI co-pilot</h2>
      <p>
        AI suggestions can be wrong. Check plans and estimates before you rely on them. Don't use
        the AI to process other people's personal data. Fair-use limits apply to the free AI server,
        and we may change or pause it.
      </p>
      <h2>Pro</h2>
      <p>
        When Pro launches, its price and refund rules will be shown at checkout. Pro never unlocks
        the AI itself; that stays free.
      </p>
      <h2>Licence</h2>
      <p>
        The source code is MIT-licensed. The TaskPilot name, logo and character artwork belong to
        EWSTUDIOS.
      </p>
    </Page>
  )
}
