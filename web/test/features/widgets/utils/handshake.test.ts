import { describe, expect, it } from 'vitest'
import {
  advance,
  BOTTOM,
  clientState,
  easeOutCubic,
  fontScale,
  HOLD_MS,
  isScenario,
  LIFELINE,
  type Packet,
  PLAY_MS,
  packetFrame,
  playFrom,
  SCENARIOS,
  SEEK_MS,
  seekAt,
  seekTarget,
  serverState,
  TOP,
  timeoutFrame,
  toStep,
  yOf,
} from '@/features/widgets/utils/handshake'

const { normal, loss } = SCENARIOS

function nth(packets: readonly Packet[], i: number): Packet {
  const packet = packets[i]
  if (!packet) throw new Error(`No packet ${i}`)
  return packet
}

describe('the states at each end', () => {
  it('walk through the normal handshake', () => {
    const at = (t: number) => [clientState(normal, t), serverState(normal, t)]

    expect(at(0)).toEqual(['CLOSED', 'LISTEN'])
    expect(at(0.1)).toEqual(['SYN_SENT', 'LISTEN'])
    expect(at(0.3)).toEqual(['SYN_SENT', 'SYN_RCVD'])
    expect(at(0.6)).toEqual(['ESTABLISHED', 'SYN_RCVD'])
    expect(at(0.9)).toEqual(['ESTABLISHED', 'ESTABLISHED'])
  })

  it('count a lost SYN as never arrived', () => {
    expect(serverState(loss, 0.3)).toBe('LISTEN')
    expect(serverState(loss, 0.53)).toBe('SYN_RCVD')
    expect(clientState(loss, 1)).toBe('ESTABLISHED')
    expect(serverState(loss, 1)).toBe('ESTABLISHED')
  })
})

describe('yOf', () => {
  it('runs time down the drawing', () => {
    expect(yOf(0)).toBe(TOP)
    expect(yOf(1)).toBe(BOTTOM)
  })
})

describe('packetFrame', () => {
  it('draws nothing before the packet is sent', () => {
    expect(packetFrame(nth(normal, 0), 0.04)).toBeNull()
  })

  it('moves a dot from sender to receiver and names it from halfway', () => {
    const packet = nth(normal, 1)
    const early = packetFrame(packet, 0.4)
    const half = packetFrame(packet, 0.475)

    expect(early?.x0).toBe(LIFELINE.server)
    expect(early?.head).toBe('dot')
    expect(early?.label).toBeNull()
    expect(half?.x).toBeCloseTo((LIFELINE.client + LIFELINE.server) / 2)
    expect(half?.label?.x).toBe((LIFELINE.client + LIFELINE.server) / 2)
  })

  it('keeps a label upright whichever way the packet runs', () => {
    const right = packetFrame(nth(normal, 0), 1)
    const left = packetFrame(nth(normal, 1), 1)

    expect(Math.abs(right?.label?.angle ?? 999)).toBeLessThanOrEqual(90)
    expect(Math.abs(left?.label?.angle ?? 999)).toBeLessThanOrEqual(90)
  })

  it('leaves no head once arrived, and a cross where a lost one stopped', () => {
    const arrived = packetFrame(nth(normal, 0), 1)
    const lost = packetFrame(nth(loss, 0), 1)

    expect(arrived?.head).toBe('none')
    expect(arrived?.x).toBe(LIFELINE.server)
    expect(lost?.head).toBe('cross')
    expect(lost?.x).toBe((LIFELINE.client + LIFELINE.server) / 2)
  })
})

describe('timeoutFrame', () => {
  it('is absent without a loss and before the lost packet leaves', () => {
    expect(timeoutFrame(normal, 1)).toBeNull()
    expect(timeoutFrame(loss, 0.03)).toBeNull()
  })

  it('grows until the retry leaves, then is labelled', () => {
    const waiting = timeoutFrame(loss, 0.2)
    const done = timeoutFrame(loss, 0.9)

    expect(waiting).toEqual({
      x: LIFELINE.client - 22,
      y0: yOf(0.03),
      y1: yOf(0.2),
      labelled: false,
    })
    expect(done).toEqual({ x: LIFELINE.client - 22, y0: yOf(0.03), y1: yOf(0.36), labelled: true })
  })
})

describe('fontScale', () => {
  it('grows text as the drawing narrows, up to a limit', () => {
    expect(fontScale(500)).toBe(1)
    expect(fontScale(800)).toBe(1)
    expect(fontScale(250)).toBe(1.9)
    expect(fontScale(400)).toBe(1.25)
    expect(fontScale(0)).toBe(1)
  })
})

describe('toStep', () => {
  it('rounds time to a slider step and keeps it in range', () => {
    expect(toStep(0.4567)).toBe(457)
    expect(toStep(-1)).toBe(0)
    expect(toStep(2)).toBe(1000)
  })
})

describe('playback', () => {
  it('starts where the slider is, or over from the end', () => {
    expect(playFrom(0.4)).toEqual({ t: 0.4, holdUntil: 0 })
    expect(playFrom(1)).toEqual({ t: 0, holdUntil: 0 })
  })

  it('runs the timeline in its duration', () => {
    expect(advance({ t: 0, holdUntil: 0 }, PLAY_MS / 2, 100)).toEqual({ t: 0.5, holdUntil: 0 })
  })

  it('holds the end for a moment, then loops', () => {
    const end = advance({ t: 0.99, holdUntil: 0 }, PLAY_MS, 1000)
    const holding = advance(end, 16, 1000 + HOLD_MS - 1)
    const looped = advance(holding, 16, 1000 + HOLD_MS)

    expect(end).toEqual({ t: 1, holdUntil: 1000 + HOLD_MS })
    expect(holding).toBe(end)
    expect(looped).toEqual({ t: 0, holdUntil: 0 })
  })
})

describe('seeking', () => {
  it('eases out and lands on the target', () => {
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(0.5)).toBe(0.875)
    expect(easeOutCubic(1)).toBe(1)
    expect(seekAt(0.2, 1, 0)).toBe(0.2)
    expect(seekAt(0.2, 1, SEEK_MS / 2)).toBeCloseTo(0.9)
    expect(seekAt(0.2, 1, SEEK_MS * 2)).toBe(1)
  })

  it("reads a link's target as a time in range, else the end", () => {
    expect(seekTarget(0.95)).toBe(0.95)
    expect(seekTarget('0.5')).toBe(0.5)
    expect(seekTarget(3)).toBe(1)
    expect(seekTarget(-1)).toBe(0)
    expect(seekTarget('soon')).toBe(1)
    expect(seekTarget(undefined)).toBe(1)
  })
})

describe('isScenario', () => {
  it('knows the two scenarios only', () => {
    expect(isScenario('normal')).toBe(true)
    expect(isScenario('loss')).toBe(true)
    expect(isScenario('flood')).toBe(false)
  })
})
