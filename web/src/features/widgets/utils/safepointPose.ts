import {
  FOCUS,
  LAP,
  lapOf,
  POLLS,
  pollAt,
  readoutOf,
  type State,
} from '@/features/widgets/utils/safepoint'
import { xOf } from '@/features/widgets/utils/safepointView'

/** How a carriage sits: its x on the rail, how far it has faded at the loop, and whether it is held. */
export type Car = { x: number; fade: number; lit: boolean; shown: boolean }

/** Where every part of the machine is at one instant of the model. */
export type Pose = {
  cars: Car[]
  tags: boolean[][]
  lamps: boolean[]
  flag: number
  working: boolean
  split: number
  total: number
  say: string
}

const FADE = 0.4
const RAISE = 0.8

const smooth = (value: number) => {
  const t = Math.min(Math.max(value, 0), 1)
  return t * t * (3 - 2 * t)
}

function carOf(state: State, thread: number): Car {
  const at = lapOf(state.positions[thread] ?? 0)
  return {
    x: xOf(at),
    fade: Math.min(1, at / FADE, (LAP - at) / FADE),
    lit: state.stopped[thread] ?? false,
    shown: state.part !== 'why' || thread === FOCUS,
  }
}

function flagOf(state: State): number {
  const { timing, clock } = state
  if (!timing || !state.scene.global) return 0
  return smooth((clock - timing.request) / RAISE) * (1 - smooth((clock - timing.resume) / RAISE))
}

export function poseOf(state: State): Pose {
  const cars = POLLS.map((_, thread) => carOf(state, thread))
  return {
    cars,
    tags: POLLS.map((polls, thread) => {
      const at = cars[thread]?.shown ? pollAt(thread, state.positions[thread] ?? 0) : null
      return polls.map((poll) => poll === at)
    }),
    lamps: state.armed,
    flag: flagOf(state),
    working: state.phase === 'op' && state.scene.global,
    split: state.split,
    total: state.total,
    say: readoutOf(state),
  }
}
