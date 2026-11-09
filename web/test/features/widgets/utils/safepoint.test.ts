import { describe, expect, it } from 'vitest'
import {
  atPoll,
  captionOf,
  distanceToPoll,
  firstScene,
  partOf,
  phaseOf,
  positionOf,
  readoutOf,
  restClock,
  restState,
  sceneOf,
  slowestOf,
  stateAt,
  timingOf,
} from '@/features/widgets/utils/safepoint'

describe('polls', () => {
  it('measures the rail left to the next poll, looping at the end of a lap', () => {
    expect(distanceToPoll(0, 3)).toBe(2)
    expect(distanceToPoll(1, 12)).toBe(0)
    expect(distanceToPoll(3, 23)).toBe(23)
    expect(distanceToPoll(3, 23 + 24)).toBe(23)
  })

  it('knows a carriage standing at a poll from one between two', () => {
    expect(atPoll(1, 12.3)).toBe(true)
    expect(atPoll(1, 10)).toBe(false)
  })
})

describe('a global safepoint', () => {
  const scene = firstScene('ttsp')

  it('stops each thread at its next poll and waits for the slowest', () => {
    const timing = timingOf(scene)

    expect(timing).toEqual({ request: 2, stops: [4, 5, 7, 19], ttsp: 17, resume: 22, end: 28 })
    expect(slowestOf(scene)).toEqual({ thread: 3, ticks: 17 })
  })

  it('never stops a carriage between two polls', () => {
    for (const clock of [6, 10, 21]) {
      const state = stateAt('ttsp', scene, clock)
      state.positions.forEach((position, thread) => {
        if (state.stopped[thread]) expect(atPoll(thread, position)).toBe(true)
      })
    }
  })

  it('holds every carriage until the operation ends, then runs them on', () => {
    expect(positionOf(scene, 0, 4)).toBe(5)
    expect(positionOf(scene, 0, 21)).toBe(5)
    expect(positionOf(scene, 0, 23)).toBe(6)
    expect(phaseOf(timingOf(scene), 10)).toBe('reach')
    expect(phaseOf(timingOf(scene), 20)).toBe('op')
    expect(phaseOf(timingOf(scene), 22)).toBe('resumed')
  })

  it('keeps the time to safepoint apart from the operation', () => {
    const short = timingOf({ ...scene, op: 1 })
    const long = timingOf({ ...scene, op: 8 })

    expect(short?.ttsp).toBe(17)
    expect(long?.ttsp).toBe(17)
    expect((long?.resume ?? 0) - (short?.resume ?? 0)).toBe(7)
  })

  it('reads the clock from the request on the stopwatch', () => {
    const state = stateAt('ttsp', scene, 20)

    expect(state.split).toBe(17)
    expect(state.total).toBe(18)
  })
})

describe('a thread-local handshake', () => {
  it('stops only the chosen thread, and the others never', () => {
    const scene = sceneOf('handshake', [1, 7, 7, 3], 2, { chosen: 2 })
    const timing = timingOf(scene)

    expect(timing?.stops).toEqual([null, null, 7, null])
    expect(scene.global).toBe(false)
    for (let clock = 0; clock < (timing?.end ?? 0); clock++) {
      const state = stateAt('handshake', scene, clock)
      expect(state.stopped.filter(Boolean).length).toBeLessThanOrEqual(1)
      expect(state.stopped[0]).toBe(false)
    }
  })
})

describe('readouts', () => {
  it('says each part’s rest in model ticks', () => {
    expect(readoutOf(restState('why'))).toBe('검사 지점에서 멈춤 · 지도 있음')
    expect(readoutOf(restState('poll'))).toBe('가장 늦은 4번 17틱 · 멈춘 스레드 4/4')
    expect(readoutOf(restState('ttsp'))).toBe('TTSP 17틱 · VM 작업 3틱')
    expect(readoutOf(restState('handshake'))).toBe('3번만 멈춤 · 나머지 3개는 달림')
  })

  it('tells the rail left before the request', () => {
    const why = firstScene('why')
    const poll = firstScene('poll')

    expect(readoutOf(stateAt('why', why, 0))).toBe('검사 지점 · 지도 있음')
    expect(readoutOf(stateAt('why', why, 1))).toBe('다음 검사 지점까지 4틱 · 지도 없음')
    expect(readoutOf(stateAt('why', why, 2.5))).toBe(
      '요청 받음 · 다음 검사 지점까지 3틱 · 지도 없음',
    )
    expect(readoutOf(stateAt('poll', poll, 1))).toBe('다음 검사 지점까지 0·4·6·18틱')
    expect(readoutOf(stateAt('ttsp', firstScene('ttsp'), 0))).toBe('요청 전 · VM 작업 3틱')
  })

  it('rests where the last carriage has just stopped', () => {
    expect(restClock(firstScene('ttsp'))).toBe(19)
    expect(restClock(sceneOf('poll', [0, 0, 0, 0], null))).toBe(0)
  })
})

describe('parts', () => {
  it('falls back to why for anything unknown', () => {
    expect(partOf('handshake')).toBe('handshake')
    expect(partOf('nope')).toBe('why')
    expect(partOf(undefined)).toBe('why')
  })

  it('captions each part with the model’s numbers', () => {
    expect(captionOf('why')).toContain('3틱을 더 달려')
    expect(captionOf('poll')).toContain(
      '1번 3틱마다, 2번 4~6틱마다, 3번 6~9틱마다, 4번 한 바퀴 24틱에 한 번',
    )
    expect(captionOf('poll')).toContain('2·3·5·17틱')
    expect(captionOf('ttsp')).toContain('17틱이 TTSP')
    expect(captionOf('ttsp')).toContain('모든 스레드가 20틱 동안')
    expect(captionOf('handshake')).toContain('3번 스레드만 5틱 뒤 다음 검사 지점에서 서서 4틱 동안')
  })
})
