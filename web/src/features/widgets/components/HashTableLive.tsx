'use client'

import { type CSSProperties, type ReactNode, useEffect, useId, useRef, useState } from 'react'
import { IsoFigure } from '@/features/widgets/iso/react/draw'
import { follow, useInView, useLoop, useReadout } from '@/features/widgets/iso/react/live'
import {
  KEYS,
  type Part,
  REST_COUNT,
  readoutOf,
  SLOTS,
  stateOf,
} from '@/features/widgets/utils/hashTable'
import {
  insertionOf,
  lengthOf,
  type Pose,
  poseAt,
  restPose,
} from '@/features/widgets/utils/hashTablePose'
import {
  depthAt,
  HEIGHT,
  needleOf,
  SINK,
  shift,
  WIDTH,
} from '@/features/widgets/utils/hashTableView'

const TOUR_FIRST = 1.4
const TOUR_BACK = 3.6
const BETWEEN = 1.1
const AT_END = 2.6
const FADE = 0.35
const NEEDLE = 0.22

type Motion = { count: number; seconds: number; length: number }

type Tour = { wait: number; fading: boolean; quiet: number }

type Props = {
  part: Part
  label: string
  base: ReactNode
  gantry: ReactNode
  carriage: ReactNode
  feeder: ReactNode
  bed: ReactNode
  seats: ReactNode
  risers: ReactNode[]
  clips: string[]
  ruler: ReactNode
  puck: ReactNode
  arm: ReactNode
  dial: ReactNode
}

const order = (pose: Pose) =>
  KEYS.map((_, index) => index).sort((a, b) => {
    const pa = pose.pucks[a]
    const pb = pose.pucks[b]
    return (pa ? depthAt(pa.x, pa.z) : 0) - (pb ? depthAt(pb.x, pb.z) : 0)
  })

const spoken = (part: Part, count: number) =>
  `키 ${count}개 넣음 · ${readoutOf(stateOf(part, count))}`

export function HashTableLive(props: Props) {
  const { part } = props
  const first = REST_COUNT[part]
  const [rest] = useState(() => restPose(part, first))
  const [count, setCount] = useState(first)
  const shown = useRef(first)
  const motion = useRef<Motion>({ count: first, seconds: 0, length: 0 })
  const needle = useRef(rest.load)
  const tour = useRef<Tour>({ wait: TOUR_FIRST, fading: false, quiet: TOUR_BACK })
  const engaged = useRef(false)
  const stage = useRef<HTMLDivElement>(null)
  const carriage = useRef<SVGGElement>(null)
  const arm = useRef<SVGGElement>(null)
  const pucksRoot = useRef<SVGGElement>(null)
  const pucks = useRef<(SVGGElement | null)[]>([])
  const risers = useRef<(SVGGElement | null)[]>([])
  const needlePath = useRef<SVGPathElement>(null)
  const sequence = useRef(order(rest).join())
  const { anchor, say } = useReadout<HTMLDivElement>()
  const visible = useInView(stage)
  const clip = useId().replace(/[^\w-]/g, '')

  const apply = (pose: Pose, calm: boolean, dt: number) => {
    carriage.current?.setAttribute('transform', shift(pose.head))
    arm.current?.setAttribute('transform', shift(pose.head))
    pose.pucks.forEach((spot, index) => {
      const node = pucks.current[index]
      if (!node) return
      node.setAttribute('transform', shift(spot.x, spot.z))
      node.toggleAttribute('data-lit', pose.lit === index)
    })
    const next = order(pose)
    const key = next.join()
    if (key !== sequence.current && pucksRoot.current) {
      sequence.current = key
      for (const index of next) {
        const node = pucks.current[index]
        if (node) pucksRoot.current.appendChild(node)
      }
    }
    pose.seats.forEach((lift, bucket) => {
      risers.current[bucket]?.setAttribute('transform', shift(0, -(1 - lift) * SINK))
    })
    needle.current = follow(needle.current, pose.load, dt, NEEDLE, calm)
    needlePath.current?.setAttribute('d', needleOf(needle.current))
    say(pose.say)
    return needle.current !== pose.load
  }

  const go = (next: number, animate: boolean) => {
    const steps = animate ? insertionOf(part, next) : []
    motion.current = { count: next, seconds: 0, length: lengthOf(steps) }
    shown.current = next
    setCount(next)
  }

  const fade = (on: boolean) => {
    tour.current.fading = on
    pucksRoot.current?.toggleAttribute('data-fading', on)
  }

  const tourStep = () => {
    const state = tour.current
    if (state.fading) {
      fade(false)
      go(0, false)
      state.wait = BETWEEN
    } else if (shown.current < KEYS.length) {
      go(shown.current + 1, true)
      state.wait = shown.current === KEYS.length ? AT_END : BETWEEN
    } else {
      fade(true)
      state.wait = FADE
    }
  }

  const touring = (dt: number, settled: boolean) => {
    const state = tour.current
    if (engaged.current) {
      state.quiet = 0
      return false
    }
    state.quiet += dt
    if (state.quiet < TOUR_BACK || !settled) return true
    state.wait -= dt
    if (state.wait <= 0) tourStep()
    return true
  }

  const kick = useLoop((dt, calm) => {
    const now = motion.current
    if (calm) now.seconds = now.length
    else now.seconds = Math.min(now.length, now.seconds + dt)
    const pose = poseAt(part, now.count, now.seconds >= now.length ? Infinity : now.seconds)
    const swinging = apply(pose, calm, dt)
    const settled = now.seconds >= now.length && !swinging
    const more = calm ? false : touring(dt, settled)
    return more || !settled
  }, visible)

  const act = (next: number) => {
    tour.current = { wait: BETWEEN, fading: false, quiet: 0 }
    pucksRoot.current?.removeAttribute('data-fading')
    go(next, next === shown.current + 1)
    kick()
  }

  const step = () => act(shown.current < KEYS.length ? shown.current + 1 : 0)

  useEffect(() => {
    const node = anchor.current
    if (!node) return
    const hold = (on: boolean) => {
      engaged.current = on
      if (!on) tour.current.quiet = 0
      kick()
    }
    const enter = (event: PointerEvent) => event.pointerType === 'mouse' && hold(true)
    const leave = (event: PointerEvent) => event.pointerType === 'mouse' && hold(false)
    const focus = () => hold(true)
    const blur = () => hold(false)
    node.addEventListener('pointerenter', enter)
    node.addEventListener('pointerleave', leave)
    node.addEventListener('focusin', focus)
    node.addEventListener('focusout', blur)
    return () => {
      node.removeEventListener('pointerenter', enter)
      node.removeEventListener('pointerleave', leave)
      node.removeEventListener('focusin', focus)
      node.removeEventListener('focusout', blur)
    }
  }, [anchor, kick])

  const last = count >= KEYS.length
  return (
    <div ref={anchor} className="hash-figure__live">
      <div ref={stage} className="hash-figure__stage">
        <IsoFigure width={WIDTH} height={HEIGHT} label={props.label}>
          <defs>
            {props.clips.map((d, index) => (
              <clipPath key={d} id={`${clip}-bore-${SLOTS - props.clips.length + index}`}>
                <path d={d} />
              </clipPath>
            ))}
          </defs>
          {props.base}
          {props.gantry}
          <g ref={carriage} transform={shift(rest.head)}>
            {props.carriage}
          </g>
          {props.feeder}
          {props.bed}
          {props.seats}
          {props.risers.map((riser, index) => {
            const bucket = SLOTS - props.risers.length + index
            return (
              <g key={bucket} clipPath={`url(#${clip}-bore-${bucket})`}>
                <g
                  ref={(node) => {
                    risers.current[bucket] = node
                  }}
                  transform={shift(0, -(1 - (rest.seats[bucket] ?? 1)) * SINK)}
                >
                  {riser}
                </g>
              </g>
            )
          })}
          {props.ruler}
          <g ref={pucksRoot} className="hash-figure__pucks">
            {order(rest).map((index) => {
              const spot = rest.pucks[index]
              return (
                <g
                  key={KEYS[index]}
                  ref={(node) => {
                    pucks.current[index] = node
                  }}
                  className="hash-puck"
                  data-lit={rest.lit === index ? '' : undefined}
                  transform={shift(spot?.x ?? 0, spot?.z ?? 0)}
                >
                  {props.puck}
                </g>
              )
            })}
          </g>
          <g ref={arm} transform={shift(rest.head)}>
            {props.arm}
          </g>
          {props.dial}
          <path
            ref={needlePath}
            className="iso-line hash-figure__needle"
            data-tone="lit"
            d={needleOf(rest.load)}
          />
        </IsoFigure>
      </div>
      <div className="hash-figure__controls">
        <button type="button" className="hash-figure__step" onClick={step}>
          {last ? '처음부터' : '키 넣기'}
        </button>
        <label
          className="slider"
          style={{ '--value': `${(count / KEYS.length) * 100}%` } as CSSProperties}
        >
          <span className="mono">
            {count}/{KEYS.length}
          </span>
          <input
            type="range"
            min={0}
            max={KEYS.length}
            value={count}
            aria-label="넣은 키 개수"
            aria-valuetext={spoken(part, count)}
            onChange={(event) => act(Number(event.target.value))}
          />
        </label>
      </div>
    </div>
  )
}
