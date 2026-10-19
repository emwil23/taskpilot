# EW apps: revamp of 12 old repos into 7 AI apps

Owner: Emmanuel Wilson (github.com/emwil23, emmanuelwilson.tech). Plan approved 2026-10-19. The owner chose "all in"; don't re-argue the scope.

## Repos in this folder
- `taskpilot/`: clone of github.com/emwil23/taskmanager. Rename it on GitHub to `taskpilot` (owner approved); GitHub redirects the old URL.
- `ew-apps-api/`: the shared backend for all apps (remote github.com/emwil23/ew-apps-api; ask the owner to create it at github.com/new if a push says it's missing).
- Later apps get cloned here too, each in its OLD repo: AthleteGO (athlete-go) → ShopKit (EWSTORE + catalogue-management) → Pixe (pixe) → Natour (natour + ew_trillo + nexter) → Translate+ (TranslateApp) → Willify (MusicSearchApp + Willify; iTunes Search API, not Spotify). TaskAng is retired into TaskPilot.

## Before starting each app
Give the owner a brief and wait for approval: (1) what is there now, (2) what we're making, (3) features to take from competitors, (4) all-in frontend tech and an analysis of each page. It must be a full app worth showing in an interview.

## Every app must have
- Awwwards-level design with 3D, looking like the work of a famous design team: icons, images, video and logos all professional. Use the `awwwards` MCP (search, design DNA, live capture, `create_design_brief`) for references; take inspiration, never copy.
- Assets from the owner's Google Flow (open it in the owner's Chrome via Claude in Chrome), project **"Revamp"**, which has a master character of the owner. No generation limits: Nano Banana Pro for images, the owner's "Omini 1.1 flash" video model for 6s or 8s clips. Draw logos and icons as SVG yourself.
- A **Meet the developer** page with that character and contact links: emmanuelwilson.tech, github.com/emwil23, linkedin.com/in/ewilly, instagram.com/iam_e.w.
- Footer: "Made with ♥ by EWSTUDIOS".
- Best-practice code throughout (strict TypeScript, tests, lint, accessibility, small clean commits); these are interview pieces.
- A showcase README in the style of `D:\Code\AIPro\AIPro\protfolio\README.md` and `D:\Code\AIPro\AIPro\Wedding\README.md`: centred title, tagline, live link and badges; hero screenshot with real alt text; "The idea"; "A walk through" (screenshot table); "How it is built" with several mermaid flowcharts and sequence diagrams; "Decisions worth explaining"; "Run it"; "Where things are". Use real screenshots saved in `docs/`.

## Stack
- Frontend: React 19, TypeScript (strict), Vite, TanStack Router, Tailwind v4, shadcn/Radix, Motion, GSAP + Lenis, React Three Fiber + drei, Vitest + Testing Library, Playwright, ESLint + Prettier, PWA, GitHub Actions CI with Lighthouse ≥ 95 and axe checks. Host on Cloudflare Pages (free, commercial use allowed).
- Backend `ew-apps-api`: Node + Hono on the owner's existing Heroku Basic dyno ($7, one web process; all apps' routes in this one server). No second runtime.
- AI: `POST /api/ai/:app/:action` uses the Gemini free tier (Flash-Lite; model name in an env var) with prompt templates kept on the server (never accept raw prompts), Supabase login, a per-user daily quota, a per-IP limit, input/output caps, and streaming (Heroku's 30s timeout). Hide it for EU/UK/CH users and under-18s. Free-tier prompts may be read by Google, so say so in the privacy page and send no personal data. Fallbacks in the frontend: Puter.js, OpenRouter OAuth (PKCE), own key. Add Sign in with ChatGPT only after OpenAI approves (hosted apps need the interest form).
- Data: Supabase free tier; one project with a schema per app; the API pings it daily so it doesn't pause.
- Pro (one pass for all apps): $2/month, $15/year, $29 lifetime; regional discount codes. Payment via Lemon Squeezy or Gumroad webhook → API → Supabase entitlement. Pro unlocks only server-backed features (sync, share links, PDFs, emails, a higher AI quota); AI itself is never paywalled. Build payments after the core app works.

## Machine
- Install tools with Scoop (`D:\Code\scoop`), e.g. `scoop install gh`. npm-only packages go through npm.
- Spend no money beyond the Heroku dyno.
