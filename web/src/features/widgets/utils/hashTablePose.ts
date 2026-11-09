import {
  bucketOf,
  chainOf,
  fixed2,
  KEYS,
  loadOf,
  type Part,
  readoutOf,
  SLOTS,
  stateOf,
} from '@/features/widgets/utils/hashTable'
import {
  bucketX,
  CARRY_Z,
  FEED_TOP,
  FEED_X,
  PUCK_H,
  SEAT_TOP,
} from '@/features/widgets/utils/hashTableView'

export type Spot = { x: number; z: number }

/** Where every part of the machine is: the head's x, each key's puck, each seat's lift. */
export type Pose = {
  head: number
  pucks: Spot[]
  seats: number[]
  load: number
  lit: number | null
  say: string
}

type Ease = 'inOut' | 'in'

type Step = { to: Pose; seconds: number; ease: Ease }

const SPEED = 300
const LIFT = 0.34
const DROP = 0.3
const CHECK = 0.32
const HOLD = 0.45
const RISE = 0.6

const travel = (from: number, to: number) => 0.22 + Math.abs(to - from) / SPEED
const stackZ = (level: number) => SEAT_TOP + level * PUCK_H
const feedZ = (index: number) => FEED_TOP + (KEYS.length - 1 - index) * PUCK_H

export function restPose(part: Part, count: number): Pose {
  const state = stateOf(part, count)
  return {
    head: FEED_X,
    pucks: KEYS.map((_, index) => {
      const placed = state.placed[index]
      return placed
        ? { x: bucketX(placed.bucket), z: stackZ(placed.level) }
        : { x: FEED_X, z: feedZ(index) }
    }),
    seats: Array.from({ length: SLOTS }, (_, bucket) => (bucket < state.slots ? 1 : 0)),
    load: loadOf(state),
    lit: state.count > 0 ? state.count - 1 : null,
    say: readoutOf(state),
  }
}

const moved = (pose: Pose, index: number, spot: Spot, extra: Partial<Pose> = {}): Pose => ({
  ...pose,
  ...extra,
  pucks: pose.pucks.map((one, at) => (at === index ? spot : one)),
})

function carry(steps: Step[], from: Pose, index: number, to: Spot, say: string): Pose {
  const lifted = moved(from, index, { x: from.head, z: CARRY_Z }, { say, lit: index })
  steps.push({ to: lifted, seconds: LIFT, ease: 'inOut' })
  const there = moved(lifted, index, { x: to.x, z: CARRY_Z }, { head: to.x })
  steps.push({ to: there, seconds: travel(lifted.head, to.x), ease: 'inOut' })
  const dropped = moved(there, index, to)
  steps.push({ to: dropped, seconds: DROP, ease: 'in' })
  return dropped
}

function resized(steps: Step[], from: Pose, part: Part, count: number): Pose {
  const state = stateOf(part, count)
  const { resize } = state
  if (!resize) return from
  const say = `리사이즈 · 칸 ${resize.from} → ${resize.to}`
  let pose: Pose = { ...from, say }
  steps.push({ to: pose, seconds: HOLD, ease: 'inOut' })
  pose = { ...pose, seats: pose.seats.map(() => 1), load: loadOf(state) }
  steps.push({ to: pose, seconds: RISE, ease: 'inOut' })
  for (const move of resize.moves) {
    const index = KEYS.indexOf(move.key as (typeof KEYS)[number])
    const reach = { ...pose, head: bucketX(move.from) }
    steps.push({ to: reach, seconds: travel(pose.head, reach.head), ease: 'inOut' })
    const label = `${move.key}: ${move.from}번 → ${move.to}번 칸`
    pose = carry(steps, reach, index, { x: bucketX(move.to), z: stackZ(move.level) }, label)
  }
  return pose
}

/** The steps of putting the [count]th key in, from the rest pose before it to the one after. */
export function insertionOf(part: Part, count: number): Step[] {
  const before = stateOf(part, count - 1)
  const after = stateOf(part, count)
  const index = count - 1
  const key = KEYS[index]
  if (!key || !after.last || count <= before.count) return []
  const steps: Step[] = []
  const start = { ...restPose(part, count - 1), lit: index }
  const bucket = after.resize ? bucketOf(key, before.slots) : after.last.bucket
  const level = after.resize ? chainOf(before, bucket) : after.last.level
  const home = after.resize ? bucket : after.last.home
  const lifted = moved(start, index, { x: FEED_X, z: CARRY_Z }, { say: `${key} → ${home}번 칸` })
  steps.push({ to: lifted, seconds: LIFT, ease: 'inOut' })
  let pose = moved(lifted, index, { x: bucketX(home), z: CARRY_Z }, { head: bucketX(home) })
  steps.push({ to: pose, seconds: travel(FEED_X, pose.head), ease: 'inOut' })
  const tried = after.resize ? [bucket] : after.last.tried
  for (const [step, slot] of tried.slice(1).entries()) {
    const full = tried[step] ?? slot
    pose = { ...pose, say: `${key} · ${full}번 칸 차 있음` }
    steps.push({ to: pose, seconds: CHECK, ease: 'inOut' })
    const next = { head: bucketX(slot), say: `${key} → ${slot}번 칸` }
    pose = moved(pose, index, { x: bucketX(slot), z: CARRY_Z }, next)
    steps.push({ to: pose, seconds: CHECK, ease: 'inOut' })
  }
  const load = count / before.slots
  const say = after.resize
    ? `키 ${count} / 칸 ${before.slots} · 적재율 ${fixed2(load)}`
    : `${key} → ${bucket}번 칸`
  pose = moved(pose, index, { x: bucketX(bucket), z: stackZ(level) }, { load, say })
  steps.push({ to: pose, seconds: DROP, ease: 'in' })
  pose = resized(steps, pose, part, count)
  const rest = restPose(part, count)
  steps.push({ to: rest, seconds: travel(pose.head, rest.head), ease: 'inOut' })
  return steps
}

export const lengthOf = (steps: Step[]) => steps.reduce((sum, step) => sum + step.seconds, 0)

const eased = (ease: Ease, t: number) => {
  if (ease === 'in') return t * t
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t

function between(from: Pose, step: Step, t: number): Pose {
  const u = eased(step.ease, t)
  const { to } = step
  return {
    head: mix(from.head, to.head, u),
    pucks: to.pucks.map((spot, index) => {
      const was = from.pucks[index] ?? spot
      return { x: mix(was.x, spot.x, u), z: mix(was.z, spot.z, u) }
    }),
    seats: to.seats.map((lift, index) => mix(from.seats[index] ?? lift, lift, u)),
    load: mix(from.load, to.load, u),
    lit: to.lit,
    say: to.say,
  }
}

/** The machine [seconds] into putting the [count]th key in; past the end it is at rest. */
export function poseAt(part: Part, count: number, seconds: number): Pose {
  const steps = insertionOf(part, count)
  let from: Pose = { ...restPose(part, count - 1), lit: count - 1 }
  let left = seconds
  for (const step of steps) {
    if (left < step.seconds) return between(from, step, Math.max(0, left) / step.seconds)
    left -= step.seconds
    from = step.to
  }
  return restPose(part, count)
}
