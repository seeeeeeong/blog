import { describe, expect, it } from 'vitest'
import { dateTime, rfc822Date, yearOf } from '@/utils/date'

describe('yearOf', () => {
  it('reads the year in Seoul', () => {
    expect(yearOf('2025-12-31T14:00:00Z')).toBe('2025')
    expect(yearOf('2025-12-31T15:00:00Z')).toBe('2026')
  })
})

describe('dateTime', () => {
  it('gives the day and the time in Seoul, with its offset', () => {
    expect(dateTime('2026-11-11T12:00:00Z')).toBe('Nov 11, 2026, 9:00 PM GMT+9')
  })

  it('moves to the next day once it is midnight in Seoul', () => {
    expect(dateTime('2026-10-21T15:05:00Z')).toBe('Oct 22, 2026, 12:05 AM GMT+9')
  })
})

describe('rfc822Date', () => {
  it('writes the instant in GMT', () => {
    expect(rfc822Date('2026-10-21T01:00:00Z')).toBe('Wed, 21 Oct 2026 01:00:00 GMT')
  })
})
