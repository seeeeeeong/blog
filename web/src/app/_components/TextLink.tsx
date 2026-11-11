import Link from 'next/link'
import type { ReactNode } from 'react'

const BASE =
  'inline-block decoration-black/15 dark:decoration-white/30 hover:decoration-black/25 hover:dark:decoration-white/50 text-current hover:text-black hover:dark:text-white transition-colors duration-300 ease-in-out'

type Props = {
  href: string
  /** Opens in a new tab, for another site. */
  external?: boolean
  underline?: boolean
  'aria-label'?: string
  children: ReactNode
}

/** A link in the site's chrome, underlined faintly until it is hovered. */
export function TextLink({ href, external = false, underline = true, children, ...rest }: Props) {
  const className = underline ? `${BASE} underline underline-offset-2` : BASE
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className} {...rest}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={className} {...rest}>
      {children}
    </Link>
  )
}
