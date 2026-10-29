import { describe, expect, it } from 'vitest'
import { collapsedFrame, durationOf, motionOf, toggled } from '@/features/ask/utils/motion'

describe('toggled', () => {
  it('opens a closed or folded panel and closes an open one', () => {
    expect(toggled('closed')).toBe('open')
    expect(toggled('minimized')).toBe('open')
    expect(toggled('open')).toBe('closed')
  })
})

describe('motionOf', () => {
  it('rises in from closed, folds into the tab and unfolds from it', () => {
    expect(motionOf('closed', 'open')).toBe('show')
    expect(motionOf('open', 'minimized')).toBe('shrink')
    expect(motionOf('minimized', 'open')).toBe('grow')
    expect(motionOf('open', 'closed')).toBe('hide')
  })

  it('does nothing when the mode stays', () => {
    expect(motionOf('open', 'open')).toBeUndefined()
  })
})

describe('collapsedFrame', () => {
  it('scales the panel from its top left corner onto the tab', () => {
    const panel = { left: 1000, top: 400, width: 420, height: 450 }
    const tab = { left: 1392, top: 700, width: 42, height: 45 }

    expect(collapsedFrame(panel, tab)).toEqual({
      transform: 'translate(392px, 300px) scale(0.1, 0.1)',
      opacity: 0,
      borderRadius: '40px',
    })
  })
})

describe('durationOf', () => {
  it('takes no time for a reader who asks for reduced motion', () => {
    expect(durationOf(300, false)).toBe(300)
    expect(durationOf(300, true)).toBe(0)
  })
})
