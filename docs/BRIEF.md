# TaskPilot: build brief (approved by the owner 2026-10-19)

Read CLAUDE.md at the repo root first: it holds the owner's rules, stack and plan, and they all apply. Work on a new branch `revamp` from master, commit in small steps, push, and open a PR to master. Replace the CRA app entirely; keep git history.

## What's there now

Create task (title and description), subtasks, New / In progress / Completed / Archive tabs, localStorage. Bugs: getMonth() off by one; tasks indexed by `id-1`; `.reverse()` changes the stored list; clicking a done subtask throws; no edit or delete.

## What we're making

"TaskPilot: the AI co-pilot for your day", keyboard-first and offline-capable.

Pages:

- `/`: landing with a 3D hero (floating task cards being "piloted" into a calm day), scroll storytelling, pricing teaser, footer "Made with ♥ by EWSTUDIOS"
- `/app`: Inbox, Today, Upcoming, Projects, Board, Calendar, Matrix, Focus
- `/developer`: Meet the developer (links are in CLAUDE.md)
- `/pro`, `/settings` (theme, AI provider, shortcuts, import/export), `/privacy`, `/terms`, a designed 404

## Taken from competitors

- Todoist: natural-language quick add, parsed on the device (chrono-node)
- Things 3: Today / Upcoming / Someday, calm design
- Trello / Linear: kanban (dnd-kit), Ctrl+K palette (cmdk), keyboard-first
- TickTick: Pomodoro focus, Eisenhower matrix, habit streaks
- Motion: "Plan my day" AI time-blocking on the calendar
- Sunsama: morning planning ritual and an evening AI review
- Akiflow: quick capture and voice capture (Web Speech API)

AI actions: goal → subtasks with estimates, plan my day, what should I do now, rewrite a vague task, end-of-day review.

## AI connect layer

One provider interface. Default: the shared backend `POST {VITE_API_URL}/api/ai/taskpilot/:action` with a Supabase JWT, streamed. It doesn't exist yet, so code against that contract and hide the option when VITE_API_URL is unset. Fallbacks: Puter.js, OpenRouter OAuth PKCE, own OpenAI key kept only in the browser.

## Tech

- React 19, strict TS, Vite, TanStack Router, Dexie, Zustand
- Tailwind v4, shadcn/Radix, Lucide, React Three Fiber + drei, GSAP ScrollTrigger + Lenis, Motion
- PWA, dark/light themes, honour reduce-motion
- Vitest + Testing Library, Playwright, ESLint + Prettier
- GitHub Actions: lint, typecheck, test, build, Lighthouse ≥ 95, axe

## Design

Use the `awwwards` MCP from .mcp.json if it loads (search, design DNA, `create_design_brief`) to pick 3–5 references (3D, productivity, SaaS) and set the palette, type and motion. Write the result to docs/design-brief.md. If it doesn't load, say so in the PR and choose the direction yourself to the same standard.

## Assets

A cloud session can't reach the owner's Google Flow. Build with clearly named placeholders and list every needed asset in `docs/assets.md`: path, size or aspect, still or 6s/8s clip, and a ready-to-paste prompt. Use the owner's master character only on the Meet-the-developer page. The list covers: hero clip and still, 3 onboarding and 4 empty-state illustrations, developer portrait and loop, OG image. Assets are generated later on the owner's PC. Draw the logo and icons as SVG yourself.

## Done means

- All pages work and tests pass in CI.
- docs/design-brief.md and docs/assets.md exist.
- A README in the owner's showcase style (see CLAUDE.md) uses Playwright screenshots.
- A PR is open.

Don't deploy, rename the repo or spend anything. List needed owner actions in the PR description.
