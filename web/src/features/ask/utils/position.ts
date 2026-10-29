// The tab keeps clear of the dock above and of the bottom edge.
const TAB_TOP = 72
const TAB_BOTTOM = 56
const TAB_START = 136
export const TAB_STEP = 16
// Less than this is a click that wobbled, not a drag.
const DRAG_SLOP = 4
const MIN_HEIGHT = 320
const HEIGHT_MARGIN = 96

/** The tab's top, kept on screen in a viewport [viewport] tall. */
export function clampTabY(y: number, viewport: number): number {
  return Math.min(Math.max(y, TAB_TOP), viewport - TAB_BOTTOM)
}

/** Where the tab first appears, near the bottom right where the panel was. */
export const startTabY = (viewport: number) => clampTabY(viewport - TAB_START, viewport)

/** The tab moved a step up or down by the arrow keys; other keys leave it. */
export function nudgeTabY(y: number, key: string, viewport: number): number | undefined {
  if (key === 'ArrowUp') return clampTabY(y - TAB_STEP, viewport)
  if (key === 'ArrowDown') return clampTabY(y + TAB_STEP, viewport)
  return undefined
}

/** Whether a pointer that moved [distance] since it went down is dragging. */
export const isDrag = (distance: number) => Math.abs(distance) > DRAG_SLOP

/** The panel's height while its grip is dragged; it grows upwards from the bottom edge. */
export function clampHeight(height: number, viewport: number): number {
  return Math.min(Math.max(height, MIN_HEIGHT), viewport - HEIGHT_MARGIN)
}
