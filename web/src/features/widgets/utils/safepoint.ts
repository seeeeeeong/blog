/** The sections of the safepoint posts, each a starting pose of the one figure. */
export type Part = 'why' | 'poll' | 'ttsp' | 'handshake'

export const PARTS: readonly Part[] = ['why', 'poll', 'ttsp', 'handshake']

export const PART_TITLES: Record<Part, string> = {
  why: '왜 멈출 곳이 따로 있나',
  poll: '폴링 지점',
  ttsp: 'TTSP와 VM 작업',
  handshake: '스레드 로컬 핸드셰이크',
}

export function partOf(value: unknown): Part {
  return PARTS.find((part) => part === value) ?? 'why'
}

/** One lap of each thread's code in model ticks: a carriage runs a tick of rail per tick, then loops. */
export const LAP = 24

/**
 * Where each thread's compiled code polls: method returns and loop back-edges, in ticks along its lap.
 * The last thread is one long counted loop whose polls the JIT elided, so only the return after it polls.
 */
export const POLLS: readonly (readonly number[])[] = [
  [2, 5, 8, 11, 14, 17, 20, 23],
  [3, 7, 12, 16, 21],
  [5, 14, 23],
  [22],
]

export const THREADS = POLLS.length

/** The thread `why` follows; the others stay off its rails. */
export const FOCUS = 1

/** How long the operation holds the stopped threads in each part, long enough to see them stand. */
export const OP_TICKS: Record<Part, number> = { why: 6, poll: 4, ttsp: 3, handshake: 4 }
export const OP_MIN = 1
export const OP_MAX = 8

/** Every carriage's place when the figure first runs, and the tick its first request comes. */
export const START = [1, 7, 7, 3]
export const LEAD = 2

/** How long all run free after a resume before the next request. */
export const TAIL = 6

/** The idle tour's leads in turn, so each request catches the slowest thread at another place. */
export const TOUR_LEADS = [9, 5, 2]

/** The thread `handshake` opens on. */
export const CHOSEN = 2

const AT_POLL = 0.5

/** One run of the machine: where the carriages start, when the request comes and whom it asks. */
export type Scene = {
  from: number[]
  request: number | null
  targets: number[]
  global: boolean
  op: number
}

export type Timing = {
  request: number
  stops: (number | null)[]
  ttsp: number
  resume: number
  end: number
}

export type Phase = 'run' | 'reach' | 'op' | 'resumed'

export const lapOf = (position: number) => ((position % LAP) + LAP) % LAP

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high)

/** Ticks from [position] to the thread's next poll, 0 when it stands on one. */
export function distanceToPoll(thread: number, position: number): number {
  const at = lapOf(position)
  const polls = POLLS[thread] ?? []
  return Math.min(...polls.map((poll) => lapOf(poll - at)))
}

/** Whether the carriage stands at a poll, where the compiled code keeps a map of its references. */
export function atPoll(thread: number, position: number): boolean {
  return pollAt(thread, position) !== null
}

/** The poll the carriage stands at, or null between two. */
export function pollAt(thread: number, position: number): number | null {
  const at = lapOf(position)
  const found = (POLLS[thread] ?? []).find((poll) => {
    const gap = Math.abs(poll - at)
    return Math.min(gap, LAP - gap) < AT_POLL
  })
  return found ?? null
}

const targetsOf = (part: Part, chosen: number) => {
  if (part === 'why') return [FOCUS]
  if (part === 'handshake') return [chosen]
  return POLLS.map((_, thread) => thread)
}

/** A run that starts from [from] and raises its request at tick [request], or never when null. */
export function sceneOf(
  part: Part,
  from: number[],
  request: number | null,
  options: { chosen?: number; op?: number } = {},
): Scene {
  return {
    from: from.map(lapOf),
    request,
    targets: targetsOf(part, options.chosen ?? CHOSEN),
    global: part !== 'handshake',
    op: options.op ?? OP_TICKS[part],
  }
}

export const firstScene = (part: Part) => sceneOf(part, START, LEAD)

export function timingOf(scene: Scene): Timing | null {
  const { request } = scene
  if (request === null) return null
  const stops = scene.from.map((from, thread) =>
    scene.targets.includes(thread) ? request + distanceToPoll(thread, from + request) : null,
  )
  const ttsp = Math.max(0, ...stops.map((stop) => (stop === null ? 0 : stop - request)))
  const resume = request + ttsp + scene.op
  return { request, stops, ttsp, resume, end: resume + TAIL }
}

/** How far the thread has run by [clock], counting laps: a stopped carriage stays at its poll. */
export function positionOf(scene: Scene, thread: number, clock: number): number {
  const from = scene.from[thread] ?? 0
  const timing = timingOf(scene)
  const stop = timing?.stops[thread]
  if (!timing || stop == null) return from + clock
  return from + clock - clamp(clock - stop, 0, timing.resume - stop)
}

export function phaseOf(timing: Timing | null, clock: number): Phase {
  if (!timing || clock < timing.request) return 'run'
  if (clock < timing.request + timing.ttsp) return 'reach'
  if (clock < timing.resume) return 'op'
  return 'resumed'
}

/** The machine at [clock] of [scene]: every number the card shows comes from here. */
export type State = {
  part: Part
  scene: Scene
  timing: Timing | null
  clock: number
  phase: Phase
  positions: number[]
  stopped: boolean[]
  armed: boolean[]
  split: number
  total: number
}

export function stateAt(part: Part, scene: Scene, clock: number): State {
  const timing = timingOf(scene)
  const positions = scene.from.map((_, thread) => positionOf(scene, thread, clock))
  const stops = timing?.stops ?? scene.from.map(() => null)
  const live = (thread: number, from: number) => {
    const stop = stops[thread]
    return timing !== null && stop != null && clock >= from && clock < timing.resume
  }
  return {
    part,
    scene,
    timing,
    clock,
    phase: phaseOf(timing, clock),
    positions,
    stopped: positions.map((_, thread) => live(thread, stops[thread] ?? Infinity)),
    armed: positions.map((_, thread) => live(thread, timing?.request ?? Infinity)),
    split: timing ? clamp(clock - timing.request, 0, timing.ttsp) : 0,
    total: timing ? clamp(clock - timing.request, 0, timing.ttsp + scene.op) : 0,
  }
}

/** The tick a run rests at: the last carriage has just stopped and the operation starts. */
export function restClock(scene: Scene): number {
  const timing = timingOf(scene)
  return timing ? timing.request + timing.ttsp : 0
}

export const restState = (part: Part) => {
  const scene = firstScene(part)
  return stateAt(part, scene, restClock(scene))
}

const whole = (ticks: number) => Math.ceil(ticks - 1e-6)

export const nameOf = (thread: number) => `${thread + 1}번`

export const distancesOf = (state: State) =>
  state.positions.map((position, thread) => whole(distanceToPoll(thread, position)))

/** The thread the others wait for: the one with the most rail left to its poll at the request. */
export function slowestOf(scene: Scene): { thread: number; ticks: number } {
  const timing = timingOf(scene)
  const waits = (timing?.stops ?? []).map((stop) =>
    stop === null ? -1 : stop - (timing?.request ?? 0),
  )
  const ticks = Math.max(...waits)
  return { thread: waits.indexOf(ticks), ticks }
}

const stoppedCount = (state: State) => state.stopped.filter(Boolean).length

function whyReadout(state: State): string {
  const position = state.positions[FOCUS] ?? 0
  if (state.stopped[FOCUS]) return '검사 지점에서 멈춤 · 지도 있음'
  if (atPoll(FOCUS, position)) return '검사 지점 · 지도 있음'
  const left = `다음 검사 지점까지 ${whole(distanceToPoll(FOCUS, position))}틱 · 지도 없음`
  return state.phase === 'reach' ? `요청 받음 · ${left}` : left
}

function pollReadout(state: State): string {
  if (state.phase === 'run' || state.phase === 'resumed') {
    return `다음 검사 지점까지 ${distancesOf(state).join('·')}틱`
  }
  const slowest = slowestOf(state.scene)
  return `가장 늦은 ${nameOf(slowest.thread)} ${slowest.ticks}틱 · 멈춘 스레드 ${stoppedCount(state)}/${THREADS}`
}

function ttspReadout(state: State): string {
  const { timing, scene } = state
  if (!timing || state.phase === 'run') return `요청 전 · VM 작업 ${scene.op}틱`
  if (state.phase === 'reach') {
    return `TTSP ${Math.floor(state.split)}틱 · 멈춘 스레드 ${stoppedCount(state)}/${THREADS}`
  }
  return `TTSP ${timing.ttsp}틱 · VM 작업 ${scene.op}틱`
}

function handshakeReadout(state: State): string {
  const thread = state.scene.targets[0] ?? CHOSEN
  const name = nameOf(thread)
  if (state.phase === 'run') return `${name} 스레드 고름 · 모두 달림`
  if (state.phase === 'reach') {
    const left = whole(distanceToPoll(thread, state.positions[thread] ?? 0))
    return `${name}에만 요청 · 다음 지점까지 ${left}틱`
  }
  if (state.phase === 'op') return `${name}만 멈춤 · 나머지 ${THREADS - 1}개는 달림`
  return `${name} 재개 · 다른 스레드는 멈춘 적 없음`
}

/** The card's live line: short, in model ticks, from the state the parts show. */
export function readoutOf(state: State): string {
  if (state.part === 'why') return whyReadout(state)
  if (state.part === 'poll') return pollReadout(state)
  if (state.part === 'ttsp') return ttspReadout(state)
  return handshakeReadout(state)
}

const gaps = (thread: number) => {
  const polls = POLLS[thread] ?? []
  return polls.map((poll, index) => lapOf((polls[index + 1] ?? (polls[0] ?? 0) + LAP) - poll))
}

function spacingOf(thread: number): string {
  const all = gaps(thread)
  const low = Math.min(...all)
  const high = Math.max(...all)
  if (all.length === 1) return `${nameOf(thread)} 한 바퀴 ${LAP}틱에 한 번`
  return low === high ? `${nameOf(thread)} ${low}틱마다` : `${nameOf(thread)} ${low}~${high}틱마다`
}

/** A true sentence under each pose, its numbers taken from the model. */
export function captionOf(part: Part): string {
  const rest = restState(part)
  const first = firstScene(part)
  const request = first.request ?? 0
  const before = first.from.map((from, thread) => whole(distanceToPoll(thread, from + request)))
  const slowest = slowestOf(first)
  if (part === 'why') {
    return `JIT이 컴파일한 코드는 메서드가 돌아갈 때와 루프 끝에서 처음으로 되돌아갈 때만 세이프포인트 요청을 검사합니다. 그 지점마다 어느 레지스터와 스택 칸에 객체 참조가 있는지 적은 지도(OopMap)가 있고, 그 사이에는 지도가 없습니다. 그래서 ${nameOf(FOCUS)} 스레드는 요청을 받은 자리에서 서지 않고 ${before[FOCUS]}틱을 더 달려, 지도가 있는 검사 지점에서 멈춥니다.`
  }
  if (part === 'poll') {
    const spacing = POLLS.map((_, thread) => spacingOf(thread)).join(', ')
    return `검사 지점 간격은 스레드마다 다릅니다: ${spacing}. ${nameOf(THREADS - 1)} 스레드는 횟수가 정해진 int 루프(counted loop)를 돕니다. JIT은 이런 루프의 검사를 뺄 수 있어, 이 그림에서는 루프가 끝난 뒤에야 검사 지점이 옵니다. 요청이 온 순간 다음 지점까지 ${before.join('·')}틱이 남아, 모두 서려면 ${nameOf(slowest.thread)} 스레드의 ${slowest.ticks}틱을 기다려야 합니다.`
  }
  if (part === 'ttsp') {
    const op = rest.scene.op
    const ttsp = rest.timing?.ttsp ?? 0
    return `VM 스레드가 SafepointSynchronize로 전역 세이프포인트를 시작하면, 폴링 페이지의 보호를 바꿔 다음 검사에서 트랩이 나게 합니다. 스레드는 검사 지점에 닿는 대로 서고, 네이티브 코드를 실행 중이거나 블록된 스레드는 이미 안전한 것으로 칩니다. 마지막 스레드가 서기까지 걸린 ${ttsp}틱이 TTSP이고, 그 뒤에야 ${op}틱짜리 VM 작업이 돕니다. 작업은 ${op}틱이지만 모든 스레드가 ${ttsp + op}틱 동안 멈춥니다.`
  }
  const thread = rest.scene.targets[0] ?? CHOSEN
  return `JDK 10의 스레드 로컬 핸드셰이크(JEP 312)는 전역 정지 없이 스레드 하나에만 작업을 겁니다. ${nameOf(thread)} 스레드만 ${before[thread]}틱 뒤 다음 검사 지점에서 서서 ${rest.scene.op}틱 동안 작업을 받고 다시 달리며, 나머지 ${THREADS - 1}개 스레드는 한 번도 서지 않습니다.`
}
