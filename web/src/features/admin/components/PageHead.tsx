import type { ReactNode } from 'react'

type Props = {
  /** The page's title, or the field that edits it. */
  title: ReactNode
  meta: string
}

export function PageHead({ title, meta }: Props) {
  return (
    <header className="ahead">
      {typeof title === 'string' ? <h1>{title}</h1> : title}
      <p className="mono ahead__meta">{meta}</p>
    </header>
  )
}
