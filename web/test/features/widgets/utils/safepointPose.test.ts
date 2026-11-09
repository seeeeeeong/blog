import { describe, expect, it } from 'vitest'
import { firstScene, POLLS, restState, stateAt } from '@/features/widgets/utils/safepoint'
import { poseOf } from '@/features/widgets/utils/safepointPose'
import { xOf } from '@/features/widgets/utils/safepointView'

describe('the rest pose', () => {
  it('holds every carriage lit at a poll, with its tag lit and the flag up', () => {
    const pose = poseOf(restState('poll'))

    expect(pose.cars.map((car) => car.lit)).toEqual([true, true, true, true])
    expect(pose.cars.map((car) => car.x)).toEqual([xOf(5), xOf(12), xOf(14), xOf(22)])
    expect(pose.tags[3]).toEqual([true])
    expect(pose.tags[0]?.filter(Boolean)).toHaveLength(1)
    expect(pose.flag).toBe(1)
    expect(pose.working).toBe(true)
    expect(pose.say).toBe('가장 늦은 4번 17틱 · 멈춘 스레드 4/4')
  })

  it('leaves the flag down and the others running in a handshake', () => {
    const pose = poseOf(restState('handshake'))

    expect(pose.flag).toBe(0)
    expect(pose.working).toBe(false)
    expect(pose.lamps).toEqual([false, false, true, false])
    expect(pose.cars.map((car) => car.lit)).toEqual([false, false, true, false])
  })

  it('shows only the followed carriage in why', () => {
    const pose = poseOf(restState('why'))

    expect(pose.cars.map((car) => car.shown)).toEqual([false, true, false, false])
    expect(pose.tags.flat().filter(Boolean)).toHaveLength(1)
  })
})

describe('motion', () => {
  it('lights no tag while a carriage runs between polls', () => {
    const pose = poseOf(stateAt('why', firstScene('why'), 1))

    expect(pose.tags[1]?.some(Boolean)).toBe(false)
    expect(pose.cars[1]?.lit).toBe(false)
  })

  it('fades a carriage out at the end of its lap and in at the start', () => {
    const scene = { ...firstScene('poll'), request: null }

    expect(poseOf(stateAt('poll', scene, 22.9 - 1)).cars[0]?.fade).toBe(1)
    expect(poseOf(stateAt('poll', scene, 23)).cars[0]?.fade).toBe(0)
    expect(poseOf(stateAt('poll', scene, 23.2)).cars[0]?.fade).toBeCloseTo(0.5)
  })

  it('has a post for every poll', () => {
    expect(poseOf(restState('ttsp')).tags.map((row) => row.length)).toEqual(
      POLLS.map((polls) => polls.length),
    )
  })
})
