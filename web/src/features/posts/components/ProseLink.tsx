import type { ComponentProps } from 'react'

/** A link in a post; one to another site opens apart and is not told where the reader came from. */
export function ProseLink({ href, children }: ComponentProps<'a'>) {
  const external = href !== undefined && /^https?:\/\//i.test(href)
  return external ? (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ) : (
    <a href={href}>{children}</a>
  )
}
