'use client'

import { useEffect, useState } from 'react'
import { messageOf } from '@/features/admin/api/client'

export type Loaded<T> =
  | { state: 'loading' }
  | { state: 'ready'; data: T }
  | { state: 'failed'; error: unknown; message: string }

/** Runs [load] once on mount, and again whenever it changes; pass a stable function. */
export function useLoad<T>(load: () => Promise<T>): Loaded<T> {
  const [loaded, setLoaded] = useState<Loaded<T>>({ state: 'loading' })
  useEffect(() => {
    let current = true
    setLoaded({ state: 'loading' })
    load().then(
      (data) => current && setLoaded({ state: 'ready', data }),
      (error: unknown) =>
        current && setLoaded({ state: 'failed', error, message: messageOf(error) }),
    )
    return () => {
      current = false
    }
  }, [load])
  return loaded
}
