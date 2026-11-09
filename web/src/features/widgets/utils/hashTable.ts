/** The sections of the hash table post, each a starting pose of the one figure. */
export type Part = 'chaining' | 'probing' | 'load'

export const PARTS: readonly Part[] = ['chaining', 'probing', 'load']

export const PART_TITLES: Record<Part, string> = {
  chaining: '체이닝',
  probing: '선형 탐사',
  load: '적재율과 리사이즈',
}

export function partOf(value: unknown): Part {
  return PARTS.find((part) => part === value) ?? 'chaining'
}

/** The keys in the order they go in, chosen so their Java hash codes collide at 4 and 8 slots. */
export const KEYS = ['apple', 'fig', 'lemon', 'melon', 'kiwi', 'pear'] as const

export const SLOTS = 8

/** Java's `HashMap` resizes once its size passes this share of its slots. */
export const LOAD_LIMIT = 0.75

const START_SLOTS: Record<Part, number> = { chaining: SLOTS, probing: SLOTS, load: SLOTS / 2 }

/** How many keys each part shows before the reader touches it. */
export const REST_COUNT: Record<Part, number> = {
  chaining: KEYS.length,
  probing: KEYS.length,
  load: 3,
}

/** Java's `String.hashCode`: s[0]·31^(n-1) + … + s[n-1], in 32-bit int arithmetic. */
export function hashCode(key: string): number {
  let hash = 0
  for (const char of key) hash = (Math.imul(hash, 31) + (char.codePointAt(0) ?? 0)) | 0
  return hash
}

/** `HashMap.hash`: the high 16 bits folded into the low ones, which the mask keeps. */
export function spread(hash: number): number {
  return hash ^ (hash >>> 16)
}

export function bucketOf(key: string, slots: number): number {
  return spread(hashCode(key)) & (slots - 1)
}

export type Placed = { key: string; bucket: number; level: number }

/** One insertion: the slots looked at in order, the last of them where the key landed. */
export type Insertion = {
  key: string
  home: number
  tried: number[]
  bucket: number
  level: number
}

export type Move = { key: string; from: number; to: number; level: number }

export type Resize = { from: number; to: number; moves: Move[] }

export type TableState = {
  part: Part
  count: number
  slots: number
  placed: Placed[]
  last: Insertion | null
  resize: Resize | null
}

function chained(keys: readonly string[], slots: number): Placed[] {
  const heights = new Array<number>(slots).fill(0)
  return keys.map((key) => {
    const bucket = bucketOf(key, slots)
    const level = heights[bucket] ?? 0
    heights[bucket] = level + 1
    return { key, bucket, level }
  })
}

function probed(keys: readonly string[], slots: number): Insertion[] {
  const taken = new Array<boolean>(slots).fill(false)
  return keys.map((key) => {
    const home = bucketOf(key, slots)
    const tried = [home]
    let bucket = home
    while (taken[bucket]) {
      bucket = (bucket + 1) % slots
      tried.push(bucket)
    }
    taken[bucket] = true
    return { key, home, tried, bucket, level: 0 }
  })
}

const asInsertion = ({ key, bucket, level }: Placed): Insertion => ({
  key,
  home: bucket,
  tried: [bucket],
  bucket,
  level,
})

function loadState(count: number): TableState {
  const keys = KEYS.slice(0, count)
  let slots = START_SLOTS.load
  let resize: Resize | null = null
  for (let size = 1; size <= count; size++) {
    if (size <= slots * LOAD_LIMIT) continue
    const before = chained(keys.slice(0, size), slots)
    const after = chained(keys.slice(0, size), slots * 2)
    const moves = after
      .map((placed, index) => ({ placed, was: before[index] }))
      .filter(({ placed, was }) => was !== undefined && was.bucket !== placed.bucket)
      .map(({ placed, was }) => ({
        key: placed.key,
        from: was?.bucket ?? 0,
        to: placed.bucket,
        level: placed.level,
      }))
      .sort((a, b) => a.from - b.from)
    resize = size === count ? { from: slots, to: slots * 2, moves } : null
    slots *= 2
  }
  const placed = chained(keys, slots)
  const newest = placed.at(-1)
  return { part: 'load', count, slots, placed, last: newest ? asInsertion(newest) : null, resize }
}

/** The table after the first [count] keys, as Java's `HashMap` or linear probing would hold it. */
export function stateOf(part: Part, count: number): TableState {
  const n = Math.max(0, Math.min(KEYS.length, Math.round(count)))
  if (part === 'load') return loadState(n)
  const keys = KEYS.slice(0, n)
  if (part === 'probing') {
    const insertions = probed(keys, SLOTS)
    const placed = insertions.map(({ key, bucket, level }) => ({ key, bucket, level }))
    return { part, count: n, slots: SLOTS, placed, last: insertions.at(-1) ?? null, resize: null }
  }
  const placed = chained(keys, SLOTS)
  const newest = placed.at(-1)
  return {
    part,
    count: n,
    slots: SLOTS,
    placed,
    last: newest ? asInsertion(newest) : null,
    resize: null,
  }
}

export const loadOf = (state: TableState) => state.count / state.slots

export const chainOf = (state: TableState, bucket: number) =>
  state.placed.filter((placed) => placed.bucket === bucket).length

export const fixed2 = (value: number) => (Math.round(value * 100) / 100).toFixed(2)

/** The card's live line: short, in true numbers, from the state the parts show. */
export function readoutOf(state: TableState): string {
  if (state.part === 'load') {
    return `키 ${state.count} / 칸 ${state.slots} · 적재율 ${fixed2(loadOf(state))}`
  }
  const { last } = state
  if (!last) return `빈 테이블 · 칸 ${state.slots}개`
  if (state.part === 'probing')
    return `${last.key} → ${last.bucket}번 칸 · ${last.tried.length}칸 확인`
  return `${last.key} → ${last.bucket}번 칸 · 체인 ${chainOf(state, last.bucket)}`
}

export const indexList = (slots: number) =>
  KEYS.map((key) => `${key} ${bucketOf(key, slots)}`).join(', ')

const longestProbe = () => {
  const insertions = probed(KEYS, SLOTS)
  return insertions.reduce((most, one) => (one.tried.length > most.tried.length ? one : most))
}

const fullChain = () => {
  const state = stateOf('chaining', KEYS.length)
  const bucket = state.placed.reduce(
    (most, one) => (chainOf(state, one.bucket) > chainOf(state, most) ? one.bucket : most),
    0,
  )
  return { bucket, keys: state.placed.filter((one) => one.bucket === bucket).map((one) => one.key) }
}

const firstResize = () => {
  for (let count = 1; count <= KEYS.length; count++) {
    const { resize } = stateOf('load', count)
    if (resize) return { count, resize }
  }
  return null
}

/** A true sentence under each pose, its numbers taken from the model. */
export function captionOf(part: Part): string {
  if (part === 'probing') {
    const probe = longestProbe()
    const span = stateOf('probing', KEYS.length).placed.map((one) => one.bucket)
    return `같은 키 ${KEYS.length}개를 한 칸에 하나씩만 넣습니다. 칸이 차 있으면 오른쪽 칸을 차례로 봅니다. ${probe.key} 키는 ${probe.home}번 칸에서 시작해 ${probe.tried.length}칸을 확인하고 ${probe.bucket}번 칸에 들어갑니다. 차 있는 칸이 ${Math.min(...span)}번부터 ${Math.max(...span)}번까지 이어져, 이 덩어리에 닿는 키는 모두 길게 탐사합니다.`
  }
  if (part === 'load') {
    const first = firstResize()
    if (!first) return ''
    const { count, resize } = first
    const key = KEYS[count - 1]
    const moved = resize.moves.map((move) => `${move.key} ${move.from} → ${move.to}`).join(', ')
    return `칸 ${resize.from}개로 시작해, 키 수가 칸 수의 ${LOAD_LIMIT}배를 넘으면 칸을 두 배로 늘립니다. ${count}번째 키(${key})를 넣어 ${count} > ${resize.from * LOAD_LIMIT}이 되면 칸이 ${resize.to}개가 되고, 모든 키의 칸을 & ${resize.to - 1}로 다시 구합니다. 옮겨지는 키는 ${moved}뿐이고, 나머지는 제자리입니다.`
  }
  const chain = fullChain()
  return `키 ${KEYS.length}개를 칸 ${SLOTS}개에 넣습니다. 칸 번호는 자바 HashMap처럼 hashCode를 (h ^ h >>> 16) & ${SLOTS - 1}로 줄여 얻습니다: ${indexList(SLOTS)}. ${chain.keys.join(', ')} 키가 모두 ${chain.bucket}번 칸에 와서 차례로 쌓여, 길이 ${chain.keys.length}의 체인이 됩니다.`
}
