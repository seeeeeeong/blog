/** The widget's id, which seek links in the text point at; a post holds one handshake widget. */
export const HANDSHAKE = 'handshake'

export type Side = 'client' | 'server'

export type Scenario = 'normal' | 'loss'

/** A segment on the timeline, from [start] to [end] in the widget's time, which runs 0 to 1. */
export type Packet = {
  label: 'SYN' | 'SYN-ACK' | 'ACK'
  from: Side
  start: number
  end: number
  /** The token it is drawn in, `--accent-orange`. */
  color: string
  /** How far across it gets before it is lost; absent when it arrives. */
  lostAt?: number
}

export const SCENARIOS: Record<Scenario, readonly Packet[]> = {
  normal: [
    { label: 'SYN', from: 'client', start: 0.05, end: 0.3, color: '--accent-orange' },
    { label: 'SYN-ACK', from: 'server', start: 0.35, end: 0.6, color: '--accent-teal' },
    { label: 'ACK', from: 'client', start: 0.65, end: 0.9, color: '--accent-blue' },
  ],
  loss: [
    { label: 'SYN', from: 'client', start: 0.03, end: 0.25, color: '--accent-orange', lostAt: 0.5 },
    { label: 'SYN', from: 'client', start: 0.36, end: 0.53, color: '--accent-orange' },
    { label: 'SYN-ACK', from: 'server', start: 0.57, end: 0.74, color: '--accent-teal' },
    { label: 'ACK', from: 'client', start: 0.78, end: 0.95, color: '--accent-blue' },
  ],
}

export const SCENARIO_LABELS: Record<Scenario, string> = { normal: '정상 연결', loss: 'SYN 유실' }

export function isScenario(value: unknown): value is Scenario {
  return value === 'normal' || value === 'loss'
}

/** The SVG's own units: the two lifelines and the span time runs down. */
export const VIEW_WIDTH = 500
export const VIEW_HEIGHT = 300
export const LIFELINE: Record<Side, number> = { client: 110, server: 390 }
export const TOP = 78
export const BOTTOM = 288

export function yOf(t: number): number {
  return TOP + t * (BOTTOM - TOP)
}

const other = (side: Side): Side => (side === 'client' ? 'server' : 'client')

const delivered = (packets: readonly Packet[], t: number) =>
  packets.filter((p) => p.lostAt === undefined && t >= p.end)

export function clientState(packets: readonly Packet[], t: number): string {
  if (delivered(packets, t).some((p) => p.label === 'SYN-ACK')) return 'ESTABLISHED'
  const first = packets[0]
  if (first && t >= first.start) return 'SYN_SENT'
  return 'CLOSED'
}

export function serverState(packets: readonly Packet[], t: number): string {
  const arrived = delivered(packets, t)
  if (arrived.some((p) => p.label === 'ACK')) return 'ESTABLISHED'
  if (arrived.some((p) => p.label === 'SYN')) return 'SYN_RCVD'
  return 'LISTEN'
}

export type PacketFrame = {
  x0: number
  y0: number
  x: number
  y: number
  /** A dot while in flight, a cross where it was lost, nothing once it arrived. */
  head: 'dot' | 'cross' | 'none'
  /** Its name along the line, upright, once it is halfway; null before. */
  label: { x: number; y: number; angle: number } | null
}

/** Where a packet is drawn at time [t]; null before it is sent. */
export function packetFrame(packet: Packet, t: number): PacketFrame | null {
  if (t < packet.start) return null
  const x0 = LIFELINE[packet.from]
  const x1 = LIFELINE[other(packet.from)]
  const y0 = yOf(packet.start)
  const y1 = yOf(packet.end)
  const reach = packet.lostAt ?? 1
  const progress = Math.min((t - packet.start) / (packet.end - packet.start), 1) * reach
  const done = progress >= reach
  const angle = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI
  let upright = angle
  if (angle > 90) upright = angle - 180
  else if (angle < -90) upright = angle + 180
  const mid = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 }
  let head: PacketFrame['head'] = 'dot'
  if (done) head = packet.lostAt === undefined ? 'none' : 'cross'
  return {
    x0,
    y0,
    x: x0 + (x1 - x0) * progress,
    y: y0 + (y1 - y0) * progress,
    head,
    label: progress >= reach * 0.5 ? { x: mid.x, y: mid.y, angle: upright } : null,
  }
}

export type TimeoutFrame = { x: number; y0: number; y1: number; labelled: boolean }

/** The wait between a lost packet and its retry, drawn beside the client; null without a loss. */
export function timeoutFrame(packets: readonly Packet[], t: number): TimeoutFrame | null {
  const lost = packets.findIndex((p) => p.lostAt !== undefined)
  const first = packets[lost]
  const retry = packets[lost + 1]
  if (!first || !retry || t <= first.start) return null
  return {
    x: LIFELINE.client - 22,
    y0: yOf(first.start),
    y1: yOf(Math.min(t, retry.start)),
    labelled: t >= retry.start,
  }
}

/** How much to grow the SVG's text so it stays readable when the drawing is shown narrow. */
export function fontScale(width: number): number {
  if (!(width > 0)) return 1
  return Math.min(Math.max(VIEW_WIDTH / width, 1), 1.9)
}

/** The slider's steps: time runs 0 to 1 in this many. */
export const STEPS = 1000

export function toStep(t: number): number {
  return Math.round(Math.min(Math.max(t, 0), 1) * STEPS)
}

export const PLAY_MS = 4500
/** How long the end stays on screen before playback loops. */
export const HOLD_MS = 1000
export const SEEK_MS = 600

/** Where playback stands; [holdUntil] is set while the end is held, else 0. */
export type Playhead = { t: number; holdUntil: number }

/** Playback starts where the slider is, or over from the start once it is at the end. */
export function playFrom(t: number): Playhead {
  return { t: t >= 1 ? 0 : t, holdUntil: 0 }
}

/** One frame of looping playback, [elapsed] ms after the last at [now]. */
export function advance(head: Playhead, elapsed: number, now: number): Playhead {
  if (head.holdUntil) return now >= head.holdUntil ? { t: 0, holdUntil: 0 } : head
  const t = Math.min(head.t + elapsed / PLAY_MS, 1)
  return { t, holdUntil: t >= 1 ? now + HOLD_MS : 0 }
}

export function easeOutCubic(k: number): number {
  return 1 - (1 - k) ** 3
}

/** Where a seek from [from] to [to] stands [elapsed] ms in; it eases out and ends at [to]. */
export function seekAt(from: number, to: number, elapsed: number): number {
  const k = Math.min(Math.max(elapsed / SEEK_MS, 0), 1)
  return from + (to - from) * easeOutCubic(k)
}

/** A seek link's `to`, as a number in 0 to 1; anything else seeks to the end. */
export function seekTarget(value: unknown): number {
  const t = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(t) ? Math.min(Math.max(t, 0), 1) : 1
}
