import {
  boxCorners,
  depthOf,
  type Flat,
  fitProjection,
  iso,
  type Plan,
  type Point3,
  pathOf,
} from '@/features/widgets/iso/iso-kit'
import { SLOTS } from '@/features/widgets/utils/hashTable'

export const WIDTH = 600
export const HEIGHT = 270
export const AZIMUTH = 62

export const BASE: Plan = { x: -188, y: -54, w: 356, d: 100, r: 9 }
export const BASE_H = 9
export const FOOT_H = 5

export const PITCH = 28
export const bucketX = (bucket: number) => (bucket - (SLOTS - 1) / 2) * PITCH

export const BED: Plan = { x: -118, y: -16, w: 236, d: 32, r: 3 }
export const BED_H = 6
export const COMB: Plan = { x: BED.x + 4, y: BED.y, w: BED.w - 8, d: 3.6, r: 1 }
export const COMB_TOP = BED_H + 3
export const GUIDE_TOP = 27
export const SEAT_R = 9.4
export const SEAT_H = 5
export const SEAT_TOP = BED_H + SEAT_H
export const PIN_H = 2.4
export const SINK = SEAT_H + PIN_H

export const PUCK_R = 7.6
export const PUCK_H = 4.2

export const FEED_X = -148
export const FEED_PAD = 2
export const FEED_TOP = FEED_PAD + 3

export const CARRY_Z = 32
export const PAD_Z = CARRY_Z + PUCK_H
export const ARM_Z = 41
export const ARM_H = 4.5

export const RAIL_Y = -36
export const RAIL_D = 8
export const RAIL_Z = 47
export const RAIL_H = 7
export const POST_L = -180
export const POST_R = 128
export const POST = 12

export const DIAL: Flat = [143, 16]
export const DIAL_R = 15
export const DIAL_Z = 3
export const DIAL_H = 8
export const DIAL_TOP = DIAL_Z + DIAL_H
const RADIANS = Math.PI / 180
/** The dial reads a load factor from 0 to 1 over 300°, its gap turned toward the viewer. */
export const DIAL_SPAN = 300 * RADIANS
export const DIAL_FROM = (AZIMUTH - 90 - 150) * RADIANS

export const P = fitProjection(
  [
    ...boxCorners(BASE, -BASE_H - FOOT_H, 0),
    ...boxCorners({ x: POST_L, y: RAIL_Y - 7, w: POST_R + POST - POST_L, d: 14, r: 0 }, 0, 57),
  ],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: AZIMUTH },
)

export const at = (point: Point3) => iso(point, P)

export const depthAt = (x: number, z: number) => depthOf([x, 0, z], P)

export function needleOf(load: number) {
  const angle = DIAL_FROM + Math.min(Math.max(load, 0), 1) * DIAL_SPAN
  const ux = Math.sin(angle)
  const uy = -Math.cos(angle)
  const [cx, cy] = DIAL
  const point = (along: number, across: number): Flat =>
    at([cx + ux * along - uy * across, cy + uy * along + ux * across, DIAL_TOP + 0.1])
  const tip = DIAL_R - 3.6
  return pathOf(
    [point(tip, 0), point(0, 0.8), point(-3.2, 0.4), point(-3.2, -0.4), point(0, -0.8)],
    true,
  )
}

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
