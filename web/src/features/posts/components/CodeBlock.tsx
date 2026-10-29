import type { ReactNode } from 'react'
import { CopyButton } from '@/features/posts/components/CopyButton'

type Props = {
  /** The file's name or the language, in the card's head. */
  label?: string
  /** The source as written, for the copy button. */
  code?: string
  /** The highlighted `<pre>`. */
  children?: ReactNode
}

export function CodeBlock({ label = '', code = '', children }: Props) {
  return (
    <div className="code">
      <div className="code__head">
        <span className="mono">{label}</span>
        <CopyButton code={code} />
      </div>
      {children}
    </div>
  )
}
