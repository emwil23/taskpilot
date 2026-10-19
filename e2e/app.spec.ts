import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Skip the first-run tour, except in the test that covers it.
test.beforeEach(async ({ page }, info) => {
  if (info.title.includes('first run')) return
  await page.addInitScript(() => {
    if (!localStorage.getItem('taskpilot-settings'))
      localStorage.setItem(
        'taskpilot-settings',
        JSON.stringify({ state: { onboarded: true }, version: 0 }),
      )
  })
})

async function quickAdd(page: Page, text: string) {
  // Wait until the lazy view has rendered, so the shortcut listener is live.
  await page.getByRole('heading', { level: 1 }).waitFor()
  await page.keyboard.press('q')
  await page.getByLabel('Task', { exact: true }).fill(text)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeHidden()
}

test('landing tells the story and links into the app @mobile', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('co-piloted')
  await expect(page.getByText('Made with')).toContainText('EWSTUDIOS')
  await page.getByRole('link', { name: /start flying/i }).click()
  await expect(page).toHaveURL(/\/app\/today/)
})

test('quick add parses natural language into a scheduled task', async ({ page }) => {
  await page.goto('/app/today')
  await quickAdd(page, 'Ship the deck today at 3pm p1 #Work ~45m')
  const row = page.locator('[data-task-id]').filter({ hasText: 'Ship the deck' })
  await expect(row).toContainText('Work')
  await expect(row).toContainText('45m')
  await expect(row).toContainText('P1')
  await expect(page.getByRole('navigation', { name: 'Projects' })).toContainText('Work')
})

test('quick add: clicking a chip removes what it stands for', async ({ page }) => {
  await page.goto('/app/inbox')
  await page.getByRole('heading', { level: 1 }).waitFor()
  await page.keyboard.press('q')
  const box = page.getByLabel('Task', { exact: true })
  await box.fill('call mom at 11 p2')
  await page.getByRole('button', { name: /remove the date/i }).click()
  await expect(box).toHaveValue('call mom p2')
  await expect(page.getByRole('button', { name: /remove the date/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /remove the priority/i })).toBeVisible()
  await expect(box).toBeFocused()
})

test('keyboard: j moves, x completes, the task moves to the Logbook', async ({ page }) => {
  await page.goto('/app/today')
  await quickAdd(page, 'Water the plants today')
  await expect(page.locator('[data-task-id]').filter({ hasText: 'Water the plants' })).toBeVisible()
  await page.keyboard.press('j')
  await page.keyboard.press('x')
  await expect(page.getByText('Done today · 1')).toBeVisible()
  await page.keyboard.press('g')
  await page.keyboard.press('l')
  await expect(page).toHaveURL(/logbook/)
  await expect(page.locator('[data-task-id]').filter({ hasText: 'Water the plants' })).toBeVisible()
})

test('command palette jumps to a view', async ({ page }) => {
  await page.goto('/app/today')
  await page.getByRole('heading', { level: 1 }).waitFor()
  await page.keyboard.press('Control+k')
  await page.getByPlaceholder(/search tasks/i).fill('matrix')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/app\/matrix/)
})

test('board: a card moves to In progress with the keyboard', async ({ page }) => {
  await page.goto('/app/inbox')
  await quickAdd(page, 'Draft the README')
  await page.goto('/app/board')
  const card = page
    .locator('li[aria-roledescription="draggable task"]')
    .filter({ hasText: 'Draft the README' })
  await card.focus()
  await page.keyboard.press('Space')
  await expect(card).toHaveClass(/opacity-30/)
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('region', { name: 'In progress' })).toHaveClass(/border-accent/)
  await page.keyboard.press('Space')
  await expect(page.getByRole('region', { name: 'In progress' })).toContainText('Draft the README')
})

test('AI: break a goal into subtasks with your own key (mocked)', async ({ page }) => {
  await page.route('https://api.openai.com/v1/chat/completions', (route) => {
    const lines = [
      { title: 'Pick a domain', estimateMin: 15 },
      { title: 'Write the about page', estimateMin: 60 },
    ].map(
      (o) =>
        `data: ${JSON.stringify({ choices: [{ delta: { content: JSON.stringify(o) + '\n' } }] })}\n\n`,
    )
    return route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
      body: lines.join('') + 'data: [DONE]\n\n',
    })
  })
  await page.goto('/settings')
  await page.getByRole('radio', { name: /your own key/i }).click()
  await page.getByLabel(/api key/i).fill('sk-test-not-real')
  await page.goto('/app/inbox')
  await quickAdd(page, 'Launch my portfolio')
  await page.getByRole('button', { name: 'Launch my portfolio' }).click()
  await page.getByRole('button', { name: /break into subtasks/i }).click()
  await expect(page.getByRole('checkbox', { name: 'Write the about page' })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Pick a domain' })).toBeVisible()
})

test('focus: the timer starts and pauses', async ({ page }) => {
  await page.goto('/app/focus')
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await page.getByRole('button', { name: 'Pause' }).click()
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible()
})

test('first run shows a three-step tour, once', async ({ page }) => {
  await page.goto('/app/today')
  const tour = page.getByRole('dialog')
  await expect(tour).toContainText('Step 1 of 3')
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Start flying' }).click()
  await expect(tour).toBeHidden()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('unknown routes show the designed 404', async ({ page }) => {
  await page.goto('/nowhere')
  await expect(page.getByRole('heading', { name: 'Lost altitude.' })).toBeVisible()
})

const PAGES = [
  '/',
  '/developer',
  '/pro',
  '/privacy',
  '/terms',
  '/settings',
  '/app/today',
  '/app/inbox',
  '/app/upcoming',
  '/app/projects',
  '/app/board',
  '/app/calendar',
  '/app/matrix',
  '/app/focus',
  '/app/logbook',
  '/nowhere',
]

for (const path of PAGES) {
  for (const theme of ['dark', 'light'] as const) {
    test(`axe: ${path} (${theme}) has no violations`, async ({ page }) => {
      await page.addInitScript(
        (t) =>
          localStorage.setItem(
            'taskpilot-settings',
            JSON.stringify({ state: { theme: t }, version: 0 }),
          ),
        theme,
      )
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      expect(
        results.violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
        ),
      ).toEqual([])
    })
  }
}

test('free AI sign-in: the emailed code signs you in on this device', async ({ page }) => {
  await page.goto('/settings')
  const ew = page.getByRole('radio', { name: /TaskPilot AI/ })
  test.skip(await ew.isDisabled(), 'Built without Supabase settings')
  const user = {
    id: '00000000-0000-4000-8000-000000000001',
    aud: 'authenticated',
    email: 'pilot@example.com',
    user_metadata: { adult: true },
  }
  await page.route('**/auth/v1/otp*', (r) => r.fulfill({ json: {} }))
  await page.route('**/auth/v1/verify*', (r) =>
    r.fulfill({
      json: {
        access_token: 'test-access',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'test-refresh',
        user,
      },
    }),
  )
  await page.route('**/auth/v1/user*', (r) => r.fulfill({ json: user }))
  await page.route('**/api/me', (r) => r.fulfill({ json: { adult: true } }))
  await ew.click()
  await page.getByLabel(/sign in by email/i).fill('pilot@example.com')
  await page.getByRole('button', { name: 'Email me' }).click()
  await page.getByLabel(/type the code/i).fill('123456')
  await page.getByRole('button', { name: 'Verify' }).click()
  await expect(page.getByText('Signed in. 30 free AI calls a day.')).toBeVisible()
})
