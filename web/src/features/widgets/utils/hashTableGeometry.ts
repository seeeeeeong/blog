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
  sideArc,
  slabOf,
  topTicks,
} from '@/features/widgets/iso/iso-kit'
import { LOAD_LIMIT, SLOTS } from '@/features/widgets/utils/hashTable'
import {
  ARM_H,
  ARM_Z,
  AZIMUTH,
  at,
  BASE,
  BASE_H,
  BED,
  BED_H,
  bucketX,
  COMB,
  COMB_TOP,
  DIAL,
  DIAL_FROM,
  DIAL_H,
  DIAL_R,
  DIAL_SPAN,
  DIAL_TOP,
  DIAL_Z,
  FEED_PAD,
  FEED_TOP,
  FEED_X,
  FOOT_H,
  GUIDE_TOP,
  P,
  PAD_Z,
  PIN_H,
  POST,
  POST_L,
  POST_R,
  PUCK_H,
  PUCK_R,
  RAIL_D,
  RAIL_H,
  RAIL_Y,
  RAIL_Z,
  SEAT_H,
  SEAT_R,
  SEAT_TOP,
} from '@/features/widgets/utils/hashTableView'

const solid = (plan: Plan, z: number, h: number, steps = 4, bevel = 0) =>
  slabOf(plan, z, h, P, steps, bevel)
const round = (cx: number, cy: number, r: number, z: number, h: number, steps = 32, bevel = 0) =>
  cylinder(cx, cy, r, z, h, P, steps, bevel)
const circle = (cx: number, cy: number, r: number, z: number, steps = 32) =>
  ring(cx, cy, r, z, P, steps)
const join = (paths: string[]) => paths.join('')
const dot = (x: number, y: number, z: number): Flat => at([x, y, z])
const BUCKETS = Array.from({ length: SLOTS }, (_, bucket) => bucket)

const FEET = corners(BASE, 20)
const SCREWS = corners(BASE, 8)
const LABEL: Plan = { x: BASE.x + 14, y: 23, w: 50, d: 13, r: 2 }
const RULE_ENDS = [40, 30, 36]

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
          [LABEL.x + 8, LABEL.y + 3.8 + row * 2.4],
          [LABEL.x + (RULE_ENDS[row] ?? 30), LABEL.y + 3.8 + row * 2.4],
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

const STRIP: Plan = { x: BED.x + 2, y: BED.y + BED.d + 3, w: BED.w - 4, d: 7, r: 1 }
const FIRST = bucketX(0)
const LAST = bucketX(SLOTS - 1)
const TICKS = topTicks(FIRST, LAST, 7, 4, STRIP.y, 0.6, [2, 3.8], P)

export const RULER_ART = {
  strip: solid(STRIP, 0, 0.6, 3),
  minor: TICKS.minor,
  major: TICKS.major,
  zero: onTop(
    [
      [FIRST, STRIP.y],
      [FIRST, STRIP.y + 5.4],
    ],
    0.6,
    P,
  ),
  screws: [dot(STRIP.x + 3, STRIP.y + 3.5, 0.6), dot(STRIP.x + STRIP.w - 3, STRIP.y + 3.5, 0.6)],
}

const POSTS: Plan[] = [POST_L, POST_R].map((x) => ({
  x,
  y: RAIL_Y - POST / 2,
  w: POST,
  d: POST,
  r: 2,
}))
const RAIL: Plan = {
  x: POST_L - 5,
  y: RAIL_Y - RAIL_D / 2,
  w: POST_R + POST - POST_L + 10,
  d: RAIL_D,
  r: 2,
}
const RAIL_TOP = RAIL_Z + RAIL_H
const STOPS = [FEED_X - 20, LAST + 18]

export const GANTRY_ART = {
  feet: POSTS.map((plan) => solid(insetPlan(plan, -3), 0, 2, 4, 0.4)),
  footScrews: POSTS.flatMap((plan) => [
    dot(plan.x - 1, plan.y + POST / 2, 2),
    dot(plan.x + POST + 1, plan.y + POST / 2, 2),
  ]),
  posts: POSTS.map((plan) => solid(plan, 2, RAIL_Z - 2, 4)),
  postSeams: join(
    POSTS.map((plan) =>
      pathOf([at([plan.x + POST, plan.y + POST, 2]), at([plan.x + POST, plan.y + POST, RAIL_Z])]),
    ),
  ),
  rail: solid(RAIL, RAIL_Z, RAIL_H, 4, 0.8),
  railLine: onTop(
    [
      [RAIL.x, RAIL_Y],
      [RAIL.x + RAIL.w, RAIL_Y],
    ],
    RAIL_TOP,
    P,
  ),
  railScrews: POSTS.map((plan) => dot(plan.x + POST / 2, RAIL_Y + 2.2, RAIL_TOP)),
  stops: STOPS.map((x) =>
    solid({ x: x - 1.6, y: RAIL.y - 0.6, w: 3.2, d: RAIL_D + 1.2, r: 0.8 }, RAIL_TOP, 2.4, 3, 0.3),
  ),
}

const GUIDE = (x: number): Plan => ({ x: x - 1.6, y: COMB.y + 0.2, w: 3.2, d: 3.2, r: 0.6 })

export const BED_ART = {
  slab: solid(BED, 0, BED_H, 4, 0.8),
  seam: planOutline(insetPlan(BED, 2.4), BED_H, P, 4),
  screws: [BED.x + 5, BED.x + BED.w - 5].flatMap((x) => [
    dot(x, BED.y + BED.d - 5, BED_H),
    dot(x, BED.y + 8, BED_H),
  ]),
  comb: solid(COMB, BED_H, COMB_TOP - BED_H, 3, 0.4),
  bores: join(BUCKETS.map((bucket) => circle(bucketX(bucket), 0, SEAT_R + 0.7, BED_H, 40))),
  guides: BUCKETS.map((bucket) => solid(GUIDE(bucketX(bucket)), COMB_TOP, GUIDE_TOP - COMB_TOP, 2)),
  guideCaps: BUCKETS.map((bucket) => dot(bucketX(bucket), COMB.y + 1.8, GUIDE_TOP)),
}

function seatOf(bucket: number) {
  const x = bucketX(bucket)
  return {
    body: round(x, 0, SEAT_R, BED_H, SEAT_H, 40, 0.5),
    face: circle(x, 0, PUCK_R + 0.2, SEAT_TOP, 36),
    seam: sideArc(x, 0, SEAT_R, BED_H + 1.6, P, 28),
    pin: round(x, 0, 1.1, SEAT_TOP, PIN_H, 16),
  }
}

export const SEATS = BUCKETS.map(seatOf)

const RADIANS = Math.PI / 180

/** The screen above a seat's bore: a sunk seat is clipped to it, so it sinks into the bed. */
export function boreClipOf(bucket: number) {
  const x = bucketX(bucket)
  const facing = AZIMUTH * RADIANS
  const arc: Flat[] = []
  for (let step = 0; step <= 32; step++) {
    const angle = facing - Math.PI / 2 + (step / 32) * Math.PI
    arc.push(at([x + SEAT_R * Math.cos(angle), SEAT_R * Math.sin(angle), BED_H]))
  }
  const first = arc[0] ?? [0, 0]
  const last = arc.at(-1) ?? first
  return pathOf([...arc, [last[0], -200], [first[0], -200]], true)
}

const FEED_GUIDE: Plan = { x: FEED_X - 2.6, y: -16, w: 5.2, d: 4, r: 0.8 }

export const FEEDER_ART = {
  pad: round(FEED_X, 0, 13, 0, FEED_PAD, 40, 0.5),
  padScrews: [0, 1, 2].map((step) => {
    const angle = (AZIMUTH + 90 + step * 90) * RADIANS
    return dot(FEED_X + 10.6 * Math.cos(angle), 10.6 * Math.sin(angle), FEED_PAD)
  }),
  seat: round(FEED_X, 0, SEAT_R, FEED_PAD, FEED_TOP - FEED_PAD, 40, 0.4),
  face: circle(FEED_X, 0, PUCK_R + 0.2, FEED_TOP, 36),
  pin: round(FEED_X, 0, 1.1, FEED_TOP, PIN_H, 16),
  block: solid({ x: FEED_X - 5, y: -19, w: 10, d: 7, r: 1.2 }, FEED_PAD, 3, 3, 0.4),
  guide: solid(FEED_GUIDE, FEED_PAD + 3, 26, 2),
  guideCap: dot(FEED_X, -14, FEED_PAD + 29),
}

export const PUCK_ART = {
  body: round(0, 0, PUCK_R, 0, PUCK_H, 40, 0.6),
  groove: circle(0, 0, PUCK_R - 2.4, PUCK_H, 36),
  hole: circle(0, 0, 1.3, PUCK_H, 16),
  seam: sideArc(0, 0, PUCK_R, PUCK_H / 2, P, 28),
}

const CARRIAGE: Plan = { x: -13, y: RAIL_Y - 7, w: 26, d: 14, r: 2.4 }
const CARRIAGE_Z = ARM_Z
const CARRIAGE_H = RAIL_Z + RAIL_H + 3 - ARM_Z
const CARRIAGE_TOP = CARRIAGE_Z + CARRIAGE_H
const ARM: Plan = {
  x: -4.5,
  y: CARRIAGE.y + CARRIAGE.d,
  w: 9,
  d: -(CARRIAGE.y + CARRIAGE.d) + 5,
  r: 1.6,
}

export const CARRIAGE_ART = {
  block: solid(CARRIAGE, CARRIAGE_Z, CARRIAGE_H, 4, 0.8),
  line: planOutline(insetPlan(CARRIAGE, 2.2), CARRIAGE_TOP, P, 3),
  screws: [
    dot(CARRIAGE.x + 3.4, CARRIAGE.y + 3.4, CARRIAGE_TOP),
    dot(CARRIAGE.x + CARRIAGE.w - 3.4, CARRIAGE.y + 3.4, CARRIAGE_TOP),
  ],
  knob: round(4, RAIL_Y + 1, 3, CARRIAGE_TOP, 3.6, 24),
  knurl: knurl(4, RAIL_Y + 1, 3, CARRIAGE_TOP, CARRIAGE_TOP + 3.6, 18, P),
  knobFace: circle(4, RAIL_Y + 1, 1.6, CARRIAGE_TOP + 3.6, 16),
}

export const ARM_ART = {
  arm: solid(ARM, ARM_Z, ARM_H, 3, 0.6),
  line: onTop(
    [
      [0, ARM.y],
      [0, ARM.y + ARM.d],
    ],
    ARM_Z + ARM_H,
    P,
  ),
  screws: [dot(0, ARM.y + 1.4, ARM_Z + ARM_H), dot(0, -4.2, ARM_Z + ARM_H)],
  quill: round(0, 0, 2.4, PAD_Z + 1.6, ARM_Z - PAD_Z - 1.6, 20),
  collar: round(0, 0, 3.4, ARM_Z - 2.2, 2.2, 24),
  pad: round(0, 0, 5.4, PAD_Z, 1.6, 32, 0.3),
}

const LIMIT_ANGLE = DIAL_FROM + LOAD_LIMIT * DIAL_SPAN
const [DX, DY] = DIAL
const STAND: Plan = { x: DX - 16, y: DY - 15, w: 32, d: 30, r: 3 }
const DIAL_TICKS = radialTicks(
  DX,
  DY,
  DIAL_R - 2.4,
  20,
  5,
  DIAL_TOP,
  [1.4, 2.8],
  P,
  DIAL_FROM,
  DIAL_SPAN,
)
const ZERO_ANGLE = DIAL_FROM
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
  minor: DIAL_TICKS.minor,
  major: DIAL_TICKS.major,
  zero: pathOf([onDial(ZERO_ANGLE, DIAL_R - 2.4), onDial(ZERO_ANGLE, DIAL_R - 6)]),
  limit: [onDial(LIMIT_ANGLE - 0.09, DIAL_R - 1.4), onDial(LIMIT_ANGLE + 0.09, DIAL_R - 1.4)],
  hub: circle(DX, DY, 1.6, DIAL_TOP, 16),
  crown: solid({ x: DX + DIAL_R - 0.6, y: DY - 2.4, w: 4.4, d: 4.8, r: 1.2 }, DIAL_Z + 2, 4, 3),
  crownCap: solid(
    { x: DX + DIAL_R + 3.6, y: DY - 3.2, w: 2.6, d: 6.4, r: 1.2 },
    DIAL_Z + 1.2,
    5.6,
    3,
  ),
}
