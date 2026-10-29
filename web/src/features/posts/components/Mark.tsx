import type { ReactNode } from 'react'

/** `<Mark>`: a phrase highlighted in the text. */
export function Mark({ children }: { children?: ReactNode }) {
  return <span className="mark">{children}</span>
}
