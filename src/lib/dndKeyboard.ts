import type { KeyboardCoordinateGetter } from '@dnd-kit/core'

const DIRS: Record<string, [number, number]> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowUp: [0, -1],
}

/**
 * Arrow keys jump the lifted card to the nearest drop zone in that direction (next column, next quadrant,
 * next calendar slot), instead of nudging it a few pixels.
 */
export const jumpToDropZone: KeyboardCoordinateGetter = (
  event,
  { context, currentCoordinates },
) => {
  const dir = DIRS[event.code]
  const from = context.collisionRect
  if (!dir || !from) return undefined
  event.preventDefault()
  const cx = from.left + from.width / 2
  const cy = from.top + from.height / 2
  let best: { x: number; y: number; d: number } | null = null
  for (const rect of context.droppableRects.values()) {
    const dx = rect.left + rect.width / 2 - cx
    const dy = rect.top + rect.height / 2 - cy
    // Must lie in the pressed direction; prefer straight lines over diagonals.
    const along = dx * dir[0] + dy * dir[1]
    if (along <= 4) continue
    const across = Math.abs(dx * dir[1]) + Math.abs(dy * dir[0])
    const d = along + across * 3
    if (!best || d < best.d) best = { x: dx, y: dy, d }
  }
  return best
    ? { x: currentCoordinates.x + best.x, y: currentCoordinates.y + best.y }
    : currentCoordinates
}
