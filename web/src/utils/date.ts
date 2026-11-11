// The author's calendar: a post published at 16:00 UTC is already the next day in Seoul.
const TIME_ZONE = 'Asia/Seoul'

const DAY = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const TIME = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
})

const YEAR = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, year: 'numeric' })

/** `Nov 11, 2026, 9:00 PM GMT+9`, when a post came out, as its page shows it. */
export function dateTime(instant: string): string {
  const date = new Date(instant)
  return `${DAY.format(date)}, ${TIME.format(date)}`
}

/** `Wed, 21 Oct 2026 01:00:00 GMT`, the RFC 822 date an RSS feed expects. */
export function rfc822Date(instant: string): string {
  return new Date(instant).toUTCString()
}

/** `2026`, the year an instant falls in in Seoul. */
export function yearOf(instant: string): string {
  return YEAR.format(new Date(instant))
}
