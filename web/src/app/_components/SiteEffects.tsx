'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const STAGGER_MS = 150

/** Each page's `.animate` blocks rise in one after another, and the back-to-top button waits for a scroll. */
export function SiteEffects() {
  const pathname = usePathname()

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new page brings new blocks to show
  useEffect(() => {
    const blocks = [...document.querySelectorAll('.animate:not(.show)')]
    const timers = blocks.map((block, i) =>
      setTimeout(() => block.classList.add('show'), i * STAGGER_MS),
    )
    return () => timers.forEach(clearTimeout)
  }, [pathname])

  useEffect(() => {
    const onScroll = () => document.documentElement.classList.toggle('scrolled', window.scrollY > 0)
    onScroll()
    document.addEventListener('scroll', onScroll, { passive: true })
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  return null
}
