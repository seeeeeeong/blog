/** Whether the panel is shown, folded into its tab at the right edge, or gone. */
export type AskMode = 'closed' | 'open' | 'minimized'

export type Motion = 'show' | 'shrink' | 'grow' | 'hide'

export type Box = { left: number; top: number; width: number; height: number }

export type Frame = { transform: string; opacity: number; borderRadius: string }

export const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

export const EXPANDED: Frame = { transform: 'none', opacity: 1, borderRadius: '16px' }

export const APPEARING: Keyframe = { opacity: 0, transform: 'translateY(16px) scale(0.98)' }

export const TAB_IN: Keyframe[] = [
  { transform: 'translateX(100%)' },
  { transform: 'translateX(0)' },
]

export const TAB_OUT: Keyframe[] = [...TAB_IN].reverse()

/** The dock's button: it opens a closed or folded panel and closes an open one. */
export const toggled = (mode: AskMode): AskMode => (mode === 'open' ? 'closed' : 'open')

/** How the panel moves from [from] to [to]; nothing when it stays. */
export function motionOf(from: AskMode, to: AskMode): Motion | undefined {
  if (from === to) return undefined
  if (to === 'minimized') return 'shrink'
  if (to === 'closed') return 'hide'
  return from === 'minimized' ? 'grow' : 'show'
}

/** The panel scaled down onto the tab, from its top left corner. */
export function collapsedFrame(panel: Box, tab: Box): Frame {
  const x = tab.left - panel.left
  const y = tab.top - panel.top
  const scale = `${tab.width / panel.width}, ${tab.height / panel.height}`
  return {
    transform: `translate(${x}px, ${y}px) scale(${scale})`,
    opacity: 0,
    borderRadius: '40px',
  }
}

/** A duration in milliseconds, or none for a reader who asks for reduced motion. */
export const durationOf = (ms: number, still: boolean) => (still ? 0 : ms)
