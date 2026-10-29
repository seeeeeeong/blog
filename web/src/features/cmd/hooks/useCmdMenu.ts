'use client'

import { useRouter } from 'next/navigation'
import { type KeyboardEvent, useMemo, useState } from 'react'
import { closeCmd } from '@/features/cmd/hooks/useCmdOpen'
import { type CmdItem, type CmdMode, type CmdPost, visibleItems } from '@/features/cmd/utils/items'
import { type CmdIntent, intentOf, wrapIndex } from '@/features/cmd/utils/keys'

/** The palette's mode, query and active item, and what its input's keys and its items do. */
export function useCmdMenu(posts: readonly CmdPost[], latestHref: string | undefined) {
  const router = useRouter()
  const [mode, setMode] = useState<CmdMode>('root')
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const items = useMemo(
    () => visibleItems(mode, query, posts, latestHref),
    [mode, query, posts, latestHref],
  )
  const current = Math.min(active, Math.max(items.length - 1, 0))

  const switchMode = (next: CmdMode) => {
    setMode(next)
    setQuery('')
    setActive(0)
  }

  const type = (next: string) => {
    setQuery(next)
    setActive(0)
  }

  const run = (item: CmdItem) => {
    const { action } = item
    if (action.type === 'search') {
      switchMode('posts')
      return
    }
    closeCmd()
    if (action.type === 'route') router.push(action.href)
    else if (action.type === 'page') location.assign(action.href)
    else window.open(action.href, '_blank', 'noopener,noreferrer')
  }

  const perform: Record<CmdIntent, () => void> = {
    next: () => setActive(wrapIndex(current, 1, items.length)),
    previous: () => setActive(wrapIndex(current, -1, items.length)),
    run: () => {
      const item = items[current]
      if (item) run(item)
    },
    back: () => switchMode('root'),
    close: closeCmd,
    stay: () => {},
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Safari ends a composition before its keydown, which then reads 229.
    const composing = event.nativeEvent.isComposing || event.keyCode === 229
    const intent = intentOf({ key: event.key, composing }, { mode, empty: query === '' })
    if (!intent) return
    event.preventDefault()
    perform[intent]()
  }

  return { mode, query, items, active: current, type, setActive, run, onKeyDown }
}
