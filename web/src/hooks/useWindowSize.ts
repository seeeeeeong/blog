'use client'

import { useEffect, useState } from 'react'

/** `1440x900`, following the window; empty on the server. */
export function useWindowSize(): string {
  const [size, setSize] = useState('')
  useEffect(() => {
    const measure = () => setSize(`${innerWidth}x${innerHeight}`)
    measure()
    addEventListener('resize', measure)
    return () => removeEventListener('resize', measure)
  }, [])
  return size
}
