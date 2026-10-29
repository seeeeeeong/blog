const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

// The author's calendar: a post published at 16:00 UTC is already the next day in Seoul.
const SEOUL = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: 'numeric',
  day: '2-digit',
})

function seoulParts(instant: string): Record<string, string> {
  const parts = SEOUL.formatToParts(new Date(instant))
  return Object.fromEntries(parts.map((part) => [part.type, part.value]))
}

/** `OCT 21`, the day an instant falls on in Seoul. */
export function shortDate(instant: string): string {
  const { month, day } = seoulParts(instant)
  return `${MONTHS[Number(month) - 1]} ${day}`
}

/** `OCT 21, 2026`, the day an instant falls on in Seoul, with its year. */
export function longDate(instant: string): string {
  const { year } = seoulParts(instant)
  return `${shortDate(instant)}, ${year}`
}

/** `2026-10-21`, the day an instant falls on in Seoul, for a `<time>` element. */
export function isoDay(instant: string): string {
  const { year, month, day } = seoulParts(instant)
  return `${year}-${month?.padStart(2, '0')}-${day}`
}

/** `2026`, the year an instant falls in in Seoul. */
export function yearOf(instant: string): string {
  return seoulParts(instant).year ?? ''
}
