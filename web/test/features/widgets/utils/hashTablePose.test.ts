import { describe, expect, it } from 'vitest'
import { KEYS, PARTS, REST_COUNT } from '@/features/widgets/utils/hashTable'
import { insertionOf, lengthOf, poseAt, restPose } from '@/features/widgets/utils/hashTablePose'
import { bucketX, CARRY_Z, FEED_X } from '@/features/widgets/utils/hashTableView'

const counts = Array.from({ length: KEYS.length }, (_, index) => index + 1)

describe('the rest pose', () => {
  it('parks the head over the feeder and says the model’s readout', () => {
    const pose = restPose('chaining', REST_COUNT.chaining)

    expect(pose.head).toBe(FEED_X)
    expect(pose.say).toBe('pear → 2번 칸 · 체인 3')
    expect(pose.load).toBe(0.75)
    expect(pose.lit).toBe(5)
  })

  it('keeps the upper seats sunk until the table grows', () => {
    expect(restPose('load', 3).seats).toEqual([1, 1, 1, 1, 0, 0, 0, 0])
    expect(restPose('load', 4).seats).toEqual([1, 1, 1, 1, 1, 1, 1, 1])
  })
})

describe('an insertion', () => {
  it.each(PARTS)('runs from one rest pose to the next in %s', (part) => {
    for (const count of counts) {
      const before = restPose(part, count - 1)
      const start = poseAt(part, count, 0)
      const end = poseAt(part, count, lengthOf(insertionOf(part, count)))

      expect(start.pucks).toEqual(before.pucks)
      expect(start.head).toBe(before.head)
      expect(end).toEqual(restPose(part, count))
    }
  })

  it('stops at each full slot while probing', () => {
    const says = insertionOf('probing', KEYS.length).map((step) => step.to.say)

    expect(says).toContain('pear · 2번 칸 차 있음')
    expect(says).toContain('pear · 5번 칸 차 있음')
    expect(says).not.toContain('pear · 6번 칸 차 있음')
  })

  it('carries the puck with the head', () => {
    const steps = insertionOf('chaining', 1)
    const carried = steps[1]?.to

    expect(carried?.head).toBe(bucketX(1))
    expect(carried?.pucks[0]).toEqual({ x: bucketX(1), z: CARRY_Z })
  })

  it('fills the old table, then raises the seats and moves only what rehashes', () => {
    const steps = insertionOf('load', 4)
    const says = steps.map((step) => step.to.say)

    expect(says).toContain('키 4 / 칸 4 · 적재율 1.00')
    expect(says).toContain('리사이즈 · 칸 4 → 8')
    expect(says).toContain('melon: 0번 → 4번 칸')
    expect(says).toContain('fig: 1번 → 5번 칸')
    expect(says.some((say) => say.startsWith('apple:'))).toBe(false)
  })
})
