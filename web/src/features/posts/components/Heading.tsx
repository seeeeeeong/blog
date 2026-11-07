import type { ComponentProps } from 'react'

type Props = ComponentProps<'h2'>

function anchored(Tag: 'h2' | 'h3') {
  return function Heading({ id, children }: Props) {
    return (
      <Tag id={id} className="anchor">
        {children}
        {id && (
          <a href={`#${id}`}>
            <span className="sr-only">이 섹션 링크</span>
            <svg
              viewBox="0 0 16 8"
              width="16"
              height="8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6.5 1H4a3 3 0 0 0 0 6h2.5M9.5 1H12a3 3 0 0 1 0 6H9.5M5 4h6" />
            </svg>
          </a>
        )}
      </Tag>
    )
  }
}

/** A section heading with a chain link to it, shown on hover. */
export const H2 = anchored('h2')

export const H3 = anchored('h3')
