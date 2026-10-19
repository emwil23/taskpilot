import {
  Archive,
  CalendarDays,
  CalendarRange,
  Columns3,
  FolderKanban,
  Grid2x2,
  Inbox,
  Moon,
  Star,
  Timer,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Second key after "g", e.g. g then t opens Today. */
  key: string
}

export const NAV: NavItem[] = [
  { to: '/app/inbox', label: 'Inbox', icon: Inbox, key: 'i' },
  { to: '/app/today', label: 'Today', icon: Star, key: 't' },
  { to: '/app/upcoming', label: 'Upcoming', icon: CalendarRange, key: 'u' },
  { to: '/app/someday', label: 'Someday', icon: Moon, key: 's' },
  { to: '/app/projects', label: 'Projects', icon: FolderKanban, key: 'p' },
  { to: '/app/board', label: 'Board', icon: Columns3, key: 'b' },
  { to: '/app/calendar', label: 'Calendar', icon: CalendarDays, key: 'c' },
  { to: '/app/matrix', label: 'Matrix', icon: Grid2x2, key: 'm' },
  { to: '/app/focus', label: 'Focus', icon: Timer, key: 'f' },
  { to: '/app/logbook', label: 'Logbook', icon: Archive, key: 'l' },
]
