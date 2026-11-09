import {
  boxCorners,
  type Flat,
  fitProjection,
  iso,
  type Plan,
  type Point3,
  pathOf,
} from '@/features/widgets/iso/iso-kit'
import { LAP, THREADS } from '@/features/widgets/utils/safepoint'

export const WIDTH = 600
export const HEIGHT = 330
export const AZIMUTH = 58

/** Rail per tick: the front ruler has one tick mark for each. */
export const PITCH = 9
export const X0 = -108
export const xOf = (tick: number) => X0 + tick * PITCH
export const LANE_GAP = 26
export const laneY = (thread: number) => (thread - (THREADS - 1) / 2) * LANE_GAP

/** Each lane stands on its own step, the back ones higher, so no post hides a carriage behind it. */
export const PLINTH = 4
export const STEP = 10
export const floorOf = (thread: number) => PLINTH + (THREADS - 1 - thread) * STEP
export const BED_X = -134
export const BED_W = 264

export const BASE: Plan = { x: -146, y: -62, w: 326, d: 134, r: 9 }
export const BASE_H = 9
export const FOOT_H = 5

export const RAIL_D = 5
export const RAIL_H = 4
export const RAIL_FROM = X0 - 8
export const RAIL_TO = xOf(LAP) + 8
export const STOP_W = 9
export const STOP_D = 13
export const STOP_H = 8

export const CAR_W = 14
export const CAR_D = 13
export const CAR_Z = RAIL_H
export const CAR_H = 6.5
export const CAR_TOP = CAR_Z + CAR_H

/** Posts stand behind their rail, so a carriage always passes in front of them. */
export const POST_Y = -9.5
export const POST = 2.6
export const POST_H = 13
export const TAG_W = 7
export const TAG_D = 1.4
export const TAG_H = 5

export const LAMP_X = RAIL_TO + STOP_W / 2
export const LAMP_R = 2.4
export const LAMP_H = 3

export const MAST: Flat = [150, -20]
export const MAST_R = 3
export const MAST_TOP = 62
export const FLAG_Z = 20
export const FLAG_RISE = 26
export const FLAG_W = 18
export const FLAG_H = 9
export const HEAD_H = 7
export const LENS_H = 2.4

export const DIAL: Flat = [150, 38]
export const DIAL_R = 15
export const DIAL_Z = 3
export const DIAL_H = 8
export const DIAL_TOP = DIAL_Z + DIAL_H
/** The stopwatch reads 0 to 32 ticks over 300°, its gap turned toward the viewer. */
export const DIAL_TICKS = 32
const RADIANS = Math.PI / 180
export const DIAL_SPAN = 300 * RADIANS
export const DIAL_FROM = (AZIMUTH - 90 - 150) * RADIANS

export const P = fitProjection(
  [
    ...boxCorners(BASE, -BASE_H - FOOT_H, 0),
    ...boxCorners(
      { x: BED_X, y: laneY(0) - LANE_GAP / 2, w: BED_W, d: 1, r: 0 },
      0,
      floorOf(0) + POST_H + TAG_H,
    ),
    [MAST[0], MAST[1], MAST_TOP + HEAD_H + LENS_H],
    [MAST[0] + FLAG_W + 4, MAST[1], FLAG_Z + FLAG_RISE + FLAG_H],
  ],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: AZIMUTH },
)

export const at = (point: Point3) => iso(point, P)

const angleOf = (ticks: number) =>
  DIAL_FROM + (Math.min(Math.max(ticks, 0), DIAL_TICKS) / DIAL_TICKS) * DIAL_SPAN

/** A stopwatch hand pointing at [ticks], [reach] short of the face's rim. */
export function handOf(ticks: number, reach: number, width: number) {
  const angle = angleOf(ticks)
  const ux = Math.sin(angle)
  const uy = -Math.cos(angle)
  const [cx, cy] = DIAL
  const point = (along: number, across: number): Flat =>
    at([cx + ux * along - uy * across, cy + uy * along + ux * across, DIAL_TOP + 0.1])
  const tip = DIAL_R - reach
  return pathOf(
    [point(tip, 0), point(0, width), point(-3, width / 2), point(-3, -width / 2), point(0, -width)],
    true,
  )
}

export const needleOf = (ticks: number) => handOf(ticks, 3.6, 0.8)
export const splitOf = (ticks: number) => handOf(ticks, 5.4, 0.55)

const ORIGIN = at([0, 0, 0])
const EX = at([1, 0, 0])
const EZ = at([0, 0, 1])
const fine = (value: number) => Math.round(value * 100) / 100

/** A screen translate for a world move along x and z, the only ways the parts move. */
export function shift(dx: number, dz = 0) {
  const sx = (EX[0] - ORIGIN[0]) * dx + (EZ[0] - ORIGIN[0]) * dz
  const sy = (EX[1] - ORIGIN[1]) * dx + (EZ[1] - ORIGIN[1]) * dz
  return `translate(${fine(sx)} ${fine(sy)})`
}
