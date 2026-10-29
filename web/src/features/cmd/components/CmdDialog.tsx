'use client'

import { useEffect, useRef } from 'react'
import { CmdMenu, optionId } from '@/features/cmd/components/CmdMenu'
import { useCmdMenu } from '@/features/cmd/hooks/useCmdMenu'
import { closeCmd } from '@/features/cmd/hooks/useCmdOpen'
import type { CmdPost } from '@/features/cmd/utils/items'

type Props = { posts: readonly CmdPost[]; latestHref?: string }

/** The open palette; it mounts fresh each time, so it always opens on the commands. */
export function CmdDialog({ posts, latestHref }: Props) {
  const menu = useCmdMenu(posts, latestHref)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => input.current?.focus(), [])

  useEffect(() => {
    document.getElementById(optionId(menu.active))?.scrollIntoView({ block: 'nearest' })
  }, [menu.active])

  return (
    <CmdMenu
      mode={menu.mode}
      query={menu.query}
      items={menu.items}
      active={menu.active}
      inputRef={input}
      onType={menu.type}
      onKeyDown={menu.onKeyDown}
      onHover={menu.setActive}
      onRun={menu.run}
      onClose={closeCmd}
    />
  )
}
