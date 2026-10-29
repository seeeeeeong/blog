'use client'

import { useEffect, useState } from 'react'

const timeNow = () =>
  new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', second: '2-digit' })

/** The time of day, ticking each second; empty on the server. */
export function useClock(): string {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(timeNow())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}
