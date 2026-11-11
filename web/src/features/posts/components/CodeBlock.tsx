import type { ReactNode } from 'react'

type Props = {
  /** The highlighted `<pre>`. */
  children?: ReactNode
}

/** A fenced block, dark in both themes as the reference draws it. */
export function CodeBlock({ children }: Props) {
  return <div className="code">{children}</div>
}
