import {
  corners,
  cylinder,
  type Flat,
  insetPlan,
  knurl,
  onTop,
  type Plan,
  pathOf,
  planOutline,
  radialTicks,
  ring,
  segment,
  sideArc,
  sideTicks,
  slabOf,
} from '@/features/widgets/iso/iso-kit'
import { LAP, POLLS } from '@/features/widgets/utils/safepoint'
import {
  AZIMUTH,
  at,
  BASE,
  BASE_H,
  BED_W,
  BED_X,
  CAR_D,
  CAR_H,
  CAR_TOP,
  CAR_W,
  CAR_Z,
  DIAL,
  DIAL_FROM,
  DIAL_H,
  DIAL_R,
  DIAL_SPAN,
  DIAL_TICKS,
  DIAL_TOP,
  DIAL_Z,
  FLAG_H,
  FLAG_RISE,
  FLAG_W,
  FLAG_Z,
  FOOT_H,
  floorOf,
  HEAD_H,
  LAMP_H,
  LAMP_R,
  LAMP_X,
  LANE_GAP,
  LENS_H,
  laneY,
  MAST,
  MAST_R,
  MAST_TOP,
  P,
  PITCH,
  POST,
  POST_H,
  POST_Y,
  RAIL_D,
  RAIL_FROM,
  RAIL_H,
  RAIL_TO,
  STOP_D,
  STOP_H,
  STOP_W,
  TAG_D,
  TAG_H,
  TAG_W,
  xOf,
} from '@/features/widgets/utils/safepointView'

const solid = (plan: Plan, z: number, h: number, steps = 4, bevel = 0) =>
  slabOf(plan, z, h, P, steps, bevel)
const round = (cx: number, cy: number, r: number, z: number, h: number, steps = 32, bevel = 0) =>
  cylinder(cx, cy, r, z, h, P, steps, bevel)
const circle = (cx: number, cy: number, r: number, z: number, steps = 32) =>
  ring(cx, cy, r, z, P, steps)
const join = (paths: string[]) => paths.join('')
const dot = (x: number, y: number, z: number): Flat => at([x, y, z])
const RADIANS = Math.PI / 180

const FEET = corners(BASE, 20)
const SCREWS = corners(BASE, 8)
const LABEL: Plan = { x: -128, y: 56, w: 44, d: 12, r: 2 }
const RULE_ENDS = [34, 26, 30]

export const BASE_ART = {
  halo: solid(BASE, -BASE_H - FOOT_H, BASE_H).fill,
  feet: FEET.map(([x, y]) => ({
    flange: round(x, y, 7, -BASE_H - FOOT_H, 1.6, 28),
    foot: round(x, y, 5.5, -BASE_H - FOOT_H + 1.6, FOOT_H - 1.6, 28),
  })),
  slab: solid(BASE, -BASE_H, BASE_H, 8, 1.6),
  groove: planOutline(insetPlan(BASE, 4.5), 0, P),
  screwRings: join(SCREWS.map(([x, y]) => circle(x, y, 2.2, 0, 16))),
  screws: SCREWS.map(([x, y]) => dot(x, y, 0)),
  label: solid(LABEL, 0, 0.8, 4),
  labelLine: planOutline(insetPlan(LABEL, 1.6), 0.8, P),
  labelRule: join(
    [0, 1, 2].map((row) =>
      onTop(
        [
          [LABEL.x + 8, LABEL.y + 3.8 + row * 2.6],
          [LABEL.x + (RULE_ENDS[row] ?? 30), LABEL.y + 3.8 + row * 2.6],
        ],
        0.8,
        P,
      ),
    ),
  ),
  labelScrews: [
    dot(LABEL.x + 3.6, LABEL.y + LABEL.d / 2, 0.8),
    dot(LABEL.x + LABEL.w - 3.6, LABEL.y + LABEL.d / 2, 0.8),
  ],
}

function tierOf(thread: number) {
  const lane = laneY(thread)
  const top = floorOf(thread)
  const plan: Plan = { x: BED_X, y: lane - LANE_GAP / 2, w: BED_W, d: LANE_GAP, r: 1 }
  const face = lane + LANE_GAP / 2
  const ticks = sideTicks(xOf(1), xOf(LAP), PITCH, 4, face, top, [1.6, 3.2], P)
  return {
    body: solid(plan, 0, top, 4, 0.5),
    minor: ticks.minor,
    major: ticks.major,
    zero: segment([xOf(0), face, top], [xOf(0), face, top - 3.2], P),
    screws: [BED_X + 4, BED_X + BED_W - 4].map((x) => dot(x, lane - LANE_GAP / 2 + 4, top)),
  }
}

function postOf(lane: number, z: number, poll: number) {
  const x = xOf(poll)
  const y = lane + POST_Y
  const tag: Plan = { x: x - TAG_W / 2, y: y - TAG_D / 2, w: TAG_W, d: TAG_D, r: 0.3 }
  return {
    pad: solid({ x: x - 3, y: y - 3, w: 6, d: 6, r: 0.8 }, z, 0.8, 3, 0.3),
    column: solid(
      { x: x - POST / 2, y: y - POST / 2, w: POST, d: POST, r: 0.4 },
      z + 0.8,
      POST_H - 0.8,
      2,
    ),
    tag: solid(tag, z + POST_H, TAG_H, 2, 0.3),
    rivet: dot(x, y + TAG_D / 2, z + POST_H + TAG_H / 2),
  }
}

function stopOf(x: number, lane: number, z: number) {
  const plan: Plan = { x, y: lane - STOP_D / 2, w: STOP_W, d: STOP_D, r: 1.2 }
  return {
    body: solid(plan, z, STOP_H, 4, 0.5),
    line: planOutline(insetPlan(plan, 1.6), z + STOP_H, P, 3),
    screws: [dot(x + STOP_W / 2, lane - STOP_D / 2 + 2.6, z + STOP_H)],
  }
}

function railOf(lane: number, z: number) {
  const plan: Plan = {
    x: RAIL_FROM,
    y: lane - RAIL_D / 2,
    w: RAIL_TO - RAIL_FROM,
    d: RAIL_D,
    r: 0.6,
  }
  return {
    body: solid(plan, z, RAIL_H, 3, 0.4),
    groove: onTop(
      [
        [RAIL_FROM, lane],
        [RAIL_TO, lane],
      ],
      z + RAIL_H,
      P,
    ),
  }
}

function lampOf(lane: number, z: number) {
  return {
    body: round(LAMP_X, lane + 1.5, LAMP_R, z + STOP_H, LAMP_H, 24),
    lens: round(LAMP_X, lane + 1.5, LAMP_R - 0.8, z + STOP_H + LAMP_H, 0.8, 24),
  }
}

function carOf(lane: number, z: number) {
  const body: Plan = { x: -CAR_W / 2, y: lane - CAR_D / 2, w: CAR_W, d: CAR_D, r: 1.6 }
  const top = z + CAR_TOP
  return {
    gib: solid(
      { x: -CAR_W / 2 + 1, y: lane + RAIL_D / 2, w: CAR_W - 2, d: 3.4, r: 0.4 },
      z + 1,
      CAR_Z - 1,
      2,
    ),
    body: solid(body, z + CAR_Z, CAR_H, 4, 0.6),
    line: planOutline(insetPlan(body, 2), top, P, 3),
    screws: [
      dot(-CAR_W / 2 + 3.2, lane - CAR_D / 2 + 3.2, top),
      dot(CAR_W / 2 - 3.2, lane + CAR_D / 2 - 3.2, top),
    ],
    knob: round(0, lane, 2.2, top, 2.4, 20),
    knobFace: circle(0, lane, 1.1, top + 2.4, 14),
  }
}

/** Each thread's step of the bed, ruled in ticks, with its rail, stops, lamp, carriage and posts. */
export const LANES = POLLS.map((polls, thread) => {
  const lane = laneY(thread)
  const z = floorOf(thread)
  return {
    id: `thread-${thread + 1}`,
    tier: tierOf(thread),
    posts: polls.map((poll) => postOf(lane, z, poll)),
    back: stopOf(RAIL_FROM - STOP_W, lane, z),
    rail: railOf(lane, z),
    car: carOf(lane, z),
    front: stopOf(RAIL_TO, lane, z),
    lamp: lampOf(lane, z),
  }
})

const [MX, MY] = MAST
const FLAG: Plan = { x: MX + MAST_R + 3, y: MY - 0.8, w: FLAG_W, d: 1.6, r: 0.4 }
const CARRIER: Plan = { x: MX + MAST_R + 0.8, y: MY - 2.4, w: 3, d: 4.8, r: 0.6 }
const GUIDE: Plan = { x: MX + MAST_R - 0.4, y: MY - 1, w: 1.2, d: 2, r: 0.3 }
const GUIDE_FROM = FLAG_Z - 3
const GUIDE_TO = FLAG_Z + FLAG_RISE + FLAG_H + 3

export const MAST_ART = {
  pad: round(MX, MY, 9, 0, 1.6, 40, 0.4),
  padScrews: [0, 1, 2].map((step) => {
    const angle = (AZIMUTH + 90 + step * 90) * RADIANS
    return dot(MX + 7 * Math.cos(angle), MY + 7 * Math.sin(angle), 1.6)
  }),
  column: round(MX, MY, MAST_R, 1.6, MAST_TOP - 1.6, 28),
  collar: round(MX, MY, MAST_R + 1.2, 6, 2.6, 28, 0.3),
  guide: solid(GUIDE, GUIDE_FROM, GUIDE_TO - GUIDE_FROM, 2),
  guideCaps: [dot(MX + MAST_R + 0.2, MY, GUIDE_TO), dot(MX + MAST_R + 0.2, MY, GUIDE_FROM + 1)],
  head: round(MX, MY, 4.6, MAST_TOP, HEAD_H, 32, 0.4),
  band: sideArc(MX, MY, 4.6, MAST_TOP + 2.2, P, 24),
  lens: round(MX, MY, 3.2, MAST_TOP + HEAD_H, LENS_H, 28),
}

export const FLAG_ART = {
  carrier: solid(CARRIER, FLAG_Z - 1.5, FLAG_H + 3, 2, 0.3),
  rivets: [
    dot(CARRIER.x + 1.5, CARRIER.y + CARRIER.d, FLAG_Z + 0.5),
    dot(CARRIER.x + 1.5, CARRIER.y + CARRIER.d, FLAG_Z + FLAG_H - 0.5),
  ],
  flag: solid(FLAG, FLAG_Z, FLAG_H, 2, 0.3),
  stripe: pathOf([
    at([FLAG.x + FLAG.w / 2, FLAG.y + FLAG.d, FLAG_Z]),
    at([FLAG.x + FLAG.w / 2, FLAG.y + FLAG.d, FLAG_Z + FLAG_H]),
  ]),
}

const [DX, DY] = DIAL
const STAND: Plan = { x: DX - 16, y: DY - 15, w: 32, d: 30, r: 3 }
const DIAL_MARKS = radialTicks(
  DX,
  DY,
  DIAL_R - 2.4,
  DIAL_TICKS,
  8,
  DIAL_TOP,
  [1.4, 2.8],
  P,
  DIAL_FROM,
  DIAL_SPAN,
)
const onDial = (angle: number, r: number): Flat =>
  at([DX + Math.sin(angle) * r, DY - Math.cos(angle) * r, DIAL_TOP])

export const DIAL_ART = {
  stand: solid(STAND, 0, DIAL_Z, 4, 0.6),
  standScrews: corners(STAND, 3.4).map(([x, y]) => dot(x, y, DIAL_Z)),
  puck: round(DX, DY, DIAL_R, DIAL_Z, DIAL_H, 56),
  knurl: knurl(DX, DY, DIAL_R, DIAL_TOP - 3, DIAL_TOP, 56, P),
  band: sideArc(DX, DY, DIAL_R, DIAL_TOP - 3, P, 40),
  bezel: circle(DX, DY, DIAL_R - 1, DIAL_TOP, 56),
  face: circle(DX, DY, DIAL_R - 2.4, DIAL_TOP, 56),
  minor: DIAL_MARKS.minor,
  major: DIAL_MARKS.major,
  zero: pathOf([onDial(DIAL_FROM, DIAL_R - 2.4), onDial(DIAL_FROM, DIAL_R - 6)]),
  hub: circle(DX, DY, 1.6, DIAL_TOP, 16),
  crown: solid({ x: DX + DIAL_R - 0.6, y: DY - 2.4, w: 4.4, d: 4.8, r: 1.2 }, DIAL_Z + 2, 4, 3),
  crownCap: solid(
    { x: DX + DIAL_R + 3.6, y: DY - 3.2, w: 2.6, d: 6.4, r: 1.2 },
    DIAL_Z + 1.2,
    5.6,
    3,
  ),
}
