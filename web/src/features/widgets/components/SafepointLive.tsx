'use client'

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import { IsoFigure } from '@/features/widgets/iso/react/draw'
import {
  asksForStillness,
  follow,
  useInView,
  useLoop,
  useReadout,
} from '@/features/widgets/iso/react/live'
import {
  CHOSEN,
  FOCUS,
  firstScene,
  LAP,
  lapOf,
  nameOf,
  OP_MAX,
  OP_MIN,
  OP_TICKS,
  type Part,
  phaseOf,
  positionOf,
  restClock,
  type Scene,
  sceneOf,
  stateAt,
  THREADS,
  TOUR_LEADS,
  timingOf,
} from '@/features/widgets/utils/safepoint'
import { type Pose, poseOf } from '@/features/widgets/utils/safepointPose'
import {
  FLAG_RISE,
  HEIGHT,
  needleOf,
  shift,
  splitOf,
  WIDTH,
} from '@/features/widgets/utils/safepointView'

/** Seconds per model tick on screen; the figure never claims real time. */
const TICK = 0.25
const TOUR_FIRST = 1.4
const TOUR_BACK = 3.6
const NEEDLE = 0.15

type Lane = {
  id: string
  tier: ReactNode
  posts: ReactNode
  tags: { key: string; node: ReactNode }[]
  back: ReactNode
  rail: ReactNode
  car: ReactNode
  front: ReactNode
  lamp: ReactNode
}

type Props = {
  part: Part
  label: string
  base: ReactNode
  lanes: Lane[]
  mast: ReactNode
  flag: ReactNode
  head: ReactNode
  lens: ReactNode
  dial: ReactNode
}

type Run = { scene: Scene; clock: number; hold: number; quiet: number; cycle: number }

type Nodes = {
  cars: (SVGGElement | null)[]
  tags: (SVGGElement | null)[][]
  lamps: (SVGGElement | null)[]
  flag: SVGGElement | null
  lens: SVGGElement | null
  split: SVGPathElement | null
  needle: SVGPathElement | null
  controls: HTMLDivElement | null
}

const BUTTONS: Record<Part, string> = {
  why: '멈춰',
  poll: '멈춰',
  ttsp: '세이프포인트 요청',
  handshake: '',
}

const THREAD_LIST = Array.from({ length: THREADS }, (_, thread) => thread)

const isBusy = (run: Run) => {
  const phase = phaseOf(timingOf(run.scene), run.clock)
  return phase === 'reach' || phase === 'op'
}

const placesAt = (scene: Scene, clock: number) =>
  scene.from.map((_, thread) => lapOf(positionOf(scene, thread, clock)))

function draw(nodes: Nodes, pose: Pose) {
  pose.cars.forEach((car, thread) => {
    const node = nodes.cars[thread]
    if (!node) return
    node.setAttribute('transform', shift(car.x))
    node.setAttribute('opacity', String(Math.round(car.fade * 100) / 100))
    node.toggleAttribute('data-lit', car.lit)
  })
  pose.tags.forEach((lit, thread) => {
    lit.forEach((on, index) => {
      nodes.tags[thread]?.[index]?.toggleAttribute('data-lit', on)
    })
  })
  pose.lamps.forEach((on, thread) => {
    nodes.lamps[thread]?.toggleAttribute('data-lit', on)
  })
  nodes.flag?.setAttribute('transform', shift(0, pose.flag * FLAG_RISE))
  nodes.lens?.toggleAttribute('data-lit', pose.working)
}

export function SafepointLive(props: Props) {
  const { part } = props
  const [first] = useState(() => {
    const scene = firstScene(part)
    return { scene, clock: restClock(scene) }
  })
  const rest = poseOf(stateAt(part, first.scene, first.clock))
  const [chosen, setChosen] = useState(CHOSEN)
  const [op, setOp] = useState(OP_TICKS[part])
  const settings = useRef({ chosen: CHOSEN, op: OP_TICKS[part] })
  const run = useRef<Run>({ ...first, hold: TOUR_FIRST, quiet: TOUR_BACK, cycle: 0 })
  const engaged = useRef(false)
  const hands = useRef({ split: rest.split, total: rest.total })
  const nodes = useRef<Nodes>({
    cars: [],
    tags: THREAD_LIST.map(() => []),
    lamps: [],
    flag: null,
    lens: null,
    split: null,
    needle: null,
    controls: null,
  })
  const stage = useRef<HTMLDivElement>(null)
  const { anchor, say } = useReadout<HTMLDivElement>()
  const visible = useInView(stage)

  const sceneFrom = (from: number[], request: number | null) =>
    sceneOf(part, from, request, settings.current)

  const swing = (pose: Pose, calm: boolean, dt: number) => {
    const now = hands.current
    now.split = follow(now.split, pose.split, dt, NEEDLE, calm)
    now.total = follow(now.total, pose.total, dt, NEEDLE, calm)
    nodes.current.split?.setAttribute('d', splitOf(now.split))
    nodes.current.needle?.setAttribute('d', needleOf(now.total))
    return now.split !== pose.split || now.total !== pose.total
  }

  const touring = (dt: number) => {
    const state = run.current
    if (engaged.current) {
      state.quiet = 0
      return false
    }
    state.quiet += dt
    return state.quiet >= TOUR_BACK
  }

  const nextChosen = () => {
    if (part !== 'handshake') return
    const next = (settings.current.chosen + 1) % THREADS
    settings.current.chosen = next
    setChosen(next)
  }

  const roll = (end: number, tour: boolean) => {
    const state = run.current
    const from = placesAt(state.scene, end)
    if (tour) nextChosen()
    const lead = TOUR_LEADS[state.cycle % TOUR_LEADS.length] ?? 0
    state.cycle += 1
    state.scene = sceneFrom(from, tour ? lead : null)
    state.clock -= end
  }

  const advance = (dt: number) => {
    const state = run.current
    const tour = touring(dt)
    if (state.hold > 0) {
      state.hold -= dt
      return
    }
    state.clock += dt / TICK
    const timing = timingOf(state.scene)
    if (timing && state.clock >= timing.end) roll(timing.end, tour)
    else if (!timing && state.clock >= LAP) state.clock -= LAP
    else if (!timing && tour) state.scene = { ...state.scene, request: Math.ceil(state.clock) + 1 }
  }

  const kick = useLoop((dt, calm) => {
    const state = run.current
    if (calm) state.clock = Math.max(state.clock, restClock(state.scene))
    else advance(dt)
    const pose = poseOf(stateAt(part, state.scene, state.clock))
    draw(nodes.current, pose)
    nodes.current.controls?.toggleAttribute('data-busy', !calm && isBusy(state))
    say(pose.say)
    const swinging = swing(pose, calm, dt)
    return !calm || swinging
  }, visible)

  const request = () => {
    const state = run.current
    if (isBusy(state) && !asksForStillness()) return
    const start = Math.ceil(state.clock)
    state.scene = sceneFrom(placesAt(state.scene, start), 0)
    state.clock -= start
    state.hold = 0
    state.quiet = 0
    kick()
  }

  const pick = (thread: number) => {
    settings.current.chosen = thread
    setChosen(thread)
    request()
  }

  const changeOp = (value: number) => {
    settings.current.op = value
    setOp(value)
    const state = run.current
    if (state.scene.request === null || state.clock < state.scene.request) {
      state.scene = { ...state.scene, op: value }
    }
    state.quiet = 0
    kick()
  }

  useEffect(() => {
    const node = anchor.current
    if (!node) return
    const hold = (on: boolean) => {
      engaged.current = on
      if (!on) run.current.quiet = 0
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

  return (
    <div ref={anchor} className="safepoint-figure__live">
      <div ref={stage} className="safepoint-figure__stage">
        <IsoFigure width={WIDTH} height={HEIGHT} label={props.label}>
          {props.base}
          {props.lanes.map((lane, thread) => {
            const car = rest.cars[thread]
            return (
              <g key={lane.id} data-thread={thread + 1}>
                {lane.tier}
                {lane.posts}
                {lane.tags.map((tag, index) => (
                  <g
                    key={tag.key}
                    ref={(node) => {
                      const row = nodes.current.tags[thread]
                      if (row) row[index] = node
                    }}
                    className="sp-tag"
                    data-lit={rest.tags[thread]?.[index] ? '' : undefined}
                  >
                    {tag.node}
                  </g>
                ))}
                {lane.back}
                {lane.rail}
                <g
                  ref={(node) => {
                    nodes.current.cars[thread] = node
                  }}
                  className="sp-car"
                  data-lit={car?.lit ? '' : undefined}
                  opacity={car?.fade}
                  display={car?.shown ? undefined : 'none'}
                  transform={shift(car?.x ?? 0)}
                >
                  {lane.car}
                </g>
                {lane.front}
                <g
                  ref={(node) => {
                    nodes.current.lamps[thread] = node
                  }}
                  className="sp-lamp"
                  data-lit={rest.lamps[thread] ? '' : undefined}
                >
                  {lane.lamp}
                </g>
              </g>
            )
          })}
          {props.mast}
          <g
            ref={(node) => {
              nodes.current.flag = node
            }}
            transform={shift(0, rest.flag * FLAG_RISE)}
          >
            {props.flag}
          </g>
          {props.head}
          <g
            ref={(node) => {
              nodes.current.lens = node
            }}
            className="sp-lens"
            data-lit={rest.working ? '' : undefined}
          >
            {props.lens}
          </g>
          {props.dial}
          <path
            ref={(node) => {
              nodes.current.split = node
            }}
            className="iso-line safepoint-figure__split"
            data-tone="hi"
            d={splitOf(rest.split)}
          />
          <path
            ref={(node) => {
              nodes.current.needle = node
            }}
            className="iso-line safepoint-figure__needle"
            data-tone="lit"
            d={needleOf(rest.total)}
          />
        </IsoFigure>
      </div>
      <div
        ref={(node) => {
          nodes.current.controls = node
        }}
        className="safepoint-figure__controls"
      >
        {part === 'handshake' ? (
          <fieldset className="safepoint-figure__threads">
            <legend>보낼 스레드</legend>
            {THREAD_LIST.map((thread) => (
              <button
                key={thread}
                type="button"
                className="safepoint-figure__step"
                aria-pressed={chosen === thread}
                onClick={() => pick(thread)}
              >
                {nameOf(thread)}
              </button>
            ))}
          </fieldset>
        ) : (
          <button type="button" className="safepoint-figure__step" onClick={request}>
            {BUTTONS[part]}
          </button>
        )}
        {part === 'ttsp' ? (
          <label
            className="slider"
            style={{ '--value': `${((op - OP_MIN) / (OP_MAX - OP_MIN)) * 100}%` } as CSSProperties}
          >
            <span className="mono">VM 작업 {op}틱</span>
            <input
              type="range"
              min={OP_MIN}
              max={OP_MAX}
              value={op}
              aria-label="VM 작업 길이"
              aria-valuetext={`VM 작업 ${op}틱`}
              onChange={(event) => changeOp(Number(event.target.value))}
            />
          </label>
        ) : null}
        {part === 'why' ? (
          <span className="safepoint-figure__note">{nameOf(FOCUS)} 스레드만 달립니다</span>
        ) : null}
      </div>
    </div>
  )
}
