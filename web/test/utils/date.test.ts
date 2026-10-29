import { describe, expect, it } from 'vitest'
import { isoDay, longDate, shortDate, yearOf } from '@/utils/date'

describe('shortDate', () => {
  it('names the month and pads the day', () => {
    expect(shortDate('2026-10-21T01:00:00Z')).toBe('OCT 21')
    expect(shortDate('2026-09-03T01:00:00Z')).toBe('SEP 03')
  })

  it('reads the day in Seoul, where a late UTC afternoon is already tomorrow', () => {
    expect(shortDate('2026-10-21T14:59:59Z')).toBe('OCT 21')
    expect(shortDate('2026-10-21T15:00:00Z')).toBe('OCT 22')
  })

  it('takes fractional seconds as the api may send them', () => {
    expect(shortDate('2026-01-05T03:04:05.123456Z')).toBe('JAN 05')
  })
})

describe('yearOf', () => {
  it('reads the year in Seoul', () => {
    expect(yearOf('2025-12-31T14:00:00Z')).toBe('2025')
    expect(yearOf('2025-12-31T15:00:00Z')).toBe('2026')
  })
})

describe('longDate', () => {
  it('adds the year in Seoul to the short date', () => {
    expect(longDate('2026-10-21T01:00:00Z')).toBe('OCT 21, 2026')
    expect(longDate('2025-12-31T15:00:00Z')).toBe('JAN 01, 2026')
  })
})

describe('isoDay', () => {
  it('writes the day in Seoul as a calendar date', () => {
    expect(isoDay('2026-10-21T01:00:00Z')).toBe('2026-10-21')
    expect(isoDay('2026-03-04T15:00:00Z')).toBe('2026-03-05')
  })
})
