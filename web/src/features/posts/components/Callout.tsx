import type { ReactNode } from 'react'

type Props = { label?: string; children?: ReactNode }

/** `<Callout label="핵심">`: a point set apart from the text around it. */
export function Callout({ label, children }: Props) {
  return (
    <aside className="callout">
      <div className="callout__label">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="6.3" />
          <path d="M8 7.2v3.8M8 5v.1" strokeLinecap="round" />
        </svg>
        {label}
      </div>
      {children}
    </aside>
  )
}
