'use client'

import './cmd.css'
import { useEffect } from 'react'
import { CmdDialog } from '@/features/cmd/components/CmdDialog'
import { toggleCmd, useCmdOpen } from '@/features/cmd/hooks/useCmdOpen'
import type { CmdPost } from '@/features/cmd/utils/items'
import { isCmdShortcut } from '@/features/cmd/utils/keys'

type Props = {
  /** The published posts, newest first. */
  posts: readonly CmdPost[]
  /** The newest post's page; no Latest command when there is none. */
  latestHref?: string
}

/** The command palette, opened by ⌘K or Ctrl+K anywhere and by the dock's Cmd button. */
export function CmdPalette({ posts, latestHref }: Props) {
  const open = useCmdOpen()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isCmdShortcut(event)) return
      event.preventDefault()
      toggleCmd()
    }
    addEventListener('keydown', onKeyDown)
    return () => removeEventListener('keydown', onKeyDown)
  }, [])

  return open ? <CmdDialog posts={posts} latestHref={latestHref} /> : null
}
