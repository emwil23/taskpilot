import { AppShell } from '@/components/AppShell'
import { SiteLayout } from '@/components/SiteLayout'
import { NotFound } from '@/pages/NotFound'
import { useSettings, applyTheme } from '@/stores/settings'
import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import { Toaster } from 'sonner'

function Root() {
  const theme = useSettings((s) => s.theme)
  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])
  return (
    <>
      <Outlet />
      <Toaster
        position="bottom-center"
        theme={theme === 'system' ? 'system' : theme}
        richColors
        closeButton
      />
    </>
  )
}

const root = createRootRoute({ component: Root, notFoundComponent: NotFound })

const site = createRoute({ getParentRoute: () => root, id: 'site', component: SiteLayout })
const shell = createRoute({ getParentRoute: () => root, id: 'shell', component: AppShell })

const sitePages = [
  createRoute({
    getParentRoute: () => site,
    path: '/',
    component: lazyRouteComponent(() => import('@/pages/Landing'), 'Landing'),
  }),
  createRoute({
    getParentRoute: () => site,
    path: 'developer',
    component: lazyRouteComponent(() => import('@/pages/Developer'), 'Developer'),
  }),
  createRoute({
    getParentRoute: () => site,
    path: 'pro',
    component: lazyRouteComponent(() => import('@/pages/Pro'), 'Pro'),
  }),
  createRoute({
    getParentRoute: () => site,
    path: 'privacy',
    component: lazyRouteComponent(() => import('@/pages/Legal'), 'Privacy'),
  }),
  createRoute({
    getParentRoute: () => site,
    path: 'terms',
    component: lazyRouteComponent(() => import('@/pages/Legal'), 'Terms'),
  }),
]

const list = (path: string, name: 'InboxView' | 'UpcomingView' | 'SomedayView' | 'LogbookView') =>
  createRoute({
    getParentRoute: () => shell,
    path,
    component: lazyRouteComponent(() => import('@/views/ListView'), name),
  })

const appPages = [
  createRoute({
    getParentRoute: () => shell,
    path: 'app',
    beforeLoad: () => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router redirects are thrown
      throw redirect({ to: '/app/today' })
    },
  }),
  list('app/inbox', 'InboxView'),
  list('app/upcoming', 'UpcomingView'),
  list('app/someday', 'SomedayView'),
  list('app/logbook', 'LogbookView'),
  createRoute({
    getParentRoute: () => shell,
    path: 'app/today',
    component: lazyRouteComponent(() => import('@/views/TodayView'), 'TodayView'),
  }),
  createRoute({
    getParentRoute: () => shell,
    path: 'app/projects',
    component: lazyRouteComponent(() => import('@/views/ProjectsView'), 'ProjectsView'),
  }),
  createRoute({
    getParentRoute: () => shell,
    path: 'app/projects/$projectId',
    component: lazyRouteComponent(() => import('@/views/ProjectsView'), 'ProjectView'),
  }),
  createRoute({
    getParentRoute: () => shell,
    path: 'app/board',
    component: lazyRouteComponent(() => import('@/views/BoardView'), 'BoardView'),
  }),
  createRoute({
    getParentRoute: () => shell,
    path: 'app/matrix',
    component: lazyRouteComponent(() => import('@/views/MatrixView'), 'MatrixView'),
  }),
  createRoute({
    getParentRoute: () => shell,
    path: 'app/calendar',
    validateSearch: (s: Record<string, unknown>): { plan?: number } => (s.plan ? { plan: 1 } : {}),
    component: lazyRouteComponent(() => import('@/views/CalendarView'), 'CalendarView'),
  }),
  createRoute({
    getParentRoute: () => shell,
    path: 'app/focus',
    validateSearch: (s: Record<string, unknown>): { task?: string } =>
      typeof s.task === 'string' ? { task: s.task } : {},
    component: lazyRouteComponent(() => import('@/views/FocusView'), 'FocusView'),
  }),
  createRoute({
    getParentRoute: () => shell,
    path: 'settings',
    component: lazyRouteComponent(() => import('@/pages/SettingsPage'), 'SettingsPage'),
  }),
]

const routeTree = root.addChildren([site.addChildren(sitePages), shell.addChildren(appPages)])

export const router = createRouter({ routeTree, defaultPreload: 'intent', scrollRestoration: true })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
