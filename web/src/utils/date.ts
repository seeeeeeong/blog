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

const LONG_MONTHS = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', month: 'long' })

const SHORT_MONTHS = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', month: 'short' })

/** `October 21, 2026`, the day an instant falls on in Seoul, as a post is dated. */
export function fullDate(instant: string): string {
  const { year, day } = seoulParts(instant)
  return `${LONG_MONTHS.format(new Date(instant))} ${Number(day)}, ${year}`
}

/** `Oct 21`, the day an instant falls on in Seoul, as the archive lists it. */
export function monthDay(instant: string): string {
  return `${SHORT_MONTHS.format(new Date(instant))} ${Number(seoulParts(instant).day)}`
}

/** `2026-10-21`, the day an instant falls on in Seoul, for a `<time>` element. */
export function isoDay(instant: string): string {
  const { year, month, day } = seoulParts(instant)
  return `${year}-${month?.padStart(2, '0')}-${day}`
}

/** `Wed, 21 Oct 2026 01:00:00 GMT`, the RFC 822 date an RSS feed expects. */
export function rfc822Date(instant: string): string {
  return new Date(instant).toUTCString()
}

/** `2026`, the year an instant falls in in Seoul. */
export function yearOf(instant: string): string {
  return seoulParts(instant).year ?? ''
}
