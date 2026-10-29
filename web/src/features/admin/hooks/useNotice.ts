'use client'

import { useCallback, useEffect, useState } from 'react'

export type Notice = { text: string; error: boolean }

// Long enough to read a short line.
const NOTICE_MS = 2600

/** A line in the toast: a success fades on its own, an error waits for the next action. */
export function useNotice() {
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    if (!notice || notice.error) return
    const timer = setTimeout(() => setNotice(null), NOTICE_MS)
    return () => clearTimeout(timer)
  }, [notice])

  const show = useCallback((text: string, error = false) => setNotice({ text, error }), [])
  const clear = useCallback(() => setNotice(null), [])
  return { notice, show, clear }
}
